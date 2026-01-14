"use client";

interface LoadingScreenProps {
  message?: string;
  subtitle?: string;
}

export default function LoadingScreen({ 
  message = "Loading Your Dashboard",
  subtitle = "Fetching your personalized data..."
}: LoadingScreenProps) {
  return (
    <div className="min-h-screen bg-bpi-gradient-light dark:bg-bpi-gradient-dark flex items-center justify-center">
      <div className="text-center">
        {/* Animated Logo/Spinner */}
        <div className="relative w-24 h-24 mx-auto mb-6">
          <div className="absolute inset-0 bg-gradient-to-r from-bpi-primary to-bpi-secondary rounded-full animate-pulse"></div>
          <div className="absolute inset-2 bg-white dark:bg-bpi-dark-card rounded-full flex items-center justify-center">
            <span className="text-2xl font-bold bg-gradient-to-r from-bpi-primary to-bpi-secondary bg-clip-text text-transparent">BPI</span>
          </div>
        </div>
        
        {/* Loading Text */}
        <h2 className="text-xl font-semibold text-foreground mb-2">{message}</h2>
        <p className="text-sm text-muted-foreground mb-6">{subtitle}</p>
        
        {/* Shimmer Progress Bar */}
        <div className="w-64 h-2 bg-gray-200 dark:bg-bpi-dark-accent rounded-full overflow-hidden mx-auto">
          <div className="h-full bg-gradient-to-r from-bpi-primary via-bpi-secondary to-bpi-primary bg-[length:200%_100%] animate-[shimmer_2s_infinite]" 
               style={{ animationTimingFunction: 'linear' }}></div>
        </div>
      </div>
      
      {/* Add shimmer animation to globals.css if not already present */}
      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
}
