import { View } from 'react-native';
import { makeStyles } from '@/theme';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, Card, Chip, Input, MoneyInput, Row, Screen, ScreenHeader, Stack, Text, useToast } from '@/components/ui';
import { copy, updateCopy } from '@/constants/copy';
import { useImpulse } from '@/features/goal/useImpulse';
import { formatMonthDay, formatWon } from '@/lib/format';
import { goBack } from '@/lib/navigation';
const useStyles = makeStyles(t=>({unit:{width:t.space[6],height:t.space[6],borderRadius:t.radius.sm,backgroundColor:t.color.bg.inverse}}));
export default function ImpulseScreen() {
  const {preset} = useLocalSearchParams<{preset?: string}>();
  const imp = useImpulse(preset === 'custom' ? 'custom' : preset && /^[0-3]$/.test(preset) ? Number(preset) : 1);
  const toast = useToast();
  const styles = useStyles();
  return <Screen edges={['top','bottom']} header={<ScreenHeader title={updateCopy.impulseTitle} onBack={() => goBack('/')} backLabel={copy.common.back}/>}>
    <Text tone="secondary">{updateCopy.impulseBody}</Text>
    <Row gap={2} wrap>{imp.presets.map((p,i) => <Chip key={p.label} label={copy.impulse.preset(p.label,p.amount)} selected={imp.picked === i} onPress={() => imp.pick(i)}/>)}<Chip label={copy.impulse.custom} selected={imp.picked === 'custom'} onPress={() => imp.pick('custom')}/></Row>
    {imp.picked === 'custom' && <Stack><Input label={copy.impulse.customName} value={imp.customName} onChangeText={imp.setCustomName}/><MoneyInput label={copy.impulse.customAmount} value={imp.customAmount} onChangeValue={imp.setCustomAmount}/></Stack>}
    {imp.amount > 0 && <Card tone="brand"><Stack gap={3}><Text variant="label">{imp.label} · {formatWon(imp.amount)}</Text><Text variant="heading">{updateCopy.workTitle}</Text><Text variant="display">{updateCopy.workTime(imp.workMinutes)}</Text><Row gap={1} wrap>{Array.from({length:Math.min(16,Math.ceil(imp.workMinutes/30))},(_,i)=><View key={i} style={styles.unit}/>)}</Row><Text variant="caption">{updateCopy.workUnit} · {updateCopy.workBasis}</Text></Stack></Card>}
    {imp.etaIfResist && imp.etaIfBuy ? <Row gap={2}>
      <Stack flex={1}><Card><Text variant="caption">{copy.impulse.ifResist}</Text><Text variant="heading">{formatMonthDay(imp.etaIfResist)}</Text></Card></Stack>
      <Stack flex={1}><Card tone="brandSubtle"><Text variant="caption">{copy.impulse.ifBuy}</Text><Text variant="heading">{formatMonthDay(imp.etaIfBuy)}</Text></Card></Stack>
    </Row> : <Card><Text tone="secondary">{copy.impulse.noSaving}</Text><Button label={copy.tabs.wallet} variant="ghost" onPress={() => router.push('/wallet')}/></Card>}
    {imp.delay !== null && <Text variant="bodyStrong">{copy.impulse.late(imp.delay)}{copy.impulse.lateSuffix}</Text>}
    <Text variant="caption" tone="secondary">{updateCopy.estimated}</Text>
    {imp.recorded && <Text tone="brand">{updateCopy.recorded}</Text>}
    <Button label={copy.impulse.resist(imp.amount)} disabled={!imp.ready} size="lg" fullWidth onPress={() => {const out=imp.resist();if(out?.kind === 'resisted') toast(copy.impulse.resisted(out.amount));}}/>
    <Button label={copy.impulse.giveIn} disabled={!imp.ready} variant="secondary" fullWidth onPress={() => {if(imp.giveIn()) toast(copy.impulse.gaveIn);}}/>
  </Screen>;
}
