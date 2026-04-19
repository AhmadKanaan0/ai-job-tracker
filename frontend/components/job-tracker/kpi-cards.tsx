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

export function KPICards() {
  const cards: KPICardProps[] = [
    {
      title: "Total Applications",
      value: 47,
      change: "+12 this week",
      color: "#00D4FF",
      data: [20, 25, 22, 30, 35, 32, 47]
    },
    {
      title: "Active Interviews",
      value: 8,
      change: "3 scheduled",
      color: "#A020F0",
      data: [2, 4, 3, 5, 6, 5, 8]
    },
    {
      title: "Match Score Avg",
      value: "87%",
      change: "+5% vs last month",
      color: "#DFFF00",
      data: [75, 78, 82, 80, 85, 84, 87]
    },
    {
      title: "Profile Strength",
      value: "92%",
      change: "Excellent",
      color: "#FFD700",
      data: [70, 75, 80, 85, 88, 90, 92]
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
