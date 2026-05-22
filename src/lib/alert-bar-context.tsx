"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

type AlertBarState = {
  active: boolean;
  text: string;
  show: (text: string) => void;
};

const AlertBarContext = createContext<AlertBarState | null>(null);

export function AlertBarProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<string[]>([]);
  const [active, setActive] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (queue.length === 0) {
      setActive(false);
      return;
    }
    setActive(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setQueue((q) => q.slice(1));
    }, 5000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [queue]);

  const show = useCallback((text: string) => {
    setQueue((q) => [...q, text]);
  }, []);

  return (
    <AlertBarContext.Provider value={{ active, text: queue[0] ?? "", show }}>
      {children}
    </AlertBarContext.Provider>
  );
}

export function useAlertBar(): AlertBarState {
  const ctx = useContext(AlertBarContext);
  if (!ctx) throw new Error("useAlertBar must be used inside <AlertBarProvider>");
  return ctx;
}
