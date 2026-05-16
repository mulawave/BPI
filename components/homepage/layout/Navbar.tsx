"use client";

import { useState, useEffect } from 'react';
import { Menu, X, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setActiveDropdown(null);
  }, [pathname]);

  const programsDropdown = [
    { name: 'Community Support', href: '/csp' },
    { name: 'Early Retirement', href: '/membership' },
    { name: 'Child Education', href: '/techquiz' },
    { name: 'International Elite Club', href: '/elite-club' },
    { name: 'TechQuiz Competition', href: '/techquiz' },
    { name: 'YouTube Monetization', href: '/coming-soon' },
    { name: 'MYNGUL', href: 'https://myngul.com/pages/beepagro' },
  ];

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'About', href: '/about' },
    { name: 'Programs', href: '/#programs', hasDropdown: true, dropdownItems: programsDropdown },
    { name: 'Blog & News', href: '/blog' },
    { name: 'International Elite Club', desktopName: 'International Elite Club', href: '/elite-club' },
    { name: 'BPI Shop', href: '/store' },
    { name: 'Contact', href: '/help' },
  ];

  // These public pages must keep dark/black header text for readability.
  const forceLightNavRoutes = new Set([
    '/about',
    '/terms',
    '/privacy',
    '/tokenomics',
    '/coming-soon',
  ]);

  const isDarkHero = (
    pathname === '/elite-club' ||
    pathname === '/myngul' ||
    pathname === '/techquiz' ||
    pathname === '/youtube-monetization'
  ) && !isScrolled && !forceLightNavRoutes.has(pathname);

  const navTextColor = isDarkHero ? 'text-white/90 hover:text-white' : 'text-bpi-charcoal/80 hover:text-bpi-green';
  const logoTextColor = isDarkHero ? 'text-white' : 'text-bpi-charcoal';
  const menuIconColor = isDarkHero ? 'text-white' : 'text-bpi-charcoal';

  return (
    <header className={`fixed top-0 w-full z-50 transition-all duration-500 ${isScrolled ? 'bg-white/90 backdrop-blur-xl shadow-sm py-3 border-b border-gray-100' : 'bg-transparent py-5 lg:py-6'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0 flex items-center gap-3 cursor-pointer hover:opacity-90 transition-opacity" aria-label="Go to homepage">
            <img 
              src="https://i.ibb.co/hRxP0rYb/BPILOGO.jpg" 
              alt="BPI Logo" 
              className="h-10 lg:h-12 w-auto object-contain bg-white p-1.5 rounded-xl shadow-sm"
            />
            <span className={`font-bold text-base lg:text-lg hidden sm:block transition-colors tracking-tight ${logoTextColor}`}>
              by BeepAgro Africa
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-8">
            {navLinks.map((link) => (
              <div
                key={link.name}
                className="relative group"
                onMouseEnter={() => link.hasDropdown && setActiveDropdown(link.name)}
                onMouseLeave={() => link.hasDropdown && setActiveDropdown(null)}
              >
                <Link
                  href={link.href}
                  className={`text-sm font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap py-2 ${navTextColor}`}
                >
                  {link.desktopName && link.desktopName !== link.name ? (
                    <>
                      <span className="hidden xl:inline">{link.desktopName}</span>
                      <span className="xl:hidden">{link.name}</span>
                    </>
                  ) : (
                    link.name
                  )}
                  {link.hasDropdown && (
                    <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${activeDropdown === link.name ? 'rotate-180' : ''}`} />
                  )}
                </Link>

                {/* Desktop Dropdown */}
                {link.hasDropdown && (
                  <AnimatePresence>
                    {activeDropdown === link.name && (
                      <motion.div
                        initial={{ opacity: 0, y: 15, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-72 bg-white rounded-2xl shadow-premium border border-gray-100 py-3 overflow-hidden"
                      >
                        {link.dropdownItems?.map((item) => (
                          <Link
                            key={item.name}
                            href={item.href}
                            className="block px-6 py-3 text-sm font-medium text-bpi-charcoal/80 hover:bg-bpi-green/5 hover:text-bpi-green transition-colors"
                          >
                            {item.name}
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </div>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-6">
            <Link href="/login" className={`text-sm font-bold transition-colors ${navTextColor}`}>
              Login
            </Link>
            <Link
              href="/register"
              className="bg-bpi-green hover:bg-bpi-forest text-white px-8 py-3.5 rounded-full text-sm font-bold transition-all shadow-[0_8px_20px_-6px_rgba(125,158,73,0.5)] hover:shadow-[0_12px_25px_-6px_rgba(125,158,73,0.6)] hover:-translate-y-0.5"
            >
              Join
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className={`lg:hidden p-2 -mr-2 transition-colors ${menuIconColor}`}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: '100vh' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="lg:hidden fixed top-[72px] left-0 w-full bg-white shadow-xl border-t border-gray-100 overflow-y-auto pb-32"
          >
            <div className="flex flex-col px-6 py-8 space-y-2">
              {navLinks.map((link) => (
                <div key={link.name} className="flex flex-col">
                  <div className="flex items-center justify-between border-b border-gray-50">
                    <Link
                      href={link.href}
                      className="text-lg font-bold text-bpi-charcoal py-4 flex-grow"
                      onClick={(e) => {
                        if (link.hasDropdown) {
                          e.preventDefault();
                          setActiveDropdown(activeDropdown === link.name ? null : link.name);
                        } else {
                          setIsMobileMenuOpen(false);
                        }
                      }}
                    >
                      {link.name}
                    </Link>
                    {link.hasDropdown && (
                      <button
                        className="p-4 text-bpi-charcoal"
                        onClick={() => setActiveDropdown(activeDropdown === link.name ? null : link.name)}
                      >
                        <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${activeDropdown === link.name ? 'rotate-180' : ''}`} />
                      </button>
                    )}
                  </div>

                  {/* Mobile Dropdown Items */}
                  <AnimatePresence>
                    {link.hasDropdown && activeDropdown === link.name && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="flex flex-col pl-4 border-l-2 border-bpi-green/20 ml-2 my-2 space-y-1 overflow-hidden"
                      >
                        {link.dropdownItems?.map((item) => (
                          <Link
                            key={item.name}
                            href={item.href}
                            className="text-base font-medium text-bpi-charcoal/70 py-3 hover:text-bpi-green transition-colors"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            {item.name}
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}

              {/* Mobile Auth Buttons */}
              <div className="pt-6 space-y-3">
                <Link
                  href="/login"
                  className="block w-full text-center py-4 rounded-2xl border-2 border-gray-200 font-bold text-bpi-charcoal hover:border-bpi-green hover:text-bpi-green transition-all text-lg"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="block w-full text-center py-4 rounded-2xl bg-bpi-green text-white font-bold hover:bg-bpi-forest transition-all text-lg shadow-lg"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Join the Movement
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
