import { useState, type ReactNode } from 'react';

import {
  Badge,
  Button,
  Card,
  Chip,
  EmptyState,
  Gauge,
  Icon,
  Input,
  ProgressBar,
  Row,
  Screen,
  Stack,
  Text,
  type IconName,
} from '@/components/ui';

// 디자인 시안과 대조하기 위한 카탈로그. 개발자 전용 화면이라 샘플 문구를 copy.ts에 두지 않는다.

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Stack gap={3}>
      <Text variant="heading">{title}</Text>
      {children}
    </Stack>
  );
}

const icons: IconName[] = [
  'home', 'goal', 'report', 'wallet', 'add', 'back', 'close', 'check', 'chevronRight', 'chevronDown',
  'arrowRight', 'image', 'link', 'pencil', 'bell', 'clock', 'ai', 'warning', 'shipping', 'settings',
];

const REASONS = ['SNS·광고를 보고', '할인·한정 판매 때문에', '스트레스·기분 전환을 위해'];
const CATEGORIES = ['일상/생활', '의류', '가전제품', '디지털기기'];
const PRESETS = ['커피 4,800원', '치킨 23,000원', '인형뽑기 10,000원'];

export default function UiCatalogScreen() {
  const [reasons, setReasons] = useState<string[]>([REASONS[0]]);
  const [category, setCategory] = useState('가전제품');
  const [preset, setPreset] = useState(PRESETS[1]);
  const toggle = (v: string) => setReasons((p) => (p.includes(v) ? p.filter((x) => x !== v) : [...p, v]));

  return (
    <Screen edges={['bottom']}>
      <Section title="Text">
        <Text variant="hero" tone="brand">3일</Text>
        <Text variant="display">63%</Text>
        <Text variant="title">무엇을 사고 싶나요?</Text>
        <Text variant="heading">울 블렌드 오버핏 코트</Text>
        <Text variant="body">14일 동안 매일 저녁 8시에 물어볼게요</Text>
        <Text variant="bodyStrong">151,000원</Text>
        <Text variant="label" tone="secondary">의류 · 189,000원</Text>
        <Text variant="caption" tone="tertiary">시뮬레이션 기간은 가격에 따라 정해져요</Text>
        <Row gap={3} wrap>
          <Text tone="secondary">secondary</Text>
          <Text tone="tertiary">tertiary</Text>
          <Text tone="disabled">disabled</Text>
          <Text tone="brand">brand</Text>
          <Text tone="warning">warning</Text>
        </Row>
      </Section>

      <Section title="Button">
        <Button label="다음 품목" size="lg" fullWidth onPress={() => {}} />
        <Row gap={3}>
          <Stack flex={1}>
            <Button label="Buy" sublabel="살게요" onPress={() => {}} />
          </Stack>
          <Stack flex={1}>
            <Button label="Bye" sublabel="안 살래요" variant="bye" onPress={() => {}} />
          </Stack>
        </Row>
        <Row gap={3}>
          <Stack flex={1}>
            <Button label="원래 필요했어요" variant="secondary" onPress={() => {}} />
          </Stack>
          <Stack flex={1}>
            <Button label="빼고 살게요" onPress={() => {}} />
          </Stack>
        </Row>
        <Button label="그래도 살래요" variant="ghost" onPress={() => {}} />
        <Button label="비활성" disabled />
        <Button label="불러오는 중" loading />
      </Section>

      <Section title="Chip">
        <Text variant="caption" tone="tertiary">tint · 복수 선택 (구매 이유)</Text>
        <Row gap={2} wrap>
          {REASONS.map((r) => (
            <Chip key={r} label={r} selected={reasons.includes(r)} onPress={() => toggle(r)} />
          ))}
        </Row>
        <Text variant="caption" tone="tertiary">solid · 단일 선택 (카테고리)</Text>
        <Row gap={2} wrap>
          {CATEGORIES.map((c) => (
            <Chip key={c} label={c} selectedStyle="solid" selected={category === c} onPress={() => setCategory(c)} />
          ))}
          <Chip label="가전제품" icon="ai" onPress={() => {}} />
        </Row>
        <Text variant="caption" tone="tertiary">inverse · 자주 쓰는 항목 (참기)</Text>
        <Row gap={2} wrap>
          {PRESETS.map((p) => (
            <Chip key={p} label={p} selectedStyle="inverse" selected={preset === p} onPress={() => setPreset(p)} />
          ))}
          <Chip label="직접 입력" dashed onPress={() => {}} />
        </Row>
      </Section>

      <Section title="Badge">
        <Row gap={2} wrap>
          <Badge label="추천" tone="brandSolid" />
          <Badge label="결과 도착" tone="brand" />
          <Badge label="14일 시뮬레이션" tone="brand" />
          <Badge label="4.5배 과대예측" tone="warning" />
          <Badge label="1.8배" />
        </Row>
      </Section>

      <Section title="Input">
        <Input label="물건 이름" placeholder="예: 미쿠 피규어" />
        <Input label="가격" placeholder="0" suffix="원" keyboardType="number-pad" helper="장바구니 금액 그대로 적어 주세요" />
        <Input label="에러 상태" defaultValue="abc" error="숫자만 입력해 주세요" />
      </Section>

      <Section title="Card">
        <Card>
          <Text>default · 흰 카드 (테두리·그림자 없음)</Text>
        </Card>
        <Card selected onPress={() => {}} accessibilityLabel="선택된 카드">
          <Text>selected · 파란 테두리 (등록 방법 추천)</Text>
        </Card>
        <Card tone="brand">
          <Stack gap={3}>
            <Text variant="label" tone="onBrand">오늘의 질문 · 오후 8:00</Text>
            <Text variant="title" tone="onBrand">오늘 하루, 이 물건들이 있었으면 했나요?</Text>
            <Button label="1분 만에 답하기" variant="onBrand" fullWidth onPress={() => {}} />
          </Stack>
        </Card>
        <Row gap={3}>
          <Stack flex={1}>
            <Card tone="subtle" padding={4}>
              <Text variant="label" tone="secondary">참으면</Text>
              <Text variant="bodyStrong">11월 16일</Text>
            </Card>
          </Stack>
          <Stack flex={1}>
            <Card tone="brandSubtle" padding={4}>
              <Text variant="label" tone="brand">사면</Text>
              <Text variant="bodyStrong" tone="brand">11월 20일</Text>
            </Card>
          </Stack>
        </Row>
        <Card tone="warning">
          <Text variant="label" tone="warning">잠깐만요</Text>
          <Text variant="title">할인을 받으려고 7,000원을 더 쓰게 돼요</Text>
        </Card>
        <Card tone="inverse">
          <Text variant="label" tone="disabled">이번 달 발견</Text>
          <Text variant="title" tone="inverse">의류는 쓸 날을 4.5배 부풀려 예측했어요</Text>
        </Card>
        <Card floating>
          <Text>floating · 오늘의 질문 카드</Text>
        </Card>
      </Section>

      <Section title="ProgressBar">
        <ProgressBar value={0.63} />
        <ProgressBar value={0.8} tone="predicted" />
        <ProgressBar value={0.25} />
        <ProgressBar value={0.6} tone="warning" size="sm" />
      </Section>

      <Section title="Gauge">
        <Row gap={6} justify="center">
          <Gauge value={1} accessibilityLabel="목표 100%">
            <Text variant="display" tone="brand">100%</Text>
            <Text variant="caption" tone="secondary">240,000원</Text>
          </Gauge>
          <Gauge value={0.63} size="md">
            <Text variant="label">63%</Text>
          </Gauge>
        </Row>
      </Section>

      <Section title="Icon">
        <Row gap={4} wrap>
          {icons.map((name) => (
            <Stack key={name} align="center" gap={1}>
              <Icon name={name} size="lg" />
              <Text variant="caption" tone="tertiary">
                {name}
              </Text>
            </Stack>
          ))}
        </Row>
      </Section>

      <Section title="EmptyState">
        <Card>
          <EmptyState
            title="사고 싶은 걸 하나 등록해볼까요?"
            description="빈 상태 예시입니다."
            action={<Button label="물건 등록" icon="add" onPress={() => {}} />}
          />
        </Card>
      </Section>
    </Screen>
  );
}
