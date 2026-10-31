import { Pressable, View } from 'react-native';

import { BarRow, RateRow, StatTile } from '@/components/feature';
import { Badge, Card, EmptyState, Icon, Row, Screen, Stack, Text, type BadgeTone } from '@/components/ui';
import { copy } from '@/constants/copy';
import { useReport } from '@/features/report/useReport';
import type { TendencyBadge } from '@/lib/calc';
import { formatWonShort } from '@/lib/format';
import { makeStyles, useTheme } from '@/theme';

const useStyles = makeStyles((t) => ({
  legendDot: { width: 10, height: 10, borderRadius: t.space[1] / 2 },
  nav: { padding: t.space[2] },
}));

const badgeOf = (b: TendencyBadge): { label: string; tone: BadgeTone } => {
  if (b.kind === 'over') return { label: copy.report.badge.over(b.ratio), tone: 'warning' };
  if (b.kind === 'slight') return { label: copy.report.badge.slight(b.ratio), tone: 'neutral' };
  return { label: copy.report.badge.accurate, tone: 'brand' };
};

/** 리포트 (기능 2·6, 명세서 4.12) */
export default function ReportScreen() {
  const theme = useTheme();
  const styles = useStyles();
  const r = useReport();

  const monthNav = (
    <Row gap={1}>
      <Pressable onPress={r.prev} accessibilityRole="button" accessibilityLabel={copy.report.prevMonth} style={styles.nav}>
        <Icon name="back" size="sm" />
      </Pressable>
      <Text variant="bodyStrong">{copy.report.monthLabel(r.month)}</Text>
      <Pressable
        onPress={r.next}
        disabled={!r.canNext}
        accessibilityRole="button"
        accessibilityLabel={copy.report.nextMonth}
        style={[styles.nav, !r.canNext && { opacity: theme.motion.disabledOpacity }]}
      >
        <Icon name="chevronRight" size="sm" />
      </Pressable>
    </Row>
  );

  if (r.empty) {
    return (
      <Screen title={copy.report.title} titleAction={monthNav}>
        <EmptyState icon="report" title={copy.report.emptyTitle} description={copy.report.emptyDescription} />
      </Screen>
    );
  }

  return (
    <Screen title={copy.report.title} titleAction={monthNav}>
      <Row gap={2}>
        <StatTile label={copy.report.registered} value={copy.report.count(r.summary.registered)} />
        <StatTile label={copy.report.byeCount} value={copy.report.count(r.summary.byeCount)} />
        <StatTile label={copy.report.saved} value={formatWonShort(r.summary.savedMoney).replace(' 원', '')} tone="brand" />
      </Row>
      <Stack gap={1}>
        <Text variant="label">{copy.report.outsideSpending(r.outsideSpending.count, r.outsideSpending.amount)}</Text>
        <Text variant="caption" tone="secondary">{copy.report.outsideSpendingHint}</Text>
      </Stack>

      {r.finding && (
        <Card tone="inverse">
          <Stack gap={2}>
            <Text variant="label" tone="disabled">
              {copy.report.findingLabel}
            </Text>
            <Text variant="title" tone="inverse">
              {copy.report.findingPre(r.finding.label)}
              {'\n'}
              <Text variant="title" tone="highlightOnInverse">
                {Number.isFinite(r.finding.ratio) ? copy.report.findingRatio(r.finding.ratio) : ''}
              </Text>
              {copy.report.findingPost}
            </Text>
          </Stack>
        </Card>
      )}

      <Card>
        <Stack gap={4}>
          <Row justify="space-between">
            <Text variant="heading">{copy.report.compareTitle}</Text>
            <Row gap={3}>
              <Row gap={1}>
                <View style={[styles.legendDot, { backgroundColor: theme.color.predicted }]} />
                <Text variant="caption" tone="secondary">
                  {copy.report.legendPredicted}
                </Text>
              </Row>
              <Row gap={1}>
                <View style={[styles.legendDot, { backgroundColor: theme.color.brand.solid }]} />
                <Text variant="caption" tone="secondary">
                  {copy.report.legendActual}
                </Text>
              </Row>
            </Row>
          </Row>
          {r.compare.length === 0 ? (
            <Text variant="label" tone="tertiary">
              {copy.report.compareEmpty}
            </Text>
          ) : (
            r.compare.map((c) => {
              const badge = badgeOf(c.badge);
              return (
                <Stack key={c.category} gap={2}>
                  <Row justify="space-between">
                    <Text variant="bodyStrong">{c.label}</Text>
                    <Badge label={badge.label} tone={badge.tone} />
                  </Row>
                  <BarRow value={copy.report.days(c.predictedDays)} ratio={c.predictedRatio} tone="predicted" valueTone="tertiary" />
                  <BarRow value={copy.report.days(c.actualDays)} ratio={c.actualRatio} strong />
                </Stack>
              );
            })
          )}
          <Text variant="caption" tone="tertiary">
            {copy.report.compareHint}
          </Text>
        </Stack>
      </Card>

      <Card>
        <Stack gap={3}>
          <Stack gap={1}>
            <Text variant="heading">{copy.report.reasonTitle}</Text>
            {r.topReason && (
              <Text variant="label" tone="secondary">
                {copy.report.reasonTop(r.topReason.label)}
              </Text>
            )}
          </Stack>
          {r.reasons.length === 0 ? (
            <Text variant="label" tone="tertiary">
              {copy.report.reasonEmpty}
            </Text>
          ) : (
            r.reasons.map((x, i) => (
              <RateRow key={x.reason} label={x.label} rate={x.rate} rateText={copy.report.rate(x.rate)} highlight={i === 0} />
            ))
          )}
        </Stack>
      </Card>
    </Screen>
  );
}
