"use client";

import React, { Fragment, useState } from "react";
import DateRange from "../date-range";
import type { DateBound, FilterUpdate } from "../index";
import type { DatePart } from "@/lib/dates";
import "./index.css";

type RangeFilter = {
  from: DatePart | null;
  until: DatePart | null;
};

export type DateMode = "from" | "until";
export type DateStep = "decade" | "year" | "month";

type Props = {
  activeFilterPopup: string | null;
  setActiveFilterPopup: (key: string | null) => void;
  yearFilter: number | null;
  minDate: DateBound;
  maxDate: DateBound;
  rangeFilter: RangeFilter;
  sortOldestFilter: boolean;
  replace: (updates: FilterUpdate[]) => void;
};

export default function AdvancedFilters({
  activeFilterPopup,
  setActiveFilterPopup,
  yearFilter,
  minDate,
  maxDate,
  rangeFilter,
  sortOldestFilter,
  replace,
}: Props) {
  const [selectedDecade, setSelectedDecade] = useState(
    Math.floor(
      (yearFilter != null ? yearFilter : new Date().getFullYear()) / 10,
    ) * 10,
  );

  // decade = selecting year
  // year = selecting month
  // month = selecting date
  const [mode, setMode] = useState<DateMode>("from");
  const [step, setStep] = useState<DateStep>("decade");

  const setDate = (
    cmode: DateMode,
    cstep: 1 | 2 | 3,
    year: number,
    month: number,
    day: number,
  ) => {
    let val = "";
    if (cstep === 1) val = `${year}`;
    else if (cstep === 2) val = `${year}-${month.toString().padStart(2, "0")}`;
    else if (cstep === 3)
      val = `${year}-${month.toString().padStart(2, "0")}-${day
        .toString()
        .padStart(2, "0")}`;

    replace([
      { key: cmode, value: val },
      { key: "page", value: "1" },
    ]);
  };

  const closeIcon = (cmode: DateMode) => (
    <svg
      className="close"
      viewBox="0 0 16 16"
      fill="currentColor"
      stroke="currentStroke"
      xmlns="http://www.w3.org/2000/svg"
      onClick={() => {
        setMode(cmode);
        replace([{ key: cmode, delete: true }]);
      }}
    >
      <path
        d="M7.99967 14.6693C11.6817 14.6693 14.6663 11.6846 14.6663 8.0026C14.6663 4.3206 11.6817 1.33594 7.99967 1.33594C4.31767 1.33594 1.33301 4.3206 1.33301 8.0026C1.33301 11.6846 4.31767 14.6693 7.99967 14.6693Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.33333"
        strokeLinejoin="round"
      />
      <path
        d="M9.88535 6.11719L6.11401 9.88852M6.11401 6.11719L9.88535 9.88852"
        strokeWidth="1.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  const getRangeValue = () => {
    if (rangeFilter.from == null && rangeFilter.until == null) {
      return "Date Range";
    }

    const parser = (vals: DatePart) => {
      if (vals.step === 1) {
        return `${vals.year}`;
      } else if (vals.step === 2) {
        return `${vals.month.toString().padStart(2, "0")}/${vals.year}`;
      } else if (vals.step === 3) {
        return `${vals.month.toString().padStart(2, "0")}/${vals.day
          .toString()
          .padStart(2, "0")}/${vals.year}`;
      }
      return "";
    };

    const els: React.ReactNode[] = [];

    els.push(
      <p
        className={`nav-cell ${
          activeFilterPopup === "range" && mode === "from" ? "active" : ""
        } ${rangeFilter.from != null ? "has-filter" : ""}`}
        onClick={() => {
          if (activeFilterPopup === "range" && mode === "from")
            setActiveFilterPopup(null);
          else {
            setMode("from");
            setStep("decade");
          }
        }}
      >
        {rangeFilter.from != null
          ? `From: ${parser(rangeFilter.from)}`
          : `From: earliest`}
        {rangeFilter.from != null && closeIcon("from")}
      </p>,
    );

    els.push(
      <p
        className={`nav-cell ${
          activeFilterPopup === "range" && mode === "until" ? "active" : ""
        } ${rangeFilter.until != null ? "has-filter" : ""}`}
        onClick={() => {
          if (activeFilterPopup === "range" && mode === "until")
            setActiveFilterPopup(null);
          else {
            setMode("until");
            setStep("decade");
          }
        }}
      >
        {rangeFilter.until != null
          ? `Until: ${parser(rangeFilter.until)}`
          : `Until: latest`}
        {rangeFilter.until != null && closeIcon("until")}
      </p>,
    );

    return (
      <>
        {els.map((el, idx) => (
          <Fragment key={`rf-${idx}`}>{el}</Fragment>
        ))}
      </>
    );
  };

  return (
    <div className="advanced-filters">
      <div className="year-filter-container filter-container">
        <div
          className={`popup-container ${
            activeFilterPopup === "year" ? "active" : ""
          }`}
        >
          <div className="popup">
            <div className="nav">
              <svg
                className={`chevron ${
                  selectedDecade - 10 < Math.floor(minDate.year / 10) * 10
                    ? "disabled"
                    : ""
                }`}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 21"
                fill="currentColor"
                onClick={() => {
                  if (selectedDecade - 10 >= Math.floor(minDate.year / 10) * 10)
                    setSelectedDecade((d) => d - 10);
                }}
              >
                <path d="M12.7107 6.6248C13.0182 6.34663 13.0427 5.87114 12.7652 5.56276C12.4878 5.25438 12.0135 5.22989 11.706 5.50806L7.28759 9.50408C6.95661 9.80342 6.95752 10.3244 7.28954 10.6226L11.6693 14.5559C11.9779 14.833 12.452 14.8069 12.7284 14.4975C13.0048 14.1882 12.9787 13.7128 12.6701 13.4357L9.24207 10.357C9.06551 10.1985 9.06503 9.92195 9.24103 9.76277L12.7107 6.6248Z" />
              </svg>

              <p>
                {selectedDecade}–{selectedDecade + 9}
              </p>

              <svg
                className={`chevron ${
                  selectedDecade + 10 >= Math.floor(maxDate.year / 10) * 10 + 10
                    ? "disabled"
                    : ""
                }`}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 21"
                fill="currentColor"
                onClick={() => {
                  if (
                    selectedDecade + 10 <
                    Math.floor(maxDate.year / 10) * 10 + 10
                  )
                    setSelectedDecade((d) => d + 10);
                }}
              >
                <path d="M7.28934 13.4377C6.98177 13.7159 6.95735 14.1914 7.23479 14.4997C7.51223 14.8081 7.98647 14.8326 8.29404 14.5544L12.7124 10.5584C13.0434 10.2591 13.0425 9.73809 12.7105 9.43992L8.33066 5.50656C8.02212 5.22947 7.54796 5.25563 7.2716 5.56498C6.99524 5.87433 7.02132 6.34973 7.32986 6.62682L10.7579 9.70546C10.9345 9.86402 10.935 10.1405 10.759 10.2997L7.28934 13.4377Z" />
              </svg>
            </div>
            <hr />

            <div className="years">
              {[...Array(10)].map((_, idx) => (
                <p
                  className={`year ${
                    selectedDecade + idx < minDate.year ||
                    selectedDecade + idx > maxDate.year
                      ? "disabled"
                      : ""
                  } ${
                    yearFilter != null && yearFilter === selectedDecade + idx
                      ? "active"
                      : ""
                  }`}
                  key={`year-${selectedDecade + idx}`}
                  onClick={() => {
                    const year = selectedDecade + idx;
                    if (year >= minDate.year && year <= maxDate.year) {
                      if (year === yearFilter)
                        replace([
                          { key: "year", delete: true },
                          { key: "page", value: "1" },
                        ]);
                      else
                        replace([
                          { key: "year", value: String(year) },
                          { key: "page", value: "1" },
                        ]);
                      setActiveFilterPopup(null);
                    }
                  }}
                >
                  {selectedDecade + idx}
                </p>
              ))}
            </div>
          </div>
        </div>

        <div
          className={`filter ${yearFilter ? "active" : ""}`}
          onClick={() => {
            if (activeFilterPopup === "year") setActiveFilterPopup(null);
            else setActiveFilterPopup("year");
          }}
        >
          {yearFilter ? yearFilter : "Year"}
          <svg
            className="chevron"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="none"
          >
            <path
              d="M6.59368 7.28916C6.3155 6.98159 5.84001 6.95716 5.53163 7.2346C5.22325 7.51204 5.19876 7.98629 5.47693 8.29386L9.47295 12.7122C9.77229 13.0432 10.2933 13.0423 10.5915 12.7103L14.5248 8.33048C14.8019 8.02194 14.7757 7.54778 14.4664 7.27142C14.157 6.99506 13.6816 7.02114 13.4045 7.32968L10.3259 10.7577C10.1674 10.9343 9.89083 10.9348 9.73165 10.7588L6.59368 7.28916Z"
              fill="#1C4480"
            />
          </svg>
        </div>
      </div>

      <div className="range-filter-container filter-container">
        <div
          className={`popup-container ${
            activeFilterPopup === "range" ? "active" : ""
          }`}
        >
          <div className="popup">
            <DateRange
              setActiveFilterPopup={setActiveFilterPopup}
              mode={mode}
              setMode={setMode}
              step={step}
              setStep={setStep}
              minDate={minDate}
              maxDate={maxDate}
              setDate={setDate}
              rangeFilter={rangeFilter}
            />
          </div>
        </div>

        <div
          className={`filter ${
            rangeFilter.from == null && rangeFilter.until == null
              ? ""
              : "active"
          }`}
          onClick={(event) => {
            const className =
              (event.target as HTMLElement).getAttribute("class") ?? "";
            if (className.includes("close")) {
              // do nothing
            } else if (className.includes("nav-cell")) {
              if (activeFilterPopup !== "range") setActiveFilterPopup("range");
            } else {
              if (activeFilterPopup === "range") setActiveFilterPopup(null);
              else {
                setStep("decade");
                setActiveFilterPopup("range");
              }
            }
          }}
        >
          {getRangeValue()}
          <svg
            className="chevron"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="none"
          >
            <path
              d="M6.59368 7.28916C6.3155 6.98159 5.84001 6.95716 5.53163 7.2346C5.22325 7.51204 5.19876 7.98629 5.47693 8.29386L9.47295 12.7122C9.77229 13.0432 10.2933 13.0423 10.5915 12.7103L14.5248 8.33048C14.8019 8.02194 14.7757 7.54778 14.4664 7.27142C14.157 6.99506 13.6816 7.02114 13.4045 7.32968L10.3259 10.7577C10.1674 10.9343 9.89083 10.9348 9.73165 10.7588L6.59368 7.28916Z"
              fill="#1C4480"
            />
          </svg>
        </div>
      </div>

      <div className="sort-filter-container filter-container">
        <div
          className={`popup-container ${
            activeFilterPopup === "sort" ? "active" : ""
          }`}
        >
          <div className="popup">
            <p
              className={sortOldestFilter ? "" : "active"}
              onClick={() => {
                replace([{ key: "sort", value: "newest" }]);
                setActiveFilterPopup(null);
              }}
            >
              Newest first
            </p>
            <p
              className={sortOldestFilter ? "active" : ""}
              onClick={() => {
                replace([{ key: "sort", value: "oldest" }]);
                setActiveFilterPopup(null);
              }}
            >
              Oldest first
            </p>
          </div>
        </div>

        <div
          className={`filter ${sortOldestFilter == null ? "" : "active"}`}
          onClick={() => {
            if (activeFilterPopup === "sort") setActiveFilterPopup(null);
            else setActiveFilterPopup("sort");
          }}
        >
          {sortOldestFilter ? "Oldest first" : "Newest first"}
          <svg
            className="chevron"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="none"
          >
            <path
              d="M6.59368 7.28916C6.3155 6.98159 5.84001 6.95716 5.53163 7.2346C5.22325 7.51204 5.19876 7.98629 5.47693 8.29386L9.47295 12.7122C9.77229 13.0432 10.2933 13.0423 10.5915 12.7103L14.5248 8.33048C14.8019 8.02194 14.7757 7.54778 14.4664 7.27142C14.157 6.99506 13.6816 7.02114 13.4045 7.32968L10.3259 10.7577C10.1674 10.9343 9.89083 10.9348 9.73165 10.7588L6.59368 7.28916Z"
              fill="#1C4480"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
