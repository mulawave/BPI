"use client";

import { motion } from 'framer-motion';
import Link from 'next/link';
import { SectionHeading } from '@/components/homepage/ui/SectionHeading';
import { ArrowRight, ShoppingBag } from 'lucide-react';

const partners = [
  { name: "UND", url: "https://i.ibb.co/F4J5WgBC/UNDLOGO.jpg", link: "https://ibb.co/fdtkS4CL" },
  { name: "LWC", url: "https://i.ibb.co/1J9Ys2XD/LWCLOGO.jpg" },
  { name: "Elite Club", url: "https://i.ibb.co/3YM7XP52/elitelogo.jpg" },
  { name: "MYNGUL", url: "https://i.ibb.co/qM8gDJpy/myngul512.png" },
  { name: "India Ghana", url: "https://i.ibb.co/0ycygYJN/india-Ghanalogo.jpg" },
  { name: "AU", url: "https://i.ibb.co/VWv77NQh/AUlogo.jpg" },
  { name: "USDT GWallet", url: "https://i.ibb.co/xSd0qJWn/USDT-GWALLET-WEB-LOGO.jpg" },
  { name: "PAC Token", url: "https://i.ibb.co/fVhhhTPW/PACTOKEN.jpg" },
  { name: "GATC", url: "https://i.ibb.co/fYDSCjGS/GATCLOGI.jpg" }
];

const recentArticles = [
  {
    id: "expanding-bpi-network",
    title: "Expanding the BPI Community Support Network Across West Africa",
    category: "Ecosystem Update",
    date: "Oct 24, 2025",
    desc: "Discover how our latest initiatives are bringing structured assistance and solidarity to more communities, ensuring no one faces life's challenges alone.",
    img: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "future-digital-ownership",
    title: "The Future of Digital Ownership: Why MYNGUL Matters",
    category: "Digital Growth",
    date: "Oct 18, 2025",
    desc: "An in-depth look at how African creators can move from mere participation to true digital ownership and monetization.",
    img: "https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "empowering-next-generation",
    title: "Empowering the Next Generation Through STEM",
    category: "Education",
    date: "Oct 12, 2025",
    desc: "Highlights from the recent BPI TechQuiz Competition and the brilliant young minds shaping Africa's technological future.",
    img: "https://images.unsplash.com/photo-1531482615713-2afd69097998?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
  }
];

export const Media = () => {
  return (
    <>
      {/* Blog & News */}
      <section id="blog" className="py-20 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading 
            title="Blog & News" 
            subtitle="Stay updated with BPI announcements, impact stories, ecosystem updates, educational insights, digital monetization guidance, and Pan-African opportunity news."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
            {recentArticles.map((item, idx) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="h-full"
              >
                <Link 
                  href={`/blog/${item.id}`}
                  className="group block h-full bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-premium hover:-translate-y-1 transition-all flex flex-col"
                >
                  <div className="aspect-[16/10] overflow-hidden bg-gray-100 flex-shrink-0">
                    <img 
                      src={item.img} 
                      alt={item.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-6 flex flex-col flex-grow">
                    <div className="flex items-center gap-3 text-xs text-bpi-charcoal/60 mb-3 font-medium uppercase tracking-wider">
                      <span className="text-bpi-green">{item.category}</span>
                      <span>•</span>
                      <span>{item.date}</span>
                    </div>
                    <h3 className="text-xl font-bold text-bpi-charcoal mb-3 group-hover:text-bpi-green transition-colors tracking-tight">
                      {item.title}
                    </h3>
                    <p className="text-bpi-charcoal/70 line-clamp-2 text-sm leading-relaxed mb-4 flex-grow">
                      {item.desc}
                    </p>
                    <div className="mt-auto inline-flex items-center gap-2 font-bold text-bpi-charcoal group-hover:text-bpi-green transition-colors text-sm">
                      Read Article <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link href="/blog" className="inline-flex items-center gap-2 font-bold text-bpi-charcoal hover:text-bpi-green transition-colors group">
              View All Updates <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Partners */}
      <section id="partners" className="py-20 lg:py-32 bg-bpi-cream border-y border-bpi-sand/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-bpi-charcoal mb-4 tracking-tight">Our Partners</h2>
            <p className="text-lg text-bpi-charcoal/70 max-w-2xl mx-auto mb-12 leading-relaxed">
              BPI is building with partners, community leaders, digital platforms, and strategic collaborators who share a commitment to African empowerment, innovation, and long-term impact.
            </p>
          </motion.div>
          
          <div className="flex flex-wrap justify-center items-center gap-4 md:gap-6 lg:gap-8">
            {partners.map((partner, idx) => {
              const cardContent = (
                <div className="w-32 h-20 md:w-40 md:h-24 lg:w-48 lg:h-28 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center p-4 lg:p-5 hover:shadow-premium hover:-translate-y-1 hover:border-bpi-green/30 transition-all duration-300 group">
                  <img 
                    src={partner.url} 
                    alt={`${partner.name} Logo`} 
                    className="max-w-full max-h-full object-contain filter grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500"
                  />
                </div>
              );

              return (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                >
                  {partner.link ? (
                    <a href={partner.link} target="_blank" rel="noopener noreferrer" className="block">
                      {cardContent}
                    </a>
                  ) : (
                    cardContent
                  )}
                </motion.div>
              );
            })}
          </div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="mt-16"
          >
            <Link href="/contact" className="inline-flex items-center gap-2 px-8 py-4 bg-white border border-gray-200 hover:border-bpi-green hover:text-bpi-green text-bpi-charcoal rounded-full font-bold transition-all shadow-sm group">
              Partner With BPI <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* BPI Shop */}
      <section id="shop" className="py-20 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading 
            title="BPI Shop" 
            subtitle="Explore BPI products, digital resources, branded materials, and ecosystem-related offers designed to support community growth and engagement."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mt-12">
            {[
              { name: "BPI Ambassador Kit", price: "$45.00" },
              { name: "Digital Creator Masterclass", price: "$99.00" },
              { name: "Official BPI Apparel", price: "$30.00" }
            ].map((item, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-gray-50 rounded-3xl p-6 lg:p-8 border border-gray-100 group hover:border-bpi-green/30 hover:shadow-premium hover:-translate-y-1 transition-all text-center"
              >
                <div className="aspect-square bg-white rounded-2xl mb-6 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-300">
                  <ShoppingBag className="w-12 h-12 text-gray-300 group-hover:text-bpi-green transition-colors" />
                </div>
                <h4 className="font-bold text-bpi-charcoal mb-2 tracking-tight">{item.name}</h4>
                <p className="text-bpi-gold font-bold mb-6">{item.price}</p>
                <Link href="/shop" className="block w-full py-3 rounded-xl border-2 border-gray-200 text-sm font-bold hover:bg-bpi-green hover:text-white hover:border-bpi-green transition-all">
                  View Details
                </Link>
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link href="/shop" className="bg-bpi-charcoal hover:bg-black text-white px-8 py-4 rounded-full font-bold transition-all shadow-md hover:shadow-premium hover:-translate-y-1 inline-flex items-center gap-2 group">
              Visit the Shop <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
};
