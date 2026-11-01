import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { loadTodayReflections, saveReflection, useToday, useAnswers, useItems, useQuestions, type ReflectionAnswer } from '@/data';
import { useTodayQuestions } from './useTodayQuestions';
import { todayAnswers } from '@/lib/calc/todayAnswers';
export function useTodayCheck() {
  const live = useTodayQuestions();
  const today = useToday();
  const answers = useAnswers(), items=useItems(), questions=useQuestions();
  const [editing,setEditing] = useState<string|null>(null);
  const answered = todayAnswers(items, questions, answers, today);
  const editQuestion=questions.find(q=>q.id===editing && q.date===today);
  const editItem=items.find(i=>i.id===editQuestion?.itemId);
  const current=editQuestion && editItem ? {item:editItem,question:editQuestion,text:editQuestion.text} : live.entries[0];
  const query = useQuery({queryKey:['daily-reflections',today], queryFn:async()=>{await loadTodayReflections();return true;}, staleTime:0, retry:false});
  const loading = query.isPending;
  const error = query.isError ? '질문을 불러오지 못했어요. 다시 시도해 주세요.' : null;
  const load = () => {void query.refetch();};
  return { ...live, loading, error, retry:load, answered, edit:setEditing,
    current, editing: !!editQuestion, cancelEdit: () => setEditing(null), done: !loading && live.entries.length === 0,
    answer: (value: ReflectionAnswer,label:string) => {
      const entry = current; if (!entry) return;
      saveReflection(entry.question.id,value,label);
      setEditing(null);
    },
  };
}
