import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Animated, View } from 'react-native';

import {
  AnswerButtons,
  behindCardStyle,
  QuestionCard,
  SwipeCard,
  swipeStrength,
  type SwipeCardHandle,
  type SwipeDirection,
} from '@/components/feature';
import { Button, Card, EmptyState, Icon, Row, Screen, ScreenHeader, SegmentedProgress, Stack, Text } from '@/components/ui';
import { copy } from '@/constants/copy';
import { useTodayCheck } from '@/features/simulation/useTodayCheck';
import type { TodayEntry } from '@/features/simulation/useTodayQuestions';
import { goBack } from '@/lib/navigation';
import { makeStyles, useTheme } from '@/theme';

/** 선택지 순서(0 있었어요 · 1 딱히 없었어요 · 2 잘 모르겠어요) ↔ 스와이프 방향 */
const DIRECTION_OF: SwipeDirection[] = ['right', 'left', 'up'];
const OPTION_OF: Record<SwipeDirection, number> = { right: 0, left: 1, up: 2 };
const LABELS = copy.check.answerLabels;

const useStyles = makeStyles((t) => ({
  stack: { flex: 1, justifyContent: 'center' },
  behind: { position: 'absolute', left: 0, right: 0 },
  summaryRow: { paddingVertical: t.space[2], borderBottomWidth: 1, borderBottomColor: t.color.border.default },
}));

function EntryCard({ entry }: { entry: TodayEntry }) {
  return (
    <QuestionCard
      name={entry.item.name}
      imageUri={entry.item.imageUri}
      meta={copy.check.meta(entry.categoryLabel, entry.day, entry.totalDays)}
      question={entry.text}
      emphasis={entry.emphasis ? copy.check.emphasis(entry.categoryLabel, entry.emphasis.ratio) : undefined}
    />
  );
}

/** 오늘의 질문 (기능 1, 명세서 4.5) — 카드를 스와이프하거나 버튼으로 답한다 */
export default function TodayCheckScreen() {
  const theme = useTheme();
  const styles = useStyles();
  const check = useTodayCheck();
  const swipeRef = useRef<SwipeCardHandle>(null);
  const [position] = useState(() => new Animated.ValueXY());
  const close = () => goBack('/');

  const header = (
    <ScreenHeader
      title={copy.check.title}
      onBack={close}
      backIcon="close"
      backLabel={copy.check.close}
      right={
        check.progress.total > 0 && (
          <Text variant="label" tone="tertiary">
            {`${check.progress.current}/${check.progress.total}`}
          </Text>
        )
      }
    />
  );

  if (check.progress.total === 0) {
    return (
      <Screen header={header} edges={['top', 'bottom']}>
        <EmptyState
          icon="check"
          title={copy.check.emptyTitle}
          description={copy.check.emptyBody}
          action={<Button label={copy.check.toHome} onPress={() => router.replace('/')} />}
        />
      </Screen>
    );
  }

  if (check.done) {
    const first = check.resultsReady[0];
    return (
      <Screen
        header={header}
        edges={['top', 'bottom']}
        footer={
          <Stack gap={2}>
            {first && (
              <Button
                label={copy.check.toResult}
                size="lg"
                fullWidth
                onPress={() => router.replace({ pathname: '/item/[id]/result', params: { id: first.id } })}
              />
            )}
            <Button
              label={copy.check.toHome}
              variant={first ? 'ghost' : 'primary'}
              size={first ? 'md' : 'lg'}
              fullWidth
              onPress={() => router.replace('/')}
            />
          </Stack>
        }
      >
        <SegmentedProgress total={check.progress.total} filled={check.progress.total} />
        <Stack align="center" gap={3} paddingY={8}>
          <Icon name="check" size="xl" tone="brand" />
          <Text variant="title">{copy.check.doneTitle}</Text>
          <Text tone="secondary">{copy.check.doneBody}</Text>
        </Stack>
        <Card>
          <Text variant="label" tone="secondary">
            {copy.check.doneSummary}
          </Text>
          {check.answered.map((a) => (
            <Row key={a.itemId} justify="space-between" style={styles.summaryRow}>
              <Text variant="bodyStrong" numberOfLines={1}>
                {a.name}
              </Text>
              <Text variant="label" tone={a.label === LABELS[0] ? 'brand' : 'secondary'}>
                {a.label}
              </Text>
            </Row>
          ))}
        </Card>
        {check.resultsReady.length > 0 && (
          <Text variant="label" tone="brand" align="center">
            {copy.check.doneResults(check.resultsReady.length)}
          </Text>
        )}
      </Screen>
    );
  }

  const entry = check.current!;
  const strengths = [
    swipeStrength(position, 'right'),
    swipeStrength(position, 'left'),
    swipeStrength(position, 'up'),
  ] as const;

  return (
    <Screen header={header} scroll={false} edges={['top', 'bottom']}>
      <SegmentedProgress
        total={check.progress.total}
        filled={check.progress.answered}
        accessibilityLabel={`${check.progress.current}/${check.progress.total}`}
      />
      <View style={styles.stack}>
        {check.upcoming && (
          <Animated.View style={[styles.behind, behindCardStyle(position)]} pointerEvents="none">
            <EntryCard entry={check.upcoming} />
          </Animated.View>
        )}
        <SwipeCard
          key={entry.item.id}
          ref={swipeRef}
          position={position}
          overlays={{
            right: { label: LABELS[0], icon: 'check', color: theme.color.brand.solid },
            left: { label: LABELS[1], icon: 'close', color: theme.color.swipeNo },
            up: { label: LABELS[2], icon: 'help', color: theme.color.warning.solid },
          }}
          onSwipe={(dir) => check.answer(OPTION_OF[dir])}
        >
          <EntryCard entry={entry} />
        </SwipeCard>
      </View>
      <AnswerButtons
        labels={LABELS}
        hints={copy.check.swipeHints}
        strengths={strengths}
        onAnswer={(option) => swipeRef.current?.swipe(DIRECTION_OF[option])}
      />
    </Screen>
  );
}
