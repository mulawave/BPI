"use client";

const navLinks = [
	{ href: "#about", label: "About" },
	{ href: "#programs", label: "Programs" },
	{ href: "#training", label: "Training" },
	{ href: "#join", label: "Join" },
	{ href: "/blog", label: "Blog & News" },
	{ href: "#news", label: "News" },
	{ href: "#partners", label: "Partners" },
	{ href: "#contact", label: "Contact" },
];

function AboutSlider({
  images = [
    "/about_slide/images/1.png",
    "/about_slide/images/2.png",
    "/about_slide/images/3.png",
    "/about_slide/images/4.png",
    "/about_slide/images/5.png",
  ],
  className = "",
}: { images?: string[]; className?: string }) {
  const [index, setIndex] = useState(0);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    timeoutRef.current = window.setTimeout(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 3500);
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [index, images.length]);

  return (
    <div
      className={`relative w-full h-full min-h-[360px] md:min-h-0 overflow-hidden rounded-3xl shadow-2xl bg-gradient-to-br from-[#bfa100]/10 via-[#e9f5ee]/60 to-[#0d3b29]/10 ${className}`}
    >
      {images.map((src, i) => (
        <div
          key={src}
          style={{
            opacity: i === index ? 1 : 0,
            transition: "opacity 0.8s",
            position: "absolute",
            inset: 0,
          }}
        >
          <Image
            src={src}
            alt={`About Slide ${i + 1}`}
            fill
            className="object-contain md:object-contain rounded-3xl drop-shadow-xl border-4 border-white/60"
            priority={i === 0}
          />
        </div>
      ))}

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {images.map((_, i) => (
          <span
            key={i}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${i === index ? "bg-[#bfa100] scale-110 shadow-lg" : "bg-[#e9f5ee]"}`}
          />
        ))}
      </div>
    </div>
  );
}




import Image from "next/image";
import Link from "next/link";
import HeroTicker from '@/components/HeroTicker';
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

import { useState, useEffect, useRef } from "react";

const featureCards = [
  {
	title: "The BPI Model",
	img: "/img-demo/d1.jpg",
	link: "/model",
	label: "Model",
	desc: "Our unique approach to community empowerment."
  },
  {
	title: "SEED Value Chain",
	img: "/img-demo/d2.jpg",
	link: "/seed",
	label: "SEED",
	desc: "Transforming agriculture through innovation."
  },
  {
	title: "Programs & Services",
	img: "/img-demo/d3.jpg",
	link: "/programs",
	label: "Programs",
	desc: "Empowering communities with tailored programs."
  },
  {
	title: "Training & Mentorship",
	img: "/img-demo/d4.jpg",
	link: "/training",
	label: "Training",
	desc: "Building skills for a sustainable future."
  },
  {
	title: "Join the Movement",
	img: "/img-demo/d5.jpg",
	link: "/join",
	label: "Join",
	desc: "Be part of Africa’s transformation."
  },
  {
	title: "News & Updates",
	img: "/img-demo/d6.jpg",
	link: "/news",
	label: "News",
	desc: "Stay informed with the latest from BPI."
  },
  {
	title: "Partners",
	img: "/img-demo/d7.jpg",
	link: "/partners",
	label: "Partners",
	desc: "Collaborating for greater impact."
  }
];

export default function HomePage() {
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [isJoinLoading, setIsJoinLoading] = useState(false);

	return (
		<div className="min-h-screen bg-gradient-to-br from-[#e9f5ee] via-[#f7fbe9] to-[#f5f5f5] flex flex-col">
			{/* Header */}
			<header className="w-full px-6 py-4 flex items-center justify-between bg-white/80 shadow-sm sticky top-0 z-40 backdrop-blur">
				<div className="flex items-center gap-3">
					<Image
						src="/img/logo.png"
						alt="BPI Logo"
						width={56}
						height={56}
						className="rounded-full shadow"
					/>
					<span className="font-bold text-2xl text-[#0d3b29] tracking-tight">
						BeepAgro Africa
					</span>
				</div>
				   <nav className="hidden md:flex gap-6">
					   {navLinks.map((link) => (
						   <a
							   key={link.href}
							   href={link.href}
							   className="text-[#0d3b29] font-medium hover:text-[#bfa100] transition-colors cursor-pointer"
						   >
							   {link.label}
						   </a>
					   ))}
				   </nav>
		   <Link href="/login" className="ml-4" onClick={(e) => {
			   e.preventDefault();
			   setIsLoginLoading(true);
			   window.location.href = '/login';
		   }}>
			   <Button disabled={isLoginLoading} className="bg-[#0d3b29] hover:bg-[#bfa100] text-white font-semibold rounded-full px-6 py-2 shadow-lg transition-all disabled:opacity-50">
				   {isLoginLoading ? (
					   <span className="flex items-center gap-2">
						   <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
							   <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
							   <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
						   </svg>
						   Loading...
					   </span>
				   ) : (
					   'Login'
				   )}
			   </Button>
		   </Link>
	</header>

{/* Hero Section */}
<section
  className="relative flex flex-col md:flex-row items-center justify-between 
             px-6 md:px-20 py-16 md:py-28 gap-10
             bg-[url('/img/hero-bg.jpg')] bg-cover bg-center bg-no-repeat"
>
  {/* Live Firestore Ticker */}
  <HeroTicker />

  {/* GREEN TINT OVERLAY */}
  <div className="pointer-events-none absolute inset-0 z-10 bg-[#0d3b29]/70 md:bg-[#0d3b29]/60" />

  {/* Left column */}
  <div className="flex-1 flex flex-col gap-6 z-20">
    <motion.h2
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7 }}
      className="text-3xl md:text-4xl font-bold text-white mb-10 text-center"
    >
      <span className="text-[#bfa100]">Millions</span> of Africans
    </motion.h2>

    <motion.p
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.8 }}
      className="text-lg md:text-2xl text-white/90 max-w-xl"
    >
      A community-first model for sustainable growth, powered by innovation
      and collaboration.
    </motion.p>

    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.8 }}
      className="flex gap-4 mt-4"
    >
      <Link href="/register" onClick={(e) => {
        e.preventDefault();
        setIsJoinLoading(true);
        window.location.href = '/register';
      }}>
        <Button disabled={isJoinLoading} className="bg-[#bfa100] hover:bg-[#e6c200] text-[#0d3b29] font-bold rounded-full px-8 py-3 text-lg shadow-xl transition-all disabled:opacity-50">
          {isJoinLoading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Loading...
            </span>
          ) : (
            'Join the Movement'
          )}
        </Button>
      </Link>
      <Link href="/about">
        <Button
          variant="outline"
          className="border-white text-white hover:bg-white/10 font-semibold rounded-full px-8 py-3 text-lg transition-all"
        >
          Learn More
        </Button>
      </Link>
    </motion.div>
  </div>

  {/* Right card */}
  <motion.div
    initial={{ opacity: 0, y: 40 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className="group bg-white rounded-2xl shadow-xl hover:shadow-2xl border border-white/30 p-6 flex flex-col items-center text-center transition-all hover:-translate-y-2 cursor-pointer z-20"
  >
    <Image
      src="/hero.jpg"
      alt="BPI Hero"
      width={600}
      height={480}
      className="rounded-3xl shadow-2xl object-cover object-center w-full max-w-[500px]"
      priority
    />
  </motion.div>

  {/* Decorative shapes above overlay */}
  <Image
    src="/img/footer_shape01.png"
    alt=""
    width={120}
    height={120}
    className="absolute left-0 bottom-0 opacity-40 z-20"
  />
  <Image
    src="/img/footer_shape02.png"
    alt=""
    width={120}
    height={120}
    className="absolute right-0 top-0 opacity-30 z-20"
  />
</section>

{/* Ticker animation */}
<style jsx>{`
  @keyframes ticker {
    0% { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }
  .animate-ticker {
    width: max-content;
    animation: ticker 28s linear infinite;
  }
`}</style>


{/* Ticker animation */}
<style jsx>{`
  @keyframes ticker {
    0% { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }
  .animate-ticker {
    width: max-content;
    animation: ticker 28s linear infinite;
  }
`}</style>


{/* About Section (Row 1: Text, Row 2: 2-column visuals) */}
<section
  id="about"
  className="w-full py-20 px-4 md:px-0 bg-gradient-to-br from-[#e9f5ee] via-[#f7fbe9] to-[#f5f5f5] scroll-mt-24"
>
  <div className="max-w-6xl mx-auto flex flex-col gap-12">

    {/* Row 1 — Full-width Text Card */}
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, type: "spring" }}
      viewport={{ once: true }}
      className="w-full bg-white/90 rounded-2xl shadow-xl p-8 md:p-12"
    >
      <div className="flex items-center gap-4 mb-6">
        <Image
          src="/img/logo.png"
          alt="BPI Logo"
          width={80}
          height={80}
          className="rounded-full shadow"
        />
        <h2 className="text-3xl md:text-4xl font-bold text-[#0d3b29]">
          About BeepAgro Africa
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-4 text-[#232323] text-lg leading-relaxed">
        <p>
          <b>BeepAgro Africa</b> is an agro-tech company focused on the adoption and
          implementation of blockchain and Web 3 technology in the marketing and
          distribution of its products. Our mission is to empower communities, drive
          innovation in agriculture, and create sustainable value chains across Africa.
        </p>
        <p>
          We believe in a community-first model for sustainable growth, powered by
          collaboration, training, and mentorship. Our programs and services are
          tailored to uplift, train, and empower millions of Africans, transforming
          agriculture through innovation and technology.
        </p>
        <p>
          Join us as we build a future where technology and agriculture work hand in
          hand to create lasting impact and prosperity for all.
        </p>
      </div>
    </motion.div>

    {/* Row 2 — Two-column visuals (perfectly balanced) */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:h-[520px]">
      {/* Left: Slider */}
      <div className="h-[360px] md:h-full">
        <AboutSlider className="h-full" />
      </div>

      {/* Right: Static visual panel OR swap with another <AboutSlider /> */}
      <div className="relative h-[360px] md:h-full rounded-3xl overflow-hidden shadow-2xl border border-[#e0e0e0]">
        {/* If you prefer a second slider, replace this entire <Image> wrapper with:
            <AboutSlider
              className="h-full"
              images={["/img/news2.jpg","/img/news1.jpg","/hero.jpg","/img/app-mockup.png"]}
            />
        */}
        <AboutSlider
              className="h-full"
              images={["/img/bpi1.jpg","/img/bpi2.jpg","/img/bpi3.jpg","/img/bpi4.jpg"]}
            />

        {/* Optional label badge */}
       <span className="absolute top-4 left-4 bg-[#0d3b29]/90 text-white text-xs font-semibold px-3 py-1 rounded-full shadow">
          Featured Highlights
        </span>
      </div>
    </div>
  </div>
</section>



          {/* Feature Cards Section */}
			   <section className="w-full px-6 md:px-20 py-16 bg-white/80 flex flex-col items-center">
				   <motion.h2
					   initial={{ opacity: 0, y: 20 }}
					   animate={{ opacity: 1, y: 0 }}
					   transition={{ duration: 0.7 }}
					   className="text-3xl md:text-4xl font-bold text-[#0d3b29] mb-10 text-center"
				   >
					   Explore Our Initiatives
				   </motion.h2>
				   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-6xl">
					   {featureCards.map((card, i) => (
						   <motion.div
							   key={card.title}
							   initial={{ opacity: 0, y: 40 }}
							   animate={{ opacity: 1, y: 0 }}
							   transition={{ duration: 0.5, delay: i * 0.08 }}
							   className="group bg-white rounded-2xl shadow-xl hover:shadow-2xl border border-[#e0e0e0] p-6 flex flex-col items-center text-center transition-all hover:-translate-y-2 cursor-pointer"
						   >
							   <div className="relative w-32 h-32 mb-4">
								   <Image
									   src={card.img}
									   alt={card.title}
									   fill
									   className="object-cover rounded-xl group-hover:scale-105 transition-transform"
								   />
								   <span className="absolute top-2 left-2 bg-[#bfa100]/90 text-white text-xs font-bold px-3 py-1 rounded-full shadow">
									   {card.label}
								   </span>
							   </div>
							   <h3 className="text-xl font-bold text-[#0d3b29] mb-2">
								   {card.title}
							   </h3>
							   <p className="text-[#232323] mb-4">{card.desc}</p>
							   <Link
								   href={card.link}
								   className="text-[#bfa100] font-semibold hover:underline transition"
							   >
								   Learn More →
							   </Link>
						   </motion.div>
					   ))}
				   </div>
			   </section>


			   {/* Programs Section */}
			   <section id="programs" className="w-full py-16 px-4 md:px-0 bg-gradient-to-br from-[#f7fbe9] via-[#e9f5ee] to-[#f5f5f5] scroll-mt-24">
				   <div className="max-w-5xl mx-auto">
					   <h2 className="text-3xl md:text-4xl font-bold text-[#0d3b29] mb-8 text-center">Programs & Core Services</h2>
					   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
						   <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col gap-3 border border-[#e0e0e0]">
							   <h3 className="text-xl font-bold text-[#bfa100] mb-2">EPC & EPP (Export Promotion Code & Program)</h3>
							   <p className="text-[#232323]">Earn dollar-based rewards by promoting African-made products globally through BPI Market, our blockchain-enabled digital marketplace. Diaspora buyers enjoy exclusive discounts while members benefit from dollar-based commissions.</p>
						   </div>
						   <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col gap-3 border border-[#e0e0e0]">
							   <h3 className="text-xl font-bold text-[#bfa100] mb-2">YouTube Monetization Support</h3>
							   <p className="text-[#232323]">Empowering content creators to grow organic followership and meet YouTube monetization requirements through structured community support and growth strategies.</p>
						   </div>
						   <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col gap-3 border border-[#e0e0e0]">
							   <h3 className="text-xl font-bold text-[#bfa100] mb-2">Renewable Solar Assessment Tool</h3>
							   <p className="text-[#232323]">Become a certified solar consultant with hands-on training using our digital solar planning tool, which helps design affordable, sustainable solar energy systems tailored to client needs.</p>
						   </div>
						   <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col gap-3 border border-[#e0e0e0]">
							   <h3 className="text-xl font-bold text-[#bfa100] mb-2">MYNGUL – Pan-African Social Media Platform</h3>
							   <p className="text-[#232323]">Engage with Africa’s first identity-based, revenue-sharing social media platform. Grow your network, share Afrocentric content, and earn rewards as part of a vibrant virtual cooperative.</p>
						   </div>
					   </div>
				   </div>
			   </section>

			   {/* Training Section */}
			   <section id="training" className="w-full py-16 px-4 md:px-0 bg-white scroll-mt-24">
				   <div className="max-w-5xl mx-auto">
					   <h2 className="text-3xl md:text-4xl font-bold text-[#0d3b29] mb-8 text-center">Mentorship & Skill Development</h2>
					   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
						   <div className="bg-[#f7fbe9] rounded-xl shadow p-6 flex flex-col items-center">
							   <span className="text-3xl mb-2">☀️</span>
							   <h3 className="text-lg font-bold text-[#bfa100] mb-1">Solar</h3>
							   <p className="text-[#232323] text-center">Solar installation & energy entrepreneurship</p>
						   </div>
						   <div className="bg-[#e9f5ee] rounded-xl shadow p-6 flex flex-col items-center">
							   <span className="text-3xl mb-2">🌱</span>
							   <h3 className="text-lg font-bold text-[#bfa100] mb-1">Export</h3>
							   <p className="text-[#232323] text-center">Agro-exportation and packaging</p>
						   </div>
						   <div className="bg-[#f7fbe9] rounded-xl shadow p-6 flex flex-col items-center">
							   <span className="text-3xl mb-2">🤖</span>
							   <h3 className="text-lg font-bold text-[#bfa100] mb-1">Web3 & AI</h3>
							   <p className="text-[#232323] text-center">Web3 & AI digital upskilling</p>
						   </div>
						   <div className="bg-[#e9f5ee] rounded-xl shadow p-6 flex flex-col items-center">
							   <span className="text-3xl mb-2">🔧</span>
							   <h3 className="text-lg font-bold text-[#bfa100] mb-1">Conversion</h3>
							   <p className="text-[#232323] text-center">Mechanical-to-Electric conversion training</p>
						   </div>
						   <div className="bg-[#f7fbe9] rounded-xl shadow p-6 flex flex-col items-center">
							   <span className="text-3xl mb-2">💡</span>
							   <h3 className="text-lg font-bold text-[#bfa100] mb-1">Empowerment</h3>
							   <p className="text-[#232323] text-center">Leadership, legacy, and financial mentorship</p>
						   </div>
					   </div>
				   </div>
			   </section>

			   {/* Join Section */}
			   <section id="join" className="w-full py-16 px-4 md:px-0 bg-gradient-to-br from-[#e9f5ee] via-[#f7fbe9] to-[#f5f5f5] scroll-mt-24">
				   <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-10">
					   <div className="flex-1 flex flex-col gap-4">
						   <h2 className="text-3xl md:text-4xl font-bold text-[#0d3b29] mb-4">Become a BPI Member Today</h2>
						   <p className="text-lg text-[#232323] mb-2">Take action toward your economic freedom.<br />
							   <span className="text-[#bfa100]">Follow the steps to build legacy, community, and passive income:</span>
						   </p>
						   <ul className="list-disc pl-6 text-[#232323] mb-4">
							   <li>Join the BPI community</li>
							   <li>Set up a payment node</li>
							   <li>Launch a digital farm</li>
							   <li>Receive your free EPC (Export Promotion Code)</li>
							   <li>Create your MYNGUL account</li>
							   <li>Refer 20 others to qualify for a $1,000 blockchain-based pension plan</li>
						   </ul>
						   <a href="/app/register" className="inline-block">
							   <Button className="bg-[#bfa100] hover:bg-[#0d3b29] text-white font-bold rounded-full px-8 py-3 text-lg shadow-xl transition-all">
								   Join Now
							   </Button>
						   </a>
					   </div>
					   <div className="flex-1 flex justify-center">
						   <Image
							   src="/img/app-mockup.png"
							   alt="App Mockup"
							   width={320}
							   height={320}
							   className="rounded-2xl shadow-xl object-contain"
						   />
					   </div>
				   </div>
			   </section>

			   {/* News Section */}
			   <section id="news" className="w-full py-16 px-4 md:px-0 bg-white scroll-mt-24">
				   <div className="max-w-5xl mx-auto">
					   <h2 className="text-3xl md:text-4xl font-bold text-[#0d3b29] mb-8 text-center">News & Updates</h2>
					   <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
						   <div className="bg-[#f7fbe9] rounded-xl shadow p-6 flex flex-col">
							   <Image src="/img/news1.jpg" alt="News 1" width={320} height={180} className="rounded-lg mb-3 object-cover" />
							   <span className="text-xs text-[#bfa100] font-semibold mb-1">BPI News</span>
							   <h3 className="text-lg font-bold text-[#0d3b29] mb-2">Community Is the New Oil: Unlocking Africa’s Future Through Economic Virtual Cooperatives.</h3>
							   <span className="text-xs text-[#232323] mb-2">By Admin • 12th June, 2025</span>
						   </div>
						   <div className="bg-[#e9f5ee] rounded-xl shadow p-6 flex flex-col">
							   <Image src="/img/news2.jpg" alt="News 2" width={320} height={180} className="rounded-lg mb-3 object-cover" />
							   <span className="text-xs text-[#bfa100] font-semibold mb-1">BPI News</span>
							   <h3 className="text-lg font-bold text-[#0d3b29] mb-2">Introducing the BPI Economic Virtual Cooperative Model: The Blueprint for Africa’s...</h3>
							   <span className="text-xs text-[#232323] mb-2">By Admin • 12th June, 2025</span>
						   </div>
						   <div className="bg-[#f7fbe9] rounded-xl shadow p-6 flex flex-col">
							   <Image src="/img/news1.jpg" alt="News 3" width={320} height={180} className="rounded-lg mb-3 object-cover" />
							   <span className="text-xs text-[#bfa100] font-semibold mb-1">BPI News</span>
							   <h3 className="text-lg font-bold text-[#0d3b29] mb-2">Community Is the New Oil: Unlocking Africa’s Future Through Economic Virtual Cooperatives.</h3>
							   <span className="text-xs text-[#232323] mb-2">By Admin • 12th June, 2025</span>
						   </div>
					   </div>
				   </div>
			   </section>

			   {/* Partners Section */}
			   <section id="partners" className="w-full py-16 px-4 md:px-0 bg-gradient-to-br from-[#e9f5ee] via-[#f7fbe9] to-[#f5f5f5] scroll-mt-24">
				   <div className="max-w-5xl mx-auto">
					   <h2 className="text-3xl md:text-4xl font-bold text-[#0d3b29] mb-8 text-center">Our Strategic Partners</h2>
					   <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
						   <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-center border border-[#e0e0e0]">
							   <Image src="/img/partners/gwallet.jpg" alt="G-wallet" width={100} height={100} className="rounded-full mb-3 object-cover" />
							   <h4 className="text-lg font-bold text-[#bfa100] mb-1">G-wallet</h4>
							   <span className="text-xs text-[#232323] mb-1">USDT Transactions</span>
							   <p className="text-[#232323] text-center text-sm">The Gwallet is a Tether-exclusive wallet built to solve Africa's barriers in digital economy.</p>
						   </div>
						   <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-center border border-[#e0e0e0]">
							   <Image src="/img/partners/zenqira.jpg" alt="Zenqira" width={100} height={100} className="rounded-full mb-3 object-cover" />
							   <h4 className="text-lg font-bold text-[#bfa100] mb-1">Zenqira</h4>
							   <span className="text-xs text-[#232323] mb-1">Fueling AI Innovation</span>
							   <p className="text-[#232323] text-center text-sm">Zenqira is a decentralized, community-driven solution to enhance AI data collection and distribution.</p>
						   </div>
						   <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-center border border-[#e0e0e0]">
							   <Image src="/img/partners/stepclub.jpg" alt="StepClub" width={100} height={100} className="rounded-full mb-3 object-cover" />
							   <h4 className="text-lg font-bold text-[#bfa100] mb-1">StepClub</h4>
							   <span className="text-xs text-[#232323] mb-1">Unlock your full potential</span>
							   <p className="text-[#232323] text-center text-sm">STEPClub has everything you need to reach your goals and ensure you achieve optimal health and wealth.</p>
						   </div>
						   <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-center border border-[#e0e0e0]">
							   <Image src="/img/partners/freelife.jpg" alt="FreeLife" width={100} height={100} className="rounded-full mb-3 object-cover" />
							   <h4 className="text-lg font-bold text-[#bfa100] mb-1">FreeLife</h4>
							   <span className="text-xs text-[#232323] mb-1">Healthy living, Made Easy</span>
							   <p className="text-[#232323] text-center text-sm">FreeLife Global Ltd is a Leading Provider of integrated health and Wealth Management Solutions.</p>
						   </div>
					   </div>
				   </div>
			   </section>

			   {/* Contact Section */}
			   <section id="contact" className="w-full py-16 px-4 md:px-0 bg-white scroll-mt-24">
				   <div className="max-w-5xl mx-auto">
					   <h2 className="text-3xl md:text-4xl font-bold text-[#0d3b29] mb-8 text-center">Connect With Us</h2>
					   <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
						   <div className="flex flex-col gap-4">
							   <h3 className="text-2xl font-semibold text-[#0d3b29] mb-2">Contact Details</h3>
							   <div className="flex items-center gap-3">
								   <i className="fas fa-map-marker-alt text-[#bfa100] text-xl"></i>
								   <span className="text-[#232323]">15b Yinusa Adeniji Street, Off Muslim Avenue, Ikeja, Lagos, Nigeria.</span>
							   </div>
							   <div className="flex items-center gap-3">
								   <i className="fas fa-envelope text-[#bfa100] text-xl"></i>
								   <span className="text-[#232323]">beepagro@gmail.com, partners@beepagro.com</span>
							   </div>
							   <div className="flex items-center gap-3">
								   <i className="fas fa-phone text-[#bfa100] text-xl"></i>
								   <span className="text-[#232323]">+234-706-710-8437, +234-909-200-3500</span>
							   </div>
						   </div>
						   <div>
							   <h3 className="text-2xl font-semibold text-[#0d3b29] mb-2">Let’s Connect</h3>
							   <form className="flex flex-col gap-4" action="#" method="post">
								   <input type="text" name="name" placeholder="Your Full Name" className="rounded-lg border border-[#bfa100] px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#0d3b29]" required />
								   <input type="email" name="email" placeholder="Your Email Address" className="rounded-lg border border-[#bfa100] px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#0d3b29]" required />
								   <input type="text" name="phone" placeholder="Your Mobile Number" className="rounded-lg border border-[#bfa100] px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#0d3b29]" />
								   <input type="text" name="subject" placeholder="Your Subject" className="rounded-lg border border-[#bfa100] px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#0d3b29]" />
								   <textarea name="message" placeholder="Your Message" className="rounded-lg border border-[#bfa100] px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#0d3b29]" rows={4} required></textarea>
								   <Button type="submit" className="bg-[#bfa100] hover:bg-[#0d3b29] text-white font-bold rounded-full px-8 py-3 text-lg shadow-xl transition-all">Send Message</Button>
							   </form>
						   </div>
					   </div>
				   </div>
			   </section>

			{/* Footer */}
			<footer className="w-full bg-[#0d3b29] text-white pt-12 pb-6 px-6 md:px-20 mt-auto relative overflow-hidden">
				<div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10">
					<div className="flex flex-col gap-4">
						<Image
							src="/img/logo.png"
							alt="BPI Logo"
							width={64}
							height={64}
							className="rounded-full"
						/>
						<p className="text-white/90 text-sm">
							BeepAgro Africa represents an agro-tech company focused on the
							adoption and implementation of blockchain and Web 3 technology in
							the marketing and distribution of its products.
						</p>
						<div className="flex gap-3 mt-2">
							<a
								href="https://www.facebook.com/profile.php?id=100088524616888"
								target="_blank"
								rel="noopener"
								className="hover:text-[#bfa100] transition"
							>
								<i className="fab fa-facebook-f text-xl"></i>
							</a>
							<a
								href="https://www.instagram.com/beepagro/"
								target="_blank"
								rel="noopener"
								className="hover:text-[#bfa100] transition"
							>
								<i className="fab fa-instagram text-xl"></i>
							</a>
							<a
								href="https://www.linkedin.com/company/beepmagnet-international-limited/"
								target="_blank"
								rel="noopener"
								className="hover:text-[#bfa100] transition"
							>
								<i className="fab fa-linkedin-in text-xl"></i>
							</a>
						</div>
					</div>
					<div>
						<h4 className="font-bold text-lg mb-3">Site Links</h4>
						<ul className="space-y-2">
							<li>
								<Link
									href="/shop"
									className="hover:text-[#bfa100] transition"
								>
									Our Shop
								</Link>
							</li>
							<li>
								<Link
									href="/about"
									className="hover:text-[#bfa100] transition"
								>
									About Us
								</Link>
							</li>
							<li>
								<Link
									href="/contact"
									className="hover:text-[#bfa100] transition"
								>
									Contact Us
								</Link>
							</li>
							<li>
								<Link
									href="/privacy"
									className="hover:text-[#bfa100] transition"
								>
									Privacy Policy
								</Link>
							</li>
							<li>
								<Link
									href="/terms"
									className="hover:text-[#bfa100] transition"
								>
									Terms & Conditions
								</Link>
							</li>
						</ul>
					</div>
					<div>
						<h4 className="font-bold text-lg mb-3">Contact Info</h4>
						<ul className="space-y-2 text-white/90">
							<li>
								BeepHouse 15b Yinusa Adeniji Street,
								<br />
								Off Muslim Avenue, Ikeja, Lagos.
							</li>
							<li>
								<i className="fas fa-phone mr-2"></i>+234 706 710 8437
							</li>
							<li>
								<i className="fas fa-envelope mr-2"></i>info@beepagro.com
							</li>
							<li>
								<i className="fas fa-globe mr-2"></i>www.beepagro.com
							</li>
						</ul>
					</div>
					<div>
						<h4 className="font-bold text-lg mb-3">Newsletter</h4>
						<p className="text-white/90 mb-2">Subscribe now to get updates</p>
						<form className="flex gap-2">
							<input
								type="email"
								placeholder="Enter your Email.."
								className="rounded-full px-4 py-2 text-[#232323] focus:outline-none focus:ring-2 focus:ring-[#bfa100]"
								required
							/>
							<Button className="bg-[#bfa100] hover:bg-[#0d3b29] text-white rounded-full px-4 py-2">
								Subscribe
							</Button>
						</form>
						<div className="flex items-center gap-3 mt-4">
							<Image
								src="/img/satisfaction_img.png"
								alt="100% Confidential"
								width={40}
								height={40}
							/>
							<div>
								<h5 className="font-bold text-base">100% Confidential</h5>
								<span className="text-xs text-white/80">
									25k Active Customer
								</span>
							</div>
						</div>
					</div>
				</div>
				<div className="w-full text-center text-white/70 text-xs mt-10 pt-6 border-t border-white/10">
					&copy; {new Date().getFullYear()} BeepAgro Africa. All rights reserved.
				</div>
				<Image
					src="/img/footer_shape01.png"
					alt=""
					width={120}
					height={120}
					className="absolute left-0 bottom-0 opacity-10"
				/>
				<Image
					src="/img/footer_shape02.png"
					alt=""
					width={120}
					height={120}
					className="absolute right-0 top-0 opacity-10"
				/>
			</footer>
		</div>
	);
}
