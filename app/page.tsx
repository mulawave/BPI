import { Navbar } from "@/components/homepage/layout/Navbar";
import { Footer } from "@/components/homepage/layout/Footer";
import { Hero } from "@/components/homepage/sections/Hero";
import { BrandIdentity } from "@/components/homepage/sections/BrandIdentity";
import { Ecosystem } from "@/components/homepage/sections/Ecosystem";
import { Flagships } from "@/components/homepage/sections/Flagships";
import { Spotlights } from "@/components/homepage/sections/Spotlights";
import { AboutSection } from "@/components/homepage/sections/AboutSection";
import { Media } from "@/components/homepage/sections/Media";
import { Engagement } from "@/components/homepage/sections/Engagement";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <Hero />
        <BrandIdentity />
        <Ecosystem />
        <Flagships />
        <Spotlights />
        <AboutSection />
        <Media />
        <Engagement />
      </main>
      <Footer />
    </div>
  );
}
