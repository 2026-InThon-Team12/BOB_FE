import { useState } from "react";
import { Pressable, View } from "react-native";

import { addMonths, daysInMonth } from "@/lib/date";
import { makeStyles, useTheme } from "@/theme";

import { Icon } from "./Icon";
import { Row } from "./Stack";
import { Text } from "./Text";

type Props = {
  /** 선택한 날짜 YYYY-MM-DD */
  value?: string;
  /** 이 날짜 이전은 고를 수 없다 (오늘) */
  minDate: string;
  maxDate?: string;
  onChange: (date: string) => void;
  weekdayLabels: readonly string[];
  monthLabel: (monthKey: string) => string;
  prevLabel: string;
  nextLabel: string;
};

const useStyles = makeStyles((t) => ({
  grid: { flexDirection: "row", flexWrap: "wrap" },
  cell: {
    width: `${100 / 7}%`,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    width: 36,
    height: 36,
    borderRadius: t.radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  nav: { padding: t.space[2] },
}));

const pad = (n: number) => String(n).padStart(2, "0");

/** 명세서 InlineCalendar: 월 이동, 오늘 이전 비활성, 선택일 buy 원형 */
export function InlineCalendar({
  value,
  minDate,
  maxDate,
  onChange,
  weekdayLabels,
  monthLabel,
  prevLabel,
  nextLabel,
}: Props) {
  const theme = useTheme();
  const styles = useStyles();
  const [month, setMonth] = useState((value ?? minDate).slice(0, 7));
  const [y, m] = month.split("-").map(Number);
  const firstWeekday = new Date(y, m - 1, 1).getDay();
  const days = daysInMonth(month);
  const canPrev = month > minDate.slice(0, 7);
  const canNext = !maxDate || month < maxDate.slice(0, 7);

  const cells: (string | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: days }, (_, i) => `${month}-${pad(i + 1)}`),
  ];

  return (
    <View>
      <Row justify="space-between">
        <Pressable
          onPress={() => canPrev && setMonth(addMonths(month, -1))}
          disabled={!canPrev}
          accessibilityRole="button"
          accessibilityLabel={prevLabel}
          style={[
            styles.nav,
            !canPrev && { opacity: theme.motion.disabledOpacity },
          ]}
        >
          <Icon name="back" size="sm" />
        </Pressable>
        <Text variant="bodyStrong">{monthLabel(month)}</Text>
        <Pressable
          disabled={!canNext}
          onPress={() => canNext && setMonth(addMonths(month, 1))}
          accessibilityRole="button"
          accessibilityLabel={nextLabel}
          style={styles.nav}
        >
          <Icon name="chevronRight" size="sm" />
        </Pressable>
      </Row>
      <View style={styles.grid}>
        {weekdayLabels.map((w) => (
          <View key={w} style={styles.cell}>
            <Text variant="caption" tone="tertiary">
              {w}
            </Text>
          </View>
        ))}
        {cells.map((date, i) => {
          if (!date) return <View key={`b${i}`} style={styles.cell} />;
          const disabled = date < minDate || (!!maxDate && date > maxDate);
          const selected = date === value;
          return (
            <Pressable
              key={date}
              onPress={() => onChange(date)}
              disabled={disabled}
              accessibilityRole="button"
              accessibilityState={{ selected, disabled }}
              accessibilityLabel={date}
              style={styles.cell}
            >
              <View
                style={[
                  styles.dot,
                  selected && { backgroundColor: theme.color.brand.solid },
                ]}
              >
                <Text
                  variant="label"
                  tone={
                    selected ? "inverse" : disabled ? "disabled" : "primary"
                  }
                >
                  {Number(date.slice(8))}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
