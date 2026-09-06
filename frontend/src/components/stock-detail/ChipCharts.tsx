"use client";

import { EmptyDataState } from "@/components/stock-detail/DataPanelPrimitives";
import {
  buildLinePath,
  buildNumericLinePath,
  chartX,
  chartY,
  minMax,
  nearestChartIndex,
  tooltipX,
  tooltipY,
} from "@/components/stock-detail/stockDetailChartGeometry";
import {
  formatCompactDate,
  formatDate,
  formatLots,
  formatMonthDay,
  formatPrice,
  formatSignedLots,
  valueTone,
} from "@/components/stock-detail/stockDetailFormatters";
import type {
  InstitutionalCumulativeKey,
  InstitutionalNetKey,
  InstitutionalSeriesPoint,
  ShareholdingSeriesPoint,
} from "@/components/stock-detail/stockDetailTypes";
import { useT } from "@/i18n";
import { omiChartColors } from "@/lib/themeColors";
import { useState } from "react";

export function ShareholdingMixedChart({ points }: { points: ShareholdingSeriesPoint[] }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const t = useT();
  const viewWidth = 860;
  const viewHeight = 340;
  const left = 70;
  const right = 88;
  const top = 52;
  const height = 220;
  const width = viewWidth - left - right;
  const largeScale = minMax(points.map((point) => point.largeRatio));
  const closeScale = minMax(points.map((point) => point.close));
  const showClose = closeScale !== null && points.some((point) => point.close !== null);

  if (points.length === 0 || largeScale === null) {
    return <EmptyDataState message={t("stockDetail.dataPanel.empty.shareholdingTrend")} />;
  }

  const closePath =
    showClose && closeScale
      ? buildLinePath(points, "close", closeScale, left, top, width, height)
      : "";
  const barWidth = Math.max(2, Math.min(10, width / Math.max(points.length, 1) - 2));
  const hoverPoint = hoverIndex === null ? null : points[hoverIndex] ?? null;
  const hoverX =
    hoverIndex === null ? null : chartX(hoverIndex, points.length, left, width);
  const hoverLargeY =
    hoverPoint?.largeRatio === null || hoverPoint?.largeRatio === undefined
      ? null
      : chartY(hoverPoint.largeRatio, largeScale.min, largeScale.max, top, height);
  const hoverCloseY =
    hoverPoint?.close === null || hoverPoint?.close === undefined || closeScale === null
      ? null
      : chartY(hoverPoint.close, closeScale.min, closeScale.max, top, height);
  const hoverPrimaryY = hoverCloseY ?? hoverLargeY ?? top + height / 2;
  const hoverTipWidth = 196;
  const hoverTipHeight = 92;
  const hoverTipX = hoverX === null ? 0 : tooltipX(hoverX, hoverTipWidth, viewWidth);
  const hoverTipY = tooltipY(hoverPrimaryY, hoverTipHeight, top, height);

  return (
    <div className="border border-omi-border-subtle bg-omi-surface px-4 py-5">
      <div className="mb-3 flex items-center justify-center gap-6 text-sm font-semibold">
        <span className="inline-flex items-center gap-1.5 text-omi-text-strong">
          <span className="h-3 w-5 rounded-sm bg-omi-heat-border" />
          {t("stockDetail.dataPanel.chart.largeHolderPct")}
        </span>
        <span className="inline-flex items-center gap-1.5 text-omi-text-strong">
          <span className="h-2.5 w-2.5 rounded-full border-2 border-omi-market-up-border" />
          {t("stockDetail.dataPanel.chart.closePrice")}
        </span>
      </div>
      <svg
        viewBox={`0 0 ${viewWidth} ${viewHeight}`}
        className="h-[340px] w-full"
        onMouseMove={(event) => {
          const nextIndex = nearestChartIndex(event, points.length, left, width, viewWidth);
          setHoverIndex((current) => (current === nextIndex ? current : nextIndex));
        }}
        onMouseLeave={() => setHoverIndex(null)}
      >
        {[0, 1, 2, 3].map((tick) => {
          const y = top + (tick / 3) * height;
          return <line key={tick} x1={left} x2={left + width} y1={y} y2={y} stroke={omiChartColors.grid} />;
        })}
        <text x={left} y={22} className="fill-omi-text-strong text-[13px] font-semibold">
          {t("stockDetail.dataPanel.chart.largeHolderPct")}
        </text>
        <text x={left + width + right} y={22} textAnchor="end" className="fill-omi-text-strong text-[13px] font-semibold">
          {t("stockDetail.dataPanel.chart.closePrice")}
        </text>
        {points.map((point, index) => {
          const value = point.largeRatio ?? largeScale.min;
          const x = chartX(index, points.length, left, width) - barWidth / 2;
          const y = chartY(value, largeScale.min, largeScale.max, top, height);
          return (
            <rect
              key={point.date}
              x={x}
              y={y}
              width={barWidth}
              height={top + height - y}
              fill={omiChartColors.heatMuted}
              opacity="0.72"
            />
          );
        })}
        {closePath ? (
          <path d={closePath} fill="none" stroke={omiChartColors.growth} strokeWidth="2.5" strokeLinecap="round" />
        ) : null}
        <text x={left - 6} y={top + 4} textAnchor="end" className="fill-omi-text text-[12px] font-medium tabular-nums">
          {largeScale.max.toFixed(2)}
        </text>
        <text x={left - 6} y={top + height} textAnchor="end" className="fill-omi-text text-[12px] font-medium tabular-nums">
          {largeScale.min.toFixed(2)}
        </text>
        {closeScale ? (
          <>
            <text x={left + width + 6} y={top + 4} className="fill-omi-text text-[12px] font-medium tabular-nums">
              {formatPrice(closeScale.max)}
            </text>
            <text x={left + width + 6} y={top + height} className="fill-omi-text text-[12px] font-medium tabular-nums">
              {formatPrice(closeScale.min)}
            </text>
          </>
        ) : null}
        <text x={left} y={top + height + 24} className="fill-omi-text-muted text-[12px] font-medium tabular-nums">
          {formatCompactDate(points[0]?.date)}
        </text>
        <text x={left + width} y={top + height + 24} textAnchor="end" className="fill-omi-text-muted text-[12px] font-medium tabular-nums">
          {formatCompactDate(points[points.length - 1]?.date)}
        </text>
        {hoverPoint && hoverX !== null ? (
          <g pointerEvents="none">
            <line
              x1={hoverX}
              x2={hoverX}
              y1={top}
              y2={top + height}
              stroke={omiChartColors.crosshair}
              strokeDasharray="4 4"
            />
            {hoverLargeY !== null ? (
              <g>
                <rect x={6} y={hoverLargeY - 13} width={56} height={26} rx={4} fill={omiChartColors.tooltip} />
                <text
                  x={34}
                  y={hoverLargeY + 4}
                  textAnchor="middle"
                  className="fill-omi-surface text-[12px] font-bold tabular-nums"
                >
                  {formatPrice(hoverPoint.largeRatio)}
                </text>
                <line
                  x1={left}
                  x2={left + width}
                  y1={hoverLargeY}
                  y2={hoverLargeY}
                  stroke={omiChartColors.crosshair}
                  strokeDasharray="4 4"
                />
              </g>
            ) : null}
            {hoverCloseY !== null ? (
              <g>
                <rect
                  x={viewWidth - 62}
                  y={hoverCloseY - 13}
                  width={56}
                  height={26}
                  rx={4}
                  fill={omiChartColors.tooltip}
                />
                <text
                  x={viewWidth - 34}
                  y={hoverCloseY + 4}
                  textAnchor="middle"
                  className="fill-omi-surface text-[12px] font-bold tabular-nums"
                >
                  {formatPrice(hoverPoint.close)}
                </text>
              </g>
            ) : null}
            <rect x={hoverX - 40} y={top + height + 28} width={80} height={26} rx={4} fill={omiChartColors.tooltip} />
            <text
              x={hoverX}
              y={top + height + 45}
              textAnchor="middle"
              className="fill-omi-surface text-[12px] font-bold tabular-nums"
            >
              {formatCompactDate(hoverPoint.date)}
            </text>
            <g transform={`translate(${hoverTipX} ${hoverTipY})`}>
              <rect width={hoverTipWidth} height={hoverTipHeight} rx={4} fill={omiChartColors.surface} stroke={omiChartColors.tooltipBorder} />
              <text x={14} y={22} className="fill-omi-text-strong text-[13px] font-bold tabular-nums">
                {formatCompactDate(hoverPoint.date)}
              </text>
              <circle cx={18} cy={44} r={5} fill={omiChartColors.heatMuted} />
              <text x={32} y={48} className="fill-omi-text-muted text-[13px]">
                {t("stockDetail.dataPanel.chart.largeHolderPct")}
              </text>
              <text x={hoverTipWidth - 14} y={48} textAnchor="end" className="fill-omi-text text-[13px] font-bold tabular-nums">
                {formatPrice(hoverPoint.largeRatio)}
              </text>
              <circle cx={18} cy={72} r={5} fill={omiChartColors.growth} />
              <text x={32} y={76} className="fill-omi-text-muted text-[13px]">
                {t("stockDetail.dataPanel.chart.closePrice")}
              </text>
              <text x={hoverTipWidth - 14} y={76} textAnchor="end" className="fill-omi-text text-[13px] font-bold tabular-nums">
                {formatPrice(hoverPoint.close)}
              </text>
            </g>
          </g>
        ) : null}
        <rect
          x={left}
          y={top}
          width={width}
          height={height + 54}
          fill="transparent"
          pointerEvents="all"
        />
      </svg>
    </div>
  );
}

export function ShareholdingRatioChart({ points }: { points: ShareholdingSeriesPoint[] }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const t = useT();
  const viewWidth = 860;
  const viewHeight = 310;
  const left = 70;
  const right = 78;
  const top = 48;
  const height = 196;
  const width = viewWidth - left - right;
  const largeScale = minMax(points.map((point) => point.largeRatio));
  const smallScale = minMax(points.map((point) => point.smallRatio));

  if (points.length === 0 || largeScale === null || smallScale === null) {
    return <EmptyDataState message={t("stockDetail.dataPanel.empty.shareholdingRatio")} />;
  }

  const largePath = buildLinePath(points, "largeRatio", largeScale, left, top, width, height);
  const smallPath = buildLinePath(points, "smallRatio", smallScale, left, top, width, height);
  const hoverPoint = hoverIndex === null ? null : points[hoverIndex] ?? null;
  const hoverX =
    hoverIndex === null ? null : chartX(hoverIndex, points.length, left, width);
  const hoverLargeY =
    hoverPoint?.largeRatio === null || hoverPoint?.largeRatio === undefined
      ? null
      : chartY(hoverPoint.largeRatio, largeScale.min, largeScale.max, top, height);
  const hoverSmallY =
    hoverPoint?.smallRatio === null || hoverPoint?.smallRatio === undefined
      ? null
      : chartY(hoverPoint.smallRatio, smallScale.min, smallScale.max, top, height);
  const hoverPrimaryY = hoverLargeY ?? hoverSmallY ?? top + height / 2;
  const hoverTipWidth = 200;
  const hoverTipHeight = 92;
  const hoverTipX = hoverX === null ? 0 : tooltipX(hoverX, hoverTipWidth, viewWidth);
  const hoverTipY = tooltipY(hoverPrimaryY, hoverTipHeight, top, height);

  return (
    <div className="border border-omi-border-subtle bg-omi-surface px-4 py-5">
      <div className="mb-3 flex items-center justify-center gap-6 text-sm font-semibold">
        <span className="inline-flex items-center gap-1.5 text-omi-text-strong">
          <span className="h-2.5 w-2.5 rounded-full border-2 border-omi-heat-border" />
          {t("stockDetail.dataPanel.chart.largeHolderPct")}
        </span>
        <span className="inline-flex items-center gap-1.5 text-omi-text-strong">
          <span className="h-2.5 w-2.5 rounded-full border-2 border-omi-market-up-border" />
          {t("stockDetail.dataPanel.chart.smallHolderPct")}
        </span>
      </div>
      <svg
        viewBox={`0 0 ${viewWidth} ${viewHeight}`}
        className="h-[310px] w-full"
        onMouseMove={(event) => {
          const nextIndex = nearestChartIndex(event, points.length, left, width, viewWidth);
          setHoverIndex((current) => (current === nextIndex ? current : nextIndex));
        }}
        onMouseLeave={() => setHoverIndex(null)}
      >
        {[0, 1, 2, 3].map((tick) => {
          const y = top + (tick / 3) * height;
          return <line key={tick} x1={left} x2={left + width} y1={y} y2={y} stroke={omiChartColors.grid} />;
        })}
        <path d={largePath} fill="none" stroke={omiChartColors.heatMuted} strokeWidth="2.5" strokeLinecap="round" />
        <path d={smallPath} fill="none" stroke={omiChartColors.growth} strokeWidth="2.5" strokeLinecap="round" />
        <text x={left} y={20} className="fill-omi-text-strong text-[13px] font-semibold">
          {t("stockDetail.dataPanel.chart.largeHolderPct")}
        </text>
        <text x={left + width + right} y={20} textAnchor="end" className="fill-omi-text-strong text-[13px] font-semibold">
          {t("stockDetail.dataPanel.chart.smallHolderPct")}
        </text>
        <text x={left - 6} y={top + 4} textAnchor="end" className="fill-omi-text text-[12px] font-medium tabular-nums">
          {largeScale.max.toFixed(2)}
        </text>
        <text x={left - 6} y={top + height} textAnchor="end" className="fill-omi-text text-[12px] font-medium tabular-nums">
          {largeScale.min.toFixed(2)}
        </text>
        <text x={left + width + 6} y={top + 4} className="fill-omi-text text-[12px] font-medium tabular-nums">
          {smallScale.max.toFixed(2)}
        </text>
        <text x={left + width + 6} y={top + height} className="fill-omi-text text-[12px] font-medium tabular-nums">
          {smallScale.min.toFixed(2)}
        </text>
        <text x={left} y={top + height + 24} className="fill-omi-text-muted text-[12px] font-medium tabular-nums">
          {formatCompactDate(points[0]?.date)}
        </text>
        <text x={left + width} y={top + height + 24} textAnchor="end" className="fill-omi-text-muted text-[12px] font-medium tabular-nums">
          {formatCompactDate(points[points.length - 1]?.date)}
        </text>
        {hoverPoint && hoverX !== null ? (
          <g pointerEvents="none">
            <line
              x1={hoverX}
              x2={hoverX}
              y1={top}
              y2={top + height}
              stroke={omiChartColors.crosshair}
              strokeDasharray="4 4"
            />
            {hoverLargeY !== null ? (
              <g>
                <rect x={6} y={hoverLargeY - 13} width={56} height={26} rx={4} fill={omiChartColors.tooltip} />
                <text
                  x={34}
                  y={hoverLargeY + 4}
                  textAnchor="middle"
                  className="fill-omi-surface text-[12px] font-bold tabular-nums"
                >
                  {formatPrice(hoverPoint.largeRatio)}
                </text>
                <line
                  x1={left}
                  x2={left + width}
                  y1={hoverLargeY}
                  y2={hoverLargeY}
                  stroke={omiChartColors.crosshair}
                  strokeDasharray="4 4"
                />
              </g>
            ) : null}
            {hoverSmallY !== null ? (
              <g>
                <rect
                  x={viewWidth - 62}
                  y={hoverSmallY - 13}
                  width={56}
                  height={26}
                  rx={4}
                  fill={omiChartColors.tooltip}
                />
                <text
                  x={viewWidth - 34}
                  y={hoverSmallY + 4}
                  textAnchor="middle"
                  className="fill-omi-surface text-[12px] font-bold tabular-nums"
                >
                  {formatPrice(hoverPoint.smallRatio)}
                </text>
              </g>
            ) : null}
            <rect x={hoverX - 40} y={top + height + 28} width={80} height={26} rx={4} fill={omiChartColors.tooltip} />
            <text
              x={hoverX}
              y={top + height + 45}
              textAnchor="middle"
              className="fill-omi-surface text-[12px] font-bold tabular-nums"
            >
              {formatCompactDate(hoverPoint.date)}
            </text>
            <g transform={`translate(${hoverTipX} ${hoverTipY})`}>
              <rect width={hoverTipWidth} height={hoverTipHeight} rx={4} fill={omiChartColors.surface} stroke={omiChartColors.tooltipBorder} />
              <text x={14} y={22} className="fill-omi-text-strong text-[13px] font-bold tabular-nums">
                {formatCompactDate(hoverPoint.date)}
              </text>
              <circle cx={18} cy={44} r={5} fill={omiChartColors.heatMuted} />
              <text x={32} y={48} className="fill-omi-text-muted text-[13px]">
                {t("stockDetail.dataPanel.chart.largeHolderPct")}
              </text>
              <text x={hoverTipWidth - 14} y={48} textAnchor="end" className="fill-omi-text text-[13px] font-bold tabular-nums">
                {formatPrice(hoverPoint.largeRatio)}
              </text>
              <circle cx={18} cy={72} r={5} fill={omiChartColors.growth} />
              <text x={32} y={76} className="fill-omi-text-muted text-[13px]">
                {t("stockDetail.dataPanel.chart.smallHolderPct")}
              </text>
              <text x={hoverTipWidth - 14} y={76} textAnchor="end" className="fill-omi-text text-[13px] font-bold tabular-nums">
                {formatPrice(hoverPoint.smallRatio)}
              </text>
            </g>
          </g>
        ) : null}
        <rect
          x={left}
          y={top}
          width={width}
          height={height + 54}
          fill="transparent"
          pointerEvents="all"
        />
      </svg>
    </div>
  );
}

export function InstitutionalFlowChart({
  points,
  title,
  netKey,
  cumulativeKey,
  activeDate,
  showXAxisLabels = false,
  onHoverPointChange,
}: {
  points: InstitutionalSeriesPoint[];
  title: string;
  netKey: InstitutionalNetKey;
  cumulativeKey: InstitutionalCumulativeKey;
  activeDate?: string | null;
  showXAxisLabels?: boolean;
  onHoverPointChange?: (point: InstitutionalSeriesPoint | null) => void;
}) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const t = useT();
  const chartPoints = points;
  const viewWidth = 860;
  const viewHeight = showXAxisLabels ? 156 : 130;
  const left = 70;
  const right = 78;
  const top = 26;
  const height = 88;
  const width = viewWidth - left - right;
  const netValues = chartPoints
    .map((point) => point[netKey])
    .filter((value): value is number => value !== null && value !== undefined);
  const cumulativeScale = minMax(chartPoints.map((point) => point[cumulativeKey])) ?? {
    min: -1,
    max: 1,
  };
  const netMax = Math.max(...netValues.map((value) => Math.abs(value)), 1);
  const netScale = { min: -netMax, max: netMax };
  const zeroY = chartY(0, netScale.min, netScale.max, top, height);
  const barWidth = Math.max(2, Math.min(9, width / Math.max(chartPoints.length, 1) - 2));
  const cumulativePath = buildNumericLinePath(
    chartPoints,
    (point) => point[cumulativeKey],
    cumulativeScale,
    left,
    top,
    width,
    height
  );
  const latestPoint = chartPoints[chartPoints.length - 1] ?? null;
  const hoverPoint = hoverIndex === null ? null : chartPoints[hoverIndex] ?? null;
  const activeIndex = activeDate
    ? chartPoints.findIndex((point) => point.date === activeDate)
    : -1;
  const guideIndex = hoverIndex ?? (activeIndex >= 0 ? activeIndex : null);
  const guideX =
    guideIndex === null ? null : chartX(guideIndex, chartPoints.length, left, width);
  const hoverX =
    hoverIndex === null ? null : chartX(hoverIndex, chartPoints.length, left, width);
  const hoverNetY =
    hoverPoint?.[netKey] === null || hoverPoint?.[netKey] === undefined
      ? null
      : chartY(hoverPoint[netKey], netScale.min, netScale.max, top, height);
  const hoverCumY =
    hoverPoint?.[cumulativeKey] === null || hoverPoint?.[cumulativeKey] === undefined
      ? null
      : chartY(hoverPoint[cumulativeKey], cumulativeScale.min, cumulativeScale.max, top, height);
  const hoverTipWidth = 200;
  const hoverTipHeight = 92;
  const hoverTipX = hoverX === null ? 0 : tooltipX(hoverX, hoverTipWidth, viewWidth);
  const hoverTipY = tooltipY(hoverCumY ?? hoverNetY ?? top + height / 2, hoverTipHeight, top, height);

  if (!chartPoints.length) {
    return (
      <EmptyDataState
        message={t("stockDetail.dataPanel.empty.historyFor", { title })}
      />
    );
  }

  return (
    <div className="border-t border-omi-border-subtle py-3 first:border-t-0">
      <div className="mb-2 flex items-center justify-between gap-4 text-sm">
        <div className="font-semibold text-omi-text-strong">
          {title}
          <span className={`ml-2 text-xs font-semibold ${valueTone(latestPoint?.[cumulativeKey])}`}>
            {t("stockDetail.dataPanel.chart.cumulativeLots", {
              value: formatSignedLots(latestPoint?.[cumulativeKey]),
            })}
          </span>
        </div>
        <div className="text-xs">
          <span className="text-omi-text-muted">{t("stockDetail.dataPanel.chart.netBuySell")}</span>
          <span className={`font-semibold ${valueTone(latestPoint?.[netKey])}`}>
            {formatSignedLots(latestPoint?.[netKey])}{t("stockDetail.dataPanel.units.lots")}
          </span>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${viewWidth} ${viewHeight}`}
        className={showXAxisLabels ? "h-[156px] w-full" : "h-[130px] w-full"}
        onMouseMove={(event) => {
          const nextIndex = nearestChartIndex(event, chartPoints.length, left, width, viewWidth);
          setHoverIndex((current) => (current === nextIndex ? current : nextIndex));
          onHoverPointChange?.(chartPoints[nextIndex] ?? null);
        }}
        onMouseLeave={() => {
          setHoverIndex(null);
          onHoverPointChange?.(null);
        }}
      >
        {[0, 1, 2].map((tick) => {
          const y = top + (tick / 2) * height;
          return <line key={tick} x1={left} x2={left + width} y1={y} y2={y} stroke={omiChartColors.grid} />;
        })}
        <line x1={left} x2={left + width} y1={zeroY} y2={zeroY} stroke={omiChartColors.crosshair} />
        {chartPoints.map((point, index) => {
          const value = point[netKey] ?? 0;
          const x = chartX(index, chartPoints.length, left, width) - barWidth / 2;
          const y = chartY(value, netScale.min, netScale.max, top, height);
          return (
            <rect
              key={point.date}
              x={x}
              y={Math.min(y, zeroY)}
              width={barWidth}
              height={Math.max(1, Math.abs(zeroY - y))}
              fill={value >= 0 ? omiChartColors.marketUpFlash : omiChartColors.marketDownFlash}
              opacity="0.78"
            />
          );
        })}
        {cumulativePath ? (
          <path d={cumulativePath} fill="none" stroke={omiChartColors.cumulative} strokeWidth="2.5" strokeLinecap="round" />
        ) : null}
        <text x={left - 6} y={top + 4} textAnchor="end" className="fill-omi-text text-[12px] font-medium tabular-nums">
          {formatLots(netScale.max)}
        </text>
        <text x={left - 6} y={top + height} textAnchor="end" className="fill-omi-text text-[12px] font-medium tabular-nums">
          {formatSignedLots(netScale.min)}
        </text>
        <text x={left + width + 6} y={top + 4} className="fill-omi-text text-[12px] font-medium tabular-nums">
          {formatLots(cumulativeScale.max)}
        </text>
        <text x={left + width + 6} y={top + height} className="fill-omi-text text-[12px] font-medium tabular-nums">
          {formatSignedLots(cumulativeScale.min)}
        </text>
        {showXAxisLabels ? (
          <>
            <text x={left} y={top + height + 24} className="fill-omi-text-muted text-[12px] font-medium tabular-nums">
              {formatMonthDay(chartPoints[0]?.date)}
            </text>
            <text x={left + width} y={top + height + 24} textAnchor="end" className="fill-omi-text-muted text-[12px] font-medium tabular-nums">
              {formatMonthDay(chartPoints[chartPoints.length - 1]?.date)}
            </text>
          </>
        ) : null}
        {guideX !== null ? (
          <g pointerEvents="none">
            <line
              x1={guideX}
              x2={guideX}
              y1={top}
              y2={top + height}
              stroke={omiChartColors.crosshair}
              strokeDasharray="4 4"
            />
          </g>
        ) : null}
        {hoverPoint && hoverX !== null ? (
          <g pointerEvents="none">
            {hoverNetY !== null ? (
              <g>
                <rect x={6} y={hoverNetY - 13} width={58} height={26} rx={4} fill={omiChartColors.tooltip} />
                <text x={35} y={hoverNetY + 4} textAnchor="middle" className="fill-omi-surface text-[12px] font-bold tabular-nums">
                  {formatSignedLots(hoverPoint[netKey])}
                </text>
              </g>
            ) : null}
            {hoverCumY !== null ? (
              <g>
                <rect x={viewWidth - 66} y={hoverCumY - 13} width={60} height={26} rx={4} fill={omiChartColors.tooltip} />
                <text x={viewWidth - 36} y={hoverCumY + 4} textAnchor="middle" className="fill-omi-surface text-[12px] font-bold tabular-nums">
                  {formatSignedLots(hoverPoint[cumulativeKey])}
                </text>
              </g>
            ) : null}
            {showXAxisLabels ? (
              <>
                <rect x={hoverX - 32} y={top + height + 28} width={64} height={24} rx={4} fill={omiChartColors.tooltip} />
                <text x={hoverX} y={top + height + 44} textAnchor="middle" className="fill-omi-surface text-[12px] font-bold tabular-nums">
                  {formatMonthDay(hoverPoint.date)}
                </text>
              </>
            ) : null}
            <g transform={`translate(${hoverTipX} ${hoverTipY})`}>
              <rect width={hoverTipWidth} height={hoverTipHeight} rx={4} fill={omiChartColors.surface} stroke={omiChartColors.tooltipBorder} />
              <text x={14} y={22} className="fill-omi-text-strong text-[13px] font-bold tabular-nums">
                {formatDate(hoverPoint.date)}
              </text>
              <rect x={14} y={38} width={8} height={8} fill={(hoverPoint[netKey] ?? 0) >= 0 ? omiChartColors.marketUpFlash : omiChartColors.marketDownFlash} />
              <text x={30} y={47} className="fill-omi-text-muted text-[13px]">
                {t("stockDetail.dataPanel.chart.netBuySellLots")}
              </text>
              <text x={hoverTipWidth - 14} y={47} textAnchor="end" className="fill-omi-text text-[13px] font-bold tabular-nums">
                {formatSignedLots(hoverPoint[netKey])}
              </text>
              <circle cx={18} cy={72} r={5} fill={omiChartColors.cumulative} />
              <text x={30} y={76} className="fill-omi-text-muted text-[13px]">
                {t("stockDetail.dataPanel.chart.cumulativeLotsColumn")}
              </text>
              <text x={hoverTipWidth - 14} y={76} textAnchor="end" className="fill-omi-text text-[13px] font-bold tabular-nums">
                {formatSignedLots(hoverPoint[cumulativeKey])}
              </text>
            </g>
          </g>
        ) : null}
        <rect x={left} y={top} width={width} height={height + 48} fill="transparent" pointerEvents="all" />
      </svg>
    </div>
  );
}
