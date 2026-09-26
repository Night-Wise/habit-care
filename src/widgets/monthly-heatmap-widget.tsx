'use no memo';

import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

import { computeHeatmapLayout } from '@/utils/heatmap-layout';
import {
  getHeatmapColor,
  HEATMAP_COLORS,
  HEATMAP_COLORS_DARK,
  type HeatmapCell,
  type MonthlyActivityHeatmap,
} from '@/utils/monthly-activity-heatmap';

type Props = {
  data: MonthlyActivityHeatmap;
  dark?: boolean;
  /** Widget size in dp from WidgetInfo */
  width?: number;
  height?: number;
  enabled?: boolean;
};

function Cell({
  cell,
  dark,
  size,
  radius,
}: {
  cell: HeatmapCell;
  dark: boolean;
  size: number;
  radius: number;
}) {
  if (cell.kind === 'empty') {
    return (
      <FlexWidget
        style={{
          width: size,
          height: size,
          backgroundColor: '#00000000',
        }}
      />
    );
  }

  return (
    <FlexWidget
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        backgroundColor: getHeatmapColor(cell, dark),
      }}
    />
  );
}

function LegendSwatch({ color, size }: { color: string; size: number }) {
  return (
    <FlexWidget
      style={{
        width: size,
        height: size,
        borderRadius: 2,
        backgroundColor: color as `#${string}`,
      }}
    />
  );
}

export function MonthlyHeatmapWidget({
  data,
  dark = false,
  width = 250,
  height = 180,
  enabled = true,
}: Props) {
  const palette = dark ? HEATMAP_COLORS_DARK : HEATMAP_COLORS;
  const bg = dark ? '#0d1117' : '#ffffff';
  const titleColor = dark ? '#e6edf3' : '#1f2328';
  const mutedColor = dark ? '#8b949e' : '#656d76';
  const layout = computeHeatmapLayout(width, height, data.weeks.length);
  const cellRadius = Math.max(2, Math.round(layout.cell * 0.2));

  if (!enabled) {
    return (
      <FlexWidget
        style={{
          height: 'match_parent',
          width: 'match_parent',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: bg,
          borderRadius: layout.borderRadius,
          padding: layout.padding,
        }}
        accessibilityLabel="Monthly activity widget disabled"
      >
        <TextWidget
          text="Widget off"
          style={{
            fontSize: 14,
            fontWeight: '600',
            color: titleColor,
            marginBottom: 4,
          }}
        />
        <TextWidget
          text="Enable in HabitCare Settings"
          style={{
            fontSize: 11,
            color: mutedColor,
            textAlign: 'center',
          }}
        />
      </FlexWidget>
    );
  }

  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: bg,
        borderRadius: layout.borderRadius,
        padding: layout.padding,
      }}
      accessibilityLabel={`${data.title} activity heatmap`}
    >
      {layout.showTitle ? (
        <TextWidget
          text={data.title}
          style={{
            fontSize: layout.titleFontSize,
            fontWeight: '600',
            color: titleColor,
            marginBottom: 6,
          }}
        />
      ) : null}

      <FlexWidget
        style={{
          flexDirection: 'row',
          flexGap: layout.gap,
          flexGapColor: '#00000000',
        }}
      >
        {data.weeks.map((column, weekIndex) => (
          <FlexWidget
            key={`w-${weekIndex}`}
            style={{
              flexDirection: 'column',
              flexGap: layout.gap,
              flexGapColor: '#00000000',
            }}
          >
            {column.map((cell, dayIndex) => (
              <Cell
                key={`c-${weekIndex}-${dayIndex}`}
                cell={cell}
                dark={dark}
                size={layout.cell}
                radius={cellRadius}
              />
            ))}
          </FlexWidget>
        ))}
      </FlexWidget>

      {layout.showLegend ? (
        <FlexWidget
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: 8,
            flexGap: 4,
            flexGapColor: '#00000000',
          }}
        >
          <TextWidget
            text="Less"
            style={{
              fontSize: layout.legendFontSize,
              color: mutedColor,
              marginRight: 2,
            }}
          />
          <LegendSwatch color={palette.level0} size={layout.legendSwatch} />
          <LegendSwatch color={palette.level1} size={layout.legendSwatch} />
          <LegendSwatch color={palette.level2} size={layout.legendSwatch} />
          <LegendSwatch color={palette.level3} size={layout.legendSwatch} />
          <LegendSwatch color={palette.level4} size={layout.legendSwatch} />
          <TextWidget
            text="More"
            style={{
              fontSize: layout.legendFontSize,
              color: mutedColor,
              marginLeft: 2,
            }}
          />
        </FlexWidget>
      ) : null}
    </FlexWidget>
  );
}
