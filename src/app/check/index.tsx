import { useFirstVisitHelp } from '@/features/help/useFirstVisitHelp';
import { router } from 'expo-router';
import { View } from 'react-native';

import { ReflectionAnswerForm } from '@/components/feature/ReflectionAnswerForm';
import { ReflectionCompletion } from '@/components/feature/ReflectionCompletion';
import { ReflectionSwipe, isThreeWay } from '@/components/feature/ReflectionSwipe';
import { Button, Card, Row, Screen, ScreenHeader, SegmentedProgress, Stack, Text, Thumbnail } from '@/components/ui';
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

/** DailyCheck card layout, retaining each AI question's actual answer schema. */
export default function TodayCheckScreen() {
  const check = useTodayCheck();
  const styles = useStyles();
  const entry = check.current;
  useFirstVisitHelp('daily', !check.loading && !!entry && entry.question.phase === 'pre');
  const total = check.answered.length + check.entries.length;

  return (
    <Screen
      header={<ScreenHeader
        title={reflectionCopy.todayTitle}
        onBack={() => goBack('/')}
        backIcon="close"
        backLabel={copy.common.back}
        right={total > 0 ? <Text variant="label" tone="secondary">{check.answered.length} / {total}</Text> : undefined}
      />}
      edges={['top', 'bottom']}
    >
      {total > 0 && !!entry && <SegmentedProgress total={total} filled={check.answered.length} accessibilityLabel={reflectionCopy.todayTitle} />}
      {check.loading ? (
        <Card><Text tone="secondary">{reflectionCopy.loadingQuestions}</Text></Card>
      ) : check.error ? (
        <Card tone="warning"><Stack><Text tone="warning">{check.error}</Text><Button label={reflectionCopy.retry} onPress={check.retry} /></Stack></Card>
      ) : entry ? (
        <ReflectionSwipe key={entry.question.id} spec={entry.question.answerSpec as AnswerSpec} onAnswer={check.answer}><Card floating>
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
            {!isThreeWay(entry.question.answerSpec as AnswerSpec) && <ReflectionAnswerForm key={entry.question.id} spec={entry.question.answerSpec as AnswerSpec} onAnswer={check.answer} />}
            <Text variant="caption" tone="tertiary">{entry.question.generationMethod === 'AI' ? reflectionCopy.aiQuestion : reflectionCopy.fallbackQuestion}</Text>
          </Stack>
        </Card></ReflectionSwipe>
      ) : (
        <ReflectionCompletion answers={check.answered} onEdit={check.edit} />
      )}
      {check.editing && <Button label={reflectionCopy.cancelEdit} variant="ghost" onPress={check.cancelEdit} />}
      {!entry && !check.loading && !check.error && <>
        {check.awaitingDecision.map(item => <Button key={item.id} label={reflectionCopy.result(item.name)} onPress={() => router.push({ pathname: '/item/[id]/result', params: { id: item.id } })} />)}
        <Button label={reflectionCopy.home} onPress={() => router.replace('/')} />
      </>}
    </Screen>
  );
}
