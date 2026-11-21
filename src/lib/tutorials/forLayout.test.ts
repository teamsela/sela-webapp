import { describe, expect, it } from "vitest";
import { forLayout, resolveBody, resolveTarget, touchWords, withPhoneGroupButton, type TourStep } from "./tour";
import { colorKindOf, toolGroupOf } from "./tourEvents";
import { ORIENTATION_TOUR_STEPS } from "./orientationTour";
import { INTERFACE_TOUR_STEPS } from "./interfaceTour";

describe("touchWords", () => {
  it("says tap instead of click", () => {
    expect(touchWords("Click New strophe. Clicking it again, or a click, clicks.")).toBe("Tap New strophe. Tapping it again, or a tap, taps.");
    expect(touchWords("Double-click this word")).toBe("Double-tap this word");
  });
  it("drops right-click mentions", () => {
    expect(touchWords("The button at the bottom right of a note (or a right-click inside it) opens the menu.")).toBe(
      "The button at the bottom right of a note opens the menu.",
    );
  });
});

describe("phone menus", () => {
  it("lights the bottom bar's menu with a control inside it", () => {
    expect(withPhoneGroupButton('[data-tour="structure-newStrophe"]')).toBe('[data-tour="structure-newStrophe"], [data-tour="dock-strophe"]');
    expect(withPhoneGroupButton('[data-tour="structure-mergeWithPrevLine"]')).toContain("dock-line");
    expect(withPhoneGroupButton('[data-tour="fill-color"]')).toContain("dock-color");
    expect(withPhoneGroupButton('[data-tour="indent-add"]')).toContain("dock-word");
    expect(withPhoneGroupButton('[data-tour="boxes"]')).toBe('[data-tour="boxes"]');
  });
  it("knows which group and color a target is in", () => {
    expect(toolGroupOf('[data-tour="structure-newStanza"]')).toBe("stanza");
    expect(toolGroupOf('[data-tour="boxes"]')).toBe("word");
    expect(toolGroupOf('[data-tour="fill-color"], [data-tour="border-color"]')).toBe("format");
    expect(toolGroupOf('[data-tour="tab-motif"]')).toBeUndefined();
    expect(colorKindOf('[data-tour="font-color"]')).toBe("font");
    expect(colorKindOf('[data-tour="tab-motif"]')).toBeUndefined();
  });
});

describe("forLayout", () => {
  const step: TourStep = {
    id: "x",
    section: "S",
    title: "Click it",
    target: '[data-tour="structure-newStrophe"]',
    body: "Click New strophe.",
    phone: { title: "Phone title" },
  };
  it("leaves desktop alone", () => {
    expect(forLayout(step, "desktop")).toBe(step);
  });
  it("uses touch words on tablets, without the phone changes", () => {
    const t = forLayout(step, "tablet");
    expect(t.title).toBe("Tap it");
    expect(t.body).toBe("Tap New strophe.");
    expect(t.target).toBe('[data-tour="structure-newStrophe"]');
  });
  it("applies the phone changes on phones", () => {
    const p = forLayout(step, "phone");
    expect(p.title).toBe("Phone title");
    expect(p.target).toContain("dock-strophe");
  });
});

describe("the tours on a phone", () => {
  const all = [...ORIENTATION_TOUR_STEPS, ...INTERFACE_TOUR_STEPS];
  it("never mention clicking, hovering or right-clicking", () => {
    for (const step of all) {
      const p = forLayout(step, "phone");
      const text = [p.title, typeof p.body === "string" ? p.body : "", ...(p.checks ?? []).map((c) => c.label)].join(" ");
      expect(text, step.id).not.toMatch(/click|hover/i);
    }
  });
  it("don't point at controls phones don't have", () => {
    const desktopOnly = /notes-toggle|lang-chevron|language-dropdown|group-(format|word|line|strophe|stanza)/;
    for (const step of all) {
      const p = forLayout(step, "phone");
      const target = typeof p.target === "string" ? p.target : "";
      expect(target, step.id).not.toMatch(desktopOnly);
    }
  });
  it("use Select repeats instead of double-clicking", () => {
    const notSelect = forLayout(ORIENTATION_TOUR_STEPS.find((s) => s.id === "not-select")!, "phone");
    expect(resolveBody(notSelect, null)).toBe("");
    expect(String(notSelect.allow)).toContain("select-repeats");
    const yahweh = forLayout(INTERFACE_TOUR_STEPS.find((s) => s.id === "identical-select")!, "phone");
    expect(resolveTarget(yahweh, null)).toBeUndefined();
    expect(String(yahweh.allow)).toContain("select-repeats");
  });
});

describe("menus the user opens first", () => {
  const newStrophe: TourStep = {
    id: "n",
    section: "S",
    title: "Click New strophe",
    target: '[data-tour="structure-newStrophe"]',
    body: "Click New strophe. Verse 4 moves into a new strophe.",
    isDone: () => false,
  };
  it("phones: open Strophe in the bar, then the control; both lit", () => {
    const p = forLayout(newStrophe, "phone");
    expect(p.body).toBe("In the bar at the bottom, open Strophe. Then tap New strophe. Verse 4 moves into a new strophe.");
    expect(p.target).toContain('[data-tour="dock-strophe"]');
  });
  it("tablets: choose the ribbon group, then the control; both lit", () => {
    const t = forLayout(newStrophe, "tablet");
    expect(t.body).toBe("In the toolbar, choose Strophe. Then tap New strophe. Verse 4 moves into a new strophe.");
    expect(t.target).toBe('[data-tour="structure-newStrophe"], [data-tour="ribbon-Strophe"]');
  });
  it("leaves desktop, read-only steps and phone-specific wording alone", () => {
    expect(forLayout(newStrophe, "desktop").body).toBe(newStrophe.body);
    const readOnly = { ...newStrophe, isDone: undefined };
    expect(forLayout(readOnly, "phone").body).toBe("Tap New strophe. Verse 4 moves into a new strophe.");
    const own = { ...newStrophe, phone: { body: "Own words." } };
    expect(forLayout(own, "phone").body).toBe("Own words.");
  });
});
