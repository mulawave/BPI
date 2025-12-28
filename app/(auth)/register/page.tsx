

"use client";
import React from "react";
import Image from "next/image";
import RegisterForm from "@/components/auth/RegisterForm";
import Link from "next/link";
import { useSearchParams } from "next/navigation";


export default function RegisterPage() {
  const searchParams = useSearchParams();
  const refId = searchParams?.get("ref") || "1";
  const [showInvite, setShowInvite] = React.useState(true);
  const inviter = refId !== "1" ? "Dominique Fravoux" : "Administrator";
  const inviteMsg = `You have been invited by ${inviter}.`;
  return (
    <div className="min-h-screen bg-[radial-gradient(1200px_800px_at_20%_10%,#2a6b47_0%,#0f3a29_35%,#0b2b1f_70%)] flex items-center justify-center p-4 md:p-10">
      <div className="flex w-full max-w-[1440px] h-[750px] rounded-2xl shadow-2xl overflow-visible backdrop-blur relative">
        {/* LEFT: Hero + Quote */}
        <div className="relative flex-[6] h-full bg-gradient-to-br from-[#2a6b47] via-[#0f3a29] to-[#0b2b1f] flex flex-col justify-center z-10 rounded-l-2xl overflow-hidden">
          {/* Logo at top left */}
          <div className="absolute top-6 left-8 z-30">
            <Image src="/logo_dark.png" alt="Beep Agro Africa" width={154} height={154} className="rounded-full shadow" />
          </div>
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(2, 37, 16, 0.89),transparent_60%)]" />
          <div
            className="absolute inset-0 z-20 pointer-events-none"
            style={{
              backgroundImage: 'url(/hero_register.jpg)',
              backgroundRepeat: 'no-repeat',
              backgroundSize: 'cover',
              backgroundPosition: 'calc(100% - 110px) bottom',
            }}
          />
          {/* quote pill */}
          <div className="absolute z-20 left-8" style={{ bottom: '50%' }}>
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
        {/* RIGHT: Register Card */}
        <div className="flex-[4] flex flex-col justify-center bg-white h-full z-20 relative rounded-r-2xl ml-[-110px] p-0">
          <div className="flex flex-col items-center h-full justify-center pt-20 pb-6 px-6">
            {/* Notification Alert - centered above the form border */}
            {showInvite && (
              <div className="w-full flex justify-center items-center mb-2" style={{ position: 'absolute', top: 24, left: 0, zIndex: 40 }}>
                <div className="bg-[#0d3b29]/70 text-white text-[15px] rounded-lg px-4 py-2 flex items-center gap-2 shadow-md" style={{backdropFilter: 'blur(2px)'}}>
                  <span>{inviteMsg}</span>
                  <button
                    type="button"
                    className="ml-2 text-white/80 hover:text-white text-lg font-bold focus:outline-none"
                    aria-label="Close notification"
                    onClick={() => setShowInvite(false)}
                  >
                    ×
                  </button>
                </div>
              </div>
            )}
            <div className="border border-[#a6a6a6] rounded-[2.5rem] w-full max-w-[540px] flex flex-col items-center py-6 px-6 mt-4 relative">
              <div className="flex flex-col items-center gap-1 mb-4">
                <h2 className="mt-1 text-xl font-semibold text-[#0d3b29]">BPI Member Registration</h2>
              </div>
              <div className="w-full flex justify-center">
                <div className="w-full flex flex-col items-center">
                  <RegisterForm refId={refId} />
                </div>
              </div>
            </div>
            <div className="mt-4 text-center text-sm text-muted-foreground w-full flex flex-col items-center">
              <span>Already have an account?</span>
              <Link href="/login" className="font-semibold text-[#0d3b29] underline-offset-4 hover:underline mt-1 block">
                LOGIN HERE
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
