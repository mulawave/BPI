

"use client";
import React from "react";
import Image from "next/image";
import RegisterForm from "@/components/auth/RegisterForm";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { api } from "@/client/trpc";


export default function RegisterPage() {
  const searchParams = useSearchParams();
  const refId = searchParams?.get("ref") || "1";
  const [showInvite, setShowInvite] = React.useState(true);
  
  // Fetch referrer info
  const { data: referrerData, isLoading } = api.auth.getReferrerInfo.useQuery(
    { refId },
    { enabled: !!refId }
  );
  
  const inviter = referrerData?.name || (isLoading ? "Loading..." : "Administrator");
  const inviteMsg = `You have been invited by ${inviter}.`;
  
  return (
    <div className="min-h-screen bg-[radial-gradient(1200px_800px_at_20%_10%,#2a6b47_0%,#0f3a29_35%,#0b2b1f_70%)] p-3 sm:p-6 lg:p-10">
      <div className="mx-auto w-full max-w-[1240px] overflow-hidden rounded-3xl border border-white/15 shadow-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-12">
          <section className="relative lg:col-span-7 min-h-[220px] sm:min-h-[280px] lg:min-h-[700px] bg-gradient-to-br from-[#2a6b47] via-[#0f3a29] to-[#0b2b1f]">
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(2,37,16,0.89),transparent_60%)]" />
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: "url(/hero_register.jpg)",
                backgroundRepeat: "no-repeat",
                backgroundSize: "cover",
                backgroundPosition: "center bottom",
              }}
            />

            <div className="absolute left-5 top-5 z-20 sm:left-7 sm:top-7">
              <Image src="/logo_dark.png" alt="Beep Agro Africa" width={92} height={92} className="rounded-full shadow" />
            </div>

            <div className="relative z-10 flex h-full flex-col justify-end p-5 sm:p-7 lg:p-10">
              <div className="mb-2 flex items-center gap-2">
                <div className="h-1 w-1 rounded-full bg-white/60" />
                <div className="h-1 w-1 rounded-full bg-white/60" />
                <div className="h-1 w-1 rounded-full bg-white/60" />
              </div>
              <div className="inline-block max-w-[420px] rounded-full bg-[#6d5c03] px-4 py-2 text-sm italic text-white shadow">
                "Take advantage of the BPI Retirement Plan."
              </div>
              <div className="mt-2 inline-block rounded-full bg-[#6d5c03] px-3 py-1 text-xs font-medium text-white shadow">
                - Phill Coulson
              </div>
            </div>
          </section>

          <section className="lg:col-span-5 bg-white">
            <div className="flex min-h-full flex-col justify-center px-3 py-6 sm:px-7 sm:py-9 lg:px-9 lg:py-10">
              {showInvite && (
                <div className="mb-3 w-full rounded-xl bg-[#0d3b29]/85 px-3 py-2 text-xs text-white shadow-md backdrop-blur-sm sm:text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="leading-tight">{inviteMsg}</span>
                    <button
                      type="button"
                      className="ml-2 text-base font-bold text-white/85 transition hover:text-white"
                      aria-label="Close notification"
                      onClick={() => setShowInvite(false)}
                    >
                      x
                    </button>
                  </div>
                </div>
              )}

              <div className="w-full rounded-[2rem] border border-[#a6a6a6] px-4 py-6 sm:px-7 sm:py-8">
                <div className="mb-4 flex flex-col items-center gap-1">
                  <h2 className="text-lg font-semibold text-[#0d3b29] sm:text-xl text-center">BPI Member Registration</h2>
                </div>
                <RegisterForm refId={refId} />
              </div>

              <div className="mt-4 text-center text-xs text-muted-foreground sm:text-sm">
                <span>Already have an account?</span>
                <Link href="/login" className="mt-1 block font-semibold text-[#0d3b29] underline-offset-4 hover:underline">
                  LOGIN HERE
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
