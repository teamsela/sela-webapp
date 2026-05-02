import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Public routes that should NOT require authentication.
// All other routes (matched by `config.matcher` below) are protected.
const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/study/(.*)/view",
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    const { userId, redirectToSignIn } = await auth();
    if (!userId) {
      return redirectToSignIn({ returnBackUrl: req.url });
    }
  }
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/"],
};
