"""Browser automation tools using Playwright.

Provides tools for opening, navigating, clicking, and screenshotting a
Chromium browser window pointed at the Vercel preview or any URL.

Clerk OAuth is handled via sign-in tokens (no manual Google sign-in required).
CLERK_SECRET_KEY is read from the environment or the repo's .env file.

A single browser instance is kept alive across tool calls within the MCP
server process. Call browser_close() to tear it down.
"""

import json
import ssl
import urllib.parse
import urllib.request
from datetime import datetime
from pathlib import Path

from playwright.async_api import (
    Browser,
    Page,
    Playwright,
    async_playwright,
)

from _app import REPO_ROOT, mcp

# ---------------------------------------------------------------------------
# Module-level browser state (one instance per server process)
# ---------------------------------------------------------------------------

_pw: Playwright | None = None
_browser: Browser | None = None
_page: Page | None = None

SCREENSHOTS_BASE = REPO_ROOT / "local"
_run_folder: Path | None = None  # set by browser_run_init(); used by browser_screenshot()


def _current_run_folder() -> Path:
    """Return the active run folder, creating a default one if not initialised."""
    global _run_folder
    if _run_folder is None:
        _run_folder = SCREENSHOTS_BASE / datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
        _run_folder.mkdir(parents=True, exist_ok=True)
    return _run_folder


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _load_clerk_secret() -> str:
    """Read CLERK_SECRET_KEY from env or repo .env file."""
    import os
    key = os.environ.get("CLERK_SECRET_KEY", "")
    if key:
        return key
    env_file = REPO_ROOT / ".env"
    if env_file.exists():
        for line in env_file.read_text(encoding="utf-8").splitlines():
            if line.startswith("CLERK_SECRET_KEY="):
                return line.split("=", 1)[1].strip().strip('"').strip("'")
    return ""


def _clerk_request(method: str, path: str, secret: str, body: dict | None = None) -> tuple[int, dict]:
    """Make a Clerk Backend API request. Returns (status_code, json_body)."""
    url = f"https://api.clerk.com/v1{path}"
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(
        url,
        data=data,
        method=method,
        headers={
            "Authorization": f"Bearer {secret}",
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 sela-mcp/1.0",
        },
    )
    ctx = ssl.create_default_context()
    try:
        with urllib.request.urlopen(req, context=ctx, timeout=15) as resp:
            raw = resp.read()
            return resp.status, json.loads(raw) if raw else {}
    except urllib.error.HTTPError as exc:
        raw = exc.read()
        try:
            return exc.code, json.loads(raw) if raw else {}
        except json.JSONDecodeError:
            return exc.code, {"error": raw.decode(errors="replace")}
    except Exception as exc:
        return 0, {"error": str(exc)}


async def _ensure_page(headless: bool = False) -> Page:
    """Return the active page, launching a new browser if needed."""
    global _pw, _browser, _page

    if _pw is None:
        _pw = await async_playwright().start()

    if _browser is None or not _browser.is_connected():
        _browser = await _pw.chromium.launch(
            headless=headless,
            args=["--start-maximized"],
        )

    if _page is None or _page.is_closed():
        # no_viewport=True lets the browser control window size (works with --start-maximized)
        _page = await _browser.new_page(no_viewport=True)

    return _page


def _make_clerk_token(user_email: str) -> tuple[str, str]:
    """Look up a Clerk user by email and create a sign-in token.

    Returns (user_id, token) on success.
    Raises ValueError with a descriptive message on failure.
    """
    secret = _load_clerk_secret()
    if not secret:
        raise ValueError("CLERK_SECRET_KEY not found in environment or .env.")

    qs = urllib.parse.urlencode({"email_address[]": user_email})
    status, body = _clerk_request("GET", f"/users?{qs}", secret)
    if status != 200:
        raise ValueError(f"Clerk user lookup failed ({status}): {body}")
    users = body if isinstance(body, list) else body.get("data", [])
    if not users:
        raise ValueError(f"No Clerk user found with email '{user_email}'.")
    user_id = users[0]["id"]

    status, body = _clerk_request("POST", "/sign_in_tokens", secret, {"user_id": user_id})
    if status != 200:
        raise ValueError(f"Could not create sign-in token ({status}): {body}")
    token = body.get("token")
    if not token:
        raise ValueError(f"Clerk API returned no token. Response: {body}")
    return user_id, token


def _screenshot_path(filename: str) -> Path:
    folder = _current_run_folder()
    if not filename:
        filename = f"screenshot_{datetime.now().strftime('%H-%M-%S_%f')[:19]}.png"
    elif not filename.endswith(".png"):
        filename += ".png"
    return folder / filename


# ---------------------------------------------------------------------------
# Tools
# ---------------------------------------------------------------------------

@mcp.tool()
async def browser_run_init(label: str = "") -> str:
    """Create a new timestamped run folder under local/ for this session's screenshots.

    All subsequent browser_screenshot() calls will save into this folder.
    Call once at the start of each test run.

    Args:
        label: Optional short label appended to the folder name (e.g. 'sounds-test').
    """
    global _run_folder
    ts = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    name = f"{ts}_{label}" if label else ts
    _run_folder = SCREENSHOTS_BASE / name
    _run_folder.mkdir(parents=True, exist_ok=True)
    return f"Run folder created: {_run_folder}"

@mcp.tool()
async def browser_open(url: str, headless: bool = False) -> str:
    """Open a URL in a Playwright Chromium browser window.

    If a browser is already open the URL is loaded in the existing window.
    The browser stays alive across subsequent tool calls.

    Args:
        url: URL to open (e.g. the Vercel preview URL).
        headless: Run without a visible window (default: False).
    """
    try:
        page = await _ensure_page(headless=headless)
        await page.goto(url, timeout=30_000, wait_until="domcontentloaded")
        title = await page.title()
        return f"Opened: {page.url}\nTitle: {title}"
    except Exception as exc:
        return f"ERROR: {exc}"


@mcp.tool()
async def browser_auth_clerk(base_url: str, user_email: str) -> str:
    """Sign in to the app using a Clerk sign-in token (bypasses Google OAuth).

    Strategy:
    1. Navigate to the sign-in page and wait for Clerk JS to mount.
    2. Call window.Clerk.client.signIn.create({ strategy: 'ticket', ticket }) via
       the Clerk Backend API token.
    3. Activate the resulting session and navigate to the app root.

    Requires CLERK_SECRET_KEY in the environment or the repo .env file.

    Args:
        base_url: Root URL of the app (e.g. the Vercel preview URL).
        user_email: Email address of the Clerk account to sign in as.
    """
    try:
        user_id, token = _make_clerk_token(user_email)
    except ValueError as exc:
        return f"ERROR: {exc}"

    try:
        page = await _ensure_page()

        # Navigate to the sign-in page so Clerk JS initialises.
        sign_in_url = f"{base_url.rstrip('/')}/sign-in"
        await page.goto(sign_in_url, timeout=30_000, wait_until="domcontentloaded")
        await page.wait_for_function(
            "window.Clerk?.loaded && window.Clerk.client?.signIn",
            timeout=15_000,
        )

        active_user_id = await page.evaluate(
            "() => window.Clerk.user?.id || window.Clerk.session?.user?.id || null"
        )
        if active_user_id == user_id:
            await page.goto(
                base_url.rstrip("/") + "/",
                timeout=30_000,
                wait_until="domcontentloaded",
            )
            await page.wait_for_timeout(1500)
            return (
                f"Already authenticated as '{user_email}' (user_id={user_id}).\n"
                f"Current URL: {page.url}\n"
                f"Title: {await page.title()}"
            )
        if active_user_id:
            await page.evaluate("async () => { await window.Clerk.signOut(); }")

        # Use the Clerk JS SDK to authenticate via the sign-in token.
        js_result = await page.evaluate(
            """async (token) => {
                try {
                    const si = await window.Clerk.client.signIn.create({ strategy: 'ticket', ticket: token });
                    return { status: si.status, sessionId: si.createdSessionId };
                } catch(e) {
                    return { error: e.message };
                }
            }""",
            token,
        )
        if js_result.get("error"):
            return f"ERROR: Clerk JS signIn failed: {js_result['error']}"

        session_id = js_result.get("sessionId")
        await page.evaluate(
            "async (sid) => { await window.Clerk.setActive({ session: sid }); }",
            session_id,
        )
        await page.wait_for_timeout(1500)

        # Navigate to the app root now that we're authenticated.
        await page.goto(
            base_url.rstrip("/") + "/",
            timeout=30_000,
            wait_until="domcontentloaded",
        )
        await page.wait_for_timeout(1500)
        title = await page.title()
        return (
            f"Authenticated as '{user_email}' (user_id={user_id}).\n"
            f"Current URL: {page.url}\n"
            f"Title: {title}"
        )
    except Exception as exc:
        return f"ERROR during Clerk auth: {exc}"


@mcp.tool()
async def browser_navigate(url: str) -> str:
    """Navigate the open browser to a new URL.

    Args:
        url: Full URL to navigate to.
    """
    try:
        page = await _ensure_page()
        await page.goto(url, timeout=30_000, wait_until="domcontentloaded")
        title = await page.title()
        return f"Navigated to: {page.url}\nTitle: {title}"
    except Exception as exc:
        return f"ERROR: {exc}"


@mcp.tool()
async def browser_click(selector: str, timeout_ms: int = 8000) -> str:
    """Click an element by CSS selector or Playwright text locator.

    Selector examples:
      - CSS:  'button.my-class', '#element-id'
      - Text: 'text=Sounds', 'text=Hebrew Letters Distribution'

    Args:
        selector: CSS or Playwright locator string.
        timeout_ms: Max wait time for the element in ms (default: 8000).
    """
    try:
        page = await _ensure_page()
        await page.click(selector, timeout=timeout_ms)
        await page.wait_for_timeout(600)
        return f"Clicked: {selector}"
    except Exception as exc:
        return f"ERROR clicking '{selector}': {exc}"


@mcp.tool()
async def browser_type(selector: str, text: str, timeout_ms: int = 5000) -> str:
    """Fill a text input with the given value.

    Args:
        selector: CSS selector for the input element.
        text: Text to fill in.
        timeout_ms: Max wait time for the element in ms.
    """
    try:
        page = await _ensure_page()
        await page.fill(selector, text, timeout=timeout_ms)
        return f"Typed into '{selector}': {text!r}"
    except Exception as exc:
        return f"ERROR typing into '{selector}': {exc}"


@mcp.tool()
async def browser_wait_for(selector: str, timeout_ms: int = 10000) -> str:
    """Wait for an element to appear in the page.

    Args:
        selector: CSS or Playwright locator string.
        timeout_ms: Max wait time in ms (default: 10000).
    """
    try:
        page = await _ensure_page()
        await page.wait_for_selector(selector, timeout=timeout_ms)
        return f"Element visible: {selector}"
    except Exception as exc:
        return f"TIMEOUT: '{selector}' not found within {timeout_ms}ms: {exc}"


@mcp.tool()
async def browser_get_text(selector: str = "body") -> str:
    """Get the visible text content of an element.

    Args:
        selector: CSS selector (default: 'body' for the full page text).
    """
    try:
        page = await _ensure_page()
        el = await page.query_selector(selector)
        if el is None:
            return f"ERROR: No element matching '{selector}'."
        text = await el.inner_text()
        return text[:4000]
    except Exception as exc:
        return f"ERROR: {exc}"


@mcp.tool()
async def browser_screenshot(filename: str = "") -> str:
    """Take a screenshot of the current browser page.

    Saves to the current run folder (set by browser_run_init) under local/.
    A new timestamped folder is auto-created if browser_run_init was not called.
    Filename is auto-generated (timestamp) when not provided.

    Args:
        filename: Optional filename (e.g. '01_sounds-tab.png').
    """
    try:
        page = await _ensure_page()
        path = _screenshot_path(filename)
        await page.screenshot(path=str(path), full_page=False)
        return f"Screenshot saved: {path}"
    except Exception as exc:
        return f"ERROR: {exc}"


@mcp.tool()
async def browser_get_url() -> str:
    """Return the current URL and page title of the open browser."""
    try:
        page = await _ensure_page()
        return f"URL:   {page.url}\nTitle: {await page.title()}"
    except Exception as exc:
        return f"ERROR: {exc}"


@mcp.tool()
async def browser_close() -> str:
    """Close the browser and release all Playwright resources."""
    global _pw, _browser, _page
    msgs = []
    try:
        if _page and not _page.is_closed():
            await _page.close()
            msgs.append("page closed")
        _page = None
        if _browser and _browser.is_connected():
            await _browser.close()
            msgs.append("browser closed")
        _browser = None
        if _pw:
            await _pw.stop()
            msgs.append("playwright stopped")
        _pw = None
        return "Browser closed. " + ", ".join(msgs) if msgs else "No browser was open."
    except Exception as exc:
        return f"ERROR: {exc}"
