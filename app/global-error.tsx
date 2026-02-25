"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

// global-error replaces the root layout; must include <html> and <body>
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "sans-serif", background: "#fafafa" }}>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            textAlign: "center",
          }}
        >
          <div style={{ maxWidth: 420, width: "100%" }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: "#fee2e2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1.5rem",
              }}
            >
              <AlertTriangle style={{ width: 32, height: 32, color: "#dc2626" }} />
            </div>

            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem", color: "#111" }}>
              Critical error
            </h1>
            <p style={{ color: "#6b7280", marginBottom: "1.5rem", fontSize: "0.875rem" }}>
              A critical error occurred. Please refresh the page.
            </p>
            {error?.digest && (
              <p
                style={{
                  fontSize: "0.75rem",
                  fontFamily: "monospace",
                  background: "#f3f4f6",
                  padding: "4px 8px",
                  borderRadius: 4,
                  display: "inline-block",
                  marginBottom: "1.5rem",
                  color: "#6b7280",
                }}
              >
                Error ID: {error.digest}
              </p>
            )}
            <br />
            <button
              onClick={reset}
              style={{
                background: "#059669",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "0.6rem 1.4rem",
                fontSize: "0.875rem",
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <RefreshCw style={{ width: 16, height: 16 }} />
              Refresh page
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
