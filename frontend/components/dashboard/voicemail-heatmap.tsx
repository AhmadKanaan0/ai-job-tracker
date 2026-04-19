"use client";

import { MoreHorizontal } from "lucide-react";

const days = ["Sat", "Mon", "Tue", "Wed", "Thu", "Fri"];
const legends = [
  { label: "<100", color: "bg-muted" },
  { label: "<500", color: "bg-secondary/40" },
  { label: "<700", color: "bg-secondary/70" },
  { label: ">900", color: "bg-secondary" },
];

// Generate random heatmap data
const generateHeatmapData = () => {
  const data: number[][] = [];
  for (let i = 0; i < 6; i++) {
    const row: number[] = [];
    for (let j = 0; j < 6; j++) {
      row.push(Math.floor(Math.random() * 4));
    }
    data.push(row);
  }
  return data;
};

const heatmapData = generateHeatmapData();

const getColor = (value: number) => {
  switch (value) {
    case 0:
      return "bg-muted";
    case 1:
      return "bg-secondary/40";
    case 2:
      return "bg-secondary/70";
    case 3:
      return "bg-secondary";
    default:
      return "bg-muted";
  }
};

export function VoicemailHeatmap() {
  return (
    <div className="rounded-2xl bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-card-foreground">
          Avg Voicemail By Day
        </h3>
        <button className="text-muted-foreground hover:text-foreground">
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        {legends.map((legend) => (
          <div key={legend.label} className="flex items-center gap-2">
            <div className={`h-3 w-3 rounded ${legend.color}`} />
            <span className="text-xs text-muted-foreground">{legend.label}</span>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <div className="grid grid-cols-6 gap-1.5">
          {heatmapData.map((row, rowIndex) =>
            row.map((value, colIndex) => (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={`h-7 w-7 rounded-md ${getColor(value)}`}
              />
            ))
          )}
        </div>
      </div>

      <div className="mt-3 flex justify-between px-1">
        {days.map((day) => (
          <span key={day} className="text-xs text-muted-foreground">
            {day}
          </span>
        ))}
      </div>
    </div>
  );
}
