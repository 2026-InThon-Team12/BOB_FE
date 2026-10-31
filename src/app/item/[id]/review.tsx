import { router, useLocalSearchParams } from 'expo-router';

import { BarRow, ItemSummary } from '@/components/feature';
import { Button, Card, EmptyState, Icon, Row, Screen, ScreenHeader, Stack, Text, TextLink } from '@/components/ui';
import { copy, reflectionCopy } from '@/constants/copy';
import { useReview } from '@/features/review/useReview';
import { goBack } from '@/lib/navigation';

/** One usage review after the first two weeks; completed records stay readable. */
export default function PostCheckScreen() {
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

      {view.daysUntilDue > 0
        ? <Text>{copy.review.notDue(view.daysUntilDue)}</Text>
        : !review.saved && <Card><Stack gap={3}>
          <Text variant="heading">{copy.review.question(item.name,view.window)}</Text>
          <Text tone="secondary">{copy.review.pick}</Text>
          {view.buckets.map(bucket=><Button key={bucket.id} label={copy.review.buckets[bucket.id].label} variant="secondary" disabled={review.busy} onPress={()=>{void review.submit(bucket.id);}}/>)}
          {review.busy && <Text>{copy.review.saving}</Text>}
          {review.error && <Text tone="warning">{review.error}</Text>}
        </Stack></Card>}
      {item.purchase?.reviewStart && <Text tone="secondary">{reflectionCopy.window(item.purchase.reviewStart,item.purchase.reviewEnd)}</Text>}
      {review.saved && (
        <>
          <Text variant="label">{copy.review.done}</Text>
          <Text>{view.bucket ? copy.review.buckets[view.bucket.id]?.label : ''}</Text>
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
                  <Text variant="label">{copy.review.recorded}</Text>
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
