// Конструктор организатора (white label, решение 21.10.2026: «чтобы можно было блоками составлять под требования клиента,
// чтобы он сам мог подгрузить логотип и прописать название организации»). Организатор, купивший подписку, сам задаёт
// название, логотип, цвет, координатора, собирает «Сегодня» из блоков, выбирает плитки «Под рукой» и вкладки, получает код
// приглашения. Пока сервера нет, организатор сохраняется на этом телефоне (tenants.custom); с сервером — для всех участников.
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import {
  PALETTE, REGION_RU, TENANT, TODAY_BLOCKS, TOOLS, allTenants, blankTenant, deriveBrand, isHex, setCustomTenants, suggestCode,
  type DataRegion, type Tenant, type ToolKey,
} from '@/data/tenant';
import { useSwitchTenant } from '@/state/reset';
import { peekStored, putStored } from '@/state/store';
import { useToast } from '@/state/toast';
import { Icon } from '@/ui/Icon';
import { Button, Card, Check, Chips, Field, H3, Label, Pick, Plain, T } from '@/ui/kit';
import { Monogram } from '@/ui/Monogram';
import { pickPhoto } from '@/ui/notes-ui';
import { C, F, SH } from '@/ui/theme';

const initialsOf = (name: string, words = 2) => name.trim().split(/\s+/).slice(0, words).map((w) => w[0] || '').join('').toUpperCase();
const REGIONS = Object.entries(REGION_RU) as [DataRegion, string][];

export default function Builder() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const switchTenant = useSwitchTenant();
  const toast = useToast();
  const existing = id ? allTenants().find((t) => t.id === id && t.custom) : undefined;
  const [t, setT] = useState<Tenant>(() => (existing ? { ...existing, blocks: existing.blocks.map((b) => ({ ...b })) } : blankTenant()));
  const [hex, setHex] = useState(t.accent);
  // монограмму и код подставляем из названия, пока организатор не поправил их сам
  const [ownShort, setOwnShort] = useState(!!existing);
  const [ownCode, setOwnCode] = useState(!!existing);
  const [armed, setArmed] = useState(false);
  const patch = (p: Partial<Tenant>) => setT((x) => ({ ...x, ...p }));

  const setName = (name: string) => patch({ name, ...(ownShort ? {} : { short: initialsOf(name, 3) }), ...(ownCode ? {} : { code: suggestCode(name) }) });
  const setColor = (h: string) => { setHex(h); if (isHex(h)) patch(deriveBrand(h)); };
  const uploadLogo = async () => {
    const p = await pickPhoto('library');
    if (!p) return;
    try {
      const img = await (await ImageManipulator.manipulate(p.uri).resize({ width: 256 }).renderAsync()).saveAsync({ format: SaveFormat.PNG, base64: true });
      patch({ logo: `data:image/png;base64,${img.base64}` });
    } catch {
      toast('Не получилось открыть картинку — попробуйте PNG или JPG');
    }
  };
  const moveBlock = (i: number, d: -1 | 1) => setT((x) => {
    const b = [...x.blocks];
    const j = i + d;
    if (j < 0 || j >= b.length) return x;
    const cur = b.at(i)!;
    b.splice(i, 1);
    b.splice(j, 0, cur);
    return { ...x, blocks: b };
  });
  const toggleTool = (k: ToolKey) => patch({ tools: t.tools.includes(k) ? t.tools.filter((x) => x !== k) : TOOLS.map(([key]) => key).filter((key) => key === k || t.tools.includes(key)) });

  const codeTaken = allTenants().some((x) => x.id !== t.id && x.code.toLowerCase() === t.code.toLowerCase());
  const problem = !t.name.trim() ? 'Впишите название организации'
    : !/^[A-Z0-9]{3,12}$/.test(t.code) ? 'Код приглашения: 3–12 латинских букв или цифр'
      : codeTaken ? 'Такой код уже занят — придумайте другой'
        : !t.coordinator.name.trim() ? 'Впишите имя координатора' : '';

  const save = () => {
    if (problem) { toast(problem); return; }
    const ready: Tenant = { ...t, name: t.name.trim(), short: (t.short || initialsOf(t.name, 3)).slice(0, 3), coordinator: { name: t.coordinator.name.trim(), initials: initialsOf(t.coordinator.name) } };
    const list = (peekStored<Tenant[]>('tenants.custom') || []).filter((x) => x.id !== ready.id).concat(ready);
    putStored('tenants.custom', list);
    setCustomTenants(list);
    switchTenant(ready.id);
    toast(`Сохранено: ${ready.name} · код ${ready.code}`);
    setTimeout(() => router.replace('/'), 50);
  };
  const remove = () => {
    if (!armed) { setArmed(true); return; }
    const list = (peekStored<Tenant[]>('tenants.custom') || []).filter((x) => x.id !== t.id);
    putStored('tenants.custom', list);
    setCustomTenants(list);
    if (TENANT.id === t.id) switchTenant('gtt');
    toast(`Удалено: ${t.name}`);
    setTimeout(() => router.replace('/join'), 50);
  };

  return (
    <Plain>
      <Card tone="info">
        <T>Соберите приложение для своих участников: название, логотип и цвет, экран «Сегодня» из нужных блоков. Участники откроют его по коду приглашения.</T>
      </Card>

      <BrandPreview t={t} />

      <Card>
        <H3>Организация</H3>
        <Field label="Название" value={t.name} onChangeText={setName} placeholder="Например, Деловые поездки в Азию" />
        <Field label="Слоган под названием" value={t.tagline} onChangeText={(tagline) => patch({ tagline })} placeholder="Чем вы занимаетесь" />
        <Field label="Монограмма (до 3 букв, если нет логотипа)" value={t.short} onChangeText={(v) => { setOwnShort(true); patch({ short: v.toUpperCase().slice(0, 3) }); }} placeholder="АБ" />
      </Card>

      <Card>
        <H3>Логотип</H3>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <Monogram t={t} size={64} />
          <View style={{ flex: 1, gap: 8 }}>
            <Button title={t.logo ? 'Заменить логотип' : 'Загрузить логотип'} icon="camera" kind="light" small onPress={uploadLogo} />
            {t.logo ? <Button title="Убрать — показывать монограмму" kind="ghost" small onPress={() => patch({ logo: undefined })} /> : null}
          </View>
        </View>
        <T muted>PNG или JPG, лучше на прозрачном фоне. В приложении — на белой плашке.</T>
      </Card>

      <Card>
        <H3>Цвет бренда</H3>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {PALETTE.map((p) => (
            <Pressable key={p} onPress={() => setColor(p)} accessibilityRole="button" accessibilityLabel={`Цвет ${p}`} accessibilityState={{ selected: t.accent === p }}
              style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: p, alignItems: 'center', justifyContent: 'center', boxShadow: t.accent === p ? `0px 0px 0px 3px ${C.card}, 0px 0px 0px 5px ${p}` : SH.small }}>
              {t.accent === p ? <Icon name="check" size={18} color="#fff" /> : null}
            </Pressable>
          ))}
        </View>
        <Field label="Свой цвет (HEX)" value={hex} onChangeText={setColor} placeholder="#1a73e8" />
        {!isHex(hex) ? <T muted>Формат: # и шесть знаков, например #1a73e8.</T> : null}
      </Card>

      <Card>
        <H3>Координатор</H3>
        <Field label="Имя и фамилия" value={t.coordinator.name} onChangeText={(name) => patch({ coordinator: { name, initials: initialsOf(name) } })} placeholder="Кто на связи с группой" />
        <Field label="Телефон для кнопки «Позвонить»" value={t.phone || ''} onChangeText={(phone) => patch({ phone })} placeholder="+7 900 000-00-00" keyboardType="phone-pad" />
      </Card>

      <Card>
        <H3>Экран «Сегодня»</H3>
        <T muted>Включите нужные блоки и расставьте их стрелками.</T>
        {t.blocks.map((b, i) => {
          const meta = TODAY_BLOCKS.find(([k]) => k === b.key);
          return (
            <View key={b.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 }}>
              <View style={{ flex: 1 }}>
                <Check on={b.on} onPress={() => patch({ blocks: t.blocks.map((x) => (x.key === b.key ? { ...x, on: !x.on } : x)) })}>{`${meta?.[1] ?? b.key} — ${meta?.[2] ?? ''}`}</Check>
              </View>
              <Arrow label={`Выше: ${meta?.[1]}`} up disabled={i === 0} onPress={() => moveBlock(i, -1)} />
              <Arrow label={`Ниже: ${meta?.[1]}`} disabled={i === t.blocks.length - 1} onPress={() => moveBlock(i, 1)} />
            </View>
          );
        })}
      </Card>

      <Card>
        <H3>Плитки «Под рукой»</H3>
        <Chips>{TOOLS.map(([k, title]) => <Pick key={k} title={title} on={t.tools.includes(k)} onPress={() => toggleTool(k)} />)}</Chips>
        <Label>Вкладки внизу</Label>
        <Check on={t.tabs.library} onPress={() => patch({ tabs: { ...t.tabs, library: !t.tabs.library } })}>Материалы — презентации и памятки</Check>
        <Check on={t.tabs.people} onPress={() => patch({ tabs: { ...t.tabs, people: !t.tabs.people } })}>Люди — группа и знакомства</Check>
        <T muted>«Сегодня», «План» и «Поездка» есть всегда.</T>
      </Card>

      <Card>
        <H3>Код приглашения и данные</H3>
        <Field label="Код (латиница и цифры)" value={t.code} onChangeText={(v) => { setOwnCode(true); patch({ code: v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12) }); }} placeholder="ASIATRIP" />
        {t.code ? <T muted>{`Ссылка для участников: /join?code=${t.code}`}</T> : null}
        <Label>Где хранить данные участников</Label>
        <Chips>{REGIONS.map(([k, ru]) => <Pick key={k} title={ru} on={t.region === k} onPress={() => patch({ region: k })} />)}</Chips>
        <T muted>Выбирайте страну, где работает ваша компания: например, для России закон требует хранить данные граждан в России.</T>
      </Card>

      {problem ? <T muted style={{ paddingHorizontal: 4, color: C.warn }}>{problem}</T> : null}
      <Button title={existing ? 'Сохранить изменения' : 'Сохранить и открыть'} icon="check" onPress={save} />
      {existing ? <Button title={armed ? 'Нажмите ещё раз — удалить организатора' : 'Удалить организатора'} kind="ghost" onPress={remove} /> : null}
      <T muted style={{ paddingHorizontal: 4 }}>Пока сервер не подключён, организатор сохраняется на этом телефоне. После запуска сервера участники откроют его по коду на своих телефонах.</T>
    </Plain>
  );
}

function Arrow({ up, disabled, onPress, label }: { up?: boolean; disabled: boolean; onPress: () => void; label: string }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button" accessibilityLabel={label} hitSlop={6}
      style={{ width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: C.card, boxShadow: disabled ? undefined : SH.small, opacity: disabled ? 0.35 : 1 }}>
      <Text style={{ fontFamily: F.bold, fontSize: 16, color: C.ink }}>{up ? '↑' : '↓'}</Text>
    </Pressable>
  );
}

/** Живой предпросмотр: как участник увидит шапку, карточку «Сейчас», плитки и вкладки в цветах организатора. */
function BrandPreview({ t }: { t: Tenant }) {
  const tools = TOOLS.filter(([k]) => t.tools.includes(k)).slice(0, 3);
  const tabs: [string, string][] = [['sun', 'Сегодня'], ['cal', 'План'], ...(t.tabs.library ? [['book', 'Материалы'] as [string, string]] : []), ...(t.tabs.people ? [['people', 'Люди'] as [string, string]] : []), ['suitcase', 'Поездка']];
  return (
    <View accessibilityLabel={`Предпросмотр: ${t.name || 'новый организатор'}`} style={{ borderRadius: 26, padding: 14, gap: 12, backgroundColor: C.bg, boxShadow: SH.inset }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Monogram t={t} size={36} />
        <View style={{ flex: 1 }}>
          <Text numberOfLines={1} style={{ fontFamily: F.bold, fontSize: 15, color: C.ink }}>{t.name || 'Название организации'}</Text>
          <Text numberOfLines={1} style={{ fontFamily: F.regular, fontSize: 12, color: C.muted }}>{t.tagline}</Text>
        </View>
      </View>
      <LinearGradient colors={[t.heroFrom, t.heroTo]} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={{ borderRadius: 20, padding: 14, gap: 4 }}>
        <Text style={{ fontFamily: F.semibold, fontSize: 11.5, color: 'rgba(255,255,255,0.8)' }}>через 25 мин</Text>
        <Text style={{ fontFamily: F.display, fontSize: 26, color: '#fff', textTransform: 'uppercase' }}>Выезд в 09:30</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
          <View style={{ flex: 1, height: 34, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontFamily: F.bold, fontSize: 12.5, color: t.accent }}>Я в автобусе</Text>
          </View>
          <View style={{ flex: 1, height: 34, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontFamily: F.bold, fontSize: 12.5, color: '#fff' }}>Такси</Text>
          </View>
        </View>
      </LinearGradient>
      {tools.length ? (
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {tools.map(([k, title, icon]) => (
            <View key={k} style={{ flex: 1, alignItems: 'center', gap: 4, paddingVertical: 8, borderRadius: 16, backgroundColor: C.card, boxShadow: SH.small }}>
              <Icon name={icon} size={18} color={t.accentInk} />
              <Text style={{ fontFamily: F.semibold, fontSize: 11, color: C.ink }}>{title}</Text>
            </View>
          ))}
        </View>
      ) : null}
      <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 8, borderRadius: 18, backgroundColor: '#fff', boxShadow: SH.float }}>
        {tabs.map(([icon, title], i) => (
          <View key={title} style={{ alignItems: 'center', gap: 2 }}>
            <Icon name={icon as never} size={18} color={i === 0 ? t.accent : '#8a94a6'} />
            <Text style={{ fontFamily: F.semibold, fontSize: 10, color: i === 0 ? t.accent : '#8a94a6' }}>{title}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
