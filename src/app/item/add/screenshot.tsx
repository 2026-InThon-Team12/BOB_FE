import { router } from 'expo-router';
import { ActivityIndicator } from 'react-native';
import { Button, Card, Row, Screen, ScreenHeader, Stack, Text, Thumbnail } from '@/components/ui';
import { copy, updateCopy } from '@/constants/copy';
import { useScreenshotImport, useStartManual } from '@/features/register/useImport';
import { goBack } from '@/lib/navigation';
import { useTheme } from '@/theme';
export default function ScreenshotScreen() {
  const theme = useTheme();
  const importer = useScreenshotImport();
  const startManual = useStartManual();
  return <Screen edges={['top','bottom']} header={<ScreenHeader onBack={() => goBack('/item/add')} backLabel={copy.common.back}/>}>
    <Text variant="title">{updateCopy.multiPick}</Text>
    <Text tone="secondary">{updateCopy.multiBody}</Text>
    {importer.analyzing && <ActivityIndicator color={theme.color.brand.solid}/>}
    {!!importer.slots.length && <Text>{updateCopy.multiProgress(importer.completed, importer.slots.length)}</Text>}
    {importer.slots.map((slot,index) => <Card key={`${index}:${slot.image.uri}`}><Row gap={3}>
      <Thumbnail uri={slot.image.uri}/><Stack flex={1}><Text>{slot.status === 'pending' ? copy.register.analyzing : updateCopy.multiStatus(index, slot.status === 'done')}</Text></Stack>
    </Row></Card>)}
    {importer.failed && <Card tone="warning"><Text>{updateCopy.multiPartial}</Text><Text tone="secondary">{importer.errorMessage}</Text></Card>}
    {importer.hasRows && <Button label={updateCopy.reviewImported} disabled={importer.analyzing} fullWidth onPress={() => router.replace('/item/add/review')}/>}
    {importer.failed && <Button label={updateCopy.retryFailed} disabled={importer.analyzing} onPress={importer.retryFailed}/>}
    <Button label={updateCopy.multiPick} variant="secondary" disabled={importer.analyzing} onPress={importer.pickAndAnalyze}/>
    <Button label={copy.register.toManual} variant="ghost" disabled={importer.analyzing} onPress={() => {startManual();router.replace('/item/add/review');}}/>
  </Screen>;
}
