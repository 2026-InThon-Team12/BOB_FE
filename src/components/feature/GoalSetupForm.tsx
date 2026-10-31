import { ScrollView, View } from 'react-native';

import { Card, Chip, Icon, Input, MoneyInput, ProgressBar, Row, Stack, Switch, Text } from '@/components/ui';
import { copy } from '@/constants/copy';
import { makeStyles } from '@/theme';

import { PhotoTile } from './PhotoTile';

const useStyles = makeStyles((t) => ({
  divider: { height: 1, backgroundColor: t.color.border.default },
  iconTile: {
    width: 44,
    height: 44,
    borderRadius: t.radius.md,
    backgroundColor: t.color.brand.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  picks: { gap: t.space[2] },
  emptyPreview: {
    padding: t.space[4],
    borderRadius: t.radius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: t.color.border.strong,
  },
}));

/** useGoalSetup 결과 중 폼이 쓰는 부분 */
export type GoalSetupFormModel = {
  current: { goal: { name: string; price: number }; saved: number } | null;
  transfer: boolean;
  setTransfer: (v: boolean) => void;
  name: string;
  setName: (v: string) => void;
  price: number | null;
  setPrice: (v: number | null) => void;
  imageUri?: string;
  photoLoading: boolean;
  pickPhoto: () => void;
  registered: { id: string; name: string; price: number }[];
  pickRegistered: (id: string) => void;
  preview: { carried: number; remaining: number; ratio: number } | null;
};

/**
 * 목표 정하기 본문 (명세서 4.8-1): 질문 → (바꿀 때) 지금 목표 + 옮기기 → 목표 물건 → 미리보기
 * 목표 바꾸기(goals/new)와 온보딩 첫 목표가 함께 쓴다. 헤더·하단 버튼은 화면이 정한다.
 */
export function GoalSetupForm({ form }: { form: GoalSetupFormModel }) {
  const styles = useStyles();

  return (
    <>
      <Stack gap={2}>
        <Text variant="title">{copy.goalSetup.question}</Text>
        <Text variant="label" tone="secondary">
          {copy.goalSetup.subtitle}
        </Text>
      </Stack>

      {/* 바꿀 때만: 지금 목표 + 모은 돈 옮기기 */}
      {form.current && (
        <Card padding={4}>
          <Stack gap={3}>
            <Row gap={3}>
              <View style={styles.iconTile}>
                <Icon name="goal" tone="brand" />
              </View>
              <Stack flex={1} gap={1}>
                <Text variant="caption" tone="secondary">
                  {copy.goalSetup.currentLabel}
                </Text>
                <Text variant="bodyStrong" numberOfLines={1}>
                  {copy.goalSetup.current(
                    form.current.goal.name,
                    form.current.saved,
                    Math.round((form.current.saved / form.current.goal.price) * 100),
                  )}
                </Text>
              </Stack>
            </Row>
            <View style={styles.divider} />
            <Row justify="space-between">
              <Stack flex={1}>
                <Text variant="label" weight="600">
                  {copy.goalSetup.transfer(form.current.saved)}
                </Text>
              </Stack>
              <Switch value={form.transfer} onChange={form.setTransfer} accessibilityLabel={copy.goalSetup.transfer(form.current.saved)} />
            </Row>
          </Stack>
        </Card>
      )}

      {/* 목표 물건 */}
      <Card padding={4}>
        <Stack gap={3}>
          <Text variant="label" weight="700">
            {copy.goalSetup.targetLabel}
          </Text>
          <Row gap={3} align="flex-end">
            <PhotoTile
              uri={form.imageUri}
              loading={form.photoLoading}
              label={copy.goalSetup.photo}
              accessibilityLabel={copy.goalSetup.photoLabel}
              onPress={form.pickPhoto}
            />
            <Stack flex={1}>
              <Input
                label={copy.goalSetup.nameLabel}
                placeholder={copy.goalSetup.namePlaceholder}
                value={form.name}
                onChangeText={form.setName}
              />
            </Stack>
          </Row>
          <MoneyInput label={copy.goalSetup.priceLabel} placeholder="0" value={form.price} onChangeValue={form.setPrice} />
          {form.registered.length > 0 && (
            <Stack gap={2}>
              <Text variant="caption" tone="secondary">
                {copy.goalSetup.pickRegistered}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.picks}>
                {form.registered.map((i) => (
                  <Chip
                    key={i.id}
                    label={copy.goalSetup.registeredChip(i.name, i.price)}
                    selected={form.name === i.name && form.price === i.price}
                    onPress={() => form.pickRegistered(i.id)}
                  />
                ))}
              </ScrollView>
            </Stack>
          )}
        </Stack>
      </Card>

      {/* 미리보기 */}
      {form.preview ? (
        <Card tone="brandSubtle">
          <Stack gap={3}>
            <Text variant="label" weight="600" tone="brand">
              {copy.goalSetup.previewLabel}
            </Text>
            <Text variant="title">
              {form.preview.remaining === 0
                ? copy.goalSetup.previewReached
                : copy.goalSetup.previewRemaining(form.preview.remaining)}
            </Text>
            <ProgressBar value={form.preview.ratio} accessibilityLabel={copy.goalSetup.previewLabel} />
            <Text variant="caption" tone="brand">
              {form.preview.carried > 0 ? copy.goalSetup.startFilled(form.preview.carried) : copy.goalSetup.startEmpty}
            </Text>
          </Stack>
        </Card>
      ) : (
        <View style={styles.emptyPreview}>
          <Text variant="label" tone="secondary">
            {copy.goalSetup.previewEmpty}
          </Text>
        </View>
      )}
    </>
  );
}
