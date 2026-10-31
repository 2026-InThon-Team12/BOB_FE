import { useFirstVisitHelp } from '@/features/help/useFirstVisitHelp';
import { router } from 'expo-router';
import { View } from 'react-native';
import { useState } from 'react';

import { ReflectionSwipe } from '@/components/feature/ReflectionSwipe';
import { isSwipeQuestion } from '@/lib/reflection';
import { Button, Card, EmptyState, Row, Screen, ScreenHeader, SegmentedProgress, Stack, Text, Thumbnail } from '@/components/ui';
import { CATEGORY_LABELS } from '@/constants/categories';
import { copy, reflectionCopy } from '@/constants/copy';
import type { AnswerSpec } from '@/data';
import { useTodayCheck } from '@/features/simulation/useTodayCheck';
import { formatWon } from '@/lib/format';
import { goBack } from '@/lib/navigation';
import { makeStyles } from '@/theme';

const useStyles = makeStyles((t) => ({
  divider: { height: 1, backgroundColor: t.color.border.divider },
  question: { minHeight: t.space[12] * 2, justifyContent: 'center' },
}));

/** Purchase reflection cards use one three-direction swipe contract. */
export default function TodayCheckScreen() {
  const check = useTodayCheck();
  const [cardTouching, setCardTouching] = useState(false);
  const styles = useStyles();
  const entry = check.current;
  useFirstVisitHelp('daily', !check.loading && !!entry && entry.question.phase === 'pre');
  const total = check.answered.length + check.entries.length;

  return (
    <Screen
      scrollEnabled={!cardTouching}
      header={<ScreenHeader
        title={reflectionCopy.todayTitle}
        onBack={() => goBack('/')}
        backIcon="close"
        backLabel={copy.common.back}
        right={total > 0 ? <Text variant="label" tone="secondary">{check.answered.length} / {total}</Text> : undefined}
      />}
      edges={['top', 'bottom']}
    >
      {total > 0 && <SegmentedProgress total={total} filled={check.answered.length} accessibilityLabel={reflectionCopy.todayTitle} />}
      {check.loading ? (
        <Card><Text tone="secondary">{reflectionCopy.loadingQuestions}</Text></Card>
      ) : check.error ? (
        <Card tone="warning"><Stack><Text tone="warning">{check.error}</Text><Button label={reflectionCopy.retry} onPress={check.retry} /></Stack></Card>
      ) : entry && !isSwipeQuestion(entry.question) ? (
        <Card><Stack>
          <Text variant="title">{entry.text}</Text>
          <Text>{check.answered.find(a => a.questionId === entry.question.id)?.label}</Text>
          <Text tone="secondary">{reflectionCopy.legacyAnswer}</Text>
          <Button label={copy.common.close} onPress={() => check.edit(null)} />
        </Stack></Card>
      ) : entry ? (
        <ReflectionSwipe key={entry.question.id} spec={entry.question.answerSpec as AnswerSpec} onAnswer={check.answer} onGestureActiveChange={setCardTouching}><Card floating>
          <Stack gap={4}>
            <Row gap={3}>
              <Thumbnail uri={entry.item.imageUri} placeholder={copy.common.imagePlaceholder} />
              <Stack flex={1} gap={1}>
                <Text variant="heading" numberOfLines={2}>{entry.item.name}</Text>
                <Text variant="caption" tone="tertiary">{CATEGORY_LABELS[entry.item.category]} · {formatWon(entry.item.price)}</Text>
              </Stack>
            </Row>
            <View style={styles.divider} />
            <Text variant="label" tone="secondary">{entry.question.phase === 'post' ? reflectionCopy.post : reflectionCopy.pre}</Text>
            <View style={styles.question}><Text variant="title">{entry.text}</Text></View>
            {entry.question.reference && <Text tone="secondary">{entry.question.reference}</Text>}
            <Text variant="caption" tone="secondary">{reflectionCopy.swipeHint}</Text>
            <Text variant="caption" tone="tertiary">{entry.question.generationMethod === 'AI' ? reflectionCopy.aiQuestion : reflectionCopy.fallbackQuestion}</Text>
          </Stack>
        </Card></ReflectionSwipe>
      ) : (
        <Card><EmptyState icon="check" title={reflectionCopy.allAnswered} /></Card>
      )}
      {check.answered.map(a => <Button key={a.questionId} variant="ghost" label={a.readOnly ? reflectionCopy.viewAnswer(a.name,a.label) : reflectionCopy.edit(a.name, a.label)} onPress={() => check.edit(a.questionId)} />)}
      {check.awaitingDecision.map(item => <Button key={item.id} label={reflectionCopy.result(item.name)} onPress={() => router.push({ pathname: '/item/[id]/result', params: { id: item.id } })} />)}
      <Button label={reflectionCopy.home} variant="ghost" onPress={() => router.replace('/')} />
    </Screen>
  );
}
