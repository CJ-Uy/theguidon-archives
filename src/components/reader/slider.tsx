"use client";

import { ChevronFirst, ChevronLast, ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  numPages: number;
  page: number;
  step: number;
  rightPage?: number | null;
  onChange: (p: number) => void;
  onPrev: () => void;
  onNext: () => void;
};

export default function ReaderRail({
  numPages,
  page,
  step,
  rightPage,
  onChange,
  onPrev,
  onNext,
}: Props) {
  const progress = numPages > 1 ? ((page - 1) / (numPages - 1)) * 100 : 0;

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
        onChange={(e) => onChange(parseInt(e.currentTarget.value, 10))}
        aria-label={`Page ${page} of ${numPages}`}
      />

      <div className="seek" aria-label="Pager">
        <button onClick={() => onChange(1)} disabled={page <= 1} aria-label="First page">
          <ChevronFirst size={15} />
        </button>
        <button onClick={onPrev} disabled={page <= 1} aria-label="Previous">
          <ChevronLeft size={15} />
        </button>
        <button onClick={onNext} disabled={page >= numPages} aria-label="Next">
          <ChevronRight size={15} />
        </button>
        <button onClick={() => onChange(numPages)} disabled={page >= numPages} aria-label="Last page">
          <ChevronLast size={15} />
        </button>
      </div>
    </div>
  );
}
