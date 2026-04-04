import { authMiddleware, redirectToSignIn } from "@clerk/nextjs";

export default authMiddleware({
  // Public routes remain accessible without login
  publicRoutes: ["/", "/search", "/doctor/:id"],
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
