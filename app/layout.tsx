import "@/styles/globals.css";
import "@/styles/admin-premium.css";
import Providers from "@/components/providers";
import { cn } from "@/styles/utils";
import ViewportFitBanner from "@/components/ViewportFitBanner";
import ImpersonationBanner from "@/components/admin/ImpersonationBanner";

export const metadata = {
  title: "BPI - BeepAgro Progress Initiative",
  description: "BeepAgro Progress Initiative - Empowering Agricultural Communities",
  icons: {
    icon: "/img/logo.png",
    shortcut: "/img/logo.png",
    apple: "/img/logo.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-background font-sans antialiased")}> 
        <Providers>
          <ImpersonationBanner />
          {children}
          <ViewportFitBanner />
        </Providers>
      </body>
    </html>
  );
}
