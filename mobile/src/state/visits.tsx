// Заметки делегата к визитам (текст, голос, фото, рассказ гида) и визитки, отсканированные на визитах. Всё хранится на телефоне
// и попадает в «Итоги поездки» (PDF). Видит только сам делегат — координатору и компаниям не отправляется.
import { createContext, useContext, useMemo, type ReactNode } from 'react';

import type { BizCard } from '@/data/card';
import { dropFile, nowLabel } from '@/data/media';
import { useStored } from '@/state/store';

/** guide — рассказ гида (субтитры радиогида). tags и deal — поправленные вручную темы и отметка «договорённость»;
 *  пока не заданы, их находит словарь тем (data/themes.ts). */
export type VNote = { id: string; at: string; kind: 'text' | 'voice' | 'photo' | 'guide'; text?: string; uri?: string; sec?: number; tags?: string[]; deal?: boolean };

type VisitsState = {
  notesOf: (visit: string) => VNote[];
  addNote: (visit: string, n: Omit<VNote, 'id' | 'at'>) => void;
  removeNote: (visit: string, id: string) => void;
  updateNote: (visit: string, id: string, patch: Partial<Pick<VNote, 'tags' | 'deal'>>) => void;
  cards: BizCard[];
  cardsOf: (visit: string) => BizCard[];
  saveCard: (c: BizCard) => void;
  removeCard: (id: string) => void;
};

const Ctx = createContext<VisitsState | null>(null);
const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export function VisitsProvider({ children }: { children: ReactNode }) {
  const [notes, setNotes] = useStored<Record<string, VNote[]>>('visits.notes', {});
  const [cards, setCards] = useStored<BizCard[]>('visits.cards', []);
  const value = useMemo<VisitsState>(() => ({
    notesOf: (v) => notes[v] || [],
    addNote: (v, n) => setNotes((all) => ({ ...all, [v]: [{ ...n, id: uid(), at: nowLabel() }, ...(all[v] || [])] })),
    removeNote: (v, id) => setNotes((all) => {
      const gone = (all[v] || []).find((n) => n.id === id);
      dropFile(gone?.uri);
      return { ...all, [v]: (all[v] || []).filter((n) => n.id !== id) };
    }),
    updateNote: (v, id, patch) => setNotes((all) => ({ ...all, [v]: (all[v] || []).map((n) => (n.id === id ? { ...n, ...patch } : n)) })),
    cards,
    cardsOf: (v) => cards.filter((c) => c.visit === v),
    saveCard: (c) => setCards((all) => (all.some((x) => x.id === c.id) ? all.map((x) => (x.id === c.id ? c : x)) : [{ ...c, id: c.id || uid(), at: c.at || nowLabel() }, ...all])),
    removeCard: (id) => setCards((all) => {
      dropFile(all.find((c) => c.id === id)?.photo);
      return all.filter((c) => c.id !== id);
    }),
  }), [notes, cards, setNotes, setCards]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useVisits() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useVisits вне VisitsProvider');
  return v;
}
