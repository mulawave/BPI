"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { AiOutlineLock } from "react-icons/ai";
import { useSearchParams } from "next/navigation";
import { api } from "@/client/trpc";

export default function SetNewPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  
  const searchParams = useSearchParams();
  const token = searchParams?.get("token");
  
  const resetPasswordMutation = api.auth.resetPassword.useMutation();
  const validateTokenQuery = api.auth.validateResetToken.useQuery(
    { token: token || "" },
    { enabled: !!token }
  );

  useEffect(() => {
    if (!token) {
      setError("Invalid reset link. Please request a new password reset.");
      setTokenValid(false);
      return;
    }

    if (validateTokenQuery.data) {
      setTokenValid(validateTokenQuery.data.valid);
      if (!validateTokenQuery.data.valid) {
        setError("This reset link has expired or is invalid. Please request a new password reset.");
      }
    }
  }, [token, validateTokenQuery.data]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!token) {
      setError("Invalid reset token.");
      return;
    }
    
    if (!password || !confirmPassword) {
      setError("Please fill in both fields.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      await resetPasswordMutation.mutateAsync({
        token,
        password,
        confirmPassword,
      });
      setSubmitted(true);
    } catch (error: any) {
      setError(error.message || "An error occurred. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(1200px_800px_at_20%_10%,#2a6b47_0%,#0f3a29_35%,#0b2b1f_70%)] flex items-center justify-center p-4 md:p-10">
      <div className="flex w-full max-w-[1270px] h-[750px] rounded-2xl shadow-2xl overflow-visible backdrop-blur relative">
        {/* LEFT: Hero Image */}
        <div className="relative flex-[7] h-full bg-gradient-to-br from-[#2a6b47] via-[#0f3a29] to-[#0b2b1f] flex flex-col justify-center z-10 rounded-l-2xl">
          <div className="absolute inset-0 z-20 pointer-events-none">
            <Image src="/new_password_hero.jpg" alt="Set New Password Hero" fill style={{objectFit: 'contain', objectPosition: 'left center'}} />
          </div>
        </div>
        {/* RIGHT: Set New Password Card */}
  <div className="flex-[3.5] flex flex-col justify-center bg-white h-full z-20 relative rounded-r-2xl ml-[-110px] p-0">
          <div className="flex flex-col items-center h-full justify-center p-10">
            <div className="border border-[#a6a6a6] rounded-[2.5rem] w-full max-w-[400px] flex flex-col items-center p-10 relative bg-white/90">
              <div className="flex flex-col items-center gap-2 mb-8">
                <Image src="/logo.png" alt="Beep Agro Africa" width={120} height={120} className="rounded-full shadow mb-2" />
                <h2 className="mt-2 text-2xl font-semibold text-[#0d3b29]">Set New Password</h2>
                <p className="text-sm text-[#0d3b29] text-center">Enter your new password below to reset your account.</p>
              </div>
              {submitted ? (
                <div className="w-full text-center text-green-700 font-medium text-base">
                  Your password has been reset successfully! <br />
                  <Link href="/login" className="font-semibold text-[#0d3b29] underline-offset-4 hover:underline mt-2 block">
                    Go to Login
                  </Link>
                </div>
              ) : tokenValid === false ? (
                <div className="w-full text-center text-red-600 font-medium text-base">
                  {error}
                  <br />
                  <Link href="/forgot-password" className="font-semibold text-[#0d3b29] underline-offset-4 hover:underline mt-2 block">
                    Request New Reset Link
                  </Link>
                </div>
              ) : validateTokenQuery.isLoading ? (
                <div className="w-full text-center text-[#0d3b29] font-medium text-base">
                  Validating reset link...
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
                  <div className="relative">
                    <span className="absolute left-1.5 top-1/2 -translate-y-1/2 flex items-center justify-center w-7 h-7 rounded-full border border-[#b0b0b0] text-[#b0b0b0] text-xl pointer-events-none">
                      <AiOutlineLock />
                    </span>
                    <input
                      type="password"
                      name="password"
                      placeholder="New password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="pl-10 rounded-full border border-[#a6a6a6] bg-[#f4f4f4] px-5 py-4 text-[1.1rem] text-[#232323] font-sans font-light focus:border-[#0d3b29] placeholder-[#b0b0b0] outline-none w-full"
                      required
                    />
                  </div>
                  <div className="relative">
                    <span className="absolute left-1.5 top-1/2 -translate-y-1/2 flex items-center justify-center w-7 h-7 rounded-full border border-[#b0b0b0] text-[#b0b0b0] text-xl pointer-events-none">
                      <AiOutlineLock />
                    </span>
                    <input
                      type="password"
                      name="confirmPassword"
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className="pl-10 rounded-full border border-[#a6a6a6] bg-[#f4f4f4] px-5 py-4 text-[1.1rem] text-[#232323] font-sans font-light focus:border-[#0d3b29] placeholder-[#b0b0b0] outline-none w-full"
                      required
                    />
                  </div>
                  {error && <div className="text-red-600 text-xs text-center">{error}</div>}
                  <button
                    type="submit"
                    disabled={resetPasswordMutation.isPending}
                    className="w-full bg-[#0d3b29] text-white rounded-full h-12 text-lg font-semibold mt-2 hover:bg-[#145c3a] transition disabled:opacity-50"
                  >
                    {resetPasswordMutation.isPending ? "Setting Password..." : "Set Password"}
                  </button>
                </form>
              )}
            </div>
            <div className="mt-8 text-center text-sm text-muted-foreground w-full flex flex-col items-center">
              <span>Remembered your password?</span>
              <Link href="/login" className="font-semibold text-[#0d3b29] underline-offset-4 hover:underline mt-1 block">
                LOGIN
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
