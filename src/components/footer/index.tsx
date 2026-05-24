"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAlertBar } from "@/lib/alert-bar-context";
import "./index.css";

const SUBSCRIBE_ENDPOINT =
  "https://script.google.com/macros/s/AKfycbwdn8fWAQePWM5krVdYzwC_ksQ6pRQ561_Y1pIX6xq9fueADpNqIy-j9mJW_5zc99nr/exec";

const EMAIL_REGEX =
  /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

export default function Footer() {
  const pathname = usePathname();
  const { show } = useAlertBar();
  if (pathname?.startsWith("/admin")) return null;

  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [disabled, setDisabled] = useState(false);

  const onSubscribe = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (EMAIL_REGEX.test(email)) {
      const formdata = new FormData();
      formdata.append("email", email);

      setSubmitting(true);
      setDisabled(true);

      fetch(SUBSCRIBE_ENDPOINT, {
        method: "POST",
        body: formdata,
      })
        .then(() => {
          setSubmitting(false);
          show(
            "Successfully subscribed to The GUIDON's newsletter. Thank you!"
          );
        })
        .catch(() => {
          show(
            "An unexpected error has occurred. Please refresh the page and try again later."
          );
        });
    } else {
      show("Invalid email address");
    }
  };

  return (
    <footer>
      <div className="general-container">
        <div className="content">
          <div className="logo-desc-group">
            <img className="logo" src="/logos/base-white.svg" alt="The GUIDON" />

            <p className="desc">
              The Archives is a collection of The GUIDON&apos;s published content
              since 1929, chronicling its history as the official student
              publication of the Ateneo de Manila University.
            </p>
          </div>

          <div className="browse">
            <p className="subheader">Browse the Archives</p>
            <Link href="/releases/recent">Recently Uploaded</Link>
            <Link href="/releases/press">Press Issues</Link>
            <Link href="/releases/gradmag">Graduation Magazines</Link>
            <Link href="/releases/freshmanual">Freshmanuals</Link>
            <Link href="/releases/uaap-primer">UAAP Primers</Link>
            <Link href="/releases/legacy">Over the Years</Link>
            <Link href="/releases/others">Others</Link>
          </div>

          <div className="more">
            <p className="subheader">
              More from <span className="nowrap">The GUIDON</span>
            </p>
            <Link href="https://theguidon.com">
              <span className="nowrap">The GUIDON</span> Main
            </Link>
            <Link href="https://interactive.theguidon.com">
              <span className="nowrap">The GUIDON</span> Interactive
            </Link>
            <Link href="https://vantage.theguidon.com">Vantage Magazine</Link>
          </div>

          <div className="newsletter-group">
            <p className="subscribe">Subscribe to our newsletter</p>
            <form id="subscribe-form" onSubmit={onSubscribe}>
              <svg
                width="16"
                height="17"
                viewBox="0 0 16 17"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M14 5.05L14 12.75C14 13.2628 13.614 13.6855 13.1166 13.7433L13 13.75H3.00001C2.48718 13.75 2.06451 13.364 2.00674 12.8666L2.00001 12.75L2 5.05L7.34151 9.50259C7.71853 9.83249 8.28149 9.83249 8.65852 9.50259L14 5.05ZM12.433 3.75L8.00001 7.42125L3.566 3.75H12.433Z"
                  fill="white"
                />
              </svg>

              <input
                name="email"
                type="text"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                readOnly={disabled}
              />

              <input
                type="submit"
                value={submitting ? "Subscribing..." : "Subscribe"}
                disabled={disabled}
              />
            </form>

            <div className="social-links">
              <Link href="https://facebook.com/TheGUIDON" target="_blank">
                <img src="/icons/facebook.svg" alt="Facebook" />
              </Link>
              <Link href="https://x.com/TheGUIDON" target="_blank">
                <img src="/icons/twitter.svg" alt="Twitter" />
              </Link>
              <Link href="https://www.instagram.com/theguidon" target="_blank">
                <img src="/icons/instagram.svg" alt="Instagram" />
              </Link>
              <Link href="https://www.youtube.com/@TheGuidon" target="_blank">
                <img src="/icons/youtube.svg" alt="YouTube" />
              </Link>
              <Link
                href="https://open.spotify.com/show/0t2PxYpSft6HfoPHibwAvT"
                target="_blank"
              >
                <img src="/icons/spotify.svg" alt="Spotify" />
              </Link>
            </div>
          </div>
        </div>

        <p className="credits">
          &copy; <span className="nowrap">The GUIDON</span> 2024 All rights
          reserved. <br className="tablet" /> Designed and developed by Digital
          Development <span style={{ whiteSpace: "nowrap" }}>2022–2023</span>{" "}
          and <span style={{ whiteSpace: "nowrap" }}>2023–2024</span>.
        </p>
      </div>
    </footer>
  );
}
