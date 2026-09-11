import React from 'react';
import { LAST_FIVE_MATCHES, pgWonLabel, rankLabel, type ProgressPoint } from './leaderboardChart';

const W = 320;
const H = 160;
const PAD_X = 40;
const PAD_Y = 28;

const xAt = (index: number, count: number) => (count <= 1 ? W / 2 : PAD_X + (index / (count - 1)) * (W - 2 * PAD_X));

const yAt = (value: number, lo: number, hi: number, inverted: boolean) => {
  const range = hi - lo;
  if (range === 0) return H / 2;
  const t = (value - lo) / range;
  return PAD_Y + (inverted ? t : 1 - t) * (H - 2 * PAD_Y);
};

const lineFor = (xs: number[], ys: number[]) =>
  xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(' ');

export const LeaderboardChart: React.FC<{ points: ProgressPoint[]; className?: string }> = ({ points, className }) => {
  const shown = points.slice(-LAST_FIVE_MATCHES);
  if (shown.length === 0) {
    return (
      <div className={`flex items-center justify-center py-8 text-sm text-fg/70 ${className ?? ''}`}>
        No matches yet
      </div>
    );
  }

  const n = shown.length;
  const xs = shown.map((_, i) => xAt(i, n));
  const pgYs = shown.map((p) => yAt(p.pgWonPct, 0, 100, false));
  const rankHi = Math.max(1, ...shown.map((p) => p.rank));
  const rankYs = shown.map((p) => yAt(p.rank, 1, rankHi, true));
  const drawLine = n >= 2;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={`w-full overflow-visible ${className ?? ''}`}
      role="img"
      aria-label="Last five matches, P/G won percent and rank"
    >
      {drawLine && (
        <path
          data-series="pg"
          d={lineFor(xs, pgYs)}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
          className="text-clay"
        />
      )}
      {drawLine && (
        <path
          data-series="rank"
          d={lineFor(xs, rankYs)}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
          className="text-fg"
        />
      )}
      {shown.map((point, i) => {
        const edge = i === 0 || i === n - 1;
        const anchor = n === 1 ? 'middle' : i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle';
        const hideMid = edge ? '' : ' max-[360px]:hidden';
        return (
          <g key={i}>
            <circle data-series="pg" data-index={i} cx={xs[i]} cy={pgYs[i]} r="3" className="fill-clay" />
            <circle data-series="rank" data-index={i} cx={xs[i]} cy={rankYs[i]} r="3" className="fill-fg" />
            <text
              data-series="pg"
              data-index={i}
              data-edge={edge ? 'true' : 'false'}
              x={xs[i]}
              y={pgYs[i] - 8}
              textAnchor={anchor}
              className={`fill-clay text-xs${hideMid}`}
            >
              {pgWonLabel(point.pgWonPct)}
            </text>
            <text
              data-series="rank"
              data-index={i}
              data-edge={edge ? 'true' : 'false'}
              x={xs[i]}
              y={rankYs[i] + 16}
              textAnchor={anchor}
              className={`fill-fg text-xs${hideMid}`}
            >
              {rankLabel(point.rank)}
            </text>
          </g>
        );
      })}
    </svg>
  );
};
