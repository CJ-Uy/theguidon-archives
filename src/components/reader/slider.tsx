"use client";

type Props = {
  numPages: number;
  page: number;
  onChange: (p: number) => void;
};

export default function ReaderSlider({ numPages, page, onChange }: Props) {
  return (
    <div className="reader-slider">
      <span>Page {page} of {numPages}</span>
      <input
        type="range"
        min={1}
        max={numPages}
        value={page}
        onChange={(e) => onChange(parseInt(e.currentTarget.value, 10))}
      />
    </div>
  );
}
