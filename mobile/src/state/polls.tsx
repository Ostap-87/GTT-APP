// Опросы в группе (data/polls.ts): включает координатор, черновики готовятся заранее, делегаты видят только запущенные.
// Общее для обеих ролей состояние — сохраняется на телефоне, как всё демо; на шаге 2 — через сервер.
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { DRAFTS0, fromTemplate, type Poll, type PollKind } from '@/data/polls';
import { ME } from '@/data/trip';
import { useStored } from '@/state/store';

const hhmm = () => new Date().toTimeString().slice(0, 5);

function usePollsState() {
  const [enabled, setEnabled] = useStored('polls.enabled', false);
  const [list, setList] = useStored<Poll[]>('polls.list', DRAFTS0);
  // пока идёт опрос, итог в демо растёт сам — экраны перерисовываются раз в 3 секунды
  const [tick, setTick] = useState(0);
  const anyLive = enabled && list.some((p) => p.status === 'live');
  useEffect(() => {
    if (!anyLive) return;
    const t = setInterval(() => setTick((x) => x + 1), 3000);
    return () => clearInterval(t);
  }, [anyLive]);

  return useMemo(() => {
    const patch = (id: string, p: Partial<Poll> | ((x: Poll) => Partial<Poll>)) =>
      setList((xs) => xs.map((x) => (x.id === id ? { ...x, ...(typeof p === 'function' ? p(x) : p) } : x)));
    return {
      enabled, setEnabled, list, tick,
      /** Что видят делегаты: запущенные (и закрытые — с итогом, если координатор его показывает). */
      forDelegates: enabled ? list.filter((p) => p.status === 'live' || (p.status === 'closed' && p.showResults)) : [],
      live: enabled ? list.filter((p) => p.status === 'live') : [],
      byId: (id: string) => list.find((p) => p.id === id),
      create: (kind: PollKind) => { const p = fromTemplate(kind, `p${Date.now()}`); setList((xs) => [p, ...xs]); return p.id; },
      update: (id: string, p: Partial<Poll>) => patch(id, p),
      remove: (id: string) => setList((xs) => xs.filter((x) => x.id !== id)),
      launch: (id: string) => patch(id, { status: 'live', startedAt: Date.now(), closedAt: undefined }),
      close: (id: string) => patch(id, { status: 'closed', closedAt: Date.now() }),
      /** Голос делегата (на этом телефоне — Анна); можно передумать, пока опрос идёт. */
      vote: (id: string, optionId: string) => patch(id, (x) => ({ votes: { ...x.votes, [ME.id]: optionId } })),
      ask: (id: string, text: string) => patch(id, (x) => ({ questions: [...x.questions, { id: `q${Date.now()}`, text, by: ME.id, at: hhmm(), likes: [ME.id] }] })),
      like: (id: string, qid: string) => patch(id, (x) => ({ questions: x.questions.map((q) => (q.id !== qid ? q : { ...q, likes: q.likes.includes(ME.id) ? q.likes.filter((l) => l !== ME.id) : [...q.likes, ME.id] })) })),
      sendToCompany: (id: string) => patch(id, { sentAt: hhmm() }),
    };
  }, [enabled, list, tick, setEnabled, setList]);
}

type Polls = ReturnType<typeof usePollsState>;
const Ctx = createContext<Polls | null>(null);

export function PollsProvider({ children }: { children: ReactNode }) {
  const v = usePollsState();
  return <Ctx.Provider value={v}>{children}</Ctx.Provider>;
}

export function usePolls() {
  const v = useContext(Ctx);
  if (!v) throw new Error('usePolls вне PollsProvider');
  return v;
}
