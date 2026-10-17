// Агент и заявки (шаг 1 — в памяти телефона): заявки на места, запросы на расчёт, занятые места в выездах.
// Координатор видит все заявки (агентов и с сайта) и меняет их статус; агент — только свои.
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import { AGENCY, SEED_APPS, SEED_CALC, depById, freshCalc, tourById, type AgentApp, type CalcDraft, type CalcReq, type Dep } from '@/data/agent';

function useAgentState() {
  const [apps, setApps] = useState<AgentApp[]>(SEED_APPS);
  const [calcs, setCalcs] = useState<CalcReq[]>(SEED_CALC);
  const [depTaken, setDepTaken] = useState<Record<string, number>>({});
  const [seq, setSeq] = useState(15);
  const [draft, setDraft] = useState<CalcDraft>(freshCalc);

  return useMemo(() => {
    const depFree = (d: Dep) => Math.max(0, d.total - d.taken - (depTaken[d.id] || 0));
    const patchApp = (id: string, p: Partial<AgentApp>) => setApps((a) => a.map((x) => (x.id === id ? { ...x, ...p } : x)));
    const patchCalc = (id: string, p: Partial<CalcReq>) => setCalcs((a) => a.map((x) => (x.id === id ? { ...x, ...p } : x)));
    return {
      apps, myApps: apps.filter((x) => x.mine), calcs, depFree, draft,
      editDraft: (p: Partial<CalcDraft>) => setDraft((d) => ({ ...d, ...p })),
      resetDraft: (tour = '') => {
        const d = freshCalc();
        if (tour) { d.tour = tour; const dep = Object.values(depById).find((x) => x.tour === tour && depFree(x) > 0); d.dep = dep ? dep.id : ''; }
        setDraft(d);
      },
      /** Заявка агента на места; возвращает текст ошибки или ''. */
      submitApp: (a: { tour: string; dep: string | null; dates: string; people: number; client: string; cit: string; note: string }) => {
        if (!a.tour) return 'Выберите программу';
        if (!a.people) return 'Укажите число участников';
        const dep = a.dep ? depById[a.dep] : null;
        if (dep && a.people > depFree(dep)) return `В этом выезде свободно ${depFree(dep)} мест — уменьшите группу или выберите свои даты`;
        setApps((x) => [{ id: `ap${Date.now()}`, agency: AGENCY, tour: a.tour, dep: dep ? dep.id : null, dates: dep ? dep.dates : a.dates.trim() || 'даты под группу', people: a.people,
          client: a.client.trim() || 'Клиент не указан', cit: a.cit, status: 'new', note: a.note.trim() ? `Комментарий: ${a.note.trim()}` : '', time: 'сегодня', mine: true, upd: false }, ...x]);
        return '';
      },
      takeApp: (id: string) => patchApp(id, { status: 'work', note: 'Остап Доценко взял заявку в работу', upd: true }),
      confirmApp: (id: string) => {
        const x = apps.find((a) => a.id === id);
        if (!x) return;
        if (x.dep) setDepTaken((t) => ({ ...t, [x.dep!]: (t[x.dep!] || 0) + x.people }));
        patchApp(id, { status: 'confirmed', upd: true, note: x.dep ? `Места забронированы: ${x.people} в выезде ${x.dates}. Дальше — договор и список участников` : 'Даты согласованы — договор придёт на почту агентства' });
      },
      /** Отправка черновика на расчёт; возвращает [ошибка, номер запроса]. */
      submitCalc: (): [string, string] => {
        const c = draft;
        if (c.mode === 'ready' && !c.tour) return ['Выберите программу из каталога', ''];
        if (c.mode === 'custom' && !c.sectors.length && !c.companies.length) return ['Укажите отрасль или компании', ''];
        const people = Number(c.people || 0);
        if (!people) return ['Укажите число участников', ''];
        const cit = c.cit.map((r) => ({ c: r.c, n: Number(r.n || 0) }));
        const sum = cit.reduce((n, r) => n + r.n, 0);
        if (cit.length === 1 && !sum) cit[0].n = people;
        else if (sum !== people) return [`Гражданство: указано ${sum} из ${people} участников`, ''];
        const dep = c.dep ? depById[c.dep] : null;
        const id = `R-0${seq}`;
        setSeq((n) => n + 1);
        setCalcs((x) => [{ id, mode: c.mode, tour: c.mode === 'ready' ? c.tour : '', country: c.mode === 'ready' && c.tour ? tourById[c.tour].country : c.country, cities: c.cities.trim(), changes: c.mode === 'ready' ? c.changes.trim() : '',
          sectors: c.sectors, goals: c.goals, companies: c.companies, pickCos: c.pickCos, people, cit, level: c.level, lang: c.lang, dates: dep ? dep.dates : c.dates.trim(), days: c.mode === 'custom' ? c.days : '',
          from: c.from, flight: c.flight, hotel: c.hotel, room: c.room, incl: c.incl, client: c.client.trim() || 'Клиент не указан', budget: c.budget.trim(), due: c.due, note: c.note.trim(), file: c.file,
          status: 'new', time: 'сегодня', upd: false }, ...x]);
        setDraft(freshCalc());
        return ['', id];
      },
      takeCalc: (id: string) => patchCalc(id, { status: 'calc', upd: true }),
      doneCalc: (id: string) => patchCalc(id, { status: 'done', upd: true }),
      /** Агент открыл «Заявки» — отметки «новое» гаснут. */
      seen: () => { setApps((a) => a.map((x) => (x.upd ? { ...x, upd: false } : x))); setCalcs((a) => a.map((x) => (x.upd ? { ...x, upd: false } : x))); },
    };
  }, [apps, calcs, depTaken, seq, draft]);
}

type Agent = ReturnType<typeof useAgentState>;
const Ctx = createContext<Agent | null>(null);

export function AgentProvider({ children }: { children: ReactNode }) {
  const v = useAgentState();
  return <Ctx.Provider value={v}>{children}</Ctx.Provider>;
}

export function useAgent() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAgent вне AgentProvider');
  return v;
}
