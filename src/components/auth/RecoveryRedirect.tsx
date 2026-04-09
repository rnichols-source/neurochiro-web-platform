"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function RecoveryRedirect() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Don't redirect if already on reset-password page
    if (pathname === "/reset-password") return;

    const supabase = createClient();

    // Method 1: Listen for PASSWORD_RECOVERY auth event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        router.push("/reset-password");
      }
    });

    // Method 2: Check URL hash for recovery tokens (implicit flow)
    const hash = window.location.hash;
    if (hash && hash.includes("type=recovery")) {
      router.push("/reset-password" + hash);
      return;
    }

    // Method 3: Check URL params for recovery code (PKCE flow)
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const type = params.get("type");
    if (code && type === "recovery") {
      router.push(`/reset-password?code=${code}`);
      return;
    }

    return () => subscription.unsubscribe();
  }, [router, pathname]);

  return null;
}
