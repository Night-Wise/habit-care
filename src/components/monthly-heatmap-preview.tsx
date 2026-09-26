import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { computeHeatmapLayout } from '@/utils/heatmap-layout';
import {
  getHeatmapColor,
  HEATMAP_COLORS,
  HEATMAP_COLORS_DARK,
  type MonthlyActivityHeatmap,
} from '@/utils/monthly-activity-heatmap';

type Props = {
  data: MonthlyActivityHeatmap;
  dark?: boolean;
  /** Preview box size in dp */
  width?: number;
  height?: number;
  enabled?: boolean;
};

/** In-app preview that mirrors the Android home-screen widget look. */
export function MonthlyHeatmapPreview({
  data,
  dark = false,
  width = 280,
  height = 200,
  enabled = true,
}: Props) {
  const palette = dark ? HEATMAP_COLORS_DARK : HEATMAP_COLORS;
  const layout = useMemo(
    () => computeHeatmapLayout(width, height, data.weeks.length),
    [width, height, data.weeks.length]
  );
  const cellRadius = Math.max(2, Math.round(layout.cell * 0.2));
  const bg = dark ? '#0d1117' : '#ffffff';
  const titleColor = dark ? '#e6edf3' : '#1f2328';
  const mutedColor = dark ? '#8b949e' : '#656d76';

  if (!enabled) {
    return (
      <View
        style={[
          styles.card,
          {
            width,
            height,
            backgroundColor: bg,
            borderRadius: layout.borderRadius,
            padding: layout.padding,
          },
        ]}
      >
        <Text style={[styles.disabledTitle, { color: titleColor }]}>Widget off</Text>
        <Text style={[styles.disabledSub, { color: mutedColor }]}>
          Enable below to show activity on your home screen
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.card,
        {
          width,
          minHeight: height,
          backgroundColor: bg,
          borderRadius: layout.borderRadius,
          padding: layout.padding,
        },
      ]}
    >
      {layout.showTitle ? (
        <Text
          style={[
            styles.title,
            { color: titleColor, fontSize: layout.titleFontSize, marginBottom: 6 },
          ]}
        >
          {data.title}
        </Text>
      ) : null}

      <View style={[styles.grid, { gap: layout.gap }]}>
        {data.weeks.map((column, weekIndex) => (
          <View key={`w-${weekIndex}`} style={{ gap: layout.gap }}>
            {column.map((cell, dayIndex) => (
              <View
                key={`c-${weekIndex}-${dayIndex}`}
                style={{
                  width: layout.cell,
                  height: layout.cell,
                  borderRadius: cellRadius,
                  backgroundColor:
                    cell.kind === 'empty'
                      ? 'transparent'
                      : getHeatmapColor(cell, dark),
                }}
              />
            ))}
          </View>
        ))}
      </View>

      {layout.showLegend ? (
        <View style={[styles.legend, { marginTop: 8, gap: 4 }]}>
          <Text style={{ fontSize: layout.legendFontSize, color: mutedColor }}>
            Less
          </Text>
          {[
            palette.level0,
            palette.level1,
            palette.level2,
            palette.level3,
            palette.level4,
          ].map((color) => (
            <View
              key={color}
              style={{
                width: layout.legendSwatch,
                height: layout.legendSwatch,
                borderRadius: 2,
                backgroundColor: color,
              }}
            />
          ))}
          <Text style={{ fontSize: layout.legendFontSize, color: mutedColor }}>
            More
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  title: {
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  disabledTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  disabledSub: {
    fontSize: 11,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
});
