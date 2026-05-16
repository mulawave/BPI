"use client";

import { FormEvent, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Mail, MessageSquare, Send } from 'lucide-react';
import toast from 'react-hot-toast';

const buildCaptcha = () => {
  const left = Math.floor(Math.random() * 8) + 2;
  const right = Math.floor(Math.random() * 8) + 2;
  return { left, right, answer: left + right };
};

export const Engagement = () => {
  const [newsletterCaptcha, setNewsletterCaptcha] = useState(() => buildCaptcha());
  const [newsletterAnswer, setNewsletterAnswer] = useState('');

  const [contactCaptcha, setContactCaptcha] = useState(() => buildCaptcha());
  const [contactAnswer, setContactAnswer] = useState('');

  const handleNewsletterSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const answer = Number(newsletterAnswer.trim());
    if (answer !== newsletterCaptcha.answer) {
      toast.error('Captcha answer is incorrect. Please try again.');
      setNewsletterCaptcha(buildCaptcha());
      setNewsletterAnswer('');
      return;
    }

    toast.success('Newsletter subscription request received.');
    event.currentTarget.reset();
    setNewsletterCaptcha(buildCaptcha());
    setNewsletterAnswer('');
  };

  const handleContactSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const answer = Number(contactAnswer.trim());
    if (answer !== contactCaptcha.answer) {
      toast.error('Captcha answer is incorrect. Please try again.');
      setContactCaptcha(buildCaptcha());
      setContactAnswer('');
      return;
    }

    toast.success('Message sent successfully. We will get back to you soon.');
    event.currentTarget.reset();
    setContactCaptcha(buildCaptcha());
    setContactAnswer('');
  };

  return (
    <>
      {/* Newsletter */}
      <section className="py-16 lg:py-24 bg-bpi-green relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-bpi-forest/50 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 tracking-tight">Join the BPI Newsletter</h2>
            <p className="text-white/90 text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
              Get updates on community support, early retirement, education empowerment, digital monetization, MYNGUL, partnerships, and ecosystem growth.
            </p>
            
            <form className="flex flex-col gap-3 max-w-xl mx-auto" onSubmit={handleNewsletterSubmit}>
              <div className="flex flex-col sm:flex-row gap-3">
                <input 
                  type="email" 
                  placeholder="Enter your email address" 
                  className="flex-grow px-6 py-4 rounded-full text-bpi-charcoal focus:outline-none focus:ring-4 focus:ring-white/30 shadow-inner w-full sm:w-auto"
                  required
                />
                <button 
                  type="submit" 
                  className="bg-bpi-charcoal hover:bg-black text-white px-8 py-4 rounded-full font-bold transition-all shadow-lg w-full sm:w-auto flex-shrink-0"
                >
                  Subscribe
                </button>
              </div>

              <div className="rounded-2xl bg-white/15 p-4 text-left">
                <p className="text-sm text-white/95 mb-2 font-semibold">Security Check</p>
                <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                  <label className="text-white text-sm">What is {newsletterCaptcha.left} + {newsletterCaptcha.right}?</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={newsletterAnswer}
                    onChange={(event) => setNewsletterAnswer(event.target.value)}
                    className="w-full sm:w-32 rounded-full px-4 py-2.5 text-bpi-charcoal focus:outline-none focus:ring-2 focus:ring-white/40"
                    placeholder="Answer"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setNewsletterCaptcha(buildCaptcha());
                      setNewsletterAnswer('');
                    }}
                    className="rounded-full bg-white/25 px-4 py-2 text-sm font-semibold text-white hover:bg-white/35"
                  >
                    Refresh
                  </button>
                </div>
              </div>
            </form>
            <p className="text-white/70 text-sm mt-4 font-medium">We respect your privacy. Unsubscribe at any time.</p>
          </motion.div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-bpi-charcoal mb-6 tracking-tight">Contact Us</h2>
              <p className="text-lg text-bpi-charcoal/70 mb-10 leading-relaxed">
                Speak with a BPI Ambassador or contact the BPI team for guidance on membership, support, early retirement, creator monetization, MYNGUL, partnerships, and strategic opportunities.
              </p>
              
              <div className="space-y-6 mb-10">
                <div className="flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                  <div className="w-14 h-14 bg-bpi-cream rounded-xl flex items-center justify-center text-bpi-green flex-shrink-0">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-bpi-charcoal text-lg">Chat with Support</h4>
                    <p className="text-bpi-charcoal/60 text-sm">Available Mon-Fri, 9am-5pm</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                  <div className="w-14 h-14 bg-bpi-cream rounded-xl flex items-center justify-center text-bpi-green flex-shrink-0">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-bpi-charcoal text-lg">Email Us</h4>
                    <a href="mailto:info@beepagro.com" className="text-bpi-charcoal/60 text-sm hover:text-bpi-green transition-colors">info@beepagro.com</a>
                  </div>
                </div>
              </div>

              <Link href="/help" className="bg-bpi-green hover:bg-bpi-forest text-white px-8 py-4 rounded-full font-bold transition-all shadow-md w-full sm:w-auto inline-block text-center">
                Talk to an Ambassador
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white p-6 sm:p-8 lg:p-10 rounded-3xl shadow-premium border border-gray-100"
            >
              <form className="space-y-5 lg:space-y-6" onSubmit={handleContactSubmit}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 lg:gap-6">
                  <div>
                    <label className="block text-sm font-medium text-bpi-charcoal mb-2">First Name</label>
                    <input required type="text" className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-bpi-green/20 focus:border-bpi-green transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-bpi-charcoal mb-2">Last Name</label>
                    <input required type="text" className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-bpi-green/20 focus:border-bpi-green transition-all" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-bpi-charcoal mb-2">Email Address</label>
                  <input required type="email" className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-bpi-green/20 focus:border-bpi-green transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-bpi-charcoal mb-2">Topic of Interest</label>
                  <select required defaultValue="" className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-bpi-green/20 focus:border-bpi-green transition-all appearance-none text-bpi-charcoal/80">
                    <option value="" disabled>Select a topic</option>
                    <option value="support">Community Support</option>
                    <option value="retirement">Early Retirement</option>
                    <option value="elite">Elite Club</option>
                    <option value="general">General Inquiry</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-bpi-charcoal mb-2">Message</label>
                  <textarea required rows={4} className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-bpi-green/20 focus:border-bpi-green transition-all resize-none"></textarea>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-bpi-cream/60 p-4">
                  <p className="text-sm font-semibold text-bpi-charcoal mb-2">Security Check</p>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <label className="text-sm text-bpi-charcoal/80">What is {contactCaptcha.left} + {contactCaptcha.right}?</label>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={contactAnswer}
                      onChange={(event) => setContactAnswer(event.target.value)}
                      className="w-full sm:w-32 px-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-bpi-green/20 focus:border-bpi-green"
                      placeholder="Answer"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setContactCaptcha(buildCaptcha());
                        setContactAnswer('');
                      }}
                      className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-bpi-charcoal hover:border-bpi-green hover:text-bpi-green"
                    >
                      Refresh
                    </button>
                  </div>
                </div>
                <button type="submit" className="w-full bg-bpi-charcoal hover:bg-black text-white px-6 py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 group">
                  Send Message
                  <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </button>
              </form>
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
};
