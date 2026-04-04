import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  // All routes are protected by default.
  // Only public routes (like sign-in) should be listed here if needed.
  publicRoutes: ["/sign-in(.*)", "/sign-up(.*)"],
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
