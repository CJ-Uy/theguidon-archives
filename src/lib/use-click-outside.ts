"use client";

import { useEffect } from "react";
import type { RefObject } from "react";

export function useClickOutside<T extends HTMLElement>(
  ref: RefObject<T | null>,
  handler: () => void,
  enabled = true,
): void {
  useEffect(() => {
    if (!enabled) return;
    function onPointer(e: MouseEvent | TouchEvent) {
      const el = ref.current;
      if (!el) return;
      const target = e.target;
      if (target instanceof Node && el.contains(target)) return;
      handler();
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("touchstart", onPointer);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("touchstart", onPointer);
    };
  }, [ref, handler, enabled]);
}
