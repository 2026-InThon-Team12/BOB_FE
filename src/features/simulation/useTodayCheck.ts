import { SHORT_QUESTION_VERSION } from '@/constants/swipeQuestionCatalog';
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
  const editQuestion=questions.find(q=>q.id===editing && q.date===today && q.phase !== 'post');
  const editItem=items.find(i=>i.id===editQuestion?.itemId);
  const selected=editQuestion && editItem ? {item:editItem,question:editQuestion,text:editQuestion.text} : live.entries[0];
  const [savingEntry,setSavingEntry] = useState<typeof selected | null>(null);
  const current=savingEntry ?? selected;
  const query = useQuery({queryKey:['daily-reflections',today,SHORT_QUESTION_VERSION], queryFn:async()=>{await loadTodayReflections();return true;}, staleTime:0, retry:false});
  const loading = query.isPending;
  const error = query.isError ? '질문을 불러오지 못했어요. 다시 시도해 주세요.' : null;
  const load = () => {void query.refetch();};
  return { ...live, loading, error, retry:load, answered, edit:setEditing,
    current, editing: !!editQuestion, cancelEdit: () => setEditing(null), done: !loading && live.entries.length === 0,
    answer: async (value: ReflectionAnswer,label:string) => {
      const entry = current; if (!entry) return;
      setSavingEntry(entry);
      try {
        await saveReflection(entry.question.id,value,label);
        setEditing(null);
      } finally { setSavingEntry(null); }
    },
  };
}
