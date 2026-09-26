import React from 'react';
import type { WidgetInfo } from 'react-native-android-widget';

import type { MonthlyActivityHeatmap } from '@/utils/monthly-activity-heatmap';
import { MonthlyHeatmapWidget } from '@/widgets/monthly-heatmap-widget';
import type { WidgetThemeMode } from '@/widgets/widget-prefs';

type Size = Pick<WidgetInfo, 'width' | 'height'>;

/**
 * Builds light + dark RemoteViews payloads.
 * - system: real light/dark variants (Android picks via night mode)
 * - light / dark: same look in both slots so it stays fixed vs system theme
 */
export function buildMonthlyHeatmapWidgetViews(
  data: MonthlyActivityHeatmap,
  info: Size,
  enabled: boolean,
  theme: WidgetThemeMode
) {
  const lightView = (
    <MonthlyHeatmapWidget
      data={data}
      dark={false}
      width={info.width}
      height={info.height}
      enabled={enabled}
    />
  );
  const darkView = (
    <MonthlyHeatmapWidget
      data={data}
      dark
      width={info.width}
      height={info.height}
      enabled={enabled}
    />
  );

  if (theme === 'light') {
    return { light: lightView, dark: lightView };
  }
  if (theme === 'dark') {
    return { light: darkView, dark: darkView };
  }
  return { light: lightView, dark: darkView };
}
