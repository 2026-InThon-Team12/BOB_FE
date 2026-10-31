import { reflectionCopy } from '@/constants/copy';
import { useState } from 'react';
import { Button, Input, Stack, Text } from '@/components/ui';
import type { AnswerSpec, ReflectionAnswer } from '@/lib/reflection';
import { validReflectionAnswer } from '@/lib/reflection';

type Props = {spec:AnswerSpec & {unit?: string}; onAnswer:(value:ReflectionAnswer,label:string)=>void};
export function ReflectionAnswerForm({spec,onAnswer}:Props) {
  const [text,setText] = useState('');
  const [fields,setFields] = useState<Record<string,string>>({});
  const [error,setError] = useState<string|null>(null);
  const send = (value:ReflectionAnswer,label:string) => {
    if (!validReflectionAnswer(spec,value)) {setError(reflectionCopy.answerInvalid);return;}
    try {onAnswer(value,label);setError(null);} catch {setError(reflectionCopy.answerFailed);}
  };
  return <Stack gap={2}>
    {spec.type === 'OBJECT' && Object.entries(spec.fields ?? {}).map(([key,field]) => <Stack gap={2} key={key}>
      <Text variant="label">{key === 'when' ? reflectionCopy.firstUseWhen : reflectionCopy.useContext}</Text>
      {(field.options ?? []).map(option => <Button key={option.code} label={option.label} variant={fields[key] === option.code ? 'primary':'secondary'} onPress={()=>setFields(v=>({...v,[key]:option.code}))}/>)}
    </Stack>)}
    {(spec.type === 'INTEGER' || spec.type === 'TEXT') && <Input label={spec.type === 'INTEGER' ? `${spec.minimum ?? 0} ~ ${spec.maximum ?? 30}${spec.unit === 'KRW' ? '원':'일'}` : reflectionCopy.myAnswer} value={text} onChangeText={setText} keyboardType={spec.type === 'INTEGER' ? 'number-pad':'default'} maxLength={spec.type === 'TEXT' ? spec.max_length : 13}/>}
    {spec.type !== 'CHOICE' && <Button label={reflectionCopy.saveAnswer} onPress={()=> {
      if (spec.type === 'OBJECT') send({object_value:fields}, Object.entries(fields).map(([key,code])=>spec.fields?.[key].options?.find(o=>o.code===code)?.label ?? code).join(' · '));
      else if (spec.type === 'INTEGER') send({number_value:text.trim() ? Number(text):NaN},`${text}${spec.unit === 'KRW' ? '원':'일'}`);
      else send({text_value:text.trim()},text.trim());
    }}/>}
    {(spec.options ?? []).map(option=><Button key={option.code} label={option.label} variant="secondary" onPress={()=>send({choice_code:option.code},option.label)}/>)}
    {error && <Text tone="warning">{error}</Text>}
  </Stack>;
}
