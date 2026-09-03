import { cn } from "@/lib/utils";

export type SparkPoint = { label: string; value: number };

export function bucketDays(days: { day: string; count: number }[], buckets = 48): SparkPoint[] {
  if (days.length === 0) return [];
  if (days.length <= buckets) {
    return days.map((entry) => ({ label: entry.day, value: entry.count }));
  }
  const size = Math.ceil(days.length / buckets);
  const points: SparkPoint[] = [];
  for (let index = 0; index < days.length; index += size) {
    const slice = days.slice(index, index + size);
    points.push({
      label: `${slice[0].day} – ${slice[slice.length - 1].day}`,
      value: slice.reduce((sum, entry) => sum + entry.count, 0),
    });
  }
  return points;
}

export function Sparkline({
  points,
  height = 48,
  className,
}: {
  points: SparkPoint[];
  height?: number;
  className?: string;
}) {
  if (points.length === 0) return null;
  const max = Math.max(...points.map((point) => point.value), 1);
  const width = points.length * 4;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={`Activity across ${points.length} periods, peak ${max}`}
      className={cn("w-full", className)}
      style={{ height }}
    >
      {points.map((point, index) => {
        const barHeight = point.value === 0 ? 0 : Math.max(1, (point.value / max) * height);
        return (
          <rect
            key={index}
            x={index * 4}
            y={height - barHeight}
            width={3}
            height={barHeight}
            rx={0.5}
            fill="var(--color-brand)"
            opacity={point.value === 0 ? 0.2 : 0.9}
          >
            <title>{`${point.label}: ${point.value}`}</title>
          </rect>
        );
      })}
    </svg>
  );
}
