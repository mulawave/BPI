import "@/styles/globals.css";
import "@/styles/admin-premium.css";
import Providers from "@/components/providers";
import { cn } from "@/styles/utils";
import ViewportFitBanner from "@/components/ViewportFitBanner";
import dynamic from "next/dynamic";
const ImpersonationBanner = dynamic(() => import("@/components/admin/ImpersonationBanner"), { ssr: false });
import { resolveAppBaseUrl } from "@/lib/appUrl";

export const metadata = {
  title: "BPI - BeepAgro Palliative Initiative",
  description: "Building africa's Future, One Community at a time",
  icons: {
    icon: "/img/logo.png",
    shortcut: "/img/logo.png",
    apple: "/img/logo.png",
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const appBaseUrl = await resolveAppBaseUrl();

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn("min-h-screen bg-background font-sans antialiased")}
        data-app-base-url={appBaseUrl}
      > 
        <Providers>
          <ImpersonationBanner />
          {children}
          <ViewportFitBanner />
        </Providers>
      </body>
    </html>
  );
}
