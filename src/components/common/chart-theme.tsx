import React from "react";
import type { TooltipProps } from "recharts";

export const CHART_COLORS = [
  "#38BDF8", // Sky blue
  "#818CF8", // Indigo
  "#34D399", // Emerald
  "#F472B6", // Pink
  "#FBBF24", // Amber
  "#A78BFA", // Purple
  "#FB7185", // Rose
  "#2DD4BF", // Teal
];

export const CHART_TOOLTIP_STYLE: React.CSSProperties = {
  backgroundColor: "#111827",
  borderColor: "#334155",
  borderWidth: "1px",
  borderStyle: "solid",
  borderRadius: "8px",
  color: "#F8FAFC",
  fontSize: "12px",
  padding: "8px 12px",
  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.6)",
};

export const CHART_ITEM_STYLE: React.CSSProperties = {
  color: "#FFFFFF",
  fontSize: "12px",
  fontWeight: 500,
};

export const CHART_LABEL_STYLE: React.CSSProperties = {
  color: "#CBD5E1",
  fontSize: "12px",
  fontWeight: 600,
  marginBottom: "4px",
};

export const CHART_AXIS_PROPS = {
  stroke: "#64748B",
  tick: { fill: "#CBD5E1", fontSize: 12 },
  tickLine: false,
  axisLine: false,
};

export const CHART_GRID_PROPS = {
  stroke: "#1E293B",
  strokeDasharray: "3 3",
};

export const CHART_LEGEND_PROPS = {
  wrapperStyle: {
    color: "#E2E8F0",
    fontSize: "12px",
    paddingTop: "8px",
  },
};

/**
 * Custom dark-mode tooltip that ensures zero text clipping or black-text inheritance.
 */
export function CustomChartTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  return (
    <div
      style={{
        backgroundColor: "#111827",
        borderColor: "#334155",
        borderWidth: "1px",
        borderStyle: "solid",
        borderRadius: "8px",
        padding: "8px 12px",
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.6)",
        color: "#F8FAFC",
        fontSize: "12px",
        minWidth: "130px",
        zIndex: 50,
      }}
    >
      {label && (
        <div
          style={{
            color: "#CBD5E1",
            fontWeight: 600,
            marginBottom: "6px",
            borderBottom: "1px solid #1E293B",
            paddingBottom: "4px",
          }}
        >
          {label}
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        {payload.map((item, index) => {
          const color = item.color || item.payload?.fill || "#38BDF8";
          return (
            <div
              key={`tooltip-item-${index}`}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: "6px", color: "#CBD5E1" }}>
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "2px",
                    backgroundColor: color,
                    display: "inline-block",
                  }}
                />
                {item.name || item.dataKey}
              </span>
              <span style={{ color: "#FFFFFF", fontWeight: 600, fontFamily: "monospace" }}>
                {typeof item.value === "number" ? item.value.toLocaleString() : item.value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
