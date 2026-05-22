"use client";

import { useEffect, useState } from "react";
import type { DateBound } from "../index";
import type { DateMode, DateStep } from "../advanced";
import type { DatePart } from "@/lib/dates";
import "./index.css";

type RangeFilter = {
  from: DatePart | null;
  until: DatePart | null;
};

type Props = {
  setActiveFilterPopup: (key: string | null) => void;
  mode: DateMode;
  setMode: (m: DateMode) => void;
  step: DateStep;
  setStep: (s: DateStep) => void;
  minDate: DateBound;
  maxDate: DateBound;
  setDate: (
    cmode: DateMode,
    cstep: 1 | 2 | 3,
    year: number,
    month: number,
    day: number,
  ) => void;
  rangeFilter: RangeFilter;
};

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export default function DateRange({
  setActiveFilterPopup,
  mode,
  setMode,
  step,
  setStep,
  minDate,
  maxDate,
  setDate,
  rangeFilter,
}: Props) {
  const [selectedDecade, setSelectedDecade] = useState(2020);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  useEffect(() => {
    if (selectedYear != null)
      setSelectedDecade(Math.floor(selectedYear / 10) * 10);
  }, [selectedYear]);

  useEffect(() => {
    if (rangeFilter != null && rangeFilter[mode] != null) {
      const part = rangeFilter[mode] as DatePart;
      setSelectedYear(part.year);
      setSelectedMonth(part.step >= 2 ? part.month : null);
      setSelectedDay(part.step >= 3 ? part.day : null);
    }

    if (rangeFilter != null && rangeFilter[mode] == null) {
      setSelectedYear(null);
      setSelectedMonth(null);
      setSelectedDay(null);
    }
  }, [rangeFilter, mode]);

  return (
    <>
      <div className="nav">
        <svg
          className={`chevron ${
            (step === "decade" &&
              selectedDecade - 10 < Math.floor(minDate.year / 10) * 10) ||
            (step === "year" &&
              selectedYear != null &&
              selectedYear - 1 < minDate.year) ||
            (step === "month" &&
              selectedYear === minDate.year &&
              selectedMonth != null &&
              selectedMonth - 1 < minDate.month)
              ? "disabled"
              : ""
          }`}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 21"
          fill="currentColor"
          onClick={() => {
            if (step === "decade") {
              setSelectedDecade((d) => d - 10);
            } else if (step === "year") {
              setSelectedYear((y) => (y != null ? y - 1 : y));
              setSelectedMonth(null);
            } else if (step === "month") {
              if (selectedMonth === 1) {
                setSelectedYear((y) => (y != null ? y - 1 : y));
                setSelectedMonth(12);
              } else {
                setSelectedMonth((m) => (m != null ? m - 1 : m));
              }
            }
          }}
        >
          <path d="M12.7107 6.6248C13.0182 6.34663 13.0427 5.87114 12.7652 5.56276C12.4878 5.25438 12.0135 5.22989 11.706 5.50806L7.28759 9.50408C6.95661 9.80342 6.95752 10.3244 7.28954 10.6226L11.6693 14.5559C11.9779 14.833 12.452 14.8069 12.7284 14.4975C13.0048 14.1882 12.9787 13.7128 12.6701 13.4357L9.24207 10.357C9.06551 10.1985 9.06503 9.92195 9.24103 9.76277L12.7107 6.6248Z" />
        </svg>

        <div className="selected">
          <p className={step === "decade" ? "show" : "hide"}>
            {selectedDecade}–{selectedDecade + 9}
          </p>
          <p
            className={`clickable ${step === "year" ? "show" : "hide"}`}
            onClick={() => {
              setStep("decade");
            }}
          >
            {selectedYear}
          </p>
          <>
            <p
              className={`clickable ${step === "month" ? "show" : "hide"}`}
              onClick={() => {
                setStep("year");
              }}
            >
              {selectedMonth != null ? MONTHS[selectedMonth - 1] : ""}
            </p>
            <p
              className={`clickable ${step === "month" ? "show" : "hide"}`}
              onClick={() => {
                setStep("decade");
              }}
            >
              {selectedYear}
            </p>
          </>
        </div>

        <svg
          className={`chevron ${
            (step === "decade" &&
              selectedDecade + 10 >= Math.floor(maxDate.year / 10) * 10 + 10) ||
            (step === "year" &&
              selectedYear != null &&
              selectedYear + 1 > maxDate.year) ||
            (step === "month" &&
              selectedYear === maxDate.year &&
              selectedMonth != null &&
              selectedMonth + 1 > maxDate.month)
              ? "disabled"
              : ""
          }`}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 21"
          fill="currentColor"
          onClick={() => {
            if (step === "decade") {
              setSelectedDecade((d) => d + 10);
            } else if (step === "year") {
              setSelectedYear((y) => (y != null ? y + 1 : y));
              setSelectedMonth(null);
            } else if (step === "month") {
              if (selectedMonth === 12) {
                setSelectedYear((y) => (y != null ? y + 1 : y));
                setSelectedMonth(1);
              } else {
                setSelectedMonth((m) => (m != null ? m + 1 : m));
              }
            }
          }}
        >
          <path d="M7.28934 13.4377C6.98177 13.7159 6.95735 14.1914 7.23479 14.4997C7.51223 14.8081 7.98647 14.8326 8.29404 14.5544L12.7124 10.5584C13.0434 10.2591 13.0425 9.73809 12.7105 9.43992L8.33066 5.50656C8.02212 5.22947 7.54796 5.25563 7.2716 5.56498C6.99524 5.87433 7.02132 6.34973 7.32986 6.62682L10.7579 9.70546C10.9345 9.86402 10.935 10.1405 10.759 10.2997L7.28934 13.4377Z" />
        </svg>
      </div>

      <hr />

      <div className={`years ${step === "decade" ? "show-grid" : "hide"}`}>
        {[...Array(10)].map((_, idx) => (
          <p
            className={`year ${
              selectedDecade + idx < minDate.year ||
              selectedDecade + idx > maxDate.year
                ? "disabled"
                : ""
            } ${
              selectedYear != null && selectedYear === selectedDecade + idx
                ? "active"
                : ""
            }`}
            key={`year-${selectedDecade + idx}`}
            onClick={() => {
              setSelectedYear(selectedDecade + idx);
              setStep("year");

              if (mode === "from") {
                if (
                  rangeFilter[mode] == null ||
                  rangeFilter[mode]!.year !== selectedDecade + idx
                ) {
                  setDate(mode, 1, selectedDecade + idx, 1, 1);
                }
              } else {
                if (
                  rangeFilter[mode] == null ||
                  rangeFilter[mode]!.year !== selectedDecade + idx
                ) {
                  setDate(mode, 1, selectedDecade + idx, 12, 31);
                }
              }
            }}
          >
            {selectedDecade + idx}
          </p>
        ))}
      </div>
      <div className={`months ${step === "year" ? "show-grid" : "hide"}`}>
        {MONTHS.map((month, idx) => (
          <p
            className={`month ${
              (selectedYear === minDate.year && idx + 1 < minDate.month) ||
              (selectedYear === maxDate.year && idx + 1 > maxDate.month)
                ? "disabled"
                : ""
            } ${
              selectedMonth != null && selectedMonth === idx + 1 ? "active" : ""
            }`}
            key={`month-${idx}`}
            onClick={() => {
              setSelectedMonth(idx + 1);
              setStep("month");

              if (selectedYear == null) return;

              if (mode === "from") {
                if (
                  rangeFilter[mode] == null ||
                  rangeFilter[mode]!.month !== idx + 1
                ) {
                  setDate(mode, 2, selectedYear, idx + 1, 1);
                }
              } else {
                if (
                  rangeFilter[mode] == null ||
                  rangeFilter[mode]!.month !== idx + 1
                ) {
                  setDate(
                    mode,
                    2,
                    selectedYear,
                    idx + 1,
                    new Date(selectedYear, idx + 1, 0).getDate(),
                  );
                }
              }
            }}
          >
            {month.substring(0, 3)}
          </p>
        ))}
      </div>
      <div className={`calendar ${step === "month" ? "show-grid" : "hide"}`}>
        {DAYS.map((day, idx) => (
          <p className="day-of-week" key={`day-of-week-${idx}`}>
            {day.substring(0, 1)}
          </p>
        ))}

        {selectedYear != null && selectedMonth != null
          ? [
              ...Array(new Date(selectedYear, selectedMonth - 1, 1).getDay()),
            ].map((_, idx) => <p key={`day-placeholder-${idx}`} />)
          : null}

        {selectedYear != null && selectedMonth != null
          ? [...Array(new Date(selectedYear, selectedMonth, 0).getDate())].map(
              (_, idx) => (
                <p
                  className={`day ${
                    (selectedYear === minDate.year &&
                      selectedMonth === minDate.month &&
                      idx + 1 < minDate.day) ||
                    (selectedYear === maxDate.year &&
                      selectedMonth === maxDate.month &&
                      idx + 1 > maxDate.day)
                      ? "disabled"
                      : ""
                  } ${selectedDay === idx + 1 ? "active" : ""}`}
                  key={`day-${idx + 1}`}
                  onClick={() => {
                    setSelectedDay(idx + 1);
                    setDate(mode, 3, selectedYear, selectedMonth, idx + 1);

                    if (mode === "from") {
                      setMode("until");
                      setStep("decade");

                      if (rangeFilter.until == null) {
                        setSelectedYear(null);
                        setSelectedMonth(null);
                        setSelectedDay(null);
                      } else {
                        setSelectedYear(rangeFilter.until.year);
                        if (rangeFilter.until.step >= 2)
                          setSelectedMonth(rangeFilter.until.month);
                        if (rangeFilter.until.step >= 3)
                          setSelectedDay(rangeFilter.until.day);
                      }
                    } else {
                      setActiveFilterPopup(null);
                    }
                  }}
                >
                  {idx + 1}
                </p>
              ),
            )
          : null}
      </div>
    </>
  );
}
