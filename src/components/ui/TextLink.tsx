import { Pressable } from 'react-native';

import { useTheme } from '@/theme';

import { Icon, type IconName } from './Icon';
import { Row } from './Stack';
import { Text, type TextTone } from './Text';

type Props = {
  label: string;
  onPress: () => void;
  icon?: IconName;
  tone?: TextTone;
};

/** 글자만 있는 작은 버튼 (시안: "목표 바꾸기", "+ 물건 등록", "리포트") */
export function TextLink({ label, onPress, icon, tone = 'brand' }: Props) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={theme.layout.hitSlop}
      style={({ pressed }) => pressed && { opacity: theme.motion.pressedOpacity }}
    >
      <Row gap={1}>
        {icon && <Icon name={icon} size="sm" tone={tone} />}
        <Text variant="label" weight="600" tone={tone}>
          {label}
        </Text>
      </Row>
    </Pressable>
  );
}
