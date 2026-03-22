"use client";

import React from "react";
import Image from "next/image";

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto py-16 px-4 md:px-0">
      <h1 className="text-4xl font-bold text-[#0d3b29] mb-6">About BeepAgro Africa</h1>
      <Image
        src="/img/logo.png"
        alt="BPI Logo"
        width={80}
        height={80}
        className="mb-6 rounded-full shadow"
      />
      <p className="text-lg text-[#232323] mb-4">
        <b>BeepAgro Africa</b> is an agro-tech company focused on the adoption and implementation of blockchain and Web 3 technology in the marketing and distribution of its products. Our mission is to empower communities, drive innovation in agriculture, and create sustainable value chains across Africa.
      </p>
      <p className="text-lg text-[#232323] mb-4">
        We believe in a community-first model for sustainable growth, powered by collaboration, training, and mentorship. Our programs and services are tailored to uplift, train, and empower millions of Africans, transforming agriculture through innovation and technology.
      </p>
      <p className="text-lg text-[#232323] mb-4">
        Join us as we build a future where technology and agriculture work hand in hand to create lasting impact and prosperity for all.
      </p>
      <div className="mt-8">
        <h2 className="text-2xl font-semibold text-[#0d3b29] mb-2">Contact Information</h2>
        <ul className="text-[#232323]">
          <li>BeepHouse 15b Yinusa Adeniji Street, Off Muslim Avenue, Ikeja, Lagos.</li>
          <li>Phone: +234 706 710 8437</li>
          <li>Email: info@beepagro.com</li>
          <li>Website: www.beepagro.com</li>
        </ul>
      </div>
    </div>
  );
}
