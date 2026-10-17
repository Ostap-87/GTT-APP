// Режим координатора (шаг 1 — в памяти телефона, как в прототипе v9): профили группы и их этапы, переезды дня,
// сводки ресторанам и отелю, объявления. Профиль Анны берётся из состояния делегата — видно, как роли связаны.
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import { BASE_HISTORY, LEGS, NOT_READY, NOW, PROFILES, TEMPLATES, ALG_BY, DIET_BY, byId, fem, firstName } from '@/data/group';
import { algNames, foodLine, type Profile } from '@/data/profile';
import { DELEGATES } from '@/data/trip';
import { useTrip } from '@/state/trip';

export type Stage = ['invited' | 'filling' | 'ready' | 'checked', string, 'ok' | 'warn' | 'info'];
type LegMark = { dep?: string; arr?: string };
type Ann = { id: string; ru: string; zh: string; toD: boolean; toH: boolean; tg: boolean; time: string };
export type Followup = { id: string; company: string; typeRu: string; zh: string; consent: boolean; status: 'new' | 'sent' };
export type Review = { id: string; text: string; video: boolean; consent: boolean; status: 'new' | 'thanked' | 'shared' };
type FoodSum = { filled: number; dc: Record<string, number>; ac: Record<string, number>; sev: Record<string, number> };

function groupFoodOf(ps: Profile[]): FoodSum {
  const dc: Record<string, number> = {};
  const ac: Record<string, number> = {};
  const sev: Record<string, number> = {};
  ps.forEach((p) => {
    p.diets.filter((k) => k !== 'none').forEach((k) => { dc[k] = (dc[k] || 0) + 1; });
    if (p.algOn) p.alg.forEach((k) => { ac[k] = (ac[k] || 0) + 1; if (p.severe) sev[k] = (sev[k] || 0) + 1; });
  });
  return { filled: ps.length, dc, ac, sev };
}
// Ресторанам вчера ушла сводка по 16 профилям — без Анны (она заполнит анкету в демо).
const SENT_SIG = JSON.stringify(groupFoodOf(Object.values(PROFILES)));

function useCoordState() {
  const trip = useTrip();
  const [missing, setMissing] = useState(['d1', 'd4', 'd2', 'd3']);
  const [legs, setLegs] = useState<Record<string, LegMark>>({});
  const [checked, setChecked] = useState<Record<string, boolean>>(() => Object.fromEntries(Object.keys(PROFILES).filter((x) => x !== 'd18').map((x) => [x, true])));
  const [d1Checked, setD1Checked] = useState<string | null>(null); // профиль Анны, который координатор проверил
  const [reminded, setReminded] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [foodSent, setFoodSent] = useState({ at: 'вчера, 18:20', sig: SENT_SIG });
  const [anns, setAnns] = useState<Ann[]>([{ id: 'a0', ru: TEMPLATES[2].ru, zh: TEMPLATES[2].zh, toD: true, toH: false, tg: false, time: '08:40' }]);
  const [igorReminded, setIgorReminded] = useState(false);
  const [pddReminded, setPddReminded] = useState(false);
  const [viewing, setViewing] = useState(false);
  // Радиогид, прогулка, отзывы и «Хочу продолжить» — общие для делегата и координатора
  const [guideLive, setGuideLive] = useState(false);
  const [out, setOut] = useState<string | null>(null); // делегат гуляет сам — вернуться до …
  const [followups, setFollowups] = useState<Followup[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(0);
  const [hema, setHema] = useState<'pending' | 'accepted' | 'discuss'>('pending');
  const docsMissing = ['d4', 'd15'];

  return useMemo(() => {
    const me = trip.profile;
    const mySig = JSON.stringify(me);
    const profileOf = (id: string): Profile | null => (id === 'd1' ? me : PROFILES[id] || null);
    const pStage = (id: string): Stage => {
      if (id === 'd1') return me.saved ? (d1Checked === mySig ? ['checked', 'проверен', 'ok'] : ['ready', 'ждёт проверки', 'info']) : ['filling', `заполняет · шаг ${trip.pStep + 1} из 4`, 'warn'];
      if (NOT_READY[id]) return [NOT_READY[id].st, NOT_READY[id].text, 'warn'];
      return checked[id] ? ['checked', 'проверен', 'ok'] : ['ready', 'ждёт проверки', 'info'];
    };
    const ready = (id: string) => ['ready', 'checked'].includes(pStage(id)[0]);
    const severeOf = (id: string) => { const p = profileOf(id); return !!(p && p.saved && p.algOn && p.severe && algNames(p).length); };
    const attnOf = (id: string) => severeOf(id) || pStage(id)[0] !== 'checked';
    const food = groupFoodOf(DELEGATES.map((d) => profileOf(d.id)).filter((p): p is Profile => !!p && p.saved));
    const foodDirty = JSON.stringify(food) !== foodSent.sig;
    const foodChanges = () => {
      const was: FoodSum = JSON.parse(foodSent.sig);
      const out: string[] = [];
      Object.entries(food.dc).forEach(([k, n]) => { if ((was.dc[k] || 0) !== n) out.push(`${String(DIET_BY[k][1]).toLowerCase()} ${was.dc[k] || 0} → ${n}`); });
      Object.entries(food.ac).forEach(([k, n]) => { if ((was.ac[k] || 0) !== n) out.push(`аллергия «${String(ALG_BY[k][1]).toLowerCase()}» ${was.ac[k] || 0} → ${n}${food.sev[k] ? ' (есть серьёзная)' : ''}`); });
      return out.length ? out : ['состав питания'];
    };
    const rooming = () => {
      const pairs: [string, string][] = [];
      const singles: string[] = [];
      const open: string[] = [];
      const seen = new Set<string>();
      DELEGATES.forEach((d) => {
        if (seen.has(d.id)) return;
        const p = profileOf(d.id);
        if (!p || !p.saved) { open.push(d.id); return; }
        if (p.room === 'single') { singles.push(d.id); return; }
        const m = p.mate ? profileOf(p.mate) : null;
        if (p.mate && m && m.saved && m.mate === d.id) { pairs.push([d.id, p.mate]); seen.add(p.mate); } else open.push(d.id);
        seen.add(d.id);
      });
      return { pairs, singles, open };
    };
    const historyOf = (id: string): [string, string][] => (id === 'd1' ? trip.pHist : BASE_HISTORY[id] || [['27.10', 'Остап: проверено'], ['25.10', `${firstName(id)}: ${fem(id) ? 'заполнила' : 'заполнил'} профиль`]]);
    const notReady = DELEGATES.filter((d) => !ready(d.id));
    // Анна сама нажимает «Я в автобусе» у себя — координатор видит это сразу.
    const away = missing.filter((x) => x !== 'd1' || !trip.inBus);

    return {
      profileOf, pStage, ready, severeOf, attnOf, food, foodDirty, foodChanges, rooming, historyOf, notReady,
      missing: away, legs, reminded, notes, foodSent, anns, igorReminded, pddReminded, docsMissing, viewing,
      busCount: 18 - away.length,
      markBus: (id: string) => { if (id === 'd1') trip.setInBus(true); setMissing((m) => m.filter((x) => x !== id)); },
      /** Отметка переезда; возвращает текст ошибки, если время не подходит. */
      markLeg: (id: string, kind: 'dep' | 'arr', t: string) => {
        if (kind === 'arr') {
          const dep = legs[id]?.dep;
          if (!dep || t <= dep) return 'Прибытие должно быть позже выезда';
        }
        setLegs((l) => ({ ...l, [id]: { ...l[id], [kind]: t } }));
        return '';
      },
      check: (id: string) => {
        if (id === 'd1') { setD1Checked(mySig); trip.addHist('Остап: проверено'); } else setChecked((c) => ({ ...c, [id]: true }));
      },
      remind: (id: string) => setReminded((r) => ({ ...r, [id]: true })),
      remindAll: () => setReminded((r) => ({ ...r, ...Object.fromEntries(notReady.map((d) => [d.id, true])) })),
      setNote: (id: string, text: string) => setNotes((n) => ({ ...n, [id]: text })),
      sendFood: () => setFoodSent({ at: `сегодня, ${NOW}`, sig: JSON.stringify(food) }),
      sendAnn: (a: Omit<Ann, 'id' | 'time'>) => setAnns((x) => [{ ...a, id: `a${x.length}`, time: NOW }, ...x]),
      remindIgor: () => setIgorReminded(true),
      remindPdd: () => setPddReminded(true),
      setViewing,
      guideLive, setGuideLive, out, setOut, followups, reviews, rating, setRating, hema, setHema,
      addFollowup: (f: Omit<Followup, 'id' | 'status'>) => setFollowups((x) => [...x, { ...f, id: `f${x.length}`, status: 'new' }]),
      sendFollowup: (id: string) => setFollowups((x) => x.map((f) => (f.id === id ? { ...f, status: 'sent' } : f))),
      addReview: (r: Omit<Review, 'id' | 'status'>) => setReviews((x) => [{ ...r, id: `r${x.length}`, status: 'new' }, ...x]),
      markReview: (id: string, status: Review['status']) => setReviews((x) => x.map((r) => (r.id === id ? { ...r, status } : r))),
      foodLineOf: (id: string) => { const p = profileOf(id); return p ? foodLine(p) : ''; },
    };
  }, [trip, missing, legs, checked, d1Checked, reminded, notes, foodSent, anns, igorReminded, pddReminded, viewing, guideLive, out, followups, reviews, rating, hema]);
}

type Coord = ReturnType<typeof useCoordState>;
const Ctx = createContext<Coord | null>(null);

export function CoordProvider({ children }: { children: ReactNode }) {
  const v = useCoordState();
  return <Ctx.Provider value={v}>{children}</Ctx.Provider>;
}

export function useCoord() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useCoord вне CoordProvider');
  return v;
}

