import { Platform } from 'react-native';

import type { Todo } from '@/context/todos-context';
import { buildCurrentMonthActivityHeatmap } from '@/utils/monthly-activity-heatmap';
import { MONTHLY_HEATMAP_WIDGET_NAME } from '@/widgets/constants';
import { getMonthlyHeatmapWidgetPrefs } from '@/widgets/widget-prefs';

/** Push the latest month heatmap to any Android home-screen widgets. */
export function syncMonthlyHeatmapWidget(todos: Todo[]) {
  if (Platform.OS !== 'android') return;

  const data = buildCurrentMonthActivityHeatmap(todos);

  void Promise.all([
    import('react-native-android-widget'),
    import('@/widgets/build-heatmap-widget-views'),
    getMonthlyHeatmapWidgetPrefs(),
  ])
    .then(
      ([{ requestWidgetUpdate }, { buildMonthlyHeatmapWidgetViews }, prefs]) =>
        requestWidgetUpdate({
          widgetName: MONTHLY_HEATMAP_WIDGET_NAME,
          renderWidget: (info) =>
            buildMonthlyHeatmapWidgetViews(
              data,
              info,
              prefs.enabled,
              prefs.theme
            ),
          widgetNotFound: () => {
            // No widget on the home screen — nothing to do.
          },
        })
    )
    .catch((e) => {
      console.warn('[MonthlyHeatmapWidget] Failed to update widget:', e);
    });
}
