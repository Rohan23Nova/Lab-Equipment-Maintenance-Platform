import React from 'react';
import { IncidentTrendPoint } from '@/types/analytics';

interface IncidentTrendChartProps {
  data: IncidentTrendPoint[];
}

export const IncidentTrendChart: React.FC<IncidentTrendChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center border border-dashed border-border rounded-xl text-muted-foreground text-xs">
        <p>No incident activity recorded in selected timeframe.</p>
      </div>
    );
  }

  const maxVal = Math.max(
    5,
    ...data.map((d) => Math.max(d.reportedFaults, d.completedRepairs))
  );

  const chartHeight = 180;
  const chartWidth = 500;
  const paddingX = 40;
  const paddingY = 20;

  const innerWidth = chartWidth - paddingX * 2;
  const innerHeight = chartHeight - paddingY * 2;

  const getX = (index: number) => {
    if (data.length <= 1) return paddingX + innerWidth / 2;
    return paddingX + (index / (data.length - 1)) * innerWidth;
  };

  const getY = (val: number) => {
    return paddingY + innerHeight - (val / maxVal) * innerHeight;
  };

  const faultsPath = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.reportedFaults)}`)
    .join(' ');

  const repairsPath = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.completedRepairs)}`)
    .join(' ');

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-subtle text-card-foreground">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-foreground">Incident & Maintenance Trends</h3>
          <p className="text-xs text-muted-foreground">Daily reported defects vs completed repairs</p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-muted-foreground">Faults Reported</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-accent-lime" />
            <span className="text-muted-foreground">Repairs Completed</span>
          </div>
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-48 sm:h-56 min-w-[380px]"
        >
          {/* Grid lines */}
          <line
            x1={paddingX}
            y1={paddingY}
            x2={chartWidth - paddingX}
            y2={paddingY}
            stroke="currentColor"
            strokeOpacity="0.1"
            strokeDasharray="4 4"
          />
          <line
            x1={paddingX}
            y1={paddingY + innerHeight / 2}
            x2={chartWidth - paddingX}
            y2={paddingY + innerHeight / 2}
            stroke="currentColor"
            strokeOpacity="0.1"
            strokeDasharray="4 4"
          />
          <line
            x1={paddingX}
            y1={chartHeight - paddingY}
            x2={chartWidth - paddingX}
            y2={chartHeight - paddingY}
            stroke="currentColor"
            strokeOpacity="0.2"
          />

          {/* Y-axis labels */}
          <text
            x={paddingX - 8}
            y={paddingY + 4}
            textAnchor="end"
            className="fill-muted-foreground text-[10px] font-mono"
          >
            {maxVal}
          </text>
          <text
            x={paddingX - 8}
            y={paddingY + innerHeight / 2 + 4}
            textAnchor="end"
            className="fill-muted-foreground text-[10px] font-mono"
          >
            {Math.round(maxVal / 2)}
          </text>
          <text
            x={paddingX - 8}
            y={chartHeight - paddingY}
            textAnchor="end"
            className="fill-muted-foreground text-[10px] font-mono"
          >
            0
          </text>

          {/* Lines */}
          <path
            d={faultsPath}
            fill="none"
            stroke="#f59e0b"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={repairsPath}
            fill="none"
            stroke="#a3e635"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data Points */}
          {data.map((d, i) => (
            <g key={d.date}>
              <circle
                cx={getX(i)}
                cy={getY(d.reportedFaults)}
                r="3"
                className="fill-amber-500 hover:r-4 transition-all"
              >
                <title>{`${d.date}: ${d.reportedFaults} faults (${d.criticalFaults} critical)`}</title>
              </circle>
              <circle
                cx={getX(i)}
                cy={getY(d.completedRepairs)}
                r="3"
                className="fill-accent-lime hover:r-4 transition-all"
              >
                <title>{`${d.date}: ${d.completedRepairs} repairs completed`}</title>
              </circle>
            </g>
          ))}

          {/* X-axis labels (first, middle, last) */}
          {data.length > 0 && (
            <>
              <text
                x={getX(0)}
                y={chartHeight - 4}
                textAnchor="start"
                className="fill-muted-foreground text-[10px] font-mono"
              >
                {data[0].date.substring(5)}
              </text>
              {data.length > 2 && (
                <text
                  x={getX(Math.floor(data.length / 2))}
                  y={chartHeight - 4}
                  textAnchor="middle"
                  className="fill-muted-foreground text-[10px] font-mono"
                >
                  {data[Math.floor(data.length / 2)].date.substring(5)}
                </text>
              )}
              <text
                x={getX(data.length - 1)}
                y={chartHeight - 4}
                textAnchor="end"
                className="fill-muted-foreground text-[10px] font-mono"
              >
                {data[data.length - 1].date.substring(5)}
              </text>
            </>
          )}
        </svg>
      </div>
    </div>
  );
};
