import type { ReactNode } from 'react';

import { Icon, type IconName } from './Icon';
import { Stack } from './Stack';
import { Text } from './Text';

type Props = {
  icon?: IconName;
  title: string;
  description?: string;
  /** 하단 버튼 등 */
  action?: ReactNode;
};

export function EmptyState({ icon = 'empty', title, description, action }: Props) {
  return (
    <Stack align="center" gap={3} paddingY={10} paddingX={6}>
      <Icon name={icon} size="xl" tone="tertiary" />
      <Text variant="heading" align="center">
        {title}
      </Text>
      {description && (
        <Text variant="body" tone="secondary" align="center">
          {description}
        </Text>
      )}
      {action}
    </Stack>
  );
}
