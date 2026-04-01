"use client";

import { motion } from 'framer-motion';
import { SectionHeading } from '@/components/homepage/ui/SectionHeading';
import { CheckCircle2, MapPin, Zap, TrendingUp, Globe2, Crown } from 'lucide-react';

const phases = [
  { phase: "Phase 1", title: "Foundation", desc: "Strengthen BPI identity, onboarding systems, ambassador engagement, and core program visibility.", icon: MapPin },
  { phase: "Phase 2", title: "Program Activation", desc: "Expand Community Support, Early Retirement, Child Education, and membership activation.", icon: Zap },
  { phase: "Phase 3", title: "Digital Growth", desc: "Strengthen YouTube monetization education, and digital visibility opportunities for creators.", icon: TrendingUp },
  { phase: "Phase 4", title: "Network Expansion", desc: "Expand MYNGUL reach, deepen the Elite Club, and strengthen strategic partnerships.", icon: Globe2 },
  { phase: "Phase 5", title: "Continental Impact", desc: "Position BPI as a leading Pan-African empowerment ecosystem for strategic growth.", icon: Crown }
];

export const AboutSection = () => {
  return (
    <section className="py-16 lg:py-24 bg-bpi-sand/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* About, Vision, Mission Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 mb-16 lg:mb-24">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-1"
          >
            <h2 className="text-3xl font-bold text-bpi-charcoal mb-6 tracking-tight">About BPI</h2>
            <div className="space-y-4 text-bpi-charcoal/70 leading-relaxed">
              <p>
                BPI is the public-facing ecosystem brand of BeepAgro Africa, positioned as a Pan-African Community Aggregator and empowerment ecosystem created to deliver structured community support, early retirement solutions, child education and vocational empowerment, digital monetization pathways, and trusted Pan-African growth opportunities.
              </p>
              <p>
                Our ecosystem combines community participation, technology-enabled systems, digital opportunity, and long-term value creation to solve real needs affecting Africans across different stages of life.
              </p>
            </div>
            
            <div className="mt-8 space-y-3">
              <p className="font-semibold text-bpi-charcoal mb-4">We are building structures that help people:</p>
              {[
                "Access support when it matters",
                "Reduce retirement pressure",
                "Empower children and youth",
                "Grow digital visibility and monetization",
                "Connect with credible networks",
                "Participate in a stronger Pan-African future"
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-3 text-sm text-bpi-charcoal/80">
                  <CheckCircle2 className="w-5 h-5 text-bpi-green flex-shrink-0 mt-0.5" />
                  <span className="font-medium">{item}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="w-14 h-14 bg-bpi-green/10 rounded-2xl flex items-center justify-center mb-6">
                <Globe2 className="w-7 h-7 text-bpi-green" />
              </div>
              <h3 className="text-2xl font-bold text-bpi-charcoal mb-4 tracking-tight">Our Vision</h3>
              <p className="text-bpi-charcoal/70 leading-relaxed">
                To build one of Africa&apos;s most trusted Pan-African Community Aggregator and empowerment ecosystems, where community, technology, digital ownership, education, retirement solutions, and strategic opportunity work together to improve lives across generations.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="w-14 h-14 bg-bpi-gold/10 rounded-2xl flex items-center justify-center mb-6">
                <Zap className="w-7 h-7 text-bpi-gold" />
              </div>
              <h3 className="text-2xl font-bold text-bpi-charcoal mb-4 tracking-tight">Our Mission</h3>
              <p className="text-bpi-charcoal/70 leading-relaxed">
                To empower Africans through structured community support, early retirement solutions, child education and vocational pathways, creator and media monetization opportunities, Pan-African digital platforms, and trusted global relationship networks powered by innovation, dignity, and shared growth.
              </p>
            </motion.div>
          </div>
        </div>

        {/* Roadmap (Homepage Version) */}
        <div className="pt-16 lg:pt-20 border-t border-gray-200">
          <SectionHeading 
            title="Our Roadmap" 
            subtitle="BPI is building a long-term Pan-African Community Aggregator and empowerment ecosystem through a phased growth strategy focused on impact, innovation, and expansion."
          />

          <div className="mt-12 lg:mt-16 relative">
            {/* Connecting Line (Desktop) */}
            <div className="hidden lg:block absolute top-8 left-[10%] right-[10%] h-1 bg-gradient-to-r from-bpi-green/20 via-bpi-gold/30 to-bpi-forest/20 rounded-full" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 relative">
              {phases.map((item, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="relative group"
                >
                  {/* Icon Node */}
                  <div className="w-16 h-16 mx-auto bg-white border-4 border-gray-50 rounded-full flex items-center justify-center mb-4 lg:mb-6 relative z-10 group-hover:border-bpi-green group-hover:scale-110 transition-all duration-300 shadow-sm">
                    <item.icon className="w-6 h-6 text-bpi-charcoal group-hover:text-bpi-green transition-colors" />
                    <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-bpi-charcoal rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-white">
                      {idx + 1}
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="bg-white lg:bg-transparent p-6 lg:p-0 rounded-2xl lg:rounded-none shadow-sm lg:shadow-none border border-gray-100 lg:border-none text-center h-full">
                    <span className="text-bpi-gold font-bold text-xs uppercase tracking-wider block mb-2">{item.phase}</span>
                    <h4 className="font-bold text-bpi-charcoal mb-2 text-lg tracking-tight">{item.title}</h4>
                    <p className="text-sm text-bpi-charcoal/70 leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
