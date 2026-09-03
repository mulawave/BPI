"use client";

import { useState } from "react";
import Image from "next/image";
import { AiOutlineLock, AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { api } from "@/client/trpc";
import { signIn, signOut, useSession } from "next-auth/react";
import { resolveClientBaseUrl } from "@/lib/clientAppUrl";

export default function ForcePasswordResetPage() {
  const { data: session } = useSession();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const mutation = api.user.completeForcePasswordReset.useMutation({
    onSuccess: async (data) => {
      setSuccess(true);

      // Refresh the session with the new password so the JWT token is updated
      // with forcePasswordReset: false. Otherwise middleware keeps redirecting
      // back to this page until the old token's enrichment TTL expires.
      const email = data?.email ?? session?.user?.email;
      if (email && newPassword) {
        try {
          const signInResult = await signIn("credentials", {
            email,
            password: newPassword,
            redirect: false,
            callbackUrl: "/dashboard",
          });

          if (signInResult?.ok) {
            window.location.href = "/dashboard";
            return;
          } else if (signInResult?.error) {
            setError("Password set, but re-authentication failed. Please sign in manually.");
            return;
          }
        } catch (e) {
          console.error("Re-authentication after reset failed:", e);
        }
      }

      // Fallback: try a hard navigation and let middleware refresh the token
      // via the next full page request if signIn was unavailable.
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1500);
    },
    onError: (err) => {
      setError(err.message || "An error occurred. Please try again.");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!newPassword || !confirmPassword) {
      setError("Please fill in both fields.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    mutation.mutate({ newPassword, confirmPassword });
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(1200px_800px_at_20%_10%,#2a6b47_0%,#0f3a29_35%,#0b2b1f_70%)] flex items-center justify-center p-4 md:p-10">
      <div className="flex w-full max-w-[1270px] h-[750px] rounded-2xl shadow-2xl overflow-visible backdrop-blur relative">
        {/* LEFT: Hero Image */}
        <div className="relative flex-[7] h-full bg-gradient-to-br from-[#2a6b47] via-[#0f3a29] to-[#0b2b1f] flex flex-col justify-center z-10 rounded-l-2xl">
          <div className="absolute inset-0 z-20 pointer-events-none">
            <Image
              src="/new_password_hero.jpg"
              alt="Set New Password Hero"
              fill
              style={{ objectFit: "contain", objectPosition: "left center" }}
            />
          </div>
        </div>

        {/* RIGHT: Force Password Reset Card */}
        <div className="flex-[3.5] flex flex-col justify-center bg-white h-full z-20 relative rounded-r-2xl ml-[-110px] p-0">
          <div className="flex flex-col items-center h-full justify-center p-10">
            <div className="border border-[#a6a6a6] rounded-[2.5rem] w-full max-w-[400px] flex flex-col items-center p-10 relative bg-white/90">
              <div className="flex flex-col items-center gap-2 mb-8">
                <Image
                  src="/img/logo.png"
                  alt="BPI Logo"
                  width={120}
                  height={120}
                  className="rounded-full shadow mb-2"
                />
                <h2 className="mt-2 text-2xl font-semibold text-[#0d3b29]">
                  Create New Password
                </h2>
                <p className="text-sm text-[#0d3b29] text-center">
                  For security reasons, you are required to set a new password before continuing.
                </p>
              </div>

              {success ? (
                <div className="w-full text-center text-green-700 font-medium text-base">
                  Password updated successfully! <br />
                  <span className="text-sm text-[#0d3b29]">
                    Redirecting to your dashboard...
                  </span>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
                  <div className="relative">
                    <span className="absolute left-1.5 top-1/2 -translate-y-1/2 flex items-center justify-center w-7 h-7 rounded-full border border-[#b0b0b0] text-[#b0b0b0] text-xl pointer-events-none">
                      <AiOutlineLock />
                    </span>
                    <input
                      type={showNewPassword ? "text" : "password"}
                      name="newPassword"
                      placeholder="New password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="pl-10 pr-11 rounded-full border border-[#a6a6a6] bg-[#f4f4f4] px-5 py-4 text-[1.1rem] text-[#232323] font-sans font-light focus:border-[#0d3b29] placeholder-[#b0b0b0] outline-none w-full"
                      required
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#b0b0b0] hover:text-[#0d3b29] transition-colors"
                      aria-label={showNewPassword ? "Hide password" : "Show password"}
                    >
                      {showNewPassword ? <AiOutlineEyeInvisible size={20} /> : <AiOutlineEye size={20} />}
                    </button>
                  </div>
                  <div className="relative">
                    <span className="absolute left-1.5 top-1/2 -translate-y-1/2 flex items-center justify-center w-7 h-7 rounded-full border border-[#b0b0b0] text-[#b0b0b0] text-xl pointer-events-none">
                      <AiOutlineLock />
                    </span>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10 pr-11 rounded-full border border-[#a6a6a6] bg-[#f4f4f4] px-5 py-4 text-[1.1rem] text-[#232323] font-sans font-light focus:border-[#0d3b29] placeholder-[#b0b0b0] outline-none w-full"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#b0b0b0] hover:text-[#0d3b29] transition-colors"
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? <AiOutlineEyeInvisible size={20} /> : <AiOutlineEye size={20} />}
                    </button>
                  </div>
                  {error && (
                    <div className="text-red-600 text-xs text-center">{error}</div>
                  )}
                  <button
                    type="submit"
                    disabled={mutation.isPending}
                    className="w-full bg-[#0d3b29] text-white rounded-full h-12 text-lg font-semibold mt-2 hover:bg-[#145c3a] transition disabled:opacity-50"
                  >
                    {mutation.isPending ? "Setting Password..." : "Set New Password"}
                  </button>
                </form>
              )}

              {!success && (
                <button
                  onClick={() =>
                    signOut({ callbackUrl: `${resolveClientBaseUrl()}/login` })
                  }
                  className="mt-6 text-xs text-[#0d3b29] underline-offset-4 hover:underline"
                >
                  Sign out instead
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
