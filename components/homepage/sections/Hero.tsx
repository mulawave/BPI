"use client";

import { motion } from 'framer-motion';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export const Hero = () => {
  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-bpi-cream">
      {/* Abstract Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5 }}
          className="absolute -top-[20%] -right-[10%] w-[50%] h-[70%] rounded-full bg-bpi-green/10 blur-[120px]" 
        />
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5, delay: 0.2 }}
          className="absolute top-[40%] -left-[10%] w-[40%] h-[60%] rounded-full bg-bpi-gold/10 blur-[120px]" 
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/80 backdrop-blur-md border border-bpi-sand/50 text-bpi-gold font-semibold text-xs sm:text-sm mb-8 shadow-sm"
          >
            <ShieldCheck className="w-4 h-4 flex-shrink-0" />
            <span className="truncate tracking-wide">Pan-African Community Aggregator</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl lg:text-7xl font-bold text-bpi-charcoal leading-tight mb-8 text-balance tracking-tight"
          >
            Building a Pan-African Future of{' '}
            <span className="text-bpi-green relative whitespace-nowrap">
              Support
              <svg className="absolute -bottom-2 left-0 w-full h-3 text-bpi-green/30" viewBox="0 0 100 20" preserveAspectRatio="none">
                <path d="M0 10 Q 50 20 100 10" stroke="currentColor" strokeWidth="4" fill="none" />
              </svg>
            </span>
            , Retirement, Education, and{' '}
            <span className="text-bpi-gold">Opportunity</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-bpi-charcoal/70 mb-12 leading-relaxed max-w-3xl mx-auto font-light"
          >
            BPI, powered by BeepAgro Africa, is an empowerment ecosystem committed to building practical pathways for support, retirement readiness, youth development, digital monetization, and strategic opportunity.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-5"
          >
            <Link 
              href="/register"
              className="w-full sm:w-auto px-10 py-4 md:py-5 bg-bpi-green hover:bg-bpi-forest text-white rounded-full font-bold text-lg transition-all shadow-[0_8px_30px_rgb(125,158,73,0.3)] hover:shadow-[0_12px_40px_rgb(125,158,73,0.5)] hover:-translate-y-1 flex items-center justify-center gap-2 group"
            >
              Join the Movement
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              href="/#programs"
              className="w-full sm:w-auto px-10 py-4 md:py-5 bg-white hover:bg-gray-50 text-bpi-charcoal border border-gray-200 rounded-full font-bold text-lg transition-all shadow-sm hover:shadow-md flex items-center justify-center"
            >
              Explore Ecosystem
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
