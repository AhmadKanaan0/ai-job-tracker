"use client"

import { AreaChart, Area, ResponsiveContainer } from "recharts"

interface KPICardProps {
  title: string
  value: string | number
  change?: string
  color: string
  data: number[]
}

function KPICard({ title, value, change, color, data }: KPICardProps) {
  const chartData = data.map((v, i) => ({ value: v, index: i }))
  
  return (
    <div 
      className="glass-card rounded-2xl p-5 relative overflow-hidden"
      style={{ boxShadow: `0 0 30px ${color}15` }}
    >
      <div className="relative z-10">
        <p className="text-sm text-muted-foreground mb-1">{title}</p>
        <p className="text-3xl font-bold font-mono" style={{ color }}>{value}</p>
        {change && (
          <p className="text-xs text-muted-foreground mt-1">{change}</p>
        )}
      </div>
      
      <div className="absolute right-0 bottom-0 w-24 h-16 opacity-50">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id={`gradient-${title}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.4} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke={color}
              strokeWidth={2}
              fill={`url(#gradient-${title})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

interface KPICardsProps {
  totalApplications?: number
  activeInterviews?: number
  matchScoreAvg?: number
  profileStrength?: number
}

export function KPICards({ 
  totalApplications = 0, 
  activeInterviews = 0, 
  matchScoreAvg = 0, 
  profileStrength = 0 
}: KPICardsProps) {
  const cards: KPICardProps[] = [
    {
      title: "Total Applications",
      value: totalApplications,
      change: totalApplications > 0 ? `${totalApplications} tracked` : "Start applying!",
      color: "#00D4FF",
      data: [0, Math.floor(totalApplications * 0.3), Math.floor(totalApplications * 0.5), Math.floor(totalApplications * 0.7), totalApplications]
    },
    {
      title: "Active Interviews",
      value: activeInterviews,
      change: activeInterviews > 0 ? `${activeInterviews} in pipeline` : "None yet",
      color: "#A020F0",
      data: [0, Math.floor(activeInterviews * 0.4), Math.floor(activeInterviews * 0.6), activeInterviews]
    },
    {
      title: "Match Score Avg",
      value: matchScoreAvg > 0 ? `${matchScoreAvg}%` : "—",
      change: matchScoreAvg >= 80 ? "Excellent" : matchScoreAvg >= 60 ? "Good" : matchScoreAvg > 0 ? "Needs work" : "Analyze jobs to get scores",
      color: "#DFFF00",
      data: [0, Math.floor(matchScoreAvg * 0.5), Math.floor(matchScoreAvg * 0.8), matchScoreAvg]
    },
    {
      title: "Profile Strength",
      value: `${profileStrength}%`,
      change: profileStrength >= 80 ? "Excellent" : profileStrength >= 60 ? "Good" : "Complete your profile",
      color: "#FFD700",
      data: [0, Math.floor(profileStrength * 0.4), Math.floor(profileStrength * 0.7), profileStrength]
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(card => (
        <KPICard key={card.title} {...card} />
      ))}
    </div>
  )
}
