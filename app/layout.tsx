import "@/styles/globals.css";
import "@/styles/admin-premium.css";
import "@/styles/emerald-theme.css";
import { Playfair_Display } from "next/font/google";
import Providers from "@/components/providers";
import { cn } from "@/styles/utils";
import ViewportFitBanner from "@/components/ViewportFitBanner";
import BrandThemeApplier from "@/components/BrandThemeApplier";
import dynamic from "next/dynamic";
const ImpersonationBanner = dynamic(() => import("@/components/admin/ImpersonationBanner"), { ssr: false });
import { resolveAppBaseUrl } from "@/lib/appUrl";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
  variable: "--font-display",
});

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
    <html lang="en" suppressHydrationWarning className={playfair.variable}>
      <body
        className={cn("min-h-screen bg-background font-sans antialiased")}
        data-app-base-url={appBaseUrl}
      > 
        <Providers>
          <BrandThemeApplier />
          <ImpersonationBanner />
          {children}
          <ViewportFitBanner />
        </Providers>
      </body>
    </html>
  );
}
