import { useRef, useState, type ReactNode } from 'react';
import { Animated } from 'react-native';
import { Stack, Text } from '@/components/ui';
import type { AnswerSpec, ReflectionAnswer } from '@/lib/reflection';
import { swipeAnswer } from '@/lib/reflection';
import { reflectionCopy } from '@/constants/copy';
import { useTheme } from '@/theme';
import { SwipeCard, type SwipeCardHandle, type SwipeDirection } from './SwipeCard';
import { AnswerButtons } from './AnswerButtons';

export const isThreeWay = (spec: AnswerSpec) => spec.type === 'CHOICE' && spec.options?.length === 3 && ['YES','NO','UNSURE'].every(code => spec.options?.some(o => o.code === code));
export function ReflectionSwipe({children, spec, onAnswer}: {children: ReactNode; spec: AnswerSpec; onAnswer: (value: ReflectionAnswer, label: string) => void | Promise<void>}) {
  const [position] = useState(() => new Animated.ValueXY());
  const ref = useRef<SwipeCardHandle>(null);
  const theme = useTheme();
  const [failed,setFailed] = useState(false);
  if (!isThreeWay(spec)) return <>{children}</>;
  const codes = ['YES','NO','UNSURE'] as const;
  const labels = codes.map(code => spec.options!.find(o => o.code === code)!.label) as [string,string,string];
  const directions: SwipeDirection[] = ['right','left','up'];
  const answer = async (direction: SwipeDirection) => {const i = directions.indexOf(direction);setFailed(false);try {await onAnswer({choice_code:swipeAnswer(direction)}, labels[i]);} catch {setFailed(true);ref.current?.reset();}};
  return <Stack gap={4}>
    <SwipeCard ref={ref} position={position} onSwipe={answer} overlays={{
      right:{label:labels[0],icon:'check',color:theme.color.brand.solid},
      left:{label:labels[1],icon:'close',color:theme.color.swipeNo},
      up:{label:labels[2],icon:'help',color:theme.color.swipeUnsure},
    }}>{children}</SwipeCard>
    {failed && <Text tone="danger">{reflectionCopy.answerFailed}</Text>}
    <AnswerButtons labels={labels} hints={[`${labels[0]} →`,`← ${labels[1]}`,`↑ ${labels[2]}`]} onAnswer={i => ref.current?.swipe(directions[i])}/>
  </Stack>;
}
