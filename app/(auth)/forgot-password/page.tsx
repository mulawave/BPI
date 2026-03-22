"use client";
import React, { useState } from "react";
import { AiOutlineMail } from "react-icons/ai";
import Image from "next/image";
import Link from "next/link";
import { api } from "@/client/trpc";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  
  const forgotPasswordMutation = api.auth.forgotPassword.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    try {
      await forgotPasswordMutation.mutateAsync({ email });
      setSubmitted(true);
    } catch (error: any) {
      setError(error.message || "An error occurred. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(1200px_800px_at_20%_10%,#2a6b47_0%,#0f3a29_35%,#0b2b1f_70%)] flex items-center justify-center p-4 md:p-10">
  <div className="flex w-full max-w-[1270px] h-[750px] rounded-2xl shadow-2xl overflow-visible backdrop-blur relative">
        {/* LEFT: Hero Image */}
  <div className="relative flex-[6] h-full bg-gradient-to-br from-[#2a6b47] via-[#0f3a29] to-[#0b2b1f] flex flex-col justify-center z-10 rounded-l-2xl overflow-hidden">
          <div className="absolute inset-0 z-20 pointer-events-none">
            <Image src="/forgot_pass_hero.jpg" alt="Forgot Password Hero" fill style={{objectFit: 'cover', objectPosition: 'center'}} />
          </div>
        </div>
        {/* RIGHT: Forgot Password Card */}
  <div className="flex-[4.5] flex flex-col justify-center bg-white h-full z-20 relative rounded-r-2xl ml-[-110px] p-0">
          <div className="flex flex-col items-center h-full justify-center p-10">
            <div className="border border-[#a6a6a6] rounded-[2.5rem] w-full max-w-[400px] flex flex-col items-center p-10 relative bg-white/90">
              <div className="flex flex-col items-center gap-2 mb-8">
                <Image src="/img/logo.png" alt="BPI Logo" width={120} height={120} className="rounded-full shadow mb-2" />
                <h2 className="mt-2 text-2xl font-semibold text-[#0d3b29]">Forgot Password?</h2>
                <p className="text-sm text-[#0d3b29] text-center">Enter your email address and we'll send you a link to reset your password.</p>
              </div>
              {submitted ? (
                <div className="w-full text-center text-green-700 font-medium text-base">
                  If an account exists for <span className="font-bold">{email}</span>, a password reset link has been sent.
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
                  <div className="relative">
                    <span className="absolute left-1.5 top-1/2 -translate-y-1/2 flex items-center justify-center w-7 h-7 rounded-full border border-[#b0b0b0] text-[#b0b0b0] text-xl pointer-events-none">
                      <AiOutlineMail />
                    </span>
                    <input
                      type="email"
                      name="email"
                      placeholder="Email address"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="pl-10 rounded-full border border-[#a6a6a6] bg-[#f4f4f4] px-5 py-4 text-[1.1rem] text-[#232323] font-sans font-light focus:border-[#0d3b29] placeholder-[#b0b0b0] outline-none w-full"
                      required
                    />
                  </div>
                  {error && <div className="text-red-600 text-xs text-center">{error}</div>}
                  <button
                    type="submit"
                    disabled={forgotPasswordMutation.isPending}
                    className="w-full bg-[#0d3b29] text-white rounded-full h-12 text-lg font-semibold mt-2 hover:bg-[#145c3a] transition disabled:opacity-50"
                  >
                    {forgotPasswordMutation.isPending ? "Sending..." : "Send Reset Link"}
                  </button>
                </form>
              )}
              <div className="mt-8 text-center text-sm text-muted-foreground w-full flex flex-col items-center">
                <span>Remembered your password?</span>
                <Link href="/login" className="font-semibold text-[#0d3b29] underline-offset-4 hover:underline mt-1 block">
                  LOGIN
                </Link>
              </div>
            </div>
            <div className="mt-8 text-center text-sm text-muted-foreground w-full flex flex-col items-center">
              <span>Don’t have an account yet?</span>
              <Link href="/register" className="font-semibold text-[#0d3b29] underline-offset-4 hover:underline mt-1 block">
                CREATE AN ACCOUNT
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
