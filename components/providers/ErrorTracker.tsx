"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Utility to get network speed if available
const getNetworkSpeed = () => {
  if (typeof navigator !== "undefined" && "connection" in navigator) {
    const conn = (navigator as any).connection;
    return `${conn.effectiveType || "unknown"} - ${conn.downlink ? conn.downlink + "Mbps" : "unknown"}`;
  }
  return "unknown";
};

// Queue for errors that happen while offline
let offlineErrorQueue: any[] = [];

const sendErrorToServer = async (errorPayload: any) => {
  try {
    const res = await fetch("/api/errors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(errorPayload),
    });
    if (!res.ok) throw new Error("Failed to log error");
  } catch (e) {
    // If we can't send it, queue it for when we come back online
    offlineErrorQueue.push(errorPayload);
  }
};

const processQueue = () => {
  if (navigator.onLine && offlineErrorQueue.length > 0) {
    const queue = [...offlineErrorQueue];
    offlineErrorQueue = [];
    queue.forEach(sendErrorToServer);
  }
};

export function ErrorTracker({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    const handleOnline = () => processQueue();
    window.addEventListener("online", handleOnline);

    const handleError = (event: ErrorEvent) => {
      sendErrorToServer({
        message: event.message,
        stack: event.error?.stack,
        category: "USER", // Client side uncaught error
        url: window.location.href,
        networkSpeed: getNetworkSpeed(),
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      // Check if it's a network error (like fetch failed / site can't be reached)
      const isNetworkError = 
        event.reason?.name === "TypeError" && 
        (event.reason?.message === "Failed to fetch" || event.reason?.message === "NetworkError when attempting to fetch resource.");

      sendErrorToServer({
        message: isNetworkError ? "Network Timeout / Site Can't Be Reached" : String(event.reason),
        stack: event.reason?.stack,
        category: isNetworkError ? "NETWORK" : "USER",
        url: window.location.href,
        networkSpeed: getNetworkSpeed(),
      });
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, [pathname]);

  return <>{children}</>;
}
