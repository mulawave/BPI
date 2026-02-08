"use client";
import { useMemo } from "react";
import Link from "next/link";
import { 
  Facebook, Twitter, Instagram, Linkedin, Youtube,
  Mail, Phone, MapPin, ChevronUp,
  Users, Shield, TrendingUp, BookOpen
} from "lucide-react";
import { api } from "@/client/trpc";

interface FooterProps {
  onModalOpen?: (modalName: string) => void;
}

export default function Footer({ onModalOpen }: FooterProps) {
  const { data: footerPages } = api.content.getFooterPages.useQuery(undefined, { refetchOnWindowFocus: false });
  const { data: companyInfo } = api.admin.getSystemSettings.useQuery(undefined, { refetchOnWindowFocus: false });

  const footerLinks = useMemo<{ label: string; href: string }[]>(() => {
    const termsPage = footerPages?.find((p: any) => p.category === "terms");
    const privacyPage = footerPages?.find((p: any) => p.category === "policy" || p.category === "privacy");
    const cookiesPage = footerPages?.find((p: any) => p.category === "cookies");

    return [
      { label: "Terms of Service", href: termsPage ? `/pages/${termsPage.slug}` : "/pages/terms-of-service" },
      { label: "Privacy Policy", href: privacyPage ? `/pages/${privacyPage.slug}` : "/pages/privacy-policy" },
      { label: "Cookie Policy", href: cookiesPage ? `/pages/${cookiesPage.slug}` : "/pages/cookie-policy" },
    ];
  }, [footerPages]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="relative bg-gradient-to-br from-green-950 via-bpi-dark-card to-emerald-950 text-gray-300 mt-16">
      {/* Decorative Top Wave */}
      <div className="absolute top-0 left-0 w-full overflow-hidden leading-none">
        <svg className="relative block w-full h-12" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path
            d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
            className="fill-background"
          ></path>
        </svg>
      </div>

      <div className="w-full px-3 sm:px-4 lg:px-6 pt-20 pb-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          
          {/* Column 1: About BPI */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <img src="/img/logo.png" alt="BPI" className="h-11 w-11 rounded-xl border border-border object-cover flex-shrink-0" />
              <h3 className="text-2xl font-bold text-white">BeepAgro Palliative Initiative</h3>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              BeepAgro Palliative Initiative - Empowering agricultural communities through innovation, sustainability, and shared prosperity.
            </p>
            
            {/* Social Links */}
            <div className="flex gap-3 pt-4">
              {[
                { icon: Facebook, href: companyInfo?.social_facebook?.value || "#", label: "Facebook", show: !!companyInfo?.social_facebook?.value },
                { icon: Twitter, href: companyInfo?.social_twitter?.value || "#", label: "Twitter", show: !!companyInfo?.social_twitter?.value },
                { icon: Instagram, href: companyInfo?.social_instagram?.value || "#", label: "Instagram", show: !!companyInfo?.social_instagram?.value },
                { icon: Linkedin, href: companyInfo?.social_linkedin?.value || "#", label: "LinkedIn", show: !!companyInfo?.social_linkedin?.value },
                { icon: Youtube, href: companyInfo?.social_youtube?.value || "#", label: "YouTube", show: !!companyInfo?.social_youtube?.value }
              ].filter(s => s.show).map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-10 h-10 bg-green-900/30 hover:bg-bpi-primary rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110 group"
                >
                  <Icon className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                </a>
              ))}
            </div>
          </div>

          {/* Column 2: (reserved) */}
          <div className="hidden lg:block" aria-hidden />

          {/* Column 3: (reserved) */}
          <div className="hidden lg:block" aria-hidden />

          {/* Column 4: Contact (kept last) */}
          <div>
            <h4 className="text-white font-semibold text-lg mb-6 flex items-center gap-2">
              <Mail className="w-5 h-5 text-bpi-primary" />
              Contact
            </h4>
            <div className="space-y-3">
              {companyInfo?.company_address?.value && (
                <div className="flex items-start gap-3 text-sm">
                  <MapPin className="w-4 h-4 text-bpi-primary flex-shrink-0 mt-1" />
                  <span className="text-gray-400">{companyInfo.company_address.value}</span>
                </div>
              )}
              {companyInfo?.company_email?.value && (
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-bpi-primary flex-shrink-0" />
                  <a href={`mailto:${companyInfo.company_email.value}`} className="text-gray-400 hover:text-bpi-primary transition-colors">
                    {companyInfo.company_email.value}
                  </a>
                </div>
              )}
              {companyInfo?.company_phone?.value && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-bpi-primary flex-shrink-0" />
                  <a href={`tel:${companyInfo.company_phone.value}`} className="text-gray-400 hover:text-bpi-primary transition-colors">
                    {companyInfo.company_phone.value}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-green-800/30 mb-8"></div>

        {/* Bottom Footer */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
          <div className="text-gray-500 text-center md:text-left">
            © {new Date().getFullYear()} BeepAgro Palliative Initiative. All rights reserved.
          </div>
          
          {/* Footer Links */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-gray-500">
            {footerLinks.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-bpi-primary transition-colors">
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Trust Badges */}
        <div className="flex flex-wrap items-center justify-center gap-6 mt-8 pt-8 border-t border-green-800/30">
          <div className="flex items-center gap-2 text-gray-500 text-xs">
            <Shield className="w-4 h-4 text-green-500" />
            <span>Secure Platform</span>
          </div>
          <div className="flex items-center gap-2 text-gray-500 text-xs">
            <Users className="w-4 h-4 text-blue-500" />
            <span>Community Driven</span>
          </div>
          <div className="flex items-center gap-2 text-gray-500 text-xs">
            <TrendingUp className="w-4 h-4 text-purple-500" />
            <span>Sustainable Growth</span>
          </div>
          <div className="flex items-center gap-2 text-gray-500 text-xs">
            <BookOpen className="w-4 h-4 text-orange-500" />
            <span>Education First</span>
          </div>
        </div>
      </div>

      {/* Scroll to Top Button */}
      <button
        onClick={scrollToTop}
        className="fixed bottom-24 md:bottom-8 right-4 md:right-8 w-12 h-12 bg-gradient-to-br from-bpi-primary to-emerald-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 flex items-center justify-center z-50 group"
        aria-label="Scroll to top"
      >
        <ChevronUp className="w-6 h-6 group-hover:animate-bounce" />
      </button>
    </footer>
  );
}
