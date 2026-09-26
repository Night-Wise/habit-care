import AsyncStorage from '@react-native-async-storage/async-storage';
import type { WidgetInfo, WidgetTaskHandlerProps } from 'react-native-android-widget';

import type { Todo } from '@/context/todos-context';
import { buildCurrentMonthActivityHeatmap } from '@/utils/monthly-activity-heatmap';
import { buildMonthlyHeatmapWidgetViews } from '@/widgets/build-heatmap-widget-views';
import {
  MONTHLY_HEATMAP_WIDGET_NAME,
  TODOS_STORAGE_KEY,
} from '@/widgets/constants';
import { getMonthlyHeatmapWidgetPrefs } from '@/widgets/widget-prefs';

function parseTodos(raw: string | null): Todo[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((t: Partial<Todo> & { id?: string }) => ({
      id: String(t.id ?? ''),
      name: typeof t.name === 'string' ? t.name : '',
      icon: typeof t.icon === 'string' ? t.icon : 'circle',
      completions:
        t.completions && typeof t.completions === 'object'
          ? (t.completions as Record<string, boolean>)
          : {},
      completed: typeof t.completed === 'boolean' ? t.completed : undefined,
    }));
  } catch {
    return [];
  }
}

export async function loadMonthlyHeatmapData() {
  const stored = await AsyncStorage.getItem(TODOS_STORAGE_KEY);
  const todos = parseTodos(stored);
  return buildCurrentMonthActivityHeatmap(todos);
}

export function renderMonthlyHeatmapWidget(
  data: Awaited<ReturnType<typeof loadMonthlyHeatmapData>>,
  info: Pick<WidgetInfo, 'width' | 'height'>,
  enabled: boolean,
  theme: Awaited<ReturnType<typeof getMonthlyHeatmapWidgetPrefs>>['theme']
) {
  return buildMonthlyHeatmapWidgetViews(data, info, enabled, theme);
}

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  if (props.widgetInfo.widgetName !== MONTHLY_HEATMAP_WIDGET_NAME) {
    return;
  }

  switch (props.widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED': {
      const [data, prefs] = await Promise.all([
        loadMonthlyHeatmapData(),
        getMonthlyHeatmapWidgetPrefs(),
      ]);
      props.renderWidget(
        renderMonthlyHeatmapWidget(
          data,
          props.widgetInfo,
          prefs.enabled,
          prefs.theme
        )
      );
      break;
    }
    case 'WIDGET_DELETED':
    case 'WIDGET_CLICK':
      break;
  }
}
