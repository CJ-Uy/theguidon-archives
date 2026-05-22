"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { publicUrl, r2Keys } from "@/lib/storage";
import ReaderSlider from "./slider";
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

export default function Reader(props: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = parseMode(searchParams.get("view"));

  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isNarrow, setIsNarrow] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    setIsNarrow(mq.matches);
    const listener = (e: MediaQueryListEvent) => setIsNarrow(e.matches);
    mq.addEventListener("change", listener);
    return () => mq.removeEventListener("change", listener);
  }, []);

  const effectiveMode: ReaderMode = mode === "double" && isNarrow ? "single" : mode;

  function setMode(m: ReaderMode) {
    const sp = new URLSearchParams(Array.from(searchParams.entries()));
    if (m === "scroll") sp.delete("view");
    else sp.set("view", m);
    const qs = sp.toString();
    router.replace(qs ? `?${qs}` : window.location.pathname, { scroll: false });
  }

  useEffect(() => {
    if (effectiveMode === "scroll") return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") setPage((p) => Math.max(1, p - (effectiveMode === "double" ? 2 : 1)));
      if (e.key === "ArrowRight") setPage((p) => {
        const step = effectiveMode === "double" ? 2 : 1;
        const next = p + step;
        return next > props.numPages ? p : next;
      });
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [effectiveMode, props.numPages]);

  useEffect(() => {
    function onChange() { setIsFullscreen(document.fullscreenElement != null); }
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

  const pageNumbers = useMemo(() => {
    return Array.from({ length: props.numPages }, (_, i) => i + 1);
  }, [props.numPages]);

  return (
    <div className={`reader reader-mode-${effectiveMode}`} ref={containerRef}>
      <ReaderTitleBar
        mode={effectiveMode}
        onModeChange={setMode}
        zoom={zoom}
        onZoomIn={() => setZoom((z) => Math.min(3, z + 0.25))}
        onZoomOut={() => setZoom((z) => Math.max(0.5, z - 0.25))}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        issueId={props.issueId}
        hasPdf={props.hasPdf}
        issueSlug={props.issueSlug}
        issueTitle={props.issueTitle}
      />

      <div className="reader-body">
        {effectiveMode === "scroll" && (
          <div style={{ transform: `scale(${zoom})`, transformOrigin: "top center" }}>
            {pageNumbers.map((n) => (
              <img
                key={n}
                className="reader-page"
                src={pageUrl(n)}
                alt={`${props.issueTitle} — page ${n}`}
                loading={n <= 2 ? "eager" : "lazy"}
              />
            ))}
          </div>
        )}

        {effectiveMode === "single" && (
          <div style={{ transform: `scale(${zoom})`, transformOrigin: "top center" }}>
            <img
              className="reader-page"
              src={pageUrl(page)}
              alt={`${props.issueTitle} — page ${page}`}
              loading="eager"
            />
          </div>
        )}

        {effectiveMode === "double" && (
          <div style={{ transform: `scale(${zoom})`, transformOrigin: "top center", display: "flex", gap: "0.5rem", justifyContent: "center" }}>
            {page === 1 ? (
              <img className="reader-page" src={pageUrl(1)} alt={`${props.issueTitle} — page 1`} loading="eager" />
            ) : (
              <>
                <img className="reader-page" src={pageUrl(page)} alt={`${props.issueTitle} — page ${page}`} loading="eager" />
                {page + 1 <= props.numPages && (
                  <img className="reader-page" src={pageUrl(page + 1)} alt={`${props.issueTitle} — page ${page + 1}`} loading="eager" />
                )}
              </>
            )}
          </div>
        )}
      </div>

      {effectiveMode !== "scroll" && (
        <ReaderSlider
          numPages={props.numPages}
          page={page}
          onChange={(p) => setPage(p)}
        />
      )}
    </div>
  );
}
