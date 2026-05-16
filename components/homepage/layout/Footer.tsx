"use client";

import Link from 'next/link';
import { Facebook, Youtube, Instagram, MapPin, Phone, Mail, Twitter, Linkedin, Send, MessageCircle, Globe2 } from 'lucide-react';

const socialLinks = [
  { name: 'Facebook', icon: Facebook, url: 'https://web.facebook.com/people/Beepagro-Africa/100088524616888/', hoverColor: 'hover:bg-blue-600' },
  { name: 'X (Twitter)', icon: Twitter, url: 'https://x.com/BeepagroAfrica', hoverColor: 'hover:bg-gray-800' },
  { name: 'Instagram', icon: Instagram, url: 'https://www.instagram.com/beepagro/', hoverColor: 'hover:bg-pink-600' },
  { name: 'YouTube', icon: Youtube, url: 'https://youtube.com/@beepagroafrica', hoverColor: 'hover:bg-red-600' },
  { name: 'LinkedIn', icon: Linkedin, url: 'https://www.linkedin.com/company/bpitoken', hoverColor: 'hover:bg-blue-700' },
  { name: 'Telegram', icon: Send, url: 'https://t.me/Beepagroafrica', hoverColor: 'hover:bg-blue-500' },
  { name: 'WhatsApp', icon: MessageCircle, url: 'https://whatsapp.com/channel/0029Vb7N3mJ9MF8u29MzEN3e', hoverColor: 'hover:bg-green-500' },
  { name: 'MYNGUL', icon: Globe2, url: 'https://myngul.com/pages/beepagro', hoverColor: 'hover:bg-[#6FA15A]' },
];

export const Footer = () => {
  return (
    <footer className="bg-bpi-charcoal text-white pt-20 pb-10 md:pt-24 md:pb-12 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-16 mb-16">
          
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-3 mb-8 hover:opacity-90 transition-opacity" aria-label="Go to homepage">
              <img 
                src="https://i.ibb.co/hRxP0rYb/BPILOGO.jpg" 
                alt="BPI Logo" 
                className="h-12 md:h-14 w-auto object-contain bg-white p-2 rounded-xl"
              />
              <span className="font-bold text-xl tracking-tight">by BeepAgro Africa</span>
            </Link>
            <p className="text-white/70 mb-8 max-w-md leading-relaxed text-base font-light">
              BPI is a Pan-African Community Aggregator and empowerment ecosystem helping Africans access support, reduce retirement pressure, empower children and youth, monetize digital influence, and build trusted pathways for long-term growth.
            </p>
          </div>

          {/* Links Columns */}
          <div>
            <h4 className="font-bold text-lg mb-6 text-bpi-gold">Programs</h4>
            <ul className="space-y-4 text-white/70 text-base font-light">
              <li><Link href="/csp" className="inline-block py-1 md:py-0 hover:text-bpi-green transition-colors">Community Support</Link></li>
              <li><Link href="/membership" className="inline-block py-1 md:py-0 hover:text-bpi-green transition-colors">Early Retirement</Link></li>
              <li><Link href="/techquiz" className="inline-block py-1 md:py-0 hover:text-bpi-green transition-colors">Child Education</Link></li>
              <li><Link href="/elite-club" className="inline-block py-1 md:py-0 hover:text-bpi-green transition-colors">International Elite Club</Link></li>
              <li><Link href="/techquiz" className="inline-block py-1 md:py-0 hover:text-bpi-green transition-colors">BPI TechQuiz</Link></li>
              <li><Link href="/coming-soon" className="inline-block py-1 md:py-0 hover:text-bpi-green transition-colors">YouTube Monetization</Link></li>
              <li><a href="https://myngul.com/pages/beepagro" target="_blank" rel="noopener noreferrer" className="inline-block py-1 md:py-0 hover:text-bpi-green transition-colors">MYNGUL</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-lg mb-6 text-bpi-gold">Company</h4>
            <ul className="space-y-4 text-white/70 text-base font-light mb-10">
              <li><Link href="/about" className="inline-block py-1 md:py-0 hover:text-bpi-green transition-colors">About Us</Link></li>
              <li><Link href="/store" className="inline-block py-1 md:py-0 hover:text-bpi-green transition-colors">BPI Shop</Link></li>
              <li><Link href="/blog" className="inline-block py-1 md:py-0 hover:text-bpi-green transition-colors">Blog &amp; News</Link></li>
              <li><Link href="/help" className="inline-block py-1 md:py-0 hover:text-bpi-green transition-colors">Contact</Link></li>
            </ul>

            <h4 className="font-bold text-lg mb-6 text-bpi-gold">Account &amp; Legal</h4>
            <ul className="space-y-4 text-white/70 text-base font-light mb-6">
              <li><Link href="/login" className="inline-block py-1 md:py-0 hover:text-bpi-green transition-colors">Login</Link></li>
              <li><Link href="/register" className="inline-block py-1 md:py-0 hover:text-bpi-green transition-colors">Join the Movement</Link></li>
            </ul>
            <ul className="space-y-4 text-white/50 text-sm font-light">
              <li><Link href="/terms" className="inline-block py-1 md:py-0 hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link href="/privacy" className="inline-block py-1 md:py-0 hover:text-white transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-lg mb-6 text-bpi-gold">Contact Information</h4>
            <div className="space-y-5">
              <div className="flex items-start gap-4 text-white/70">
                <MapPin className="w-5 h-5 text-bpi-green flex-shrink-0 mt-1" />
                <address className="not-italic text-sm leading-relaxed font-light">
                  BeepHouse<br />
                  27B Yinusa Adeniji Street<br />
                  Off Muslim Avenue<br />
                  Ikeja, Lagos
                </address>
              </div>
              <div className="flex items-start gap-4 text-white/70">
                <Phone className="w-5 h-5 text-bpi-green flex-shrink-0 mt-1" />
                <div className="flex flex-col text-sm leading-relaxed space-y-1.5 font-light">
                  <a href="tel:+2347067108437" className="hover:text-bpi-green transition-colors py-0.5">+234 7067108437</a>
                  <a href="tel:+2349092003500" className="hover:text-bpi-green transition-colors py-0.5">+234 9092003500</a>
                </div>
              </div>
              <div className="flex items-start gap-4 text-white/70">
                <Mail className="w-5 h-5 text-bpi-green flex-shrink-0 mt-1" />
                <div className="flex flex-col text-sm leading-relaxed space-y-1.5 font-light">
                  <a href="mailto:info@beepagro.com" className="hover:text-bpi-green transition-colors py-0.5">info@beepagro.com</a>
                  <a href="mailto:beepagro@gmail.com" className="hover:text-bpi-green transition-colors py-0.5">beepagro@gmail.com</a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col lg:flex-row justify-between items-center gap-8">
          <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
            <p className="text-white/50 text-sm">
              &copy; 2026 BPI. All rights reserved.
            </p>
            <span className="hidden md:block text-white/30">&bull;</span>
            <p className="text-white/50 text-sm font-medium flex items-center justify-center md:justify-start gap-2">
              Powered by{' '}
              <img 
                src="https://i.ibb.co/Q75qWRmn/beepagro-logo.jpg" 
                alt="BeepAgro Logo" 
                className="h-6 md:h-7 w-auto object-contain inline-block rounded-sm"
              />
            </p>
          </div>
          
          {/* Social Media Links */}
          <div className="flex flex-wrap justify-center lg:justify-end items-center gap-3">
            {socialLinks.map((social) => (
              <a 
                key={social.name}
                href={social.url} 
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.name} 
                title={social.name}
                className={`w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/5 flex items-center justify-center text-white/70 hover:text-white transition-all duration-300 ${social.hoverColor}`}
              >
                <social.icon className="w-4 h-4 md:w-5 md:h-5" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};
