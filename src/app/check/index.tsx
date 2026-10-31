import { reflectionCopy } from '@/constants/copy';
import { router } from 'expo-router';
import { ItemSummary } from '@/components/feature';
import { ReflectionAnswerForm } from '@/components/feature/ReflectionAnswerForm';
import { Button, Card, Screen, ScreenHeader, Stack, Text } from '@/components/ui';
import { useTodayCheck } from '@/features/simulation/useTodayCheck';
import type { AnswerSpec } from '@/data';
import { goBack } from '@/lib/navigation';
export default function TodayCheckScreen() {
  const check = useTodayCheck();
  const entry = check.current;
  return <Screen header={<ScreenHeader title={reflectionCopy.todayTitle} onBack={()=>goBack('/')} />} edges={['top','bottom']}>
    {check.loading ? <Text>{reflectionCopy.loadingQuestions}</Text> : check.error ? <Stack><Text tone="warning">{check.error}</Text><Button label={reflectionCopy.retry} onPress={check.retry}/></Stack> : entry ? <Stack gap={4}>
      <ItemSummary name={entry.item.name} price={entry.item.price} category={entry.item.category} imageUri={entry.item.imageUri}/>
      <Text tone="secondary">{entry.question.phase === 'post' ? reflectionCopy.post : reflectionCopy.pre} · {reflectionCopy.remaining(check.entries.length)}</Text>
      <Card><Stack gap={3}><Text variant="title">{entry.text}</Text>
        {entry.question.reference && <Text tone="secondary">{entry.question.reference}</Text>}
        <Text variant="caption" tone="secondary">{entry.question.generationMethod === 'AI' ? reflectionCopy.aiQuestion : reflectionCopy.fallbackQuestion}</Text>
        <ReflectionAnswerForm key={entry.question.id} spec={entry.question.answerSpec as AnswerSpec} onAnswer={check.answer}/>
      </Stack></Card>
    </Stack> : <Text variant="heading">{reflectionCopy.allAnswered}</Text>}
    {check.answered.map(a=><Button key={a.questionId} variant="ghost" label={reflectionCopy.edit(a.name,a.label ?? '')} onPress={()=>check.edit(a.questionId)}/>)}
    {check.awaitingDecision.map(item=><Button key={item.id} label={reflectionCopy.result(item.name)} onPress={()=>router.push({pathname:'/item/[id]/result',params:{id:item.id}})}/>)}
    <Button label={reflectionCopy.home} variant="ghost" onPress={()=>router.replace('/')}/>
  </Screen>;
}
