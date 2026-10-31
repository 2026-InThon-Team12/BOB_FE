import { useEffect, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  useToast,
  Badge,
  Button,
  Card,
  Icon,
  Input,
  InlineCalendar,
  ProgressBar,
  Row,
  Stack,
  Text,
  Thumbnail,
  type IconName,
} from '@/components/ui';
import { copy } from '@/constants/copy';
import { apkCategories, apkCopy as c, apkMoney as money, apkTabs, apkTitles } from '@/constants/apkCopy';
import { htmlCopy as h } from '@/constants/htmlCopy';
import type { useApk } from '@/features/apklike/useApk';
import { num, object, seoulDate, str, type Json } from '@/lib/apkDomain';
import { makeStyles, useTheme } from '@/theme';

export type VM = ReturnType<typeof useApk>;
export const useHtmlStyles = makeStyles((t) => ({
  fill: { flex: 1, backgroundColor: t.color.bg.canvas },
  webInset: { height: t.layout.html.webStatusInset },
  scroll: {
    paddingHorizontal: t.space[5],
    paddingTop: t.layout.html.top,
    paddingBottom: t.layout.html.footerBottom,
    gap: t.space[3],
  },
  header: {
    height: t.layout.html.header,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  centeredHeader: { marginHorizontal: -t.space[2.5] },
  iconButton: {
    width: t.layout.html.side,
    height: t.layout.html.side,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: t.radius.md,
  },
  side: { minWidth: t.layout.html.side, alignItems: 'flex-end' },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: t.space[3] / 2,
    backgroundColor: t.color.bg.surface,
    borderTopWidth: 1,
    borderTopColor: t.color.border.default,
  },
  tab: {
    height: t.layout.html.tab,
    width: t.layout.html.tabWidth,
    alignItems: 'center',
    justifyContent: 'center',
    gap: t.space[1] - 1,
  },
  footer: {
    paddingHorizontal: t.space[5],
    paddingTop: t.space[3],
    gap: t.space[2],
    backgroundColor: t.color.bg.surface,
    borderTopWidth: 1,
    borderTopColor: t.color.border.default,
  },
  card: {
    borderRadius: t.radius.xl,
    padding: t.space[5],
    backgroundColor: t.color.bg.surface,
    gap: t.space[3],
  },
  compactCard: {
    borderRadius: t.radius.lg,
    paddingVertical: t.space[3],
    paddingHorizontal: t.space[3.5],
    backgroundColor: t.color.bg.surface,
  },
  list: {
    borderRadius: t.radius.xl,
    paddingHorizontal: t.space[4],
    paddingVertical: t.space[1],
    backgroundColor: t.color.bg.surface,
  },
  listRow: { paddingVertical: t.layout.html.rowPadding },
  divider: { height: 1, backgroundColor: t.color.track },
  twoColumns: { flexDirection: 'row', flexWrap: 'wrap', gap: t.space[2] },
  half: { width: '48.5%' },
  progressCol: { width: 64, alignItems: 'flex-end', gap: t.space[1] },
  hero: {
    backgroundColor: t.color.brand.solid,
    borderRadius: t.radius.xl,
    padding: t.space[5],
    gap: t.space[3.5],
  },
  heroButton: {
    height: t.layout.html.heroButton,
    borderRadius: t.radius.input,
    backgroundColor: t.color.bg.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleBlock: {
    gap: t.space[2],
    paddingTop: t.space[1],
    paddingBottom: t.space[3],
  },
  iconTile: {
    width: 44,
    height: 44,
    borderRadius: t.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: t.color.brand.subtle,
  },
  alert: {
    borderRadius: t.radius.input,
    paddingVertical: t.space[3],
    paddingHorizontal: t.space[3.5],
    backgroundColor: t.color.alert.subtle,
    borderColor: t.color.alert.border,
    borderWidth: 1,
  },
  reviewIcon: {
    width: 40,
    height: 40,
    borderRadius: t.radius.md,
    backgroundColor: t.color.warning.subtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selected: {
    borderWidth: 1.5,
    borderColor: t.color.brand.solid,
    backgroundColor: t.color.brand.subtle,
  },
  sectionTop: { paddingTop: t.space[2] },
  receipt: {
    width: t.layout.html.receiptWidth,
    height: t.layout.html.receiptHeight,
    borderRadius: t.radius.md,
    backgroundColor: t.color.bg.surface,
    borderWidth: 1,
    borderColor: t.color.border.default,
    padding: t.space[2],
    gap: t.space[1],
  },
  receiptLine: {
    height: 8,
    borderRadius: t.space[1] / 2,
    backgroundColor: t.color.track,
  },
  receiptAccent: { width: '60%', backgroundColor: t.color.brand.solid },
  draft: {
    borderRadius: t.radius.review,
    padding: t.space[3.5],
    gap: t.space[3],
    backgroundColor: t.color.bg.surface,
  },
  pill: {
    minHeight: t.layout.html.chip,
    paddingHorizontal: t.space[3],
    justifyContent: 'center',
    borderRadius: t.radius.pill,
    borderWidth: 1,
    borderColor: t.color.border.default,
    backgroundColor: t.color.bg.surface,
  },
  category: {
    minHeight: 36,
    paddingHorizontal: t.space[2.5],
    borderRadius: t.radius.md,
    borderWidth: 1,
    borderColor: t.color.border.default,
    backgroundColor: t.color.bg.subtle,
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.space[1],
  },
  floating: {
    ...t.elevation.float,
    borderRadius: t.radius.xxl,
    padding: t.space[5],
    minHeight: 320,
    backgroundColor: t.color.bg.surface,
    gap: t.space[3.5],
  },
  backgroundCard: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    bottom: -10,
    borderRadius: t.radius.xxl,
    backgroundColor: t.color.bg.surface,
    opacity: 0.55,
  },
  numbered: {
    width: 28,
    height: 28,
    borderRadius: t.radius.pill,
    backgroundColor: t.color.bg.inverse,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeTrack: {
    height: 12,
    borderRadius: t.radius.pill,
    backgroundColor: t.color.track,
    overflow: 'hidden',
  },
  shelf: {
    padding: t.space[4],
    backgroundColor: t.color.shelf.bg,
    borderRadius: t.radius.xl,
    gap: t.space[5],
  },
  shelfRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: t.space[4],
    borderBottomWidth: 10,
    borderBottomColor: t.color.shelf.plank,
    paddingBottom: t.space[4],
  },
  numeric: { textAlign: 'right', minWidth: 100 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: t.radius.sm / 2,
    borderWidth: 1,
    borderColor: t.color.border.strong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checked: {
    backgroundColor: t.color.brand.solid,
    borderColor: t.color.brand.solid,
  },
  questionCard: {
    ...t.elevation.float,
    borderRadius: t.radius.xxl,
    padding: t.space[5],
    minHeight: t.layout.html.questionHeight,
    backgroundColor: t.color.bg.surface,
    gap: t.space[3.5],
  },
  questionInputCard: { minHeight: 280 },
  day: {
    width: 34,
    height: 34,
    borderRadius: t.radius.sm,
    backgroundColor: t.color.bg.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));

const tabIcons: Record<string, IconName> = {
  home: 'home',
  goal: 'goal',
  report: 'report',
  wallet: 'wallet',
};
export function HtmlScreen({
  vm,
  children,
  title,
  right,
  footer,
  tabs = vm.page in apkTabs,
  back = vm.back,
}: {
  vm: VM;
  children: ReactNode;
  title?: string;
  right?: ReactNode;
  footer?: ReactNode;
  tabs?: boolean;
  back?: () => void;
}) {
  const s = useHtmlStyles(),
    t = useTheme(),
    insets = useSafeAreaInsets();
  const toast = useToast();
  useEffect(() => {
    if (vm.notice) {
      toast(vm.notice);
      vm.actions.clearNotice();
    }
  }, [vm.notice, vm.actions, toast]);
  const tabPage = vm.page in apkTabs;
  return (
    <SafeAreaView
      style={[s.fill, vm.page === 'goalDone' && { backgroundColor: t.color.bg.surface }]}
      edges={['top']}
    >
      {Platform.OS === 'web' && <View style={s.webInset} />}
      <ScrollView
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={vm.busy}
            onRefresh={() => {
              void (vm.ready ? vm.actions.refresh(vm.page) : vm.actions.init());
            }}
            tintColor={t.color.brand.solid}
          />
        }
      >
        <View style={[s.header, !tabPage && s.centeredHeader]}>
          {vm.page === 'home' ? (
            <Row gap={2} align="baseline">
              <Text variant="htmlLogo">{copy.main.logo}</Text>
              <Text variant="label" tone="tertiary">
                {copy.main.tagline}
              </Text>
            </Row>
          ) : tabPage ? (
            <Text variant="htmlHero">{title ?? apkTabs[vm.page as keyof typeof apkTabs]}</Text>
          ) : vm.page === 'goalDone' ? (
            <View style={s.side} />
          ) : (
            <IconButton name="back" label={c.back} onPress={back} disabled={vm.busy} />
          )}
          {!tabPage && !!title && (
            <Text variant="bodyStrong" weight="700">
              {title}
            </Text>
          )}
          {vm.page === 'home' ? (
            <IconButton name="bell" label={c.settings} onPress={() => vm.go('settings')} />
          ) : vm.page === 'goalDone' ? (
            <IconButton name="close" label={c.close} onPress={back} />
          ) : (
            <View style={s.side}>{right}</View>
          )}
        </View>
        {!!vm.error && (
          <Card tone="warning">
            <Stack gap={2}>
              <Text>{vm.error}</Text>
              <Row gap={3}>
                <Button label={c.close} variant="ghost" onPress={vm.actions.dismiss} />
                <Button
                  label={c.refresh}
                  variant="ghost"
                  onPress={() => {
                    void vm.actions.refresh(vm.page);
                  }}
                />
              </Row>
            </Stack>
          </Card>
        )}
        {vm.busy && <ActivityIndicator color={t.color.brand.solid} />}
        {children}
      </ScrollView>
      {footer && (
        <View
          style={[
            s.footer,
            {
              paddingBottom:
                Platform.OS === 'web' ? t.layout.html.footerBottom : Math.max(insets.bottom, t.space[4]),
            },
          ]}
        >
          {footer}
        </View>
      )}
      {tabs && !footer && (
        <View
          style={[
            s.navigation,
            {
              paddingBottom:
                Platform.OS === 'web' ? t.layout.html.tabBottom : Math.max(insets.bottom, t.space[2]),
            },
          ]}
        >
          {Object.entries(apkTabs).map(([page, label]) => (
            <Pressable
              key={page}
              style={s.tab}
              accessibilityRole="tab"
              accessibilityLabel={label}
              accessibilityState={{ selected: vm.page === page }}
              disabled={vm.busy}
              onPress={() => vm.go(page)}
            >
              <Icon name={tabIcons[page]} size="lg" tone={vm.page === page ? 'brand' : 'tertiary'} />
              <Text variant="htmlTab" tone={vm.page === page ? 'brand' : 'tertiary'}>
                {label}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </SafeAreaView>
  );
}
export function IconButton({
  name,
  label,
  onPress,
  disabled,
}: {
  name: IconName;
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const s = useHtmlStyles();
  return (
    <Pressable
      style={s.iconButton}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      disabled={disabled}
    >
      <Icon name={name} size="lg" />
    </Pressable>
  );
}
export function Action({
  vm,
  label,
  run,
  secondary = false,
  disabled = false,
  bye = false,
}: {
  vm: VM;
  label: string;
  run: () => unknown;
  secondary?: boolean;
  disabled?: boolean;
  bye?: boolean;
}) {
  return (
    <Button
      label={label}
      variant={secondary ? 'ghost' : bye ? 'bye' : 'primary'}
      size="lg"
      fullWidth
      disabled={vm.busy || disabled}
      onPress={() => {
        void run();
      }}
    />
  );
}
export function Panel({ children }: { children: ReactNode }) {
  const s = useHtmlStyles();
  return <View style={s.card}>{children}</View>;
}
export function Stat({ label, value }: { label: string; value: unknown }) {
  return (
    <Row justify="space-between" gap={2}>
      <Stack flex={1}>
        <Text variant="label" tone="secondary">
          {label}
        </Text>
      </Stack>
      <Text variant="bodyStrong">{str(value)}</Text>
    </Row>
  );
}
export function Product({ item, crop, compact = false, prominentPrice = false }: { item: Json; crop?: string; compact?: boolean; prominentPrice?: boolean }) {
  const s = useHtmlStyles();
  return (
    <View style={compact ? s.compactCard : undefined}>
      <Row gap={3}>
        <Thumbnail
          uri={crop ? `data:image/jpeg;base64,${crop}` : str(item.image_url) || undefined}
          size="sm"
          placeholder={copy.common.imagePlaceholder}
        />
        <Stack flex={1} gap={1}>
          <Text variant="bodyStrong" numberOfLines={2}>
            {str(item.name ?? item.item_name)}
          </Text>
          <Text
            variant={prominentPrice ? 'bodyStrong' : 'caption'}
            tone={prominentPrice ? 'primary' : 'secondary'}
          >
            {!prominentPrice && apkCategories[str(item.category)]}
            {!prominentPrice && item.category ? ' · ' : ''}
            {(item.price ?? item.target_amount) != null ? money(item.price ?? item.target_amount) : ''}
          </Text>
        </Stack>
      </Row>
    </View>
  );
}
export function Field({
  label,
  value,
  set,
  numeric = false,
  disabled = false,
}: {
  label: string;
  value: string;
  set: (v: string) => void;
  numeric?: boolean;
  disabled?: boolean;
}) {
  return (
    <Input
      label={label}
      value={value}
      onChangeText={(v) => {
        if (!numeric || /^\d*$/.test(v)) set(v);
      }}
      keyboardType={numeric ? 'number-pad' : 'default'}
      editable={!disabled}
    />
  );
}
export function DateField({
  label,
  value,
  set,
  min,
  max,
}: {
  label: string;
  value: string;
  set: (v: string) => void;
  min?: string;
  max?: string;
}) {
  const [open, toggle] = useState(false);
  return (
    <Stack gap={2}>
      <Button label={`${label} ${value}`} variant="secondary" icon="calendar" onPress={() => toggle(!open)} />
      {open && (
        <Card padding={3}>
          <InlineCalendar
            value={value || seoulDate()}
            minDate={min ?? '1900-01-01'}
            maxDate={max}
            onChange={(v) => {
              set(v);
              toggle(false);
            }}
            weekdayLabels={copy.calendar.weekdays}
            monthLabel={copy.calendar.month}
            prevLabel={copy.calendar.prev}
            nextLabel={copy.calendar.next}
          />
        </Card>
      )}
    </Stack>
  );
}
export function MonthNav({ vm }: { vm: VM }) {
  const shift = (n: number) => {
    const [y, m] = vm.month.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1 + n, 1)).toISOString().slice(0, 7);
  };
  return (
    <Row>
      <IconButton
        name="back"
        label={c.previous}
        disabled={vm.busy}
        onPress={() => {
          void vm.actions.changeMonth(shift(-1), vm.page);
        }}
      />
      <Text variant="label" weight="700">
        {copy.report.monthLabel(vm.month)}
      </Text>
      <IconButton
        name="chevronRight"
        label={c.next}
        disabled={vm.busy || vm.month >= seoulDate().slice(0, 7)}
        onPress={() => {
          void vm.actions.changeMonth(shift(1), vm.page);
        }}
      />
    </Row>
  );
}
export function ItemList({ vm, items }: { vm: VM; items: Json[] }) {
  const s = useHtmlStyles();
  return (
    <View style={s.list}>
      {items.map((i, index) => {
        const sim = object(i.simulation);
        return (
          <View key={str(i.id)}>
            {index > 0 && <View style={s.divider} />}
            <Pressable
              style={s.listRow}
              onPress={() => {
                void vm.openItem(str(i.id));
              }}
              disabled={vm.busy}
              accessibilityRole="button"
              accessibilityLabel={`${str(i.name)} ${c.record}`}
            >
              <Row gap={3}>
                <Stack flex={1}>
                  <Product item={i} crop={vm.crops[str(i.id)]} />
                </Stack>
                {['BUY', 'GIVE_UP'].includes(str(i.decision)) ? (
                  <Badge
                    label={i.decision === 'BUY' ? c.buy : c.bye}
                    tone={i.decision === 'BUY' ? 'brand' : 'warning'}
                  />
                ) : sim.status === 'COMPLETED' ? (
                  <Badge label={copy.main.resultBadge} tone="brand" />
                ) : (
                  <View style={s.progressCol}>
                    <Text variant="caption" weight="700">
                      {sim.status === 'SCHEDULED'
                        ? h.startOn(str(sim.start_date))
                        : `${num(sim.current_day)}/${num(sim.duration_days)}일`}
                    </Text>
                    <ProgressBar
                      value={num(sim.duration_days) ? num(sim.current_day) / num(sim.duration_days) : 0}
                      size="sm"
                    />
                  </View>
                )}
              </Row>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}
export async function openUrl(value: unknown) {
  try {
    const url = new URL(str(value));
    if (url.protocol === 'https:' && !url.username && !url.password) await Linking.openURL(url.href);
  } catch {
    /* Invalid external links remain closed. */
  }
}
export const titleFor = (page: string) => apkTitles[page];
