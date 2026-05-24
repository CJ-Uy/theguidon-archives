"use client";

import {
  ArrowDownUp,
  BookOpen,
  Download,
  FileText,
  Maximize2,
  Minimize2,
  Minus,
  Plus,
} from "lucide-react";

export type ReaderMode = "scroll" | "single" | "double";

type Props = {
  mode: ReaderMode;
  onModeChange: (m: ReaderMode) => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  pdfUrl: string | null;
  issueSlug: string;
  issueTitle: string;
  allowDouble: boolean;
};

export default function ReaderTitleBar(props: Props) {
  const shareUrl = `https://archives.theguidon.com/issue/${props.issueSlug}`;
  return (
    <div className="reader-title-bar">
      <div className="masthead">
        <span className="masthead-mark">The GUIDON Archives</span>
        <span className="masthead-title">{props.issueTitle}</span>
      </div>

      <div className="mode-switch" role="tablist" aria-label="Reading mode">
        <button
          className={props.mode === "scroll" ? "active" : ""}
          onClick={() => props.onModeChange("scroll")}
          aria-label="Long scroll view"
          aria-pressed={props.mode === "scroll"}
        >
          <ArrowDownUp size={13} />
          Scroll
        </button>
        <button
          className={props.mode === "single" ? "active" : ""}
          onClick={() => props.onModeChange("single")}
          aria-label="Single page view"
          aria-pressed={props.mode === "single"}
        >
          <FileText size={13} />
          Page
        </button>
        {props.allowDouble && (
          <button
            className={`mode-double ${props.mode === "double" ? "active" : ""}`}
            onClick={() => props.onModeChange("double")}
            aria-label="Double page spread view"
            aria-pressed={props.mode === "double"}
          >
            <BookOpen size={13} />
            Spread
          </button>
        )}
      </div>

      <div className="controls">
        <div className="zoom" aria-label="Zoom controls">
          <button onClick={props.onZoomOut} aria-label="Zoom out" disabled={props.zoom <= 0.5}>
            <Minus size={14} />
          </button>
          <span className="zoom-val">{Math.round(props.zoom * 100)}%</span>
          <button onClick={props.onZoomIn} aria-label="Zoom in" disabled={props.zoom >= 3}>
            <Plus size={14} />
          </button>
        </div>

        <button
          onClick={props.onToggleFullscreen}
          aria-label={props.isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          title={props.isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        >
          {props.isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </button>

        {props.pdfUrl && (
          <a
            className="download"
            href={props.pdfUrl}
            download
            aria-label="Download PDF"
            title="Download PDF"
          >
            <Download size={13} style={{ marginRight: 6 }} />
            PDF
          </a>
        )}

        <a
          className="fb"
          href={`https://www.facebook.com/sharer.php?u=${encodeURIComponent(shareUrl)}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Share on Facebook"
          title="Share on Facebook"
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
            <path d="M13.5 22v-8h2.7l.4-3.2H13.5V8.7c0-.9.3-1.5 1.6-1.5h1.7V4.3c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.4H7.4V14h2.7v8h3.4z" />
          </svg>
        </a>
        <a
          className="x"
          href={`https://x.com/share?text=${encodeURIComponent(`View the ${props.issueTitle} release on The GUIDON Archives: ${shareUrl}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Share on X"
          title="Share on X"
        >
          <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor" aria-hidden="true">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.451-6.231zm-1.161 17.52h1.833L7.084 4.126H5.117l11.966 15.644z" />
          </svg>
        </a>
      </div>
    </div>
  );
}
