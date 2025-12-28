import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import LoginForm from "@/components/auth/LoginForm";
import Link from "next/link";
import { Home } from "lucide-react";

export const metadata = {
  title: "Login • BeepAgro",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(1200px_800px_at_20%_10%,#2a6b47_0%,#0f3a29_35%,#0b2b1f_70%)] flex items-center justify-center p-4 md:p-10">
      {/* Floating Home Button */}
      <div className="fixed top-6 left-6 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-lg bg-[#0d3b29]/70 hover:bg-[#0d3b29]/90 transition-colors border border-[#fff3] backdrop-blur-md" style={{minWidth:'220px', maxWidth:'340px'}}>
        <Link href="/" className="flex items-center gap-2 group">
          <span className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10 border border-white/20 group-hover:bg-white/20 transition">
            <Home size={24} className="text-white drop-shadow" />
          </span>
          <span className="flex flex-col ml-2">
            <span className="text-white font-bold text-base leading-tight tracking-wide drop-shadow">Return Home</span>
            <span className="text-white/80 text-xs font-medium leading-tight drop-shadow">Back to BPI main site</span>
          </span>
        </Link>
      </div>
      <div className="flex w-full max-w-[1270px] h-[750px] rounded-2xl shadow-2xl overflow-visible backdrop-blur relative">
        {/* LEFT: Hero + Quote */}
        <div className="relative flex-[6] h-full bg-gradient-to-br from-[#2a6b47] via-[#0f3a29] to-[#0b2b1f] flex flex-col justify-center z-10 rounded-l-2xl overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.05),transparent_60%)]" />
          <div
            className="absolute inset-0 z-20 pointer-events-none"
            style={{
              backgroundImage: 'url(/hero.jpg)',
              backgroundRepeat: 'no-repeat',
              backgroundSize: 'cover',
              backgroundPosition: 'calc(100% - 110px) bottom',
            }}
          />
          {/* quote pill */}
          <div className="absolute z-20 left-8" style={{ bottom: '60%' }}>
            <div className="flex justify-center w-full mb-2">
              <div className="flex items-center gap-2">
                <div className="h-1 w-1 rounded-full bg-white/60" />
                <div className="h-1 w-1 rounded-full bg-white/60" />
                <div className="h-1 w-1 rounded-full bg-white/60" />
              </div>
            </div>
            <div className="mt-2 rounded-full px-4 py-2 text-sm italic text-white shadow" style={{ backgroundColor: '#6d5c03' }}>
              “Take advantage of the BPI Retirement Plan.”
            </div>
            <div className="mt-2 inline-block rounded-full px-3 py-1 text-xs font-medium text-white shadow" style={{ backgroundColor: '#6d5c03' }}>
              — Phill Coulson
            </div>
          </div>
        </div>
        {/* RIGHT: Login Card */}
  <div className="flex-[4.5] flex flex-col justify-center bg-white h-full z-20 relative shadow-xl rounded-r-2xl ml-[-110px] p-0">
          <div className="flex flex-col items-center h-full justify-center p-10">
            <div className="border border-[#a6a6a6] rounded-[2.5rem] w-full flex flex-col items-center p-10">
              <div className="flex flex-col items-center gap-2 mb-8">
                <Image src="/logo.png" alt="Beep Agro Africa" width={154} height={154} className="rounded-full" />
                <h2 className="mt-2 text-xl font-semibold text-[#0d3b29]">Welcome Back</h2>
              </div>
              <div className="w-full flex justify-center">
                <div className="w-full flex flex-col items-center">
                  <LoginForm />
                </div>
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
