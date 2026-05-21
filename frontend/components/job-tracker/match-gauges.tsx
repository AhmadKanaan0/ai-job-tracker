"use client"

import React from "react"

interface MatchGaugeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  isAnalyzing?: boolean;
}

export function MatchScoreGauge({ score, size = "md", isAnalyzing = false }: MatchGaugeProps) {
  const radius = size === "lg" ? 50 : size === "sm" ? 36 : 40;
  const dimension = size === "lg" ? 120 : size === "sm" ? 80 : 90;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const getColor = () => {
    if (score >= 80) return "var(--primary)"; // Neon tracking colors
    if (score >= 60) return "#00D4FF"; // Cyan
    return "#ff4444"; // Red
  };

  const getLabel = () => {
    if (score >= 80) return "EXCELLENT MATCH";
    if (score >= 60) return "GOOD MATCH";
    return "LOW MATCH";
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: dimension, height: dimension }}>
        <svg className="w-full h-full -rotate-90 drop-shadow-[0_0_10px_rgba(223,255,0,0.2)]">
          <circle
            cx={dimension / 2}
            cy={dimension / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-muted/30"
          />
          <circle
            cx={dimension / 2}
            cy={dimension / 2}
            r={radius}
            stroke={getColor()}
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out drop-shadow-md"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          {isAnalyzing ? (
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-bold text-primary animate-pulse">SCANNING</span>
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mt-1" />
            </div>
          ) : (
            <span 
              className={`font-bold font-mono ${size === "lg" ? "text-3xl" : size === "sm" ? "text-xl" : "text-2xl"}`}
              style={{ color: "var(--foreground)" }}
            >
              {score}<span className="text-sm text-muted-foreground">%</span>
            </span>
          )}
        </div>
      </div>
      <span 
        className={`font-semibold mt-3 tracking-wider ${size === "lg" ? "text-sm" : "text-xs"}`}
        style={{ color: isAnalyzing ? "var(--primary)" : getColor() }}
      >
        {isAnalyzing ? "ANALYSING FIT..." : getLabel()}
      </span>
    </div>
  );
}

export function MiniMatchGauge({ score }: { score: number }) {
  const getColor = () => {
    if (score >= 80) return "var(--primary)";
    if (score >= 60) return "#00D4FF";
    return "#ff4444";
  };

  return (
    <div className="flex items-center gap-2">
      <div 
        className="w-8 h-8 rounded-full border-2 flex items-center justify-center shadow-sm" 
        style={{ borderColor: getColor(), color: getColor() }}
      >
        <span className="text-[10px] font-bold">{score}</span>
      </div>
    </div>
  );
}
