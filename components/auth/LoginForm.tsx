"use client";

import { useState, FormEvent } from "react";
import { AlertBadge } from "@/components/ui/AlertBadge";
import { TopLoadingBar } from "@/components/ui/TopLoadingBar";
import { signIn } from "next-auth/react";
import { Mail, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<null | { type: "success" | "failed" | "warning"; message: string }>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setAlert(null);

    // Use signIn with redirect: false for client-side handling
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: "/dashboard",
    });

    if (!result) {
      setLoading(false);
      setAlert({ type: "failed", message: "Could not connect to authentication server." });
      return;
    }

    if (result.error) {
      setLoading(false);
      if (result.error.toLowerCase().includes("account")) {
        setAlert({ type: "failed", message: "Account Not Found" });
      } else if (result.error.toLowerCase().includes("combination") || result.error.toLowerCase().includes("invalid")) {
        setAlert({ type: "warning", message: "Invalid Email and Password Combination" });
      } else {
        setAlert({ type: "failed", message: result.error });
      }
      return;
    }

    if (result.ok) {
      setAlert({ type: "success", message: "Login Successful, connecting to your Dashboard" });
      // Keep loading state true during redirect to prevent re-submission
      // Use Next.js router for more reliable navigation
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    }
  }

  return (
    <div suppressHydrationWarning>
      <TopLoadingBar loading={loading} />
      {/* Alert badge at top right */}
      {alert && (
        <div className="fixed top-6 right-8 z-[200]" suppressHydrationWarning>
          <AlertBadge
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
            duration={5000}
          />
        </div>
      )}
      <form onSubmit={onSubmit} className="space-y-8 font-sans">
      {/* Email */}
      <div className="relative">
        <div className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 flex items-center justify-center">
          <span className="flex items-center justify-center w-7 h-7 rounded-full border border-[#888] border-[1px]">
            <Mail size={16} className="text-[#888]" />
          </span>
        </div>
        <Input
          type="email"
          autoComplete="email"
          placeholder="Email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-12 w-[260px] md:w-[320px] rounded-full pl-10 pr-10 bg-[#f4f4f4] border border-[#a6a6a6] focus:border-[#0d3b29] placeholder:text-[#888] text-[1.25rem] font-sans font-light text-[#888]"
        />
      </div>

      {/* Password */}
      <div className="relative">
        <div className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 flex items-center justify-center">
          <span className="flex items-center justify-center w-7 h-7 rounded-full border border-[#888] border-[1px]">
            {/* Larger padlock icon, lighter color */}
            <svg width="30" height="30" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#888]">
              <rect x="5.5" y="7.5" width="9" height="9" rx="3" stroke="#888" strokeWidth="1"/>
              <rect x="8" y="4.5" width="4" height="4" rx="1.5" stroke="#888" strokeWidth="1"/>
              <circle cx="10" cy="13" r="1.2" stroke="#888" strokeWidth="1.2"/>
              <circle cx="10" cy="13" r="0.6" fill="#888" />
              <rect x="9.4" y="13" width="1.2" height="2.2" rx="0.4" fill="#888" />
            </svg>
          </span>
        </div>
        <Input
          type={show ? "text" : "password"}
          autoComplete="current-password"
          placeholder="Password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="h-12 w-[260px] md:w-[320px] rounded-full pl-10 pr-10 bg-[#f4f4f4] border border-[#a6a6a6] focus:border-[#0d3b29] placeholder:text-[#888] text-[1.25rem] font-sans font-light text-[#888]"
        />
        <button
          type="button"
          aria-label={show ? "Hide password" : "Show password"}
          onClick={() => setShow((s) => !s)}
          className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center"
        >
          <span className="flex items-center justify-center w-7 h-7 rounded-full border border-[#888] border-[1px]">
            {show ? <EyeOff size={16} className="text-[#888]" /> : <Eye size={16} className="text-[#888]" />}
          </span>
        </button>
      </div>

      {/* Options */}
  <div className="flex items-center justify-between text-sm mt-2">
        <label className="inline-flex items-center gap-2 select-none">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-[#0d3b29] focus:ring-[#0d3b29]"
          />
          <span className="text-muted-foreground font-sans">Remember me</span>
        </label>
        <Link href="/forgot-password" className="text-[#0d3b29] hover:underline">
          Forgot Password
        </Link>
      </div>



      <Button
        type="submit"
        disabled={loading}
        className="h-12 w-full rounded-full bg-[#0d3b29] text-white hover:opacity-95 font-sans text-[1.25rem]"
      >
        {loading ? "Logging in…" : "LOGIN"}
      </Button>
    </form>
     </div>
  );
 
}
