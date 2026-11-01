import { useState } from 'react';

import { Badge, Button, Card, ProgressBar, Row, Stack, Text, TextLink } from '@/components/ui';
import { policy } from '@/config/policy';
import { CATEGORY_LABELS } from '@/constants/categories';
import { reflectionCopy } from '@/constants/copy';
import type { TodayAnswerRow } from '@/lib/calc/todayAnswers';
import { formatWon } from '@/lib/format';
import { makeStyles } from '@/theme';

const useStyles = makeStyles(t => ({
  progress: { width: t.space[12] * 2 },
  heading: { textAlign: 'center' },
}));

type Props = { answers: TodayAnswerRow[]; onEdit: (questionId: string) => void };

export function ReflectionCompletion({ answers, onEdit }: Props) {
  const styles = useStyles();
  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(answers.length / policy.reflectionResultsPageSize));
  const currentPage = Math.min(page, pages - 1);
  const visible = answers.slice(currentPage * policy.reflectionResultsPageSize, (currentPage + 1) * policy.reflectionResultsPageSize);

  return <Stack gap={4}>
    <Stack align="center" gap={3} paddingY={5}>
      <Text variant="display" tone="tertiary">BoB</Text>
      <Text variant="title" style={styles.heading}>{reflectionCopy.allAnswered}</Text>
      <Text variant="label" tone="secondary" style={styles.heading}>{reflectionCopy.completedDescription}</Text>
    </Stack>
    <Stack gap={2}>
      {visible.map(answer => <Card key={answer.questionId} padding={4} tone={answer.finishedToday ? 'brandSubtle' : 'default'}>
        <Stack gap={2}>
          <Row gap={3} justify="space-between">
            <Stack flex={1} gap={1}>
              <Text variant="heading" numberOfLines={2}>{answer.name}</Text>
              <Text variant="caption" tone="secondary">{CATEGORY_LABELS[answer.category]} · {formatWon(answer.price)}</Text>
            </Stack>
            {answer.canOpen && <TextLink label={answer.readOnly ? reflectionCopy.viewSavedAnswer : reflectionCopy.editAnswer} onPress={() => onEdit(answer.questionId)} />}
          </Row>
          {answer.finishedToday && <Text variant="caption" tone="brand">{reflectionCopy.lastObservation}</Text>}
          <Row gap={3}>
            <Stack flex={1}><Badge label={answer.label} tone={answer.positive ? 'brand' : 'neutral'} /></Stack>
            <Stack gap={1} style={styles.progress}>
                <Text variant="caption" tone="secondary">{reflectionCopy.simulationProgress(answer.day, answer.totalDays)}</Text>
                <ProgressBar size="sm" value={answer.totalDays > 0 ? answer.day / answer.totalDays : 0} accessibilityLabel={reflectionCopy.simulationProgress(answer.day, answer.totalDays)} />
            </Stack>
          </Row>
        </Stack>
      </Card>)}
    </Stack>
    {pages > 1 && <Row justify="space-between">
      <Button label={reflectionCopy.previousResults} icon="back" variant="ghost" disabled={currentPage === 0} onPress={() => setPage(currentPage - 1)} />
      <Text variant="caption" tone="secondary">{currentPage + 1} / {pages}</Text>
      <Button label={reflectionCopy.nextResults} icon="chevronRight" variant="ghost" disabled={currentPage === pages - 1} onPress={() => setPage(currentPage + 1)} />
    </Row>}
    <Text variant="caption" tone="tertiary" style={styles.heading}>{reflectionCopy.resultsCount(answers.length)}</Text>
  </Stack>;
}
