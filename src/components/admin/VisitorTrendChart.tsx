import React, { useState } from 'react';
import { BarChart2, AlertCircle } from 'lucide-react';
import { AnalyticsTrendPoint } from '../../appwrite/analyticsApi';

interface VisitorTrendChartProps {
  data: AnalyticsTrendPoint[];
  range: 7 | 30;
  onRangeChange: (nextRange: 7 | 30) => void;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export const VisitorTrendChart: React.FC<VisitorTrendChartProps> = ({
  data,
  range,
  onRangeChange,
  loading = false,
  error = null,
  onRetry,
}) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const hasAnyTraffic = data.some((d) => d.pageViews > 0 || d.uniqueVisitors > 0);
  const maxVal = Math.max(
    4,
    ...data.map((d) => Math.max(d.pageViews, d.uniqueVisitors))
  );

  const svgWidth = 720;
  const svgHeight = 230;
  const padLeft = 38;
  const padRight = 16;
  const padTop = 18;
  const padBottom = 34;
  const plotW = svgWidth - padLeft - padRight;
  const plotH = svgHeight - padTop - padBottom;

  const getX = (idx: number) => {
    if (data.length <= 1) return padLeft + plotW / 2;
    return padLeft + (idx / (data.length - 1)) * plotW;
  };
  const getY = (val: number) => {
    const ratio = Math.min(1, Math.max(0, val / maxVal));
    return padTop + plotH - ratio * plotH;
  };

  const buildPolyline = (accessor: (d: AnalyticsTrendPoint) => number) =>
    data.map((d, i) => `${getX(i).toFixed(1)},${getY(accessor(d)).toFixed(1)}`).join(' ');

  const buildAreaPath = (accessor: (d: AnalyticsTrendPoint) => number) => {
    if (data.length === 0) return '';
    const points = data.map((d, i) => `${getX(i).toFixed(1)},${getY(accessor(d)).toFixed(1)}`);
    const lastX = getX(data.length - 1).toFixed(1);
    const firstX = getX(0).toFixed(1);
    const baseY = (padTop + plotH).toFixed(1);
    return `M ${firstX},${baseY} L ${points.join(' L ')} L ${lastX},${baseY} Z`;
  };

  const yTicks = [0, Math.round(maxVal / 2), maxVal];
  const labelStride = range === 7 ? 1 : 5;
  const hoveredPoint = activeIndex !== null && data[activeIndex] ? data[activeIndex] : null;

  return (
    <section
      aria-labelledby="visitor-trend-heading"
      className="bg-surface border border-softLinen rounded-[4px] p-5 sm:p-6 space-y-5"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-softLinen/80 pb-4">
        <div>
          <h2 id="visitor-trend-heading" className="font-serif text-xl font-semibold text-charcoal">
            Tren Kunjungan Publik
          </h2>
          <p className="text-xs text-mutedBrown mt-0.5">
            Perbandingan pengunjung unik dan page views harian (Zona Waktu WITA)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* Legend */}
          <div className="flex items-center gap-4 text-xs text-charcoal/85">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-terracotta inline-block" />
              Page Views
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigoTextile inline-block" />
              Pengunjung Unik
            </span>
          </div>

          {/* 7 / 30 Day Toggle */}
          <div
            className="inline-flex rounded-[3px] border border-softLinen bg-aged/60 p-0.5 text-xs"
            role="group"
            aria-label="Rentang waktu grafik"
          >
            <button
              type="button"
              onClick={() => {
                setActiveIndex(null);
                onRangeChange(7);
              }}
              className={`px-3 py-1 rounded-[2px] font-medium transition-colors ${
                range === 7
                  ? 'bg-charcoal text-ivory'
                  : 'text-mutedBrown hover:text-charcoal'
              }`}
            >
              7 Hari
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveIndex(null);
                onRangeChange(30);
              }}
              className={`px-3 py-1 rounded-[2px] font-medium transition-colors ${
                range === 30
                  ? 'bg-charcoal text-ivory'
                  : 'text-mutedBrown hover:text-charcoal'
              }`}
            >
              30 Hari
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="h-[220px] flex items-center justify-center text-xs text-mutedBrown">
          Memuat data tren kunjungan...
        </div>
      ) : error ? (
        <div className="h-[200px] flex flex-col items-center justify-center gap-2 text-xs text-terracotta-deep text-center px-4">
          <AlertCircle className="w-5 h-5" />
          <p>{error}</p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="px-3 py-1 rounded-[3px] border border-softLinen bg-ivory text-charcoal hover:bg-aged font-medium"
            >
              Muat Ulang Grafik
            </button>
          )}
        </div>
      ) : !hasAnyTraffic ? (
        <div className="h-[200px] flex flex-col items-center justify-center gap-2 text-center px-4 border border-dashed border-softLinen rounded-[3px] bg-sand-50/60">
          <BarChart2 className="w-6 h-6 text-mutedBrown/70" />
          <p className="font-serif text-sm font-semibold text-charcoal">
            Belum ada rekaman kunjungan pada rentang {range} hari ini
          </p>
          <p className="text-xs text-mutedBrown max-w-md">
            Grafik akan otomatis terisi secara real-time saat pengunjung membuka halaman publik museum.
          </p>
        </div>
      ) : (
        <div className="relative">
          {/* Interactive Hover/Focus Tooltip */}
          {hoveredPoint && activeIndex !== null && (
            <div
              className="mb-2 sm:mb-0 sm:absolute sm:top-1 sm:right-2 z-10 bg-charcoal text-ivory text-xs px-3 py-2 rounded-[3px] shadow-sm pointer-events-none"
              role="status"
            >
              <div className="font-medium text-parchment mb-1">{hoveredPoint.dateKey}</div>
              <div className="flex items-center gap-4 tabular-nums">
                <span>
                  Page Views: <strong className="text-white">{hoveredPoint.pageViews}</strong>
                </span>
                <span>
                  Unik: <strong className="text-white">{hoveredPoint.uniqueVisitors}</strong>
                </span>
              </div>
            </div>
          )}

          <div className="w-full overflow-hidden">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-auto block select-none"
              role="img"
              aria-label={`Grafik tren kunjungan ${range} hari terakhir`}
            >
              <defs>
                <linearGradient id="pageViewsWash" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#984323" stopOpacity="0.14" />
                  <stop offset="100%" stopColor="#984323" stopOpacity="0.01" />
                </linearGradient>
              </defs>

              {/* Horizontal Grid Lines & Y-Axis Ticks */}
              {yTicks.map((tick) => {
                const y = getY(tick);
                return (
                  <g key={tick}>
                    <line
                      x1={padLeft}
                      y1={y}
                      x2={svgWidth - padRight}
                      y2={y}
                      stroke="#D9CCB9"
                      strokeDasharray={tick === 0 ? undefined : '3 3'}
                      strokeWidth="1"
                    />
                    <text
                      x={padLeft - 8}
                      y={y + 3.5}
                      textAnchor="end"
                      fontSize="10"
                      fill="#806B58"
                    >
                      {tick}
                    </text>
                  </g>
                );
              })}

              {/* Subtle Area Under Page Views */}
              <path d={buildAreaPath((d) => d.pageViews)} fill="url(#pageViewsWash)" />

              {/* Page Views Line (Terracotta) */}
              <polyline
                fill="none"
                stroke="#984323"
                strokeWidth="2.2"
                strokeLinejoin="round"
                strokeLinecap="round"
                points={buildPolyline((d) => d.pageViews)}
              />

              {/* Unique Visitors Line (Indigo Textile) */}
              <polyline
                fill="none"
                stroke="#243A4A"
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
                strokeDasharray="4 2"
                points={buildPolyline((d) => d.uniqueVisitors)}
              />

              {/* Interactive Guide & Data Dots */}
              {activeIndex !== null && data[activeIndex] && (
                <line
                  x1={getX(activeIndex)}
                  y1={padTop}
                  x2={getX(activeIndex)}
                  y2={padTop + plotH}
                  stroke="#806B58"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                />
              )}

              {data.map((d, i) => {
                const cx = getX(i);
                const yViews = getY(d.pageViews);
                const yUniq = getY(d.uniqueVisitors);
                const showLabel = i % labelStride === 0 || i === data.length - 1;
                const colWidth = data.length > 1 ? plotW / data.length : plotW;
                const isSelected = activeIndex === i;

                return (
                  <g key={d.dateKey}>
                    {(range === 7 || isSelected || d.pageViews > 0) && (
                      <circle
                        cx={cx}
                        cy={yViews}
                        r={isSelected ? 4.5 : 2.6}
                        fill="#984323"
                        stroke="#FBF8F3"
                        strokeWidth="1.2"
                      />
                    )}
                    {(range === 7 || isSelected || d.uniqueVisitors > 0) && (
                      <circle
                        cx={cx}
                        cy={yUniq}
                        r={isSelected ? 4 : 2.4}
                        fill="#243A4A"
                        stroke="#FBF8F3"
                        strokeWidth="1.2"
                      />
                    )}

                    {showLabel && (
                      <text
                        x={cx}
                        y={svgHeight - 10}
                        textAnchor={i === 0 ? 'start' : i === data.length - 1 ? 'end' : 'middle'}
                        fontSize="10"
                        fill="#806B58"
                      >
                        {d.label}
                      </text>
                    )}

                    {/* Keyboard & pointer hit column */}
                    <rect
                      x={Math.max(padLeft, cx - colWidth / 2)}
                      y={padTop}
                      width={Math.max(8, colWidth)}
                      height={plotH}
                      fill="transparent"
                      tabIndex={0}
                      role="button"
                      aria-label={`${d.dateKey}: ${d.pageViews} page views, ${d.uniqueVisitors} pengunjung unik`}
                      onMouseEnter={() => setActiveIndex(i)}
                      onFocus={() => setActiveIndex(i)}
                      onMouseLeave={() => setActiveIndex(null)}
                      onBlur={() => setActiveIndex(null)}
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
