"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Mail, Lock, AlertCircle, Sparkles, Zap } from "lucide-react";
import toast from "react-hot-toast";

// Floating particles component
const FloatingParticles = () => {
  const particles = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    delay: Math.random() * 15,
    duration: 10 + Math.random() * 20,
    size: 2 + Math.random() * 3,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full bg-gradient-to-r from-[hsl(var(--primary))] via-[hsl(var(--secondary))] to-[hsl(var(--primary))] opacity-30"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
          }}
          animate={{
            y: [0, -100 - Math.random() * 200],
            x: [0, (Math.random() - 0.5) * 100],
            opacity: [0, 0.6, 0],
            scale: [0, 1, 0.5],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

export default function AdminLoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/admin");
    }
  }, [status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
        toast.error("Login failed");
      } else {
        toast.success("Login successful");
        router.push("/admin");
      }
    } catch (err) {
      setError("An error occurred during login");
      toast.error("Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center relative overflow-hidden admin-login-sweep">
        <FloatingParticles />
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10"
        >
          <div className="relative">
            <motion.div
              className="absolute inset-0 rounded-full bg-gradient-to-r from-[hsl(var(--primary))] via-[hsl(var(--secondary))] to-[hsl(var(--primary))] opacity-30 blur-3xl"
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <motion.div
              className="relative h-24 w-24 rounded-full border-4 border-[hsl(var(--primary))]/30 border-t-[hsl(var(--primary))]"
              animate={{ rotate: 360 }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "linear",
              }}
            >
              <div className="absolute inset-2 rounded-full border-4 border-[hsl(var(--secondary))]/30 border-t-[hsl(var(--secondary))] animate-spin" style={{ animationDuration: "1.5s", animationDirection: "reverse" }} />
              <div className="absolute inset-4 rounded-full border-4 border-[hsl(var(--primary))]/25 border-t-[hsl(var(--primary))] animate-spin" style={{ animationDuration: "2s" }} />
            </motion.div>
          </div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="mt-6 text-center font-semibold premium-gradient-text text-xl"
          >
            Loading...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="admin-login-sweep relative flex min-h-screen items-center justify-center">

      {/* Floating particles */}
      <FloatingParticles />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.6, -0.05, 0.01, 0.99] }}
        className="relative z-10 w-full max-w-md px-4"
      >
        {/* Logo Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="mb-12 text-center"
        >
          <div className="relative mx-auto mb-8 flex h-28 w-28 items-center justify-center">
            {/* Rotating rings */}
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-[hsl(var(--primary))]/30"
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              className="absolute inset-2 rounded-full border-2 border-[hsl(var(--secondary))]/30"
              animate={{ rotate: -360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              className="absolute inset-4 rounded-full border-2 border-[hsl(var(--primary))]/25"
              animate={{ rotate: 360 }}
              transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            />
            
            {/* Glowing background */}
            <motion.div
              className="absolute inset-0 rounded-full bg-gradient-to-r from-[hsl(var(--primary))] via-[hsl(var(--secondary))] to-[hsl(var(--primary))] opacity-20 blur-2xl"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.2, 0.3, 0.2],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            
            {/* Center icon */}
            <motion.div
              className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[hsl(var(--primary))] via-[hsl(var(--secondary))] to-[hsl(var(--primary))] shadow-2xl"
              whileHover={{ scale: 1.1 }}
              animate={{
                boxShadow: [
                  "0 0 20px hsla(var(--primary), 0.45)",
                  "0 0 40px hsla(var(--secondary), 0.45)",
                  "0 0 20px hsla(var(--primary), 0.45)",
                  "0 0 20px hsla(var(--primary), 0.45)",
                ],
              }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              <ShieldCheck className="h-14 w-14 text-white drop-shadow-2xl" strokeWidth={2.5} />
            </motion.div>
          </div>
          
          <motion.h1
            className="premium-gradient-text text-5xl font-black mb-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            Admin Portal
          </motion.h1>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center justify-center gap-2"
          >
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="h-5 w-5 text-[hsl(var(--secondary))]" />
            </motion.div>
            <p className="text-sm font-semibold bg-gradient-to-r from-gray-600 to-gray-800 dark:from-gray-300 dark:to-gray-100 bg-clip-text text-transparent">
              Next-Generation Security Access
            </p>
            <motion.div
              animate={{ rotate: [360, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              <Zap className="h-5 w-5 text-[hsl(var(--primary))]" />
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Login Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="premium-card rounded-3xl p-8 relative overflow-hidden"
        >
          {/* Holographic overlay */}
          <div className="holographic absolute inset-0 rounded-3xl opacity-30" />
          
          {/* Shimmer effect */}
          <motion.div
            className="absolute inset-0 shimmer-effect opacity-20"
            animate={{ backgroundPosition: ["0% 0%", "100% 0%"] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
          
          <div className="relative z-10">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
              >
                <label className="mb-3 block text-sm font-bold bg-gradient-to-r from-gray-700 to-gray-900 dark:from-gray-200 dark:to-gray-50 bg-clip-text text-transparent">
                  Email Address
                </label>
                <div className="group relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-5 transition-all duration-300 group-focus-within:text-[hsl(var(--primary))]">
                    <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-[hsl(var(--primary))] transition-colors" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="block w-full rounded-2xl border-2 border-gray-200/50 dark:border-gray-700/50 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm py-4 pl-14 pr-4 text-gray-900 dark:text-white placeholder-gray-400 transition-all duration-300 focus:border-[hsl(var(--primary))] focus:outline-none focus:ring-4 focus:ring-[hsl(var(--secondary))]/20 hover:border-gray-300 dark:hover:border-gray-600"
                    placeholder="admin@beepagro.com"
                  />
                  <motion.div
                    className="absolute inset-0 rounded-2xl border-2 border-transparent pointer-events-none"
                    animate={{
                      boxShadow: [
                        "0 0 0 0 hsla(var(--secondary), 0)",
                        "0 0 0 4px hsla(var(--secondary), 0.10)",
                        "0 0 0 0 hsla(var(--secondary), 0)",
                      ],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </div>
              </motion.div>

              {/* Password Field */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
              >
                <label className="mb-3 block text-sm font-bold bg-gradient-to-r from-gray-700 to-gray-900 dark:from-gray-200 dark:to-gray-50 bg-clip-text text-transparent">
                  Password
                </label>
                <div className="group relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-5 transition-all duration-300 group-focus-within:text-[hsl(var(--primary))]">
                    <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-[hsl(var(--primary))] transition-colors" />
                  </div>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="block w-full rounded-2xl border-2 border-gray-200/50 dark:border-gray-700/50 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm py-4 pl-14 pr-4 text-gray-900 dark:text-white placeholder-gray-400 transition-all duration-300 focus:border-[hsl(var(--primary))] focus:outline-none focus:ring-4 focus:ring-[hsl(var(--secondary))]/20 hover:border-gray-300 dark:hover:border-gray-600"
                    placeholder="Enter your secure password"
                  />
                  <motion.div
                    className="absolute inset-0 rounded-2xl border-2 border-transparent pointer-events-none"
                    animate={{
                      boxShadow: [
                        "0 0 0 0 hsla(var(--secondary), 0)",
                        "0 0 0 4px hsla(var(--secondary), 0.10)",
                        "0 0 0 0 hsla(var(--secondary), 0)",
                      ],
                    }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                  />
                </div>
              </motion.div>

              {/* Error Message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -10 }}
                    className="relative overflow-hidden rounded-2xl border-2 border-red-500/50 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-950/50 dark:to-pink-950/50 p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                      </div>
                      <span className="font-semibold text-red-800 dark:text-red-300">{error}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit Button */}
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading}
                className="premium-button group relative w-full overflow-hidden rounded-2xl py-4 font-bold text-white shadow-2xl disabled:cursor-not-allowed disabled:opacity-60 transition-all duration-300"
              >
                <div className="relative flex items-center justify-center gap-3">
                  {isLoading ? (
                    <>
                      <motion.div
                        className="h-5 w-5 rounded-full border-2 border-white border-t-transparent"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-5 w-5" />
                      <span>Access Control Center</span>
                      <motion.div
                        className="absolute right-4"
                        animate={{ x: [0, 5, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        →
                      </motion.div>
                    </>
                  )}
                </div>
              </motion.button>
            </form>

            {/* Security Badge */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="mt-8 text-center"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--primary))]/25 bg-[hsl(var(--primary))]/10 px-4 py-2 backdrop-blur-sm">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <ShieldCheck className="h-4 w-4 text-[hsl(var(--primary))]" />
                </motion.div>
                <span className="text-xs font-semibold text-[hsl(var(--primary))]">
                  256-bit Enterprise Encryption
                </span>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Back Link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
          className="mt-8 text-center"
        >
          <a
            href="/dashboard"
            className="group inline-flex items-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-400 transition-colors hover:text-[hsl(var(--primary))]"
          >
            <motion.span
              className="transition-transform group-hover:-translate-x-1"
            >
              ←
            </motion.span>
            <span>Back to User Dashboard</span>
          </a>
        </motion.div>
      </motion.div>
    </div>
  );
}
