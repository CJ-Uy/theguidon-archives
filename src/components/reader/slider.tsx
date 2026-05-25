"use client";

import { useEffect, useState } from "react";
import { ChevronFirst, ChevronLast, ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  numPages: number;
  page: number;
  step: number;
  rightPage?: number | null;
  /** Fires continuously while the user drags the slider thumb. */
  onInput: (p: number) => void;
  /** Discrete commits (typed input, arrow buttons). */
  onCommit: (p: number) => void;
  onPrev: () => void;
  onNext: () => void;
};

export default function ReaderRail({
  numPages,
  page,
  step,
  rightPage,
  onInput,
  onCommit,
  onPrev,
  onNext,
}: Props) {
  const progress = numPages > 1 ? ((page - 1) / (numPages - 1)) * 100 : 0;

  // Local input value so users can type freely (e.g. delete digits) without
  // the parent re-clamping mid-edit.
  const [jumpValue, setJumpValue] = useState(String(page));
  useEffect(() => {
    setJumpValue(String(page));
  }, [page]);

  function commitJump() {
    const n = parseInt(jumpValue, 10);
    if (!Number.isFinite(n)) {
      setJumpValue(String(page));
      return;
    }
    const clamped = Math.max(1, Math.min(numPages, Math.floor(n)));
    setJumpValue(String(clamped));
    onCommit(clamped);
  }

  return (
    <div
      className="reader-rail"
      style={{ ["--progress" as string]: `${progress}%` }}
    >
      <div className="pagemark" aria-live="polite">
        <span className="label">Page</span>
        <span className="num">{page}</span>
        {rightPage && (
          <>
            <span className="sep">–</span>
            <span className="num">{rightPage}</span>
          </>
        )}
        <span className="sep">/</span>
        <span className="total">{numPages}</span>
      </div>

      <input
        type="range"
        min={1}
        max={numPages}
        step={step}
        value={page}
        onChange={(e) => onInput(parseInt(e.currentTarget.value, 10))}
        aria-label={`Page ${page} of ${numPages}`}
      />

      <div className="rail-actions">
        <form
          className="jump"
          onSubmit={(e) => {
            e.preventDefault();
            commitJump();
            (e.currentTarget.querySelector("input") as HTMLInputElement | null)?.blur();
          }}
        >
          <label className="jump-label" htmlFor="reader-jump">
            Go to
          </label>
          <input
            id="reader-jump"
            type="number"
            inputMode="numeric"
            min={1}
            max={numPages}
            value={jumpValue}
            onChange={(e) => setJumpValue(e.currentTarget.value)}
            onBlur={commitJump}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setJumpValue(String(page));
                (e.currentTarget as HTMLInputElement).blur();
              }
            }}
            aria-label="Jump to page"
          />
        </form>

        <div className="seek" aria-label="Pager">
          <button onClick={() => onCommit(1)} disabled={page <= 1} aria-label="First page">
            <ChevronFirst size={15} />
          </button>
          <button onClick={onPrev} disabled={page <= 1} aria-label="Previous">
            <ChevronLeft size={15} />
          </button>
          <button onClick={onNext} disabled={page >= numPages} aria-label="Next">
            <ChevronRight size={15} />
          </button>
          <button onClick={() => onCommit(numPages)} disabled={page >= numPages} aria-label="Last page">
            <ChevronLast size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
