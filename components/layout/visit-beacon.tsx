"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * First-party, cookieless page counter for the dashboard's traffic charts. Sends the path, the referrer's host and
 * utm_source — never personal data. A per-tab flag marks the first view of a visit; a local flag marks returning
 * visitors. Respects Do Not Track.
 */
export function VisitBeacon() {
  const path = usePathname();
  useEffect(() => {
    if (navigator.doNotTrack === "1" || !navigator.sendBeacon) return;
    let first = false, returning = false;
    try {
      first = !sessionStorage.getItem("mb_v");
      if (first) {
        sessionStorage.setItem("mb_v", "1");
        returning = !!localStorage.getItem("mb_r");
        localStorage.setItem("mb_r", "1");
      }
    } catch {}
    let ref = "";
    try {
      const host = document.referrer ? new URL(document.referrer).hostname : "";
      ref = host === location.hostname ? "" : host;
    } catch {}
    const utm = new URLSearchParams(location.search).get("utm_source") ?? "";
    navigator.sendBeacon("/api/visit", JSON.stringify({ p: path.slice(0, 200), r: ref.slice(0, 100), u: utm.slice(0, 40), f: first, b: returning }));
  }, [path]);
  return null;
}
