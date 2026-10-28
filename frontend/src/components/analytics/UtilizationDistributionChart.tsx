import React from 'react';
import { EquipmentUtilizationDetail } from '@/types/analytics';

interface UtilizationDistributionChartProps {
  overallPercentage: number | null;
  totalCapacityHours: number;
  totalBookedHours: number;
  details?: EquipmentUtilizationDetail[];
}

export const UtilizationDistributionChart: React.FC<UtilizationDistributionChartProps> = ({
  overallPercentage,
  totalCapacityHours,
  totalBookedHours,
  details = [],
}) => {
  const brackets = [
    { label: '0-25%', count: 0, color: 'bg-zinc-500' },
    { label: '25-50%', count: 0, color: 'bg-blue-500' },
    { label: '50-75%', count: 0, color: 'bg-amber-500' },
    { label: '75-100%', count: 0, color: 'bg-accent-lime' },
  ];

  details.forEach((d) => {
    if (d.utilizationPercentage <= 25) brackets[0].count++;
    else if (d.utilizationPercentage <= 50) brackets[1].count++;
    else if (d.utilizationPercentage <= 75) brackets[2].count++;
    else brackets[3].count++;
  });

  const topUtilized = [...details]
    .sort((a, b) => b.utilizationPercentage - a.utilizationPercentage)
    .slice(0, 4);

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-subtle text-card-foreground">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-foreground">Equipment Utilization</h3>
          <p className="text-xs text-muted-foreground">Operating capacity vs booked session hours</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold font-mono text-foreground">
            {overallPercentage != null ? `${overallPercentage.toFixed(1)}%` : 'N/A'}
          </span>
          <span className="text-xs text-muted-foreground">Overall</span>
        </div>
      </div>

      {/* Capacity & Booked Stats */}
      <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-muted/40 border border-border/60 text-xs">
        <div>
          <span className="text-muted-foreground block text-[11px]">Total Available Capacity</span>
          <strong className="text-foreground font-mono text-sm">
            {totalCapacityHours.toFixed(0)} hrs
          </strong>
        </div>
        <div>
          <span className="text-muted-foreground block text-[11px]">Total Confirmed Bookings</span>
          <strong className="text-accent-lime font-mono text-sm">
            {totalBookedHours.toFixed(1)} hrs
          </strong>
        </div>
      </div>

      {/* Utilization Distribution Buckets */}
      {details.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Utilization Cohorts</span>
            <span>{details.length} Instruments</span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {brackets.map((b) => (
              <div key={b.label} className="p-2.5 rounded-lg border border-border/80 bg-background/50 text-center">
                <span className="text-[10px] text-muted-foreground font-medium block">{b.label}</span>
                <span className="text-base font-bold font-mono text-foreground">{b.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Utilized Instruments Mini Bars */}
      {topUtilized.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-border/60">
          <span className="text-xs font-semibold text-muted-foreground block">
            Most Heavily Utilized Instruments
          </span>
          <div className="space-y-2 text-xs">
            {topUtilized.map((item) => (
              <div key={item.equipmentId} className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-medium text-foreground truncate max-w-[200px]">
                    {item.equipmentName}
                  </span>
                  <span className="font-mono text-muted-foreground">
                    {item.utilizationPercentage.toFixed(1)}% ({item.bookedHours.toFixed(1)}h)
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-accent-lime rounded-full"
                    style={{ width: `${Math.min(100, item.utilizationPercentage)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
