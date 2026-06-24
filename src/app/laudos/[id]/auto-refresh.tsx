"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Enquanto o laudo está `extraindo`, atualiza a página até virar `revisar`.
export function AutoRefresh({ intervalMs = 3000 }: { intervalMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    const t = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(t);
  }, [router, intervalMs]);
  return null;
}
