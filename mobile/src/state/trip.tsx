// Состояние делегата на шаге 1 — сохраняется на телефоне (store.ts). На шаге 2 его дополнит сервер (вход по приглашению, синхронизация).
import { createContext, useContext, useMemo, type ReactNode } from 'react';

import type { TripDoc } from '@/data/docs';
import type { Expense } from '@/data/expenses';
import { dropFile } from '@/data/media';
import { foodLine, freshProfile, type Profile } from '@/data/profile';
import { REMINDERS0, type ReminderSettings } from '@/data/reminders';
import { TRIP } from '@/data/trip';
import { useStored } from '@/state/store';

type Note = { text: string; time: string };
type TripState = {
  inBus: boolean;
  setInBus: (v: boolean) => void;
  done: Record<string, boolean>;
  toggle: (key: string) => void;
  profile: Profile;
  /** Правка профиля — черновик; «Сохранить» делает его видимым координатору. */
  editProfile: (patch: Partial<Profile>) => void;
  saveProfile: () => void;
  /** Шаг анкеты при первом заполнении (0–3): можно прерваться и вернуться к тому же шагу. */
  pStep: number;
  setPStep: (n: number) => void;
  /** История изменений профиля — её видит координатор: [когда, что]. */
  pHist: [string, string][];
  addHist: (what: string) => void;
  downloaded: Record<string, boolean>;
  download: (key: string) => void;
  notes: Note[];
  addNote: (text: string) => void;
  intros: Record<string, boolean>;
  introduce: (id: string) => void;
  /** «Мои документы» — только на этом телефоне. */
  docs: TripDoc[];
  addDoc: (d: TripDoc) => void;
  removeDoc: (id: string) => void;
  /** Расходы всех поездок; экран показывает расходы открытой поездки. */
  expenses: Expense[];
  addExpense: (e: Expense) => void;
  removeExpense: (id: string) => void;
  reminders: ReminderSettings;
  setReminders: (patch: Partial<ReminderSettings>) => void;
};

const Ctx = createContext<TripState | null>(null);
const clock = () => new Date().toTimeString().slice(0, 5);

export function TripProvider({ children }: { children: ReactNode }) {
  const [inBus, setInBus] = useStored('trip.inBus', false);
  const [done, setDone] = useStored<Record<string, boolean>>('trip.done', { passport: true, tickets: true, interests: true });
  const [profile, setProfile] = useStored<Profile>('trip.profile', freshProfile);
  const [pStep, setPStep] = useStored('trip.pStep', 0);
  const [pHist, setPHist] = useStored<[string, string][]>('trip.pHist', []);
  const [downloaded, setDownloaded] = useStored<Record<string, boolean>>('trip.downloaded', { trip: true, memo: true, program: true });
  const [notes, setNotes] = useStored<Note[]>('trip.notes', TRIP.programId ? [] : [{ text: 'JD: спросить про сроки доставки в регионах', time: 'вчера' }]);
  const [intros, setIntros] = useStored<Record<string, boolean>>('trip.intros', {});
  const [docs, setDocs] = useStored<TripDoc[]>('trip.docs', []);
  const [expenses, setExpenses] = useStored<Expense[]>('trip.expenses', []);
  const [reminders, setRem] = useStored<ReminderSettings>('trip.reminders', REMINDERS0);

  const value = useMemo<TripState>(() => ({
    inBus,
    setInBus,
    done,
    toggle: (key) => setDone((d) => ({ ...d, [key]: !d[key] })),
    profile,
    editProfile: (patch) => setProfile((p) => ({ ...p, ...patch })),
    saveProfile: () => {
      setPHist((h) => [[`сегодня, ${clock()}`, `Анна: ${profile.saved ? 'изменила профиль' : 'заполнила профиль'} — ${foodLine(profile)}`], ...h]);
      setProfile((p) => ({ ...p, saved: true }));
      setDone((d) => ({ ...d, profile: true }));
    },
    pStep,
    setPStep,
    pHist,
    addHist: (what) => setPHist((h) => [[`сегодня, ${clock()}`, what], ...h]),
    downloaded,
    download: (key) => setDownloaded((d) => ({ ...d, [key]: true })),
    notes,
    addNote: (text) => setNotes((n) => [{ text, time: 'сейчас' }, ...n]),
    intros,
    introduce: (id) => setIntros((x) => ({ ...x, [id]: true })),
    docs,
    addDoc: (d) => setDocs((x) => [d, ...x]),
    removeDoc: (id) => setDocs((x) => { dropFile(x.find((d) => d.id === id)?.uri); return x.filter((d) => d.id !== id); }),
    expenses,
    addExpense: (e) => setExpenses((x) => [e, ...x]),
    removeExpense: (id) => setExpenses((x) => { dropFile(x.find((e) => e.id === id)?.photo); return x.filter((e) => e.id !== id); }),
    reminders,
    setReminders: (patch) => setRem((r) => ({ ...r, ...patch })),
  }), [inBus, done, profile, pStep, pHist, downloaded, notes, intros, docs, expenses, reminders]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTrip() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useTrip вне TripProvider');
  return v;
}
