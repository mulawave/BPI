"use client";

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export const BrandIdentity = () => {
  return (
    <section id="about" className="py-16 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative order-2 lg:order-1"
          >
            <div className="aspect-[4/3] rounded-3xl overflow-hidden bg-bpi-sand/20 relative shadow-lg">
              <img 
                src="https://images.unsplash.com/photo-1531206715517-5c0ba140b2b8?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" 
                alt="African community empowerment" 
                className="w-full h-full object-cover mix-blend-multiply opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-bpi-green/20 to-transparent" />
            </div>
            {/* Decorative element */}
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-bpi-gold/10 rounded-full blur-2xl hidden md:block" />
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="order-1 lg:order-2"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-bpi-charcoal mb-6 tracking-tight">What BPI Represents Today</h2>
            <div className="space-y-5 text-lg text-bpi-charcoal/80 leading-relaxed">
              <p>
                BPI is a multi-dimensional Pan-African Community Aggregator and empowerment ecosystem built to help individuals, families, creators, leaders, and communities access structured support, retirement solutions, youth empowerment, digital monetization, and trusted growth opportunities.
              </p>
              <p>
                We believe Africans should not face life alone, work endlessly without peace, leave children without opportunity, or build digital influence on platforms they do not own. BPI is building practical systems that combine support, innovation, ownership, and long-term empowerment.
              </p>
            </div>
            
            <Link href="/about" className="inline-flex items-center gap-2 mt-8 font-bold text-bpi-green hover:text-bpi-forest transition-colors group text-lg">
              Discover Our Full Story <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>

            <div className="mt-8 pt-8 border-t border-gray-100">
              <p className="text-xl font-medium text-bpi-gold italic">
                &ldquo;Support today. Stability tomorrow. Opportunity for the future.&rdquo;
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
