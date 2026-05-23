"use client";

type PdfJs = typeof import("pdfjs-dist");

let pdfjsPromise: Promise<PdfJs> | null = null;
async function loadPdfJs(): Promise<PdfJs> {
  if (!pdfjsPromise) {
    pdfjsPromise = import("pdfjs-dist").then((mod) => {
      mod.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
      return mod;
    });
  }
  return pdfjsPromise;
}

const TARGET_WIDTH = 1500;
const WEBP_QUALITY = 0.85;

export async function pdfPagesToWebp(
  file: File,
  onProgress?: (done: number, total: number) => void,
): Promise<{ blobs: Blob[]; numPages: number }> {
  const pdfjs = await loadPdfJs();
  const buf = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buf }).promise;
  const numPages = doc.numPages;
  const blobs: Blob[] = [];

  for (let n = 1; n <= numPages; n++) {
    const page = await doc.getPage(n);
    const baseViewport = page.getViewport({ scale: 1 });
    const scale = Math.min(TARGET_WIDTH / baseViewport.width, 4);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not get 2D canvas context");

    await page.render({ canvas, canvasContext: ctx, viewport }).promise;

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("toBlob returned null"))),
        "image/webp",
        WEBP_QUALITY,
      );
    });

    blobs.push(blob);
    onProgress?.(n, numPages);
  }

  return { blobs, numPages };
}

export async function imageFileToWebp(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get 2D canvas context");
  ctx.drawImage(bitmap, 0, 0);
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("toBlob returned null"))),
      "image/webp",
      WEBP_QUALITY,
    );
  });
}
