import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { makeStyles } from '@/theme';

import { Row, Stack } from './Stack';
import { Text } from './Text';

type Props = {
  children: ReactNode;
  /** 스크롤되지 않는 상단 바 (ScreenHeader) */
  header?: ReactNode;
  /** 화면 상단 큰 제목 (탭 화면 등 헤더가 없는 경우) */
  title?: string;
  subtitle?: string;
  /** 큰 제목 오른쪽 동작 (예: "목표 바꾸기") */
  titleAction?: ReactNode;
  /** 기본 true. 카드 스와이프처럼 스크롤이 없어야 하는 화면은 false */
  scroll?: boolean;
  /** 자식 카드의 제스처 동안만 스크롤을 잠근다. ScrollView 자체는 유지한다. */
  scrollEnabled?: boolean;
  /** 화면 하단에 고정되는 영역 (주요 버튼 등) */
  footer?: ReactNode;
  /** 네비게이터 헤더가 상단 안전 영역을 처리하면 ['bottom'] 등으로 바꾼다 */
  edges?: Edge[];
};

const useStyles = makeStyles((t) => ({
  root: { flex: 1, backgroundColor: t.color.bg.canvas },
  content: { padding: t.space[5], gap: t.space[3] },
  fill: { flex: 1 },
  footer: {
    paddingHorizontal: t.space[5],
    paddingVertical: t.space[3],
    borderTopWidth: 1,
    borderTopColor: t.color.border.navigation,
    backgroundColor: t.color.bg.surface,
  },
}));

/** 모든 화면의 바깥 틀. 배경, 안전 영역, 기본 여백, 스크롤을 맡는다. */
export function Screen({
  children,
  header: topBar,
  title,
  subtitle,
  titleAction,
  scroll = true,
  scrollEnabled = true,
  footer,
  edges = ['top'],
}: Props) {
  const styles = useStyles();

  const header = (title || subtitle) && (
    <Stack gap={1}>
      {title && (
        <Row justify="space-between">
          <Text variant="title" accessibilityRole="header">
            {title}
          </Text>
          {titleAction}
        </Row>
      )}
      {subtitle && (
        <Text variant="body" tone="secondary">
          {subtitle}
        </Text>
      )}
    </Stack>
  );

  return (
    <SafeAreaView style={styles.root} edges={edges}>
      {topBar}
      {scroll ? (
        <ScrollView scrollEnabled={scrollEnabled} style={styles.fill} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {header}
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.fill, styles.content]}>
          {header}
          {children}
        </View>
      )}
      {footer && <View style={styles.footer}>{footer}</View>}
    </SafeAreaView>
  );
}
