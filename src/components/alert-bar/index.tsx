"use client";

import "./index.css";
import { useAlertBar } from "@/lib/alert-bar-context";

export default function AlertBar() {
  const { active, text } = useAlertBar();

  return (
    <div id="alert-bar" className={active ? "active" : ""}>
      {text}
    </div>
  );
}
