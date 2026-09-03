import { cn } from "@/lib/utils";

function formatCount(value: number): string {
  return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function AreaChart({
  points,
  height = 180,
  className,
}: {
  points: Array<{ label: string; value: number }>;
  height?: number;
  className?: string;
}) {
  const width = 1000;
  if (points.length === 0) return <p className="text-sm text-faint">No data.</p>;

  const max = points.reduce((peak, point) => Math.max(peak, point.value), 1);
  const step = points.length > 1 ? width / (points.length - 1) : width;
  const y = (value: number) => height - (value / max) * (height - 4) - 2;
  const path = points.map((point, index) => `${(index * step).toFixed(2)},${y(point.value).toFixed(2)}`).join(" L ");

  const ticks: Array<{ x: number; label: string }> = [];
  let previousYear = "";
  points.forEach((point, index) => {
    const year = point.label.slice(0, 4);
    if (year !== previousYear) {
      ticks.push({ x: index * step, label: year });
      previousYear = year;
    }
  });

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="h-44 w-full" role="img">
        {[0.25, 0.5, 0.75].map((fraction) => (
          <line
            key={fraction}
            x1={0}
            x2={width}
            y1={height * fraction}
            y2={height * fraction}
            stroke="var(--color-divider)"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
        ))}
        {ticks.map((tick) => (
          <line
            key={tick.label}
            x1={tick.x}
            x2={tick.x}
            y1={0}
            y2={height}
            stroke="var(--color-divider)"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
        ))}
        <path d={`M 0,${height} L ${path} L ${width},${height} Z`} fill="var(--color-brand)" fillOpacity={0.25} />
        <path
          d={`M ${path}`}
          fill="none"
          stroke="var(--color-brand)"
          strokeWidth={1.5}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="flex justify-between text-[11px] text-faint">
        <span>{points[0].label}</span>
        <span>peak {formatCount(max)}</span>
        <span>{points[points.length - 1].label}</span>
      </div>
    </div>
  );
}

export function BarChart({
  points,
  height = 160,
  className,
}: {
  points: Array<{ label: string; value: number }>;
  height?: number;
  className?: string;
}) {
  if (points.length === 0) return <p className="text-sm text-faint">No data.</p>;

  const max = points.reduce((peak, point) => Math.max(peak, point.value), 1);
  const width = 1000;
  const slot = width / points.length;
  const gap = Math.min(Math.max(slot * 0.25, 1), 24);
  const barWidth = Math.max(slot - gap, 1);

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="h-40 w-full" role="img">
        {points.map((point, index) => {
          const barHeight = Math.max((point.value / max) * (height - 2), point.value > 0 ? 1 : 0);
          return (
            <rect
              key={point.label}
              x={index * slot + gap / 2}
              y={height - barHeight}
              width={barWidth}
              height={barHeight}
              fill="var(--color-brand)"
              rx={1}
            >
              <title>{`${point.label}: ${formatCount(point.value)}`}</title>
            </rect>
          );
        })}
      </svg>
      <div className="flex justify-between text-[11px] text-faint">
        <span>{points[0].label}</span>
        <span>peak {formatCount(max)}</span>
        <span>{points[points.length - 1].label}</span>
      </div>
    </div>
  );
}

export function BarList({
  items,
  className,
}: {
  items: Array<{ key: string; label: React.ReactNode; value: number; hint?: React.ReactNode }>;
  className?: string;
}) {
  if (items.length === 0) return <p className="text-sm text-faint">No data.</p>;
  const max = items.reduce((peak, item) => Math.max(peak, item.value), 1);

  return (
    <ul className={cn("flex flex-col", className)}>
      {items.map((item) => (
        <li key={item.key} className="relative border-b border-divider/60 last:border-0">
          <span
            aria-hidden
            className="absolute inset-y-0 left-0 rounded-r bg-brand/20"
            style={{ width: `${(item.value / max) * 100}%` }}
          />
          <span className="relative flex items-center gap-3 px-3 py-1.5 text-sm">
            <span className="min-w-0 flex-1 truncate text-normal">{item.label}</span>
            {item.hint ? <span className="shrink-0 text-xs text-faint">{item.hint}</span> : null}
            <span className="shrink-0 font-mono text-[12px] text-subhead">{formatCount(item.value)}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
