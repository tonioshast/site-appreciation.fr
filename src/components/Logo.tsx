import React from "react";

interface LogoProps {
  className?: string;
  showSubtitle?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
}

export default function Logo({ className = "", showSubtitle = true, size = "md" }: LogoProps) {
  // Size mapping
  const sizeClasses = {
    sm: {
      container: "py-1",
      text: "text-xl",
      subText: "text-[7px]",
      starSize: "w-3 h-3",
      padding: "px-2",
    },
    md: {
      container: "py-2",
      text: "text-3xl md:text-4xl",
      subText: "text-[10px] md:text-[11px]",
      starSize: "w-4 h-4",
      padding: "px-4",
    },
    lg: {
      container: "py-4",
      text: "text-5xl md:text-6xl",
      subText: "text-[13px] md:text-[14px]",
      starSize: "w-6 h-6",
      padding: "px-6",
    },
    xl: {
      container: "py-8",
      text: "text-6xl md:text-7xl",
      subText: "text-xs md:text-sm",
      starSize: "w-8 h-8",
      padding: "px-8",
    }
  };

  const currentSize = sizeClasses[size];

  return (
    <div className={`flex flex-col items-center justify-center select-none ${className} ${currentSize.container}`}>
      {/* Upper Logo with Shooting Star & Glow */}
      <div className="relative inline-block">
        {/* Sweeping star orbital arc */}
        <svg
          className="absolute -top-1 -left-2 w-[110%] h-[120%] pointer-events-none overflow-visible"
          viewBox="0 0 120 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Neon blue and golden sweeping arc */}
          <path
            d="M 5,28 C 15,10 45,5 74,15 C 80,17 84,21 86,25"
            stroke="url(#arcGradient)"
            strokeWidth="0.8"
            strokeLinecap="round"
            className="animate-pulse"
          />
          
          {/* Sparkle star at the left end of the arc */}
          <g transform="translate(4, 28) scale(0.6)">
            <path
              d="M 0,-5 L 1,-1 L 5,0 L 1,1 L 0,5 L -1,1 L -5,0 L -1,-1 Z"
              fill="#fbbf24"
              className="animate-spin"
              style={{ animationDuration: "8s" }}
            />
          </g>
          
          <defs>
            <linearGradient id="arcGradient" x1="0%" y1="50%" x2="100%" y2="50%">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.8" />
              <stop offset="60%" stopColor="#eab308" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>

        {/* Logo Text */}
        <h1 className={`font-display font-semibold tracking-tight text-slate-100 ${currentSize.text} relative z-10`}>
          apprec
          <span className="relative inline-block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 font-bold px-1 filter drop-shadow-[0_0_12px_rgba(34,211,238,0.4)]">
            IA
          </span>
          tion
        </h1>

        {/* Ambient background glow beneath text */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-12 bg-blue-500/10 blur-2xl rounded-full -z-10" />
      </div>

      {/* Subtitle Underneath */}
      {showSubtitle && (
        <div className="mt-2 tracking-widest text-slate-400 uppercase font-sans font-light text-center">
          <p className={`${currentSize.subText} px-2 border-t border-slate-800/60 pt-2`}>
            Logiciel de synthèse d'appréciations pour enseignants
          </p>
        </div>
      )}
    </div>
  );
}
