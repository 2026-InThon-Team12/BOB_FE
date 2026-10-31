import { useFirstVisitHelp } from '@/features/help/useFirstVisitHelp';
import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import {
  Badge,
  Brand,
  Button,
  Card,
  Chip,
  EmptyState,
  Icon,
  ProgressBar,
  Row,
  Screen,
  Stack,
  Text,
  TextLink,
  Thumbnail,
} from '@/components/ui';
import { env } from '@/config/env';
import { copy, updateCopy } from '@/constants/copy';
import { useImpulse } from '@/features/goal/useImpulse';
import { useHome, type SimRow } from '@/features/home/useHome';
import { formatWon } from '@/lib/format';
import { makeStyles, useTheme } from '@/theme';

const useStyles = makeStyles((t) => ({
  header: { minHeight: t.space[12], flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bell: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: t.radius.md },
  headline: { ...t.typography.cardTitle },
  reviewIcon: {
    width: 40,
    height: 40,
    borderRadius: t.radius.md,
    backgroundColor: t.color.warning.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowDivider: { height: 1, backgroundColor: t.color.border.divider },
  row: { paddingVertical: t.space[3] },
  progressCol: { width: 64, alignItems: 'flex-end', gap: t.space[1] },
}));

function SimListRow({ row, first }: { row: SimRow; first: boolean }) {
  const theme = useTheme();
  const styles = useStyles();
  const open = () => router.push({ pathname: '/item/[id]/result', params: { id: row.item.id } });
  return (
    <View>
      {!first && <View style={styles.rowDivider} />}
      <Pressable
        onPress={open}
        accessibilityRole="button"
        accessibilityLabel={row.item.name}
        style={({ pressed }) => [styles.row, pressed && { opacity: theme.motion.pressedOpacity }]}
      >
        <Row gap={3}>
          <Thumbnail uri={row.item.imageUri} size="sm" placeholder={copy.common.imagePlaceholder} />
          <Stack flex={1} gap={1}>
            <Text variant="bodyStrong" numberOfLines={1}>
              {row.item.name}
            </Text>
            <Text variant="caption" tone="secondary">
              {`${row.categoryLabel} · ${formatWon(row.item.price)}`}
            </Text>
          </Stack>
          {row.resultReady ? (
            <Badge label={copy.main.resultBadge} tone="brand" />
          ) : (
            <View style={styles.progressCol}>
              <Text variant="caption" weight="700">
                {copy.main.progress(row.day, row.total)}
              </Text>
              <ProgressBar value={row.ratio} size="sm" />
            </View>
          )}
        </Row>
      </Pressable>
    </View>
  );
}

/** BOB_APP 기본 홈(Main). 화면의 수치와 이동은 기존 데이터 흐름을 사용한다. */
export default function HomeScreen() {
  const styles = useStyles();
  const home = useHome();
  useFirstVisitHelp('home');
  const impulse = useImpulse();
  const openImpulse = () => router.push({pathname: '/impulse', params: {preset: String(impulse.picked)}});
  const { goal } = home;

  return (
    <Screen>
      <View style={styles.header}>
        <Brand label={copy.main.logo} tagline={copy.main.tagline} />
        <Pressable style={styles.bell} accessibilityRole="button" accessibilityLabel={updateCopy.help} onPress={() => router.push('/help')}>
          <Icon name="help" />
        </Pressable>
      </View>

      <Card tone="brand">
        <Stack gap={3}>
          <Text variant="title">{updateCopy.impulseTitle}</Text>
          <Text>{updateCopy.impulseBody}</Text>
          <Row gap={2} wrap>{impulse.presets.map((preset,i) => <Chip key={preset.label} label={preset.label} selected={impulse.picked===i} selectedStyle="inverse" onPress={()=>impulse.pick(i)}/>)}<Chip label={copy.impulse.custom} onPress={()=>router.push({pathname:'/impulse',params:{preset:'custom'}})}/></Row>
          <Text variant="caption">{impulse.label} · {formatWon(impulse.amount)}</Text>
          <Text variant="display">{updateCopy.workTime(impulse.workMinutes)}</Text>
          <Text variant="caption">{updateCopy.workBasis}</Text>
          <Button label={updateCopy.impulseCta} variant="onBrand" fullWidth onPress={openImpulse}/>
        </Stack>
      </Card>
      {/* 오늘의 질문 */}
      {home.todayCount > 0 ? (
        <Card tone="brandSubtle">
          <Stack gap={4}>
            <Row justify="space-between">
              <Text variant="label" tone="onBrand">
                {copy.main.todayLabel(copy.main.notifyTimeShort)}
              </Text>
              <Badge label={copy.main.todayCount(home.todayCount)} tone="onBrand" />
            </Row>
            <Text variant="title" tone="onBrand" style={styles.headline}>
              {copy.main.todayHeadline}
            </Text>
            <Button label={copy.main.todayCta} variant="onBrand" size="lg" fullWidth onPress={() => router.push('/check')} />
          </Stack>
        </Card>
      ) : home.todayDone ? (
        <Card tone="brandSubtle">
          <Row gap={3}>
            <Icon name="check" tone="brand" />
            <Stack flex={1} gap={1}>
              <Text variant="bodyStrong" tone="brand">
                {copy.main.todayDone}
              </Text>
              <Text variant="label" tone="secondary">
                {copy.main.todayDoneBody(copy.main.notifyTime)}
              </Text>
            </Stack>
          </Row>
        </Card>
      ) : null}

      {/* 목표 */}
      <Card onPress={() => router.push('/goal')} accessibilityLabel={copy.tabs.goal}>
        {goal.goal ? (
          <Stack gap={3}>
            <Row justify="space-between">
              <Text variant="label" tone="secondary">
                {copy.main.goalLabel(goal.goal.name)}
              </Text>
              <Text variant="label" weight="700" tone="brand">
                {copy.goal.percent(goal.progress.ratio)}
              </Text>
            </Row>
            <Text variant="label" tone="secondary">
              <Text variant="title">{formatWon(goal.progress.saved)}</Text>
              {copy.main.goalSaved(goal.goal.price)}
            </Text>
            <ProgressBar value={goal.progress.ratio} />
            <Text variant="caption" tone="secondary">
              {goal.progress.achieved ? copy.main.goalReached : goal.eta ? copy.main.goalEta(goal.eta) : copy.goal.etaUnknown}
            </Text>
          </Stack>
        ) : (
          <Row gap={3}>
            <Icon name="goal" tone="brand" />
            <Text variant="label" tone="secondary">
              {copy.main.noGoal}
            </Text>
          </Row>
        )}
      </Card>

      {/* 구매 후 점검 */}
      {home.reviewDue && (
        <Card
          onPress={() => router.push({ pathname: '/item/[id]/review', params: { id: home.reviewDue!.id } })}
          accessibilityLabel={copy.main.reviewTitle(home.reviewDue.name)}
        >
          <Row gap={3}>
            <View style={styles.reviewIcon}>
              <Icon name="clock" tone="warning" />
            </View>
            <Stack flex={1} gap={1}>
              <Text variant="bodyStrong">{copy.main.reviewTitle(home.reviewDue.name)}</Text>
              <Text variant="caption" tone="secondary">
                {copy.main.reviewBody}
              </Text>
            </Stack>
            <Icon name="chevronRight" tone="tertiary" />
          </Row>
        </Card>
      )}

      {/* 시뮬레이션 중 */}
      <Row justify="space-between">
        <Text variant="heading">
          {copy.main.simTitle}{' '}
          <Text variant="heading" tone="brand">
            {home.simulating.length}
          </Text>
        </Text>
        <TextLink label={copy.main.add} icon="add" onPress={() => router.push('/item/add')} />
      </Row>
      {home.simulating.length === 0 ? (
        <Card>
          <EmptyState
            icon="add"
            title={copy.main.emptyTitle}
            description={copy.main.emptyBody}
            action={<Button label={copy.main.add} icon="add" onPress={() => router.push('/item/add')} />}
          />
        </Card>
      ) : (
        <Card padding={4}>
          {home.simulating.map((row, i) => (
            <SimListRow key={row.item.id} row={row} first={i === 0} />
          ))}
        </Card>
      )}

      {env.demo && <Button label={copy.dev.entry} variant="ghost" icon="dev" onPress={() => router.push('/dev')} />}
    </Screen>
  );
}
