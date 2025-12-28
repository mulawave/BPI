import "@/styles/globals.css";
import Providers from "@/components/providers";
import { cn } from "@/styles/utils";

export const metadata = {
  title: "BPI",
  description: "BeepAgro Progress Initiative - Empowering Agricultural Communities"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-background font-sans antialiased")}> 
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
