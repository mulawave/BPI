"use client";

import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { SessionProvider, useSession } from "next-auth/react";
import { ReactNode, useEffect, useRef, useState } from "react";
import { api } from "@/client/trpc";
import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { Toaster } from "react-hot-toast";
import { getNavAbortSignal, abortAllInFlightTrpcRequests } from "@/lib/trpcNavAbort";
import { CartProvider } from "@/lib/cart-context";

/**
 * Listens for unhandled promise rejections caused by a stale browser bundle
 * (error: "Failed to find Server Action"). When detected, forces a hard reload
 * so the client picks up the current deployment bundle automatically.
 */
function StaleDeployGuard() {
  useEffect(() => {
    const handler = (e: PromiseRejectionEvent) => {
      const msg: string = e.reason?.message ?? String(e.reason ?? "");
      if (msg.includes("Failed to find Server Action")) {
        window.location.reload();
      }
    };
    window.addEventListener("unhandledrejection", handler);
    return () => window.removeEventListener("unhandledrejection", handler);
  }, []);

  useEffect(() => {
    const onPageHide = () => abortAllInFlightTrpcRequests();
    window.addEventListener("pagehide", onPageHide);
    return () => window.removeEventListener("pagehide", onPageHide);
  }, []);

  return null;
}

/**
 * Watches the signed-in user ID and:
 * 1. Purges the ENTIRE React Query cache the moment the user identity changes
 *    (sign-out or account switch) — prevents cross-user data bleed.
 * 2. Invalidates all queries the first time an authenticated session is
 *    confirmed so fresh data is always fetched after login, even if something
 *    survived in cache from a previous session.
 */
function SessionCacheGuard() {
  const { data: session, status } = useSession();
  const qc = useQueryClient();
  const lastUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (status === "loading") return;
    const currentUserId = (session?.user as any)?.id ?? null;

    // First resolution after mount
    if (lastUserIdRef.current === undefined) {
      lastUserIdRef.current = currentUserId;
      // If we're already authenticated on mount, force-invalidate everything
      // so any stale cache from a prior session is immediately replaced.
      if (currentUserId) {
        qc.invalidateQueries();
      }
      return;
    }

    // User identity changed (logout, or switched accounts) — nuke the cache.
    if (lastUserIdRef.current !== currentUserId) {
      qc.clear();
    }
    lastUserIdRef.current = currentUserId;
  }, [session, status, qc]);

  return null;
}

export default function Providers({ children }: { children: ReactNode }) {
  const [qc] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // 30 s stale time — short enough that sensitive user data is never
        // served stale for long, but avoids hammering the server on every
        // render. Hard navigation always produces an empty cache anyway.
        staleTime: 30 * 1000,
        gcTime: 5 * 60 * 1000,
        // Keep defaults conservative; pages that need live refresh can opt in.
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        refetchOnMount: false,
        retry: 1,
      },
    },
  }));
  const [trpcClient] = useState(() =>
    api.createClient({
      links: [
        httpBatchLink({
          url: "/api/trpc",
          transformer: superjson,
          // Query requests (GET) get a 10-second timeout — keeps connections
          // from being held too long while preserving tRPC/React-Query's own
          // cancellation signal so queries are properly aborted on component
          // unmount / page navigation.
          // Mutation requests (POST) get a 120-second timeout — heavy admin
          // operations (deposit approval, membership assignment, referral
          // payouts) involve long database transactions that must not be
          // aborted mid-flight by the client.
          fetch: (url, options) => {
            const isMutation = (options?.method ?? "GET").toUpperCase() === "POST";
            const timeoutMs = isMutation ? 120_000 : 10_000;
            const timeoutController = new AbortController();
            const timeoutId = setTimeout(() => timeoutController.abort(), timeoutMs);

            // If tRPC/React-Query passed its own signal, forward its abort to
            // our controller too (manual signal combination for broad compat).
            const inboundSignal = options?.signal;
            if (inboundSignal) {
              if (inboundSignal.aborted) {
                timeoutController.abort();
              } else {
                inboundSignal.addEventListener("abort", () => timeoutController.abort(), { once: true });
              }
            }

            // Also listen to the global navigation abort signal so all
            // in-flight requests are killed instantly when the user navigates.
            const navSignal = getNavAbortSignal();
            if (navSignal.aborted) {
              timeoutController.abort();
            } else {
              navSignal.addEventListener("abort", () => timeoutController.abort(), { once: true });
            }

            return fetch(url, { ...options, signal: timeoutController.signal }).finally(
              () => clearTimeout(timeoutId)
            );
          },
        }),
      ],
    })
  );

  return (
    <SessionProvider>
      <api.Provider client={trpcClient} queryClient={qc}>
        <QueryClientProvider client={qc}>
          <ThemeProvider>
            <CurrencyProvider>
              <CartProvider>
              <StaleDeployGuard />
              <SessionCacheGuard />
              <Toaster 
                position="top-right"
                toastOptions={{
                  duration: 3000,
                  style: {
                    background: '#333',
                    color: '#fff',
                  },
                  success: {
                    duration: 3000,
                    iconTheme: {
                      primary: '#10b981',
                      secondary: '#fff',
                    },
                  },
                  error: {
                    duration: 4000,
                    iconTheme: {
                      primary: '#ef4444',
                      secondary: '#fff',
                    },
                  },
                }}
              />
              {children}
              </CartProvider>
            </CurrencyProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </api.Provider>
    </SessionProvider>
  );
}
