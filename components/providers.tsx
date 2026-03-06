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

/**
 * Watches the signed-in user ID and purges the entire React Query / tRPC
 * cache the moment it changes (sign-out OR switching accounts). Without this,
 * the stale cache from a previous session is shown to the next user on the
 * same browser before background refetches complete — causing the
 * "seeing another user's data" issue.
 */
function SessionCacheGuard() {
  const { data: session, status } = useSession();
  const qc = useQueryClient();
  const lastUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (status === "loading") return;
    const currentUserId = (session?.user as any)?.id ?? null;
    // On first render, just record the current user without clearing.
    if (lastUserIdRef.current === undefined) {
      lastUserIdRef.current = currentUserId;
      return;
    }
    // If the user changed (sign-out, or switched accounts) — purge everything.
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
        staleTime: 5 * 60 * 1000, // 5 minutes default
        gcTime: 10 * 60 * 1000, // 10 minutes cache
        refetchOnWindowFocus: false, // Disable aggressive refetching
        refetchOnReconnect: false,
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
          // Add a 20-second timeout while preserving tRPC/React-Query's own
          // cancellation signal so queries are still properly aborted on
          // component unmount / page navigation.
          fetch: (url, options) => {
            const timeoutController = new AbortController();
            const timeoutId = setTimeout(() => timeoutController.abort(), 20000);

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
            </CurrencyProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </api.Provider>
    </SessionProvider>
  );
}
