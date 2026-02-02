"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { 
  Facebook, Twitter, Instagram, Linkedin, Youtube,
  Mail, Phone, MapPin, ArrowRight, ChevronUp,
  Leaf, Users, Shield, Award, TrendingUp, BookOpen,
  Sparkles, GraduationCap, Calculator, Download, Megaphone
} from "lucide-react";
import { api } from "@/client/trpc";

interface FooterProps {
  onModalOpen?: (modalName: string) => void;
}

export default function Footer({ onModalOpen }: FooterProps) {
  const [email, setEmail] = useState("");
  const { data: footerPages } = api.content.getFooterPages.useQuery(undefined, { refetchOnWindowFocus: false });
  const { data: companyInfo } = api.admin.getSystemSettings.useQuery(undefined, { refetchOnWindowFocus: false });

  const footerLinks = useMemo<{ label: string; href: string }[]>(() => {
    if (!footerPages || footerPages.length === 0) {
      return [
        { label: "Terms of Service", href: "/pages/terms-of-service" },
        { label: "Privacy Policy", href: "/pages/privacy-policy" },
        { label: "Cookie Policy", href: "/pages/cookie-policy" },
      ];
    }
    return footerPages.map((p: { title: string; slug: string }) => ({ label: p.title, href: `/pages/${p.slug}` }));
  }, [footerPages]);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement newsletter subscription
    setEmail("");
  };

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
              <div className="w-10 h-10 bg-gradient-to-br from-bpi-primary to-emerald-600 rounded-lg flex items-center justify-center">
                <Leaf className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white">BPI</h3>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              BeepAgro Progress Initiative - Empowering agricultural communities through innovation, sustainability, and shared prosperity.
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

          {/* Column 2: Quick Links */}
          <div>
            <h4 className="text-white font-semibold text-lg mb-6 flex items-center gap-2">
              <Users className="w-5 h-5 text-bpi-primary" />
              Quick Links
            </h4>
            <ul className="space-y-3">
              {[
                { label: "About Us", href: "/about" },
                { label: "Membership Packages", href: "/membership" },
                { label: "Tokenomics", href: "/tokenomics" },
                { label: "Empowerment Programs", href: "/empowerment" },
                { label: "Community", onClick: () => onModalOpen?.('community') },
                { label: "Training Center", onClick: () => onModalOpen?.('training') },
              ].map((link) => (
                <li key={link.label}>
                  {link.href ? (
                    <Link 
                      href={link.href}
                      className="text-gray-400 hover:text-bpi-primary transition-colors duration-200 flex items-center gap-2 group text-sm"
                    >
                      <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <span>{link.label}</span>
                    </Link>
                  ) : (
                    <button
                      onClick={link.onClick}
                      className="text-gray-400 hover:text-bpi-primary transition-colors duration-200 flex items-center gap-2 group text-sm"
                    >
                      <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <span>{link.label}</span>
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Community Features */}
          <div>
            <h4 className="text-white font-semibold text-lg mb-6 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-bpi-primary" />
              Features
            </h4>
            <ul className="space-y-3">
              {[
                { label: "BPI Calculator", icon: Calculator, onClick: () => onModalOpen?.('calculator') },
                { label: "Best Deals", icon: Sparkles, onClick: () => onModalOpen?.('deals') },
                { label: "Leadership Pool", icon: Award, onClick: () => onModalOpen?.('leadership') },
                { label: "Latest Updates", icon: Megaphone, onClick: () => onModalOpen?.('updates') },
                { label: "Training Courses", icon: GraduationCap, onClick: () => onModalOpen?.('training') },
                { label: "Promotional Materials", icon: Download, onClick: () => onModalOpen?.('materials') },
              ].map(({ label, icon: Icon, onClick }) => (
                <li key={label}>
                  <button
                    onClick={onClick}
                    className="text-gray-400 hover:text-bpi-primary transition-colors duration-200 flex items-center gap-2 group text-sm w-full text-left"
                  >
                    <Icon className="w-4 h-4 text-gray-500 group-hover:text-bpi-primary transition-colors" />
                    <span>{label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Contact & Newsletter */}
          <div>
            <h4 className="text-white font-semibold text-lg mb-6 flex items-center gap-2">
              <Mail className="w-5 h-5 text-bpi-primary" />
              Stay Connected
            </h4>
            
            {/* Contact Info */}
            <div className="space-y-3 mb-6">
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

            {/* Newsletter Signup */}
            <div>
              <p className="text-gray-400 text-sm mb-3">Subscribe to our newsletter for updates</p>
              <form onSubmit={handleSubscribe} className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email"
                  className="flex-1 px-3 py-2 bg-green-900/20 border border-green-800/50 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-bpi-primary transition-colors"
                  required
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-bpi-primary to-emerald-600 text-white rounded-lg hover:from-emerald-600 hover:to-bpi-primary transition-all duration-300 flex items-center justify-center"
                  aria-label="Subscribe"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-green-800/30 mb-8"></div>

        {/* Bottom Footer */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
          <div className="text-gray-500 text-center md:text-left">
            © {new Date().getFullYear()} BeepAgro Progress Initiative. All rights reserved.
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
