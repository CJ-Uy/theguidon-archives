"use client";

import { publicUrl, r2Keys } from "@/lib/storage";

export type ReaderMode = "scroll" | "single" | "double";

type Props = {
  mode: ReaderMode;
  onModeChange: (m: ReaderMode) => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  issueId: number;
  hasPdf: boolean;
  issueSlug: string;
  issueTitle: string;
};

export default function ReaderTitleBar(props: Props) {
  const shareUrl = `https://archives.theguidon.com/issue/${props.issueSlug}`;
  return (
    <div className="reader-title-bar">
      <div className="mode-switch" role="tablist">
        <button
          className={props.mode === "scroll" ? "active" : ""}
          onClick={() => props.onModeChange("scroll")}
          aria-label="Long scroll view"
        >Scroll</button>
        <button
          className={props.mode === "single" ? "active" : ""}
          onClick={() => props.onModeChange("single")}
          aria-label="Single page view"
        >Single</button>
        <button
          className={`mode-double ${props.mode === "double" ? "active" : ""}`}
          onClick={() => props.onModeChange("double")}
          aria-label="Double page view"
        >Double</button>
      </div>
      <div className="controls">
        <button onClick={props.onZoomOut} aria-label="Zoom out">−</button>
        <span>{Math.round(props.zoom * 100)}%</span>
        <button onClick={props.onZoomIn} aria-label="Zoom in">+</button>
        <button onClick={props.onToggleFullscreen} aria-label={props.isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}>
          {props.isFullscreen ? "⤓" : "⤢"}
        </button>
        {props.hasPdf && (
          <a
            href={publicUrl(r2Keys.pdf(props.issueId))}
            download
            aria-label="Download PDF"
          >
            Download
          </a>
        )}
        <a
          href={`https://www.facebook.com/sharer.php?u=${encodeURIComponent(shareUrl)}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Share on Facebook"
        >FB</a>
        <a
          href={`https://x.com/share?text=${encodeURIComponent(`View the ${props.issueTitle} release on The GUIDON Archives: ${shareUrl}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Share on X"
        >X</a>
      </div>
    </div>
  );
}
