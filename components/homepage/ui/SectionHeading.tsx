"use client";

import { motion } from 'framer-motion';

interface Props {
  title: string;
  subtitle?: string;
  badge?: string;
  centered?: boolean;
  light?: boolean;
}

export const SectionHeading: React.FC<Props> = ({ title, subtitle, badge, centered = true, light = false }) => {
  return (
    <div className={`mb-16 lg:mb-24 ${centered ? 'text-center flex flex-col items-center' : 'text-left flex flex-col items-start'}`}>
      {badge && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold mb-6 tracking-wide uppercase ${
            light 
              ? 'bg-white/10 text-bpi-gold border border-white/20' 
              : 'bg-bpi-green/10 text-bpi-forest border border-bpi-green/20'
          }`}
        >
          {badge}
        </motion.div>
      )}
      <motion.h2 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: badge ? 0.1 : 0 }}
        className={`text-3xl md:text-4xl lg:text-5xl font-bold mb-6 tracking-tight text-balance ${light ? 'text-white' : 'text-bpi-charcoal'}`}
      >
        {title}
      </motion.h2>
      {subtitle && (
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: badge ? 0.2 : 0.1 }}
          className={`text-lg md:text-xl max-w-3xl leading-relaxed ${centered ? 'mx-auto text-center' : ''} ${light ? 'text-white/80 font-light' : 'text-bpi-charcoal/70'}`}
        >
          {subtitle}
        </motion.p>
      )}
    </div>
  );
};
