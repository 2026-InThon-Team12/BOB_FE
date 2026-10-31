import { router, useLocalSearchParams } from 'expo-router';

import { BarRow, ItemSummary } from '@/components/feature';
import { Button, Card, EmptyState, Icon, Row, Screen, ScreenHeader, Stack, Text, TextLink } from '@/components/ui';
import { CATEGORY_LABELS } from '@/constants/categories';
import { copy, reflectionCopy } from '@/constants/copy';
import { useReview } from '@/features/review/useReview';
import { goBack } from '@/lib/navigation';

/** New purchase reflections use the daily swipe flow; old usage records remain readable. */
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

      <Button label={reflectionCopy.postAction} variant="secondary" onPress={()=>router.push('/check')}/>
      {item.purchase?.reviewStart && <Text tone="secondary">{reflectionCopy.window(item.purchase.reviewStart,item.purchase.reviewEnd)}</Text>}
      <Text tone="secondary">{reflectionCopy.postSwipeNotice}</Text>
      {review.saved && (
        <>
          <Text variant="label">{reflectionCopy.legacyReview}</Text>
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
