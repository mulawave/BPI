"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { ReactNode, useState } from "react";
import { api } from "@/client/trpc";
import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import { ThemeProvider } from "@/contexts/ThemeContext";

export default function Providers({ children }: { children: ReactNode }) {
  const [qc] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    api.createClient({
      links: [
        httpBatchLink({
          url: "/api/trpc",
          transformer: superjson,
        }),
      ],
    })
  );

  return (
    <SessionProvider>
      <api.Provider client={trpcClient} queryClient={qc}>
        <QueryClientProvider client={qc}>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </QueryClientProvider>
      </api.Provider>
    </SessionProvider>
  );
}
