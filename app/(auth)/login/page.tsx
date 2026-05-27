import Image from "next/image";
import LoginForm from "@/components/auth/LoginForm";
import Link from "next/link";
import { Home } from "lucide-react";

export const metadata = {
  title: "Login • BeepAgro",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(1200px_800px_at_20%_10%,#2a6b47_0%,#0f3a29_35%,#0b2b1f_70%)] p-3 sm:p-6 lg:p-10">
      <div className="mx-auto w-full max-w-[1200px]">
        <div className="mb-4 sm:mb-6 flex justify-start">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-[#0d3b29]/70 px-4 py-2.5 text-white shadow-lg backdrop-blur-md transition-colors hover:bg-[#0d3b29]/90"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/10 group-hover:bg-white/20">
              <Home size={18} className="text-white" />
            </span>
            <span className="flex flex-col">
              <span className="text-sm font-semibold leading-tight">Return Home</span>
              <span className="text-xs text-white/80 leading-tight">Back to BPI main site</span>
            </span>
          </Link>
        </div>

        <div className="overflow-hidden rounded-3xl border border-white/15 shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-12">
            <section className="relative lg:col-span-7 min-h-[220px] sm:min-h-[260px] lg:min-h-[680px] bg-gradient-to-br from-[#2a6b47] via-[#0f3a29] to-[#0b2b1f]">
              <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.05),transparent_60%)]" />
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: "url(/hero.jpg)",
                  backgroundRepeat: "no-repeat",
                  backgroundSize: "cover",
                  backgroundPosition: "center bottom",
                }}
              />

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
              <div className="flex min-h-full flex-col justify-center px-4 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12">
                <div className="w-full rounded-[2rem] border border-[#a6a6a6] px-4 py-7 sm:px-8 sm:py-9">
                  <div className="mb-7 flex flex-col items-center gap-2">
                    <Image src="/img/logo.png" alt="BPI Logo" width={126} height={126} className="rounded-full" />
                    <h2 className="mt-1 text-xl font-semibold text-[#0d3b29]">Welcome Back</h2>
                  </div>

                  <div className="w-full">
                    <LoginForm />
                  </div>
                </div>

                <div className="mt-6 text-center text-sm text-muted-foreground">
                  <span>Don&apos;t have an account yet?</span>
                  <Link href="/register" className="mt-1 block font-semibold text-[#0d3b29] underline-offset-4 hover:underline">
                    CREATE AN ACCOUNT
                  </Link>
                </div>
              </div>
            </section>
          </span>
          </div>
        </div>
      </div>
    </div>
  );
}
