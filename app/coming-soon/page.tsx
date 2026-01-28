import { Metadata } from "next";
import { Sparkles, ArrowLeft } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Coming Soon | BPI",
  description: "This feature is coming soon to BPI platform",
};

export default function ComingSoonPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-green-950/30 dark:via-green-900/20 dark:to-emerald-950/30 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white dark:bg-green-900/30 backdrop-blur-sm rounded-3xl shadow-2xl dark:shadow-none border border-gray-200 dark:border-green-700/50 p-8 md:p-12 text-center">
          {/* Animated Icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-br from-bpi-primary to-emerald-600 rounded-full flex items-center justify-center animate-pulse">
                <Sparkles className="w-12 h-12 text-white" />
              </div>
              <div className="absolute inset-0 w-24 h-24 bg-gradient-to-br from-bpi-primary to-emerald-600 rounded-full blur-xl opacity-50 animate-pulse"></div>
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Coming Soon
          </h1>

          {/* Description */}
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-md mx-auto">
            We&apos;re working hard to bring you something amazing. This feature will be available soon!
          </p>

          {/* Features Preview */}
          <div className="bg-gradient-to-r from-bpi-primary/10 to-emerald-600/10 dark:from-bpi-primary/20 dark:to-emerald-600/20 rounded-2xl p-6 mb-8">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Stay tuned for:
            </p>
            <ul className="space-y-2 text-gray-600 dark:text-gray-400 text-sm">
              <li className="flex items-center justify-center gap-2">
                <span className="w-1.5 h-1.5 bg-bpi-primary rounded-full"></span>
                Exciting new features
              </li>
              <li className="flex items-center justify-center gap-2">
                <span className="w-1.5 h-1.5 bg-bpi-primary rounded-full"></span>
                Enhanced user experience
              </li>
              <li className="flex items-center justify-center gap-2">
                <span className="w-1.5 h-1.5 bg-bpi-primary rounded-full"></span>
                More ways to grow with BPI
              </li>
            </ul>
          </div>

          {/* Back Button */}
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-bpi-primary to-emerald-600 text-white px-6 py-3 rounded-lg font-medium hover:from-bpi-primary/90 hover:to-emerald-600/90 transition-all shadow-lg hover:shadow-xl"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>

          {/* Optional: Newsletter signup or notification request */}
          <p className="mt-8 text-xs text-gray-500 dark:text-gray-400">
            Want to be notified when this feature launches? Contact support for updates.
          </p>
        </div>
      </div>
    </div>
  );
}
