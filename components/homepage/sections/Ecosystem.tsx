"use client";

import { motion } from 'framer-motion';
import Link from 'next/link';
import { SectionHeading } from '@/components/homepage/ui/SectionHeading';
import { HeartHandshake, Timer, GraduationCap, Crown, Youtube, Globe2, ArrowRight, Cpu } from 'lucide-react';

const pillars = [
  {
    title: "BPI Community Support",
    copy: "A technology-enabled, community-powered support model designed to help members access structured assistance during important life moments.",
    cta: "Explore Community Support",
    link: "/csp",
    icon: HeartHandshake,
    color: "text-bpi-green",
    bg: "bg-bpi-green/10",
    border: "group-hover:border-bpi-green/30"
  },
  {
    title: "BPI Early Retirement",
    copy: "A strategic solution helping qualified participants reduce retirement timelines from 35 years to 3–7 years through a structured pathway.",
    cta: "Explore Early Retirement",
    link: "/membership",
    icon: Timer,
    color: "text-bpi-gold",
    bg: "bg-bpi-gold/10",
    border: "group-hover:border-bpi-gold/30"
  },
  {
    title: "Child Education & Vocational",
    copy: "An empowerment initiative focused on helping children and youth access education, practical skills, and future readiness.",
    cta: "Explore Youth Empowerment",
    link: "/techquiz",
    icon: GraduationCap,
    color: "text-bpi-forest",
    bg: "bg-bpi-forest/10",
    border: "group-hover:border-bpi-forest/30"
  },
  {
    title: "International Elite Club",
    copy: "A private, invitation-based premium network for trusted leaders seeking strategic relationships and high-value opportunities.",
    cta: "Discover the Elite Club",
    link: "/elite-club",
    icon: Crown,
    color: "text-bpi-gold",
    bg: "bg-bpi-gold/10",
    border: "group-hover:border-bpi-gold/30"
  },
  {
    title: "BPI TechQuiz Competition",
    copy: "A state-based STEM competition designed to identify bright African children early and strengthen digital literacy.",
    cta: "Explore BPI TechQuiz",
    link: "/techquiz",
    icon: Cpu,
    color: "text-bpi-forest",
    bg: "bg-bpi-forest/10",
    border: "group-hover:border-bpi-forest/30"
  },
  {
    title: "YouTube Monetization",
    copy: "A creator-focused growth pathway helping African voices build visibility, influence, and monetizable digital presence.",
    cta: "Explore Creator Growth",
    link: "/coming-soon",
    icon: Youtube,
    color: "text-red-600",
    bg: "bg-red-50",
    border: "group-hover:border-red-200"
  },
  {
    title: "MYNGUL",
    copy: "A Pan-African social media platform designed to give Africans greater digital visibility, connection, and ownership.",
    cta: "Discover MYNGUL",
    link: "https://myngul.com/pages/beepagro",
    icon: Globe2,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "group-hover:border-blue-200"
  }
];

export const Ecosystem = () => {
  return (
    <section id="programs" className="py-24 lg:py-32 bg-bpi-cream/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading 
          badge="Core Programs"
          title="Our Ecosystem Solutions" 
          subtitle="BPI is built around key pillars designed to address support, financial peace, youth empowerment, strategic access, and digital visibility."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mt-16">
          {pillars.map((pillar, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="h-full"
            >
              <Link 
                href={pillar.link} 
                className={`bg-white rounded-3xl p-8 md:p-10 shadow-sm hover:shadow-premium hover:-translate-y-1 transition-all duration-300 border border-gray-100 flex flex-col h-full group ${pillar.border}`}
              >
                <div className={`w-16 h-16 rounded-2xl ${pillar.bg} flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300`}>
                  <pillar.icon className={`w-8 h-8 ${pillar.color}`} />
                </div>
                <h3 className="text-2xl font-bold text-bpi-charcoal mb-4 tracking-tight group-hover:text-bpi-green transition-colors">{pillar.title}</h3>
                <p className="text-bpi-charcoal/70 mb-10 flex-grow leading-relaxed font-light">
                  {pillar.copy}
                </p>
                <div className="inline-flex items-center gap-2 text-sm font-bold text-bpi-charcoal group-hover:text-bpi-green transition-colors mt-auto">
                  {pillar.cta}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
