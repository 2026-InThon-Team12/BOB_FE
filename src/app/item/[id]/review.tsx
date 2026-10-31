import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { BarRow, BucketOption, ItemSummary } from '@/components/feature';
import { Button, Card, EmptyState, Icon, Row, Screen, ScreenHeader, Stack, Text, TextLink } from '@/components/ui';
import { CATEGORY_LABELS } from '@/constants/categories';
import { copy } from '@/constants/copy';
import { useReview } from '@/features/review/useReview';
import { goBack } from '@/lib/navigation';
import { makeStyles } from '@/theme';

const useStyles = makeStyles((t) => ({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: t.space[2] },
  cell: { width: '48.5%' },
}));

/** 구매 후 점검 (기능 2, 명세서 4.7) — 구간을 고르면 바로 저장하고 예측과 비교 */
export default function PostCheckScreen() {
  const styles = useStyles();
  const { id } = useLocalSearchParams<{ id: string }>();
  const review = useReview(id);
  const { view } = review;
  const header = <ScreenHeader title={copy.review.title} onBack={() => goBack('/')} backLabel={copy.common.back} />;

  if (!view) {
    return (
      <Screen header={header} edges={['top', 'bottom']}>
        <EmptyState title={copy.result.notFound} action={<Button label={copy.check.toHome} onPress={() => router.replace('/')} />} />
      </Screen>
    );
  }

  const { item } = view;
  const due = view.phase === 'awaitingReview' || view.phase === 'reviewed';
  const range = view.bucket ? copy.review.buckets[view.bucket.id]?.range : '';

  return (
    <Screen header={header} edges={['top', 'bottom']}>
      <ItemSummary
        name={item.name}
        price={item.price}
        category={item.category}
        imageUri={item.imageUri}
        extra={copy.review.sinceBought(view.daysSinceBought)}
      />

      {!due ? (
        <Card tone="subtle">
          <Text variant="label" tone="secondary">
            {copy.review.notDue(view.daysUntilDue)}
          </Text>
        </Card>
      ) : (
        <>
          <Stack gap={2}>
            <Text variant="title">{copy.review.question(item.name, view.window)}</Text>
            <Text variant="label" tone="secondary">
              {copy.review.body}
            </Text>
          </Stack>

          <View style={styles.grid} accessibilityRole="radiogroup">
            {view.buckets.map((b) => (
              <View key={b.id} style={styles.cell}>
                <BucketOption
                  label={copy.review.buckets[b.id].label}
                  range={copy.review.buckets[b.id].range}
                  selected={review.bucketId === b.id}
                  onPress={() => review.pick(b.id)}
                />
              </View>
            ))}
          </View>

          {view.comparison && view.bucket && (
            <Card>
              <Stack gap={4}>
                <Text variant="label" tone="secondary">
                  {copy.review.compareTitle}
                </Text>
                <BarRow
                  label={copy.review.predicted}
                  value={copy.review.daysOf(view.window, copy.report.days(view.predictedDays))}
                  ratio={view.predictedRate}
                  tone="predicted"
                  strong
                />
                <BarRow
                  label={copy.review.actual}
                  value={copy.review.daysOf(view.window, range)}
                  ratio={view.comparison.actualRate}
                  strong
                />
                <Text variant="bodyStrong" weight="700">
                  {view.comparison.verdict.kind === 'muchLess'
                    ? copy.review.verdict.muchLess(view.comparison.verdict.fraction)
                    : copy.review.verdict[view.comparison.verdict.kind]}
                </Text>
              </Stack>
            </Card>
          )}

          {review.saved && (
            <Card padding={4}>
              <Row gap={2}>
                <Icon name="ai" size="sm" tone="brand" />
                <Stack flex={1}>
                  <Text variant="label">{copy.review.reflected(CATEGORY_LABELS[item.category])}</Text>
                </Stack>
                <TextLink label={copy.review.toReport} onPress={() => router.dismissTo('/report')} />
              </Row>
            </Card>
          )}
        </>
      )}
    </Screen>
  );
}
