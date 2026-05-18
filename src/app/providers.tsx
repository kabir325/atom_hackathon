"use client";

import { useEffect, useState } from "react";
import { AuthProvider } from "@/components/auth/auth-context";
import { ensureSeeded } from "@/lib/seed";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await ensureSeeded();
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) return null;

  return <AuthProvider>{children}</AuthProvider>;
}
