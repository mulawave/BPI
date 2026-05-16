"use client";

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Shield, Coins, Sprout, Cpu, Network } from 'lucide-react';

export const Flagships = () => {
  return (
    <>
      {/* Community Support Spotlight */}
      <section className="py-24 lg:py-32 bg-bpi-forest text-white overflow-hidden relative">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16 lg:mb-24">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center px-4 py-1.5 rounded-full bg-white/10 text-white border border-white/20 text-sm font-semibold mb-6 tracking-wide uppercase"
            >
              Flagship Pathway
            </motion.div>
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight text-balance"
            >
              No African Should Face Life Alone
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-lg md:text-xl text-white/80 max-w-4xl mx-auto leading-relaxed font-light"
            >
              BPI Community Support is built on the belief that support should be structured, community-driven, and accessible through participation. It creates a practical model where members identify with a community, contribute to growth, and build access to a support lifeline rooted in dignity.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 mb-16 lg:mb-20">
            {[
              { step: "01", title: "Activate your membership", desc: "Choose Regular or Regular Plus" },
              { step: "02", title: "Contribute to growth", desc: "Recommend a minimum of 2 members" },
              { step: "03", title: "Provide voluntary support", desc: "Support 10 live broadcasts" },
              { step: "04", title: "Lifeline becomes Active", desc: "Access structured assistance" }
            ].map((item, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 relative overflow-hidden hover:bg-white/10 hover:border-white/20 transition-all duration-300 group"
              >
                <div className="text-7xl font-black text-white/5 absolute -top-4 -right-2 pointer-events-none select-none group-hover:scale-110 transition-transform">{item.step}</div>
                <h4 className="text-xl font-bold mb-3 relative z-10 pr-4">{item.title}</h4>
                <p className="text-white/60 relative z-10 font-light leading-relaxed text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
            <Link 
              href="/register"
              className="bg-bpi-green hover:bg-white hover:text-bpi-forest text-white px-10 py-4 md:py-5 rounded-full font-bold text-lg transition-all shadow-lg inline-flex items-center justify-center gap-2 w-full sm:w-auto group"
            >
              Activate Your Membership
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              href="/csp"
              className="bg-transparent border border-white/30 hover:bg-white/10 text-white px-10 py-4 md:py-5 rounded-full font-bold text-lg transition-all inline-flex items-center justify-center w-full sm:w-auto"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Early Retirement Spotlight */}
      <section className="py-24 lg:py-32 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-bpi-gold/10 text-bpi-gold font-semibold text-sm mb-8 uppercase tracking-wide">
                <Shield className="w-4 h-4" />
                <span>Premium Pathway</span>
              </div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-bpi-charcoal mb-6 tracking-tight">
                BPI Early Retirement
              </h2>
              <h3 className="text-2xl md:text-3xl text-bpi-gold font-medium mb-8 leading-snug">
                Reduce your retirement years from 35 years to 3–7 years
              </h3>
              <p className="text-lg text-bpi-charcoal/70 mb-10 leading-relaxed font-light">
                A strategic pathway designed to help qualified participants reduce retirement pressure and build long-term financial peace through multiple structured reward opportunities.
              </p>
              
              <div className="space-y-4 mb-12">
                {[
                  { icon: Coins, text: "Rewards from Web3 daily transaction fees" },
                  { icon: Sprout, text: "Rewards from BPI Digital Farm yields" },
                  { icon: Cpu, text: "AI-powered forex copy trading liquidity setups" },
                  { icon: Network, text: "Liquidity rewards from DeFi opportunities" }
                ].map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-5 p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:border-bpi-gold/30 transition-colors group">
                    <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center flex-shrink-0 text-bpi-gold group-hover:scale-110 transition-transform">
                      <feature.icon className="w-6 h-6" />
                    </div>
                    <p className="text-bpi-charcoal/80 font-medium text-base leading-relaxed">{feature.text}</p>
                  </div>
                ))}
              </div>

              <Link href="/membership" className="bg-bpi-charcoal hover:bg-black text-white px-10 py-5 rounded-full font-bold text-lg transition-all shadow-lg inline-flex items-center justify-center gap-2 w-full sm:w-auto group">
                Explore Early Retirement
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative hidden lg:block"
            >
              <div className="aspect-square rounded-full bg-bpi-sand/30 absolute -inset-4 blur-3xl opacity-50" />
              <img 
                src="https://images.unsplash.com/photo-1573164713988-8665fc963095?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" 
                alt="Early Retirement Planning" 
                className="rounded-3xl shadow-2xl relative z-10 object-cover w-full h-[700px]"
              />
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
};
