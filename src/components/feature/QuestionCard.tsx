import { View } from 'react-native';

import { Card, Icon, Row, Stack, Text, Thumbnail } from '@/components/ui';
import { copy } from '@/constants/copy';
import { makeStyles } from '@/theme';

type Props = {
  name: string;
  imageUri?: string;
  meta: string;
  question: string;
  /** 과대예측 분야 안내 (시안 주황 박스) */
  emphasis?: string;
};

const useStyles = makeStyles((t) => ({
  body: { minHeight: 420 },
  divider: { height: 1, backgroundColor: t.color.border.default },
  emphasis: {
    flexDirection: 'row',
    gap: t.space[2],
    padding: t.space[3],
    borderRadius: t.radius.md,
    backgroundColor: t.color.warning.subtle,
  },
}));

/** 오늘의 질문 카드 내용 (시안: 물건 · 시뮬레이션 N일째 · 질문) */
export function QuestionCard({ name, imageUri, meta, question, emphasis }: Props) {
  const styles = useStyles();
  return (
    <Card floating>
      <View style={styles.body}>
        <Stack gap={4} flex={1}>
          <Row gap={3}>
            <Thumbnail uri={imageUri} placeholder={copy.common.imagePlaceholder} />
            <Stack flex={1} gap={1}>
              <Text variant="heading" numberOfLines={1}>
                {name}
              </Text>
              <Text variant="caption" tone="secondary">
                {meta}
              </Text>
            </Stack>
          </Row>
          <View style={styles.divider} />
          <Text variant="label" tone="secondary">
            {copy.check.imagine}
          </Text>
          <Stack flex={1}>
            <Text variant="title">{question}</Text>
          </Stack>
          {emphasis && (
            <View style={styles.emphasis}>
              <Icon name="ai" size="sm" tone="warning" />
              <Stack flex={1}>
                <Text variant="caption" tone="primary">
                  {emphasis}
                </Text>
              </Stack>
            </View>
          )}
        </Stack>
      </View>
    </Card>
  );
}
