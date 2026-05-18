"use client";

import { useCallback, useEffect, useState } from "react";
import { getState } from "@/lib/state";
import { type AppState } from "@/lib/types";

export function useAppState() {
  const [state, setState] = useState<AppState>(() => getState());

  const refresh = useCallback(() => {
    setState(getState());
  }, []);

  useEffect(() => {
    const onStorage = () => refresh();
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [refresh]);

  return { state, refresh };
}

