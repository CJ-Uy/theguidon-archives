"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import SearchField from "../search-field";
import MobileMenu from "../mobile-menu";
import "./index.css";

export default function Header() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.get("query") ?? "";

  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  useEffect(() => {
    setShowMobileMenu(false);
    setShowMobileSearch(false);
  }, [pathname, query]);

  const toggleMobileMenu = () => setShowMobileMenu((s) => !s);
  const toggleMobileSearch = () => setShowMobileSearch((s) => !s);

  if (pathname?.startsWith("/admin")) return null;

  return (
    <header>
      <div className="general-container">
        <svg
          id="menu-icon"
          className="mobile-icon"
          onClick={toggleMobileMenu}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M21 17C21.5523 17 22 17.4477 22 18C22 18.5523 21.5523 19 21 19H3C2.44772 19 2 18.5523 2 18C2 17.4477 2.44772 17 3 17H21ZM21 11C21.5523 11 22 11.4477 22 12C22 12.5523 21.5523 13 21 13H3C2.44772 13 2 12.5523 2 12C2 11.4477 2.44772 11 3 11H21ZM21 5C21.5523 5 22 5.44772 22 6C22 6.55228 21.5523 7 21 7H3C2.44772 7 2 6.55228 2 6C2 5.44772 2.44772 5 3 5H21Z"
            fill="white"
          />
        </svg>

        <MobileMenu
          show={showMobileMenu}
          onClose={() => setShowMobileMenu(false)}
        />

        <Link href="/">
          <img className="logo" src="/logos/base-white.svg" alt="The GUIDON" />
        </Link>

        <svg
          id="search-icon"
          className="mobile-icon"
          onClick={toggleMobileSearch}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.8004 2.40039C15.4396 2.40039 19.2004 6.1612 19.2004 10.8004C19.2004 12.692 18.5751 14.4377 17.5199 15.8418L17.5858 15.8933L17.6489 15.9519L21.2489 19.5519C21.7175 20.0205 21.7175 20.7803 21.2489 21.2489C20.8163 21.6815 20.1357 21.7148 19.6649 21.3487L19.5519 21.2489L15.9519 17.6489C15.9108 17.6079 15.8734 17.5646 15.8395 17.5195C14.4377 18.5751 12.692 19.2004 10.8004 19.2004C6.1612 19.2004 2.40039 15.4396 2.40039 10.8004C2.40039 6.1612 6.1612 2.40039 10.8004 2.40039ZM10.8004 4.80039C7.48668 4.80039 4.80039 7.48668 4.80039 10.8004C4.80039 14.1141 7.48668 16.8004 10.8004 16.8004C14.1141 16.8004 16.8004 14.1141 16.8004 10.8004C16.8004 7.48668 14.1141 4.80039 10.8004 4.80039Z"
            fill="white"
          />
        </svg>

        <SearchField initialQuery={query} />

        <nav className="main-nav">
          <Link href="/" className={pathname === "/" ? "active" : ""}>
            Home
          </Link>
          <div className="releases-link-container">
            <div className="popup-container">
              <nav className="popup">
                <Link
                  href="/releases/recent"
                  className={pathname === "/releases/recent" ? "active" : ""}
                >
                  Recently Uploaded
                </Link>
                <Link
                  href="/releases/press"
                  className={pathname === "/releases/press" ? "active" : ""}
                >
                  Press Issues
                </Link>
                <Link
                  href="/releases/gradmag"
                  className={pathname === "/releases/gradmag" ? "active" : ""}
                >
                  Graduation Magazines
                </Link>
                <Link
                  href="/releases/freshmanual"
                  className={
                    pathname === "/releases/freshmanual" ? "active" : ""
                  }
                >
                  Freshmanuals
                </Link>
                <Link
                  href="/releases/uaap-primer"
                  className={
                    pathname === "/releases/uaap-primer" ? "active" : ""
                  }
                >
                  UAAP Primers
                </Link>
                <Link
                  href="/releases/legacy"
                  className={pathname === "/releases/legacy" ? "active" : ""}
                >
                  Over the Years
                </Link>
                <Link
                  href="/releases/others"
                  className={pathname === "/releases/others" ? "active" : ""}
                >
                  Others
                </Link>
              </nav>
            </div>

            <Link
              href="/releases"
              className={
                pathname.startsWith("/releases") ? "active" : ""
              }
            >
              Releases
              <svg
                className="chevron"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M6.5938 7.28965C6.31563 6.98208 5.84013 6.95765 5.53175 7.23509C5.22337 7.51253 5.19889 7.98678 5.47706 8.29435L9.47308 12.7127C9.77242 13.0437 10.2934 13.0428 10.5916 12.7108L14.5249 8.33097C14.802 8.02243 14.7759 7.54827 14.4665 7.27191C14.1572 6.99555 13.6818 7.02163 13.4047 7.33017L10.326 10.7582C10.1675 10.9348 9.89095 10.9353 9.73177 10.7593L6.5938 7.28965Z" />
              </svg>
            </Link>
          </div>
          <Link href="/about" className={pathname === "/about" ? "active" : ""}>
            About
          </Link>
        </nav>
      </div>

      <div
        className={`bg-tint ${showMobileSearch ? "active" : ""}`}
        onClick={toggleMobileSearch}
      />
      <div id="mobile-search" className={showMobileSearch ? "active" : ""}>
        <SearchField initialQuery={query} autoFocus={showMobileSearch} />
        <p className="cancel" onClick={toggleMobileSearch}>
          Cancel
        </p>
      </div>
    </header>
  );
}
