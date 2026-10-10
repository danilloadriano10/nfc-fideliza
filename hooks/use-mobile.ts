import * as React from "react"

const MOBILE_BREAKPOINT = 768

function subscribe(callback: () => void) {
  if (typeof window === "undefined") return () => {}
  window.addEventListener("resize", callback)
  return () => window.removeEventListener("resize", callback)
}

function getSnapshot() {
  return typeof window !== "undefined" ? window.innerWidth < MOBILE_BREAKPOINT : false
}

function getServerSnapshot() {
  return false
}

export function useIsMobile() {
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

