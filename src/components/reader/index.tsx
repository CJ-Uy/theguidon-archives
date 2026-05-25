"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ReaderRail from "./slider";
import ReaderTitleBar, { type ReaderMode } from "./title-bar";
import "./reader.css";

type Props = {
  issueId: number;
  issueSlug: string;
  issueTitle: string;
  numPages: number;
  hasPdf: boolean;
  publicBaseUrl: string;
};

const PRELOAD_AHEAD = 4;
const PRELOAD_BEHIND = 1;

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

/** For double mode: left page of the spread containing `p`.
 *  Page 1 sits alone (as a cover); from page 2 on, pairs are (2,3),(4,5)... */
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
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Slider drag local state so URL updates don't fight the dragging
  const [dragPage, setDragPage] = useState<number | null>(null);
  const commitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    setIsNarrow(mq.matches);
    const listener = (e: MediaQueryListEvent) => setIsNarrow(e.matches);
    mq.addEventListener("change", listener);
    return () => mq.removeEventListener("change", listener);
  }, []);

  const effectiveMode: ReaderMode =
    mode === "double" && isNarrow ? "single" : mode;
  const allowDouble = !isNarrow;

  const page = effectiveMode === "double" ? spreadLeft(urlPage) : urlPage;
  const visualPage = dragPage ?? page;
  const rightPage =
    effectiveMode === "double" && page > 1 && page + 1 <= props.numPages
      ? page + 1
      : null;

  const baseUrl = props.publicBaseUrl.replace(/\/$/, "");
  const pageUrl = useCallback(
    (n: number) => `${baseUrl}/pages/${props.issueId}/${n}.webp`,
    [baseUrl, props.issueId],
  );
  const pdfUrl = `${baseUrl}/pdfs/${props.issueId}.pdf`;

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

  const commitPage = useCallback(
    (p: number) => {
      const clamped = clampPage(p, props.numPages);
      writeParams((sp) => {
        if (clamped <= 1) sp.delete("p");
        else sp.set("p", String(clamped));
      });
    },
    [props.numPages, writeParams],
  );

  // Slider input handler — updates visual instantly, debounces URL commit
  const sliderInput = useCallback(
    (p: number) => {
      setDragPage(p);
      if (commitTimer.current) clearTimeout(commitTimer.current);
      commitTimer.current = setTimeout(() => {
        commitPage(p);
        setDragPage(null);
      }, 150);
    },
    [commitPage],
  );

  // Discrete jumps (arrows, keyboard, input) — commit immediately
  const setPage = useCallback(
    (p: number) => {
      setDragPage(null);
      if (commitTimer.current) clearTimeout(commitTimer.current);
      commitPage(p);
    },
    [commitPage],
  );

  const step = effectiveMode === "double" ? 2 : 1;

  const goPrev = useCallback(() => {
    if (effectiveMode === "double") {
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

  // Fullscreen mirror
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

  // ============================================================
  // Preload neighboring pages so navigation is instant.
  // The browser caches Image objects' fetches; the visible <img>
  // then resolves from cache when we change `page`.
  // ============================================================
  useEffect(() => {
    if (effectiveMode === "scroll" || !baseUrl) return;
    const targets = new Set<number>();
    const aheadStep = effectiveMode === "double" ? 2 : 1;

    for (let i = 1; i <= PRELOAD_AHEAD; i++) {
      const ahead = page + aheadStep * i;
      if (ahead <= props.numPages) targets.add(ahead);
      if (effectiveMode === "double" && ahead + 1 <= props.numPages) targets.add(ahead + 1);
    }
    for (let i = 1; i <= PRELOAD_BEHIND; i++) {
      const behind = page - aheadStep * i;
      if (behind >= 1) targets.add(behind);
      if (effectiveMode === "double" && behind >= 2) targets.add(behind + 1);
    }
    // Detached Image() objects; rely on the browser HTTP cache.
    const imgs: HTMLImageElement[] = [];
    targets.forEach((n) => {
      const img = new window.Image();
      img.decoding = "async";
      img.src = pageUrl(n);
      imgs.push(img);
    });
    return () => {
      // Drop references; the browser may cancel pending loads.
      imgs.forEach((img) => {
        img.src = "";
      });
    };
  }, [baseUrl, effectiveMode, page, pageUrl, props.numPages]);

  // ============================================================
  // PDF download — fetch as blob and trigger a save dialog so the
  // current tab isn't navigated away. Falls back to a new-tab open
  // if the fetch fails (CORS, network).
  // ============================================================
  const onDownloadPdf = useCallback(async () => {
    if (downloading) return;
    setDownloading(true);
    setDownloadProgress(0);
    try {
      const resp = await fetch(pdfUrl);
      if (!resp.ok || !resp.body) throw new Error(`HTTP ${resp.status}`);

      const totalHeader = resp.headers.get("content-length");
      const total = totalHeader ? Number(totalHeader) : 0;
      const reader = resp.body.getReader();
      const chunks: Uint8Array[] = [];
      let received = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        received += value.length;
        if (total > 0) setDownloadProgress(Math.round((received / total) * 100));
      }

      const blob = new Blob(chunks as BlobPart[], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${props.issueSlug}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
    } catch {
      // Fallback: open in a new tab so the user isn't navigated away.
      window.open(pdfUrl, "_blank", "noopener,noreferrer");
    } finally {
      setDownloading(false);
      setDownloadProgress(null);
    }
  }, [downloading, pdfUrl, props.issueSlug]);

  const pageNumbers = useMemo(
    () => Array.from({ length: props.numPages }, (_, i) => i + 1),
    [props.numPages],
  );

  const nextDisabled =
    effectiveMode === "double"
      ? page + (page === 1 ? 1 : 2) > props.numPages
      : page >= props.numPages;

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
        pdfUrl={props.hasPdf ? pdfUrl : null}
        onDownloadPdf={onDownloadPdf}
        downloading={downloading}
        downloadProgress={downloadProgress}
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
              disabled={nextDisabled}
              aria-label="Next page"
            >
              <ChevronRight size={22} />
            </button>
          </>
        )}

        <div className="reader-stage" style={{ transform: `scale(${zoom})` }}>
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
              className="reader-page"
              src={pageUrl(page)}
              alt={`${props.issueTitle} — page ${page}`}
              loading="eager"
              decoding="async"
            />
          )}

          {effectiveMode === "double" && (
            <div className={`spread ${page === 1 ? "cover-only" : ""}`}>
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
          page={visualPage}
          step={step}
          rightPage={rightPage}
          onInput={sliderInput}
          onCommit={setPage}
          onPrev={goPrev}
          onNext={goNext}
        />
      )}
    </div>
  );
}
