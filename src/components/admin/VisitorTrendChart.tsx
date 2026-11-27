import React, { useMemo, useState } from 'react';
import { RefreshCw, TrendingUp } from 'lucide-react';
import { VisitorDailyPoint } from '../../appwrite/analyticsApi';

interface VisitorTrendChartProps {
  series: VisitorDailyPoint[];
  daysWindow: 7 | 30;
  onDaysWindowChange: (days: 7 | 30) => void;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

function formatShortDate(dateKey: string): string {
  const parts = dateKey.split('-');
  if (parts.length !== 3) return dateKey;
  const dt = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  return dt.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

export const VisitorTrendChart: React.FC<VisitorTrendChartProps> = ({
  series,
  daysWindow,
  onDaysWindowChange,
  loading,
  error,
  onRetry,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const visibleSeries = useMemo(() => {
    if (!Array.isArray(series) || series.length === 0) return [];
    return series.slice(-daysWindow);
  }, [series, daysWindow]);

  const hasData = visibleSeries.some((d) => d.pageViews > 0 || d.uniqueVisitors > 0);

  const maxVal = useMemo(() => {
    let m = 4;
    for (const pt of visibleSeries) {
      m = Math.max(m, pt.pageViews, pt.uniqueVisitors);
    }
    // Round up cleanly to multiple of 4 for clean horizontal grid steps
    return Math.ceil(m / 4) * 4;
  }, [visibleSeries]);

  // SVG coordinate system
  const svgW = 720;
  const svgH = 240;
  const padL = 36;
  const padR = 16;
  const padT = 18;
  const padB = 28;
  const chartW = svgW - padL - padR;
  const chartH = svgH - padT - padB;

  const points = useMemo(() => {
    const n = visibleSeries.length;
    if (n === 0) return [];
    return visibleSeries.map((pt, idx) => {
      const x = n === 1 ? padL + chartW / 2 : padL + (idx / (n - 1)) * chartW;
      const yViews = padT + chartH - (pt.pageViews / maxVal) * chartH;
      const yUnique = padT + chartH - (pt.uniqueVisitors / maxVal) * chartH;
      return { ...pt, idx, x, yViews, yUnique };
    });
  }, [visibleSeries, maxVal, chartW, chartH]);

  const viewsPolyline = points.map((p) => `${p.x.toFixed(1)},${p.yViews.toFixed(1)}`).join(' ');
  const uniquePolyline = points.map((p) => `${p.x.toFixed(1)},${p.yUnique.toFixed(1)}`).join(' ');
  const viewsAreaPath =
    points.length > 0
      ? `M ${points[0].x.toFixed(1)},${(padT + chartH).toFixed(1)} ` +
        points.map((p) => `L ${p.x.toFixed(1)},${p.yViews.toFixed(1)}`).join(' ') +
        ` L ${points[points.length - 1].x.toFixed(1)},${(padT + chartH).toFixed(1)} Z`
      : '';

  const activePoint =
    hoveredIdx !== null && points[hoveredIdx]
      ? points[hoveredIdx]
      : points.length > 0
      ? points[points.length - 1]
      : null;

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => ({
    val: Math.round(maxVal * ratio),
    y: padT + chartH - ratio * chartH,
  }));

  const labelIndices = useMemo(() => {
    const n = points.length;
    if (n <= 7) return points.map((_, i) => i);
    const step = Math.ceil(n / 6);
    const ids: number[] = [];
    for (let i = 0; i < n; i += step) ids.push(i);
    if (ids[ids.length - 1] !== n - 1) ids.push(n - 1);
    return ids;
  }, [points]);

  return (
    <section className="bg-surface border border-softLinen rounded-md p-5 sm:p-6 flex flex-col justify-between space-y-5">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-softLinen/80 pb-4">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-mutedBrown block">
            Tren Kunjungan Publik
          </span>
          <h2 className="font-serif text-xl font-bold text-charcoal mt-0.5">
            Grafik Pengunjung Unik &amp; Page Views
          </h2>
        </div>

        <div className="flex items-center gap-4">
          {/* Legend */}
          <div className="flex items-center gap-3 text-xs text-muted">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-terracotta inline-block" />
              Page Views
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigoTextile inline-block" />
              Pengunjung Unik
            </span>
          </div>

          {/* 7-day / 30-day switcher */}
          <div
            role="group"
            aria-label="Rentang hari grafik pengunjung"
            className="inline-flex bg-aged/70 p-0.5 rounded border border-softLinen text-xs"
          >
            <button
              type="button"
              onClick={() => onDaysWindowChange(7)}
              className={`px-2.5 py-1 rounded-xs font-semibold transition-colors ${
                daysWindow === 7
                  ? 'bg-charcoal text-ivory'
                  : 'text-charcoal/75 hover:text-charcoal'
              }`}
            >
              7 Hari
            </button>
            <button
              type="button"
              onClick={() => onDaysWindowChange(30)}
              className={`px-2.5 py-1 rounded-xs font-semibold transition-colors ${
                daysWindow === 30
                  ? 'bg-charcoal text-ivory'
                  : 'text-charcoal/75 hover:text-charcoal'
              }`}
            >
              30 Hari
            </button>
          </div>
        </div>
      </div>

      {/* Body States */}
      {loading && visibleSeries.length === 0 ? (
        <div className="h-[240px] flex items-center justify-center bg-ivory/60 rounded border border-softLinen/60 text-xs text-muted">
          Memuat data tren kunjungan dari server...
        </div>
      ) : error ? (
        <div className="h-[240px] flex flex-col items-center justify-center bg-ivory/60 rounded border border-softLinen text-center px-4 space-y-3">
          <p className="text-xs text-rose-800 font-medium">{error}</p>
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-terracotta text-surface text-xs font-semibold hover:bg-terracotta-hover transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Muat Ulang Grafik
          </button>
        </div>
      ) : !hasData ? (
        <div className="h-[240px] flex flex-col items-center justify-center bg-ivory/50 rounded border border-dashed border-naturalBeige text-center px-4 space-y-2">
          <TrendingUp className="w-6 h-6 text-mutedBrown" />
          <p className="text-sm font-serif font-semibold text-charcoal">
            Belum ada kunjungan tercatat pada rentang {daysWindow} hari terakhir
          </p>
          <p className="text-xs text-muted max-w-md">
            Data akan terisi otomatis begitu pengunjung membuka halaman publik museum tanpa memerlukan tindakan manual.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Interactive Tooltip Summary Strip */}
          {activePoint && (
            <div className="flex flex-wrap items-center justify-between gap-2 bg-ivory border border-softLinen rounded px-3.5 py-2 text-xs">
              <span className="font-semibold text-charcoal">
                Tanggal: {formatShortDate(activePoint.dateKey)} ({activePoint.dateKey})
              </span>
              <div className="flex flex-wrap items-center gap-4">
                <span className="text-indigoTextile font-semibold">
                  Pengunjung Unik: {activePoint.uniqueVisitors}
                </span>
                <span className="text-terracotta font-semibold">
                  Page Views: {activePoint.pageViews}
                </span>
                <span className="text-muted hidden sm:inline">
                  Desktop: {activePoint.desktopViews} • Mobile: {activePoint.mobileViews}
                </span>
              </div>
            </div>
          )}

          {/* Clean Responsive Dual-Series SVG Chart */}
          <div className="w-full overflow-hidden">
            <svg
              viewBox={`0 0 ${svgW} ${svgH}`}
              className="w-full h-auto block select-none"
              role="img"
              aria-label={`Grafik tren kunjungan ${daysWindow} hari`}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {/* Horizontal Gridlines & Y Labels */}
              {yTicks.map((t) => (
                <g key={t.val}>
                  <line
                    x1={padL}
                    y1={t.y}
                    x2={svgW - padR}
                    y2={t.y}
                    stroke="#E6D9C6"
                    strokeDasharray="3 3"
                    strokeWidth="1"
                  />
                  <text
                    x={padL - 8}
                    y={t.y + 4}
                    textAnchor="end"
                    fontSize="10"
                    fill="#806B58"
                  >
                    {t.val}
                  </text>
                </g>
              ))}

              {/* Subtle Soft Terracotta Area Under Page Views */}
              {viewsAreaPath && <path d={viewsAreaPath} fill="#984323" fillOpacity="0.08" />}

              {/* Series Lines */}
              <polyline
                fill="none"
                stroke="#984323"
                strokeWidth="2.2"
                strokeLinejoin="round"
                strokeLinecap="round"
                points={viewsPolyline}
              />
              <polyline
                fill="none"
                stroke="#243A4A"
                strokeWidth="2"
                strokeDasharray="5 3"
                strokeLinejoin="round"
                strokeLinecap="round"
                points={uniquePolyline}
              />

              {/* X-Axis Labels */}
              {labelIndices.map((idx) => {
                const p = points[idx];
                if (!p) return null;
                return (
                  <text
                    key={p.dateKey}
                    x={p.x}
                    y={svgH - 6}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#6E5C4E"
                  >
                    {formatShortDate(p.dateKey)}
                  </text>
                );
              })}

              {/* Hover Guide & Interactive Hit Targets */}
              {activePoint && (
                <line
                  x1={activePoint.x}
                  y1={padT}
                  x2={activePoint.x}
                  y2={padT + chartH}
                  stroke="#C9B69C"
                  strokeWidth="1"
                />
              )}

              {points.map((p) => {
                const sliceW = points.length > 1 ? chartW / points.length : chartW;
                const isSelected = activePoint?.idx === p.idx;
                return (
                  <g key={p.dateKey}>
                    <circle
                      cx={p.x}
                      cy={p.yViews}
                      r={isSelected ? 4.5 : 2.5}
                      fill="#984323"
                      stroke="#FBF8F3"
                      strokeWidth="1.2"
                    />
                    <circle
                      cx={p.x}
                      cy={p.yUnique}
                      r={isSelected ? 4 : 2.2}
                      fill="#243A4A"
                      stroke="#FBF8F3"
                      strokeWidth="1.2"
                    />
                    <rect
                      x={p.x - sliceW / 2}
                      y={padT}
                      width={Math.max(sliceW, 12)}
                      height={chartH}
                      fill="transparent"
                      tabIndex={0}
                      aria-label={`${p.dateKey}: ${p.uniqueVisitors} pengunjung unik, ${p.pageViews} page views`}
                      onMouseEnter={() => setHoveredIdx(p.idx)}
                      onFocus={() => setHoveredIdx(p.idx)}
                    />
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      )}
    </section>
  );
};
