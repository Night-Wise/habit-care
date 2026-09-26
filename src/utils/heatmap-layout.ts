export type HeatmapLayout = {
  cell: number;
  gap: number;
  padding: number;
  titleFontSize: number;
  legendFontSize: number;
  legendSwatch: number;
  showTitle: boolean;
  showLegend: boolean;
  borderRadius: number;
};

/** Scale month heatmap to fit an Android widget (or in-app preview) size in dp. */
export function computeHeatmapLayout(
  width: number,
  height: number,
  weekCount: number
): HeatmapLayout {
  const w = Math.max(80, width || 250);
  const h = Math.max(80, height || 180);
  const weeks = Math.max(1, weekCount);

  const showTitle = h >= 100;
  const showLegend = h >= 140 && w >= 140;
  const padding = w < 160 || h < 140 ? 8 : 12;
  const titleBlock = showTitle ? Math.round(h * 0.14) : 0;
  const legendBlock = showLegend ? Math.round(h * 0.12) : 0;

  const availW = Math.max(48, w - padding * 2);
  const availH = Math.max(48, h - padding * 2 - titleBlock - legendBlock);

  const gap = Math.max(2, Math.min(4, Math.floor(Math.min(availW, availH) / 50)));
  const cellW = Math.floor((availW - (weeks - 1) * gap) / weeks);
  const cellH = Math.floor((availH - 6 * gap) / 7);
  const cell = Math.max(6, Math.min(cellW, cellH, 32));

  return {
    cell,
    gap,
    padding,
    titleFontSize: showTitle ? Math.max(11, Math.min(16, Math.round(cell * 1.1))) : 0,
    legendFontSize: 10,
    legendSwatch: Math.max(8, Math.min(12, Math.round(cell * 0.7))),
    showTitle,
    showLegend,
    borderRadius: Math.max(10, Math.min(16, Math.round(Math.min(w, h) * 0.06))),
  };
}
