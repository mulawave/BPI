"use client";

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Crown, Globe2 } from 'lucide-react';

export const Spotlights = () => {
  return (
    <>
      {/* Child Education & Elite Club Split */}
      <section className="py-24 lg:py-32 bg-bpi-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Child Education */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-3xl p-10 md:p-14 shadow-sm border border-gray-100 flex flex-col justify-between group hover:shadow-premium hover:border-bpi-green/30 hover:-translate-y-1 transition-all duration-300"
            >
              <div>
                <h3 className="text-3xl md:text-4xl font-bold text-bpi-charcoal mb-6 tracking-tight">Empowering the Next Generation</h3>
                <p className="text-bpi-charcoal/70 text-lg leading-relaxed mb-10 font-light">
                  BPI believes Africa&apos;s future depends on what we build for children and youth today. This initiative helps create pathways for education, practical learning, vocational advancement, and future-ready empowerment.
                </p>
              </div>
              <Link href="/child-education" className="self-start text-bpi-green font-bold flex items-center gap-2 group-hover:gap-3 transition-all text-lg">
                Support Education &amp; Skills <ArrowRight className="w-5 h-5" />
              </Link>
            </motion.div>

            {/* Elite Club */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-bpi-charcoal rounded-3xl p-10 md:p-14 shadow-xl border border-bpi-gold/20 flex flex-col justify-between relative overflow-hidden text-white group hover:-translate-y-1 hover:border-bpi-gold/40 transition-all duration-300"
            >
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all duration-500 pointer-events-none">
                <Crown className="w-40 h-40 md:w-56 md:h-56 text-bpi-gold" />
              </div>
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-bpi-gold/20 text-bpi-gold font-semibold text-xs mb-8 uppercase tracking-wider border border-bpi-gold/30">
                  Invitation Only
                </div>
                <h3 className="text-3xl md:text-4xl font-bold mb-6 tracking-tight">A Trusted Circle for Strategic Leaders</h3>
                <p className="text-white/70 text-lg leading-relaxed mb-10 font-light">
                  A private, invitation-based platform for trusted and financially capable leaders who value premium relationships, strategic collaboration, and long-term growth opportunities.
                </p>
              </div>
              <Link href="/elite-club" className="self-start text-bpi-gold font-bold flex items-center gap-2 group-hover:gap-3 transition-all relative z-10 text-lg">
                Discover the Elite Club <ArrowRight className="w-5 h-5" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Digital & Media Section */}
      <section className="py-24 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* YouTube Monetization */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-2 lg:order-1"
            >
              <h3 className="text-4xl md:text-5xl font-bold text-bpi-charcoal mb-6 tracking-tight">Helping African Voices Monetize Digital Influence</h3>
              <p className="text-lg text-bpi-charcoal/70 mb-10 leading-relaxed font-light">
                BPI YouTube Monetization is designed to help creators, businesses, and communities understand how to build visibility, create valuable content, grow audience engagement, and position for monetization.
              </p>
              <Link href="/youtube-monetization" className="bg-red-50 text-red-600 hover:bg-red-100 px-8 py-4 rounded-full font-bold transition-colors inline-flex items-center gap-2 group text-lg border border-red-100">
                Explore Creator Growth <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>

            {/* MYNGUL */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-1 lg:order-2 bg-gradient-to-br from-[#6FA15A]/10 to-bpi-green/5 rounded-3xl p-10 md:p-12 border border-[#6FA15A]/20 shadow-sm group hover:shadow-premium transition-all duration-300"
            >
              <div className="w-16 h-16 bg-[#6FA15A] rounded-2xl flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 transition-transform">
                <Globe2 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-3xl md:text-4xl font-bold text-bpi-charcoal mb-4 tracking-tight">Introducing MYNGUL</h3>
              <p className="text-[#6FA15A] font-semibold mb-6 text-xl">From digital participation to digital ownership.</p>
              <p className="text-bpi-charcoal/70 mb-10 leading-relaxed font-light text-lg">
                A Pan-African digital platform created to give Africans greater visibility, connection, ownership, and monetization opportunity in the social media space.
              </p>
              <Link href="/myngul" className="bg-[#6FA15A] hover:bg-bpi-green text-white px-8 py-4 rounded-full font-bold transition-colors inline-flex items-center gap-2 shadow-md group/btn text-lg">
                Discover MYNGUL <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
};
