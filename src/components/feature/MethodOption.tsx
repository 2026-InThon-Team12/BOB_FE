import { View } from 'react-native';

import { Badge, Card, Icon, Row, Stack, Text, type IconName } from '@/components/ui';
import { makeStyles } from '@/theme';

type Props = {
  icon: IconName;
  title: string;
  body: string;
  badge?: string;
  /** 추천 방법 (파란 테두리) */
  highlighted?: boolean;
  onPress: () => void;
};

const useStyles = makeStyles((t) => ({
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: t.radius.md,
    backgroundColor: t.color.brand.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  neutralIcon: { backgroundColor: t.color.bg.subtle },
}));

/** 시안 "무엇을 사고 싶나요?"의 등록 방법 카드 */
export function MethodOption({ icon, title, body, badge, highlighted, onPress }: Props) {
  const styles = useStyles();
  return (
    <Card selected={highlighted} onPress={onPress} accessibilityLabel={title}>
      <Row gap={3.5} align="flex-start">
        <View style={[styles.iconBox, !highlighted && styles.neutralIcon]}>
          <Icon name={icon} tone={highlighted ? 'brand' : 'primary'} />
        </View>
        <Stack flex={1} gap={1}>
          <Row gap={2}>
            <Text variant="heading">{title}</Text>
            {badge && <Badge label={badge} tone="brandSolid" />}
          </Row>
          <Text variant="label" tone="secondary">
            {body}
          </Text>
        </Stack>
      </Row>
    </Card>
  );
}
