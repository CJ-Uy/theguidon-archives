"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { publicUrl, r2Keys } from "@/lib/storage";
import ReaderRail from "./slider";
import ReaderTitleBar, { type ReaderMode } from "./title-bar";
import "./reader.css";

type Props = {
  issueId: number;
  issueSlug: string;
  issueTitle: string;
  numPages: number;
  hasPdf: boolean;
};

function parseMode(raw: string | null): ReaderMode {
  if (raw === "single" || raw === "double") return raw;
  return "scroll";
}

function clampPage(p: number, max: number) {
  if (!Number.isFinite(p)) return 1;
  if (p < 1) return 1;
  if (p > max) return max;
  return Math.floor(p);
}

/** For double mode: return the left page of the spread that contains `p`.
 *  Page 1 sits alone (as a cover); from page 2 on, pairs are (2,3),(4,5),... */
function spreadLeft(p: number): number {
  if (p <= 1) return 1;
  return p % 2 === 0 ? p : p - 1;
}

export default function Reader(props: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = parseMode(searchParams.get("view"));
  const urlPage = clampPage(parseInt(searchParams.get("p") ?? "1", 10), props.numPages);

  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isNarrow, setIsNarrow] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    setIsNarrow(mq.matches);
    const listener = (e: MediaQueryListEvent) => setIsNarrow(e.matches);
    mq.addEventListener("change", listener);
    return () => mq.removeEventListener("change", listener);
  }, []);

  // Double mode collapses to single on narrow viewports
  const effectiveMode: ReaderMode =
    mode === "double" && isNarrow ? "single" : mode;
  const allowDouble = !isNarrow;

  // Page state lives in the URL; in scroll mode we don't paginate
  const page =
    effectiveMode === "double" ? spreadLeft(urlPage) : urlPage;
  const rightPage =
    effectiveMode === "double" && page > 1 && page + 1 <= props.numPages
      ? page + 1
      : null;

  const writeParams = useCallback(
    (mutate: (sp: URLSearchParams) => void) => {
      const sp = new URLSearchParams(Array.from(searchParams.entries()));
      mutate(sp);
      const qs = sp.toString();
      router.replace(qs ? `?${qs}` : window.location.pathname, { scroll: false });
    },
    [router, searchParams],
  );

  const setMode = useCallback(
    (m: ReaderMode) => {
      writeParams((sp) => {
        if (m === "scroll") {
          sp.delete("view");
          sp.delete("p");
        } else {
          sp.set("view", m);
        }
      });
    },
    [writeParams],
  );

  const setPage = useCallback(
    (p: number) => {
      const clamped = clampPage(p, props.numPages);
      writeParams((sp) => {
        if (clamped <= 1) sp.delete("p");
        else sp.set("p", String(clamped));
      });
    },
    [props.numPages, writeParams],
  );

  const step = effectiveMode === "double" ? 2 : 1;

  const goPrev = useCallback(() => {
    if (effectiveMode === "double") {
      // 1 (cover) → 1, 2 → 1, 4 → 2, 6 → 4, ...
      if (page <= 1) return;
      if (page === 2) return setPage(1);
      return setPage(page - 2);
    }
    setPage(page - 1);
  }, [effectiveMode, page, setPage]);

  const goNext = useCallback(() => {
    if (effectiveMode === "double") {
      if (page <= 1) return setPage(2);
      const next = page + 2;
      if (next > props.numPages) return;
      return setPage(next);
    }
    setPage(page + 1);
  }, [effectiveMode, page, props.numPages, setPage]);

  // Keyboard navigation
  useEffect(() => {
    if (effectiveMode === "scroll") return;
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      } else if (e.key === "Home") {
        e.preventDefault();
        setPage(1);
      } else if (e.key === "End") {
        e.preventDefault();
        setPage(props.numPages);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [effectiveMode, goNext, goPrev, props.numPages, setPage]);

  // Fullscreen state mirror
  useEffect(() => {
    function onChange() {
      setIsFullscreen(document.fullscreenElement != null);
    }
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  function toggleFullscreen() {
    if (document.fullscreenElement) document.exitFullscreen();
    else containerRef.current?.requestFullscreen();
  }

  function pageUrl(n: number) {
    return publicUrl(r2Keys.page(props.issueId, n));
  }

  const pageNumbers = useMemo(
    () => Array.from({ length: props.numPages }, (_, i) => i + 1),
    [props.numPages],
  );

  return (
    <div className={`reader mode-${effectiveMode}`} ref={containerRef}>
      <ReaderTitleBar
        mode={effectiveMode}
        onModeChange={setMode}
        zoom={zoom}
        onZoomIn={() => setZoom((z) => Math.min(3, +(z + 0.25).toFixed(2)))}
        onZoomOut={() => setZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2)))}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        issueId={props.issueId}
        hasPdf={props.hasPdf}
        issueSlug={props.issueSlug}
        issueTitle={props.issueTitle}
        allowDouble={allowDouble}
      />

      <div className="reader-body">
        {effectiveMode !== "scroll" && (
          <>
            <button
              type="button"
              className="reader-arrow prev"
              onClick={goPrev}
              disabled={page <= 1}
              aria-label="Previous page"
            >
              <ChevronLeft size={22} />
            </button>
            <button
              type="button"
              className="reader-arrow next"
              onClick={goNext}
              disabled={
                effectiveMode === "double"
                  ? page + (page === 1 ? 1 : 2) > props.numPages
                  : page >= props.numPages
              }
              aria-label="Next page"
            >
              <ChevronRight size={22} />
            </button>
          </>
        )}

        <div
          className="reader-stage"
          ref={stageRef}
          style={{ transform: `scale(${zoom})` }}
        >
          {effectiveMode === "scroll" &&
            pageNumbers.map((n) => (
              <img
                key={n}
                className="reader-page"
                src={pageUrl(n)}
                alt={`${props.issueTitle} — page ${n}`}
                loading={n <= 2 ? "eager" : "lazy"}
                decoding="async"
              />
            ))}

          {effectiveMode === "single" && (
            <img
              key={`s-${page}`}
              className="reader-page"
              src={pageUrl(page)}
              alt={`${props.issueTitle} — page ${page}`}
              loading="eager"
              decoding="async"
            />
          )}

          {effectiveMode === "double" && (
            <div className={`spread ${page === 1 ? "cover-only" : ""}`} key={`d-${page}`}>
              {page === 1 ? (
                <img
                  className="reader-page"
                  src={pageUrl(1)}
                  alt={`${props.issueTitle} — cover`}
                  loading="eager"
                  decoding="async"
                />
              ) : (
                <>
                  <img
                    className="reader-page left"
                    src={pageUrl(page)}
                    alt={`${props.issueTitle} — page ${page}`}
                    loading="eager"
                    decoding="async"
                  />
                  {rightPage && (
                    <img
                      className="reader-page right"
                      src={pageUrl(rightPage)}
                      alt={`${props.issueTitle} — page ${rightPage}`}
                      loading="eager"
                      decoding="async"
                    />
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {effectiveMode !== "scroll" && (
        <ReaderRail
          numPages={props.numPages}
          page={page}
          step={step}
          rightPage={rightPage}
          onChange={(p) => setPage(p)}
          onPrev={goPrev}
          onNext={goNext}
        />
      )}
    </div>
  );
}
