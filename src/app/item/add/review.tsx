import { Redirect, router } from 'expo-router';

import { DraftRowCard } from '@/components/feature';
import { Button, Screen, ScreenHeader, Stack, Text, TextLink, useToast } from '@/components/ui';
import { copy } from '@/constants/copy';
import { useDraftReview } from '@/features/register/useDraftReview';
import { goBack } from '@/lib/navigation';

/** 인식 결과 확인·수정 (시안 "N개 품목을 찾았어요") — 직접 입력도 이 화면에서 */
export default function ReviewDraftsScreen() {
  const review = useDraftReview();
  const toast = useToast();

  // 등록 흐름 밖에서 주소로 바로 들어온 경우
  if (review.rows.length === 0 && !review.registering) return <Redirect href="/item/add" />;

  const register = async () => {
    // 0개면 버튼을 막지 않고 안내 토스트 (명세서 4.3)
    if (review.includedCount === 0) return toast(copy.register.registerNone);
    if ((await review.register()) > 0) router.replace('/item/add/reasons');
  };

  return (
    <Screen
      edges={['top', 'bottom']}
      header={<ScreenHeader onBack={() => goBack('/item/add')} backLabel={copy.common.back} />}
      footer={
        <Stack gap={2}>
          <Button
            label={copy.register.registerButton(review.includedCount)}
            size="lg"
            fullWidth
            loading={review.registering}
            onPress={register}
          />
        </Stack>
      }
    >
      <Stack gap={2}>
        <Text variant="title">
          {review.fromScreenshot ? copy.register.foundTitle(review.rows.length) : copy.register.manualReviewTitle}
        </Text>
        <Text variant="label" tone="secondary">
          {copy.register.reviewBody}
        </Text>
      </Stack>

      {review.rows.map((row) => (
        <DraftRowCard
          key={row.key}
          name={row.name}
          price={row.price}
          category={row.category}
          imageUri={row.imageUri}
          included={row.included}
          reviewNote={row.selectionUncertain ? '장바구니 체크 여부를 확실히 읽지 못했어요. 가져올 상품이면 직접 체크해 주세요.' : row.reviewFields?.length ? `확인이 필요한 정보: ${row.reviewFields.map(f=>({name:'상품명',price:'가격',image:'사진',selection:'체크 여부'}[f] ?? f)).join(', ')}. 원본과 비교해 수정해 주세요.` : undefined}
          days={row.days}
          aiPicked={row.aiPicked}
          suggesting={row.suggesting}
          expanded={row.expanded}
          errors={row.errors}
          onToggleExpanded={() => review.toggleExpanded(row.key)}
          onIncludedChange={(v) => review.setIncluded(row.key, v)}
          onNameChange={(v) => review.setName(row.key, v)}
          onPriceChange={(v) => review.setPrice(row.key, v)}
          onCategoryChange={(c) => review.setCategory(row.key, c)}
          onRemove={() => review.removeRow(row.key)}
        />
      ))}

      <TextLink label={copy.register.addRow} icon="add" onPress={review.addRow} />
      <Text variant="caption" tone="tertiary">
        {copy.register.bandsNote}
      </Text>
    </Screen>
  );
}
