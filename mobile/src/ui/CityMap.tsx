// Офлайн-карта города (data/offline-map.ts): вода, дороги, линии метро и станции — одним SVG; точки поездки, люди группы и
// «Я здесь» — метками поверх карты, их удобно нажимать. Двигается пальцем, масштаб — двумя пальцами, колесом мыши и кнопками ±.
// Названия станций появляются при приближении. Подпись «© OpenStreetMap» — обязательное условие лицензии данных.
import { memo, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { PanResponder, Platform, Pressable, Text, View, type GestureResponderEvent, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, G, Path, Rect, Text as SvgText } from 'react-native-svg';

import type { CityMap as Map } from '@/data/offline-map';
import type { PointKind } from '@/data/places-geo';
import { Icon } from './Icon';
import type { IconName } from './icon-paths';
import { C, F, SH } from './theme';

/** Как выглядят точки поездки на карте. */
export const POINT_STYLE: Record<PointKind, { icon: IconName; color: string; ru: string }> = {
  hotel: { icon: 'bed', color: '#1a73e8', ru: 'Отель' },
  visit: { icon: 'building', color: '#7048e8', ru: 'Визит' },
  meal: { icon: 'food', color: '#d9622b', ru: 'Ресторан' },
  culture: { icon: 'culture', color: '#1e8e5a', ru: 'Культура' },
};

export type Marker = { key: string; lat: number; lng: number; icon?: IconName; text?: string; color: string; ring?: string; label?: string };
type View3 = { cx: number; cy: number; span: number };

const MIN_SPAN = 600, LABELS_SPAN = 9000;

/** Подпись с белой обводкой — читается поверх линий: обводка снизу, текст сверху. */
function Label({ x, y, k, text, bold }: { x: number; y: number; k: number; text: string; bold?: boolean }) {
  const f = bold ? F.semibold : F.medium;
  return (
    <G>
      <SvgText x={x} y={y} fontSize={10.5 * k} fontFamily={f} fill="#ffffff" stroke="#ffffff" strokeWidth={2.8 * k} strokeLinejoin="round">{text}</SvgText>
      <SvgText x={x} y={y} fontSize={10.5 * k} fontFamily={f} fill={bold ? '#3a4357' : '#26324a'}>{text}</SvgText>
    </G>
  );
}

/** Слои карты — отдельно: при сдвиге не перерисовываются, при масштабе меняется только толщина линий. */
const Layers = memo(function Layers({ m, k, labels }: { m: Map; k: number; labels: boolean }) {
  return (
    <G>
      <Rect x={0} y={0} width={m.W} height={m.H} fill="#eef1f5" />
      <Path d={m.water.areas} fill="#cfe2f6" />
      <Path d={m.water.lines} stroke="#a9cbee" strokeWidth={2.4 * k} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Path d={m.roads.minor} stroke="#dde3ea" strokeWidth={3.6 * k} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Path d={m.roads.major} stroke="#e7c879" strokeWidth={5.2 * k} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Path d={m.roads.minor} stroke="#ffffff" strokeWidth={2.2 * k} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Path d={m.roads.major} stroke="#fde9b8" strokeWidth={3.4 * k} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {m.metro.map((l) => <Path key={l.ref + l.zh} d={l.d} stroke={l.color} strokeWidth={3.2 * k} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={0.92} />)}
      {m.stations.map((st, i) => <Circle key={`s${i}`} cx={st.X} cy={st.Y} r={3.1 * k} fill="#ffffff" stroke="#1f2a3d" strokeWidth={1.3 * k} />)}
      {labels ? m.stations.map((st, i) => <Label key={`t${i}`} x={st.X + 5 * k} y={st.Y - 4 * k} k={k} text={st.ru || st.en || st.zh} />) : null}
      {[...m.rail, ...m.airports].map((p, i) => (
        <G key={`r${i}`}>
          <Rect x={p.X - 4.5 * k} y={p.Y - 4.5 * k} width={9 * k} height={9 * k} rx={2 * k} fill="#5b6576" />
          {labels || i < m.rail.length ? <Label x={p.X + 7 * k} y={p.Y + 3.5 * k} k={k} text={p.ru || p.en} bold /> : null}
        </G>
      ))}
    </G>
  );
});

type Props = {
  map: Map;
  markers?: Marker[];
  me?: { lat: number; lng: number; acc?: number } | null;
  selected?: string;
  onSelect?: (key: string) => void;
  height?: number;
  /** Начальный вид: центр и ширина в метрах. */
  focus?: { lat: number; lng: number; span?: number };
  /** Сменился — карта переезжает к focus (выбрали точку в списке). */
  focusKey?: string;
  children?: ReactNode;
};

export function CityMap({ map: m, markers = [], me, selected, onSelect, height = 420, focus, focusKey, children }: Props) {
  const [w, setW] = useState(0);
  const init = (): View3 => {
    if (focus && m.contains(focus.lat, focus.lng)) { const [cx, cy] = m.project(focus.lat, focus.lng); return { cx, cy, span: focus.span ?? 7000 }; }
    return { cx: m.W / 2, cy: m.H / 2, span: m.W };
  };
  const [v, setV] = useState<View3>(init);
  const vRef = useRef(v);
  vRef.current = v;
  const wRef = useRef(0);
  wRef.current = w;
  const clamp = (x: View3): View3 => {
    const span = Math.min(Math.max(x.span, MIN_SPAN), m.W * 1.2);
    return { span, cx: Math.min(Math.max(x.cx, 0), m.W), cy: Math.min(Math.max(x.cy, 0), m.H) };
  };
  const zoom = (f: number) => setV((x) => clamp({ ...x, span: x.span * f }));
  useEffect(() => {
    if (!focusKey || !focus || !m.contains(focus.lat, focus.lng)) return;
    const [cx, cy] = m.project(focus.lat, focus.lng);
    setV((x) => clamp({ cx, cy, span: Math.min(x.span, focus.span ?? 3500) }));
  }, [focusKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // жесты: один палец — сдвиг, два — масштаб; касание без движения достаётся меткам
  const g = useRef({ start: v, dist: 0 });
  const pan = useMemo(() => {
    const two = (e: GestureResponderEvent) => {
      const t = e.nativeEvent.touches;
      return t.length >= 2 ? Math.hypot(t[0].pageX - t[1].pageX, t[0].pageY - t[1].pageY) : 0;
    };
    return PanResponder.create({
      onMoveShouldSetPanResponder: (_, s) => Math.abs(s.dx) + Math.abs(s.dy) > 4,
      onPanResponderGrant: (e) => { g.current = { start: vRef.current, dist: two(e) }; },
      onPanResponderMove: (e, s) => {
        const st = g.current.start;
        const d = two(e);
        if (d && g.current.dist) { setV(clamp({ ...st, span: (st.span * g.current.dist) / d })); return; }
        if (d && !g.current.dist) { g.current = { start: vRef.current, dist: d }; return; }
        const upp = st.span / (wRef.current || 1);
        setV(clamp({ ...st, cx: st.cx - s.dx * upp, cy: st.cy - s.dy * upp }));
      },
      onPanResponderTerminationRequest: () => false,
    });
  }, [m]); // eslint-disable-line react-hooks/exhaustive-deps

  const spanH = w ? (v.span * height) / w : v.span;
  const k = w ? v.span / w : 1; // единиц карты в одном пикселе
  const toScreen = (lat: number, lng: number) => {
    const [X, Y] = m.project(lat, lng);
    return { left: (X - (v.cx - v.span / 2)) / k, top: (Y - (v.cy - spanH / 2)) / k };
  };
  const onLayout = (e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width);
  // колесо мыши в браузере
  const wheel = Platform.OS === 'web' ? { onWheel: (e: { deltaY: number; preventDefault?: () => void }) => { e.preventDefault?.(); zoom(e.deltaY > 0 ? 1.15 : 1 / 1.15); } } : {};

  const btn = (icon: IconName | null, label: string, fn: () => void, text?: string) => (
    <Pressable onPress={fn} accessibilityRole="button" accessibilityLabel={label}
      style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center', boxShadow: SH.small }}>
      {icon ? <Icon name={icon} size={20} color={C.blueInk} /> : <Text style={{ fontFamily: F.bold, fontSize: 20, color: C.blueInk }}>{text}</Text>}
    </Pressable>
  );
  const visible = (p: { left: number; top: number }) => p.left > -30 && p.left < w + 30 && p.top > -30 && p.top < height + 30;

  return (
    <View onLayout={onLayout} style={{ height, borderRadius: 22, overflow: 'hidden', backgroundColor: '#eef1f5', boxShadow: SH.inset }} {...pan.panHandlers} {...(wheel as object)}>
      {w ? (
        <Svg width={w} height={height} viewBox={`${v.cx - v.span / 2} ${v.cy - spanH / 2} ${v.span} ${spanH}`}>
          <Layers m={m} k={k} labels={v.span < LABELS_SPAN} />
          {me && m.contains(me.lat, me.lng) ? (() => { const [X, Y] = m.project(me.lat, me.lng); return (
            <G>
              <Circle cx={X} cy={Y} r={Math.max(me.acc || 0, 8 * k)} fill="rgba(26,115,232,0.14)" stroke="rgba(26,115,232,0.35)" strokeWidth={k} />
              <Circle cx={X} cy={Y} r={7 * k} fill="#1a73e8" stroke="#ffffff" strokeWidth={2.6 * k} />
            </G>
          ); })() : null}
        </Svg>
      ) : null}
      {w ? markers.map((mk) => {
        const p = toScreen(mk.lat, mk.lng);
        if (!visible(p)) return null;
        const on = mk.key === selected;
        const size = on ? 38 : 30;
        return (
          <Pressable key={mk.key} onPress={() => onSelect?.(mk.key)} accessibilityRole="button" accessibilityLabel={mk.label || mk.key} hitSlop={6}
            style={{ position: 'absolute', left: p.left - size / 2, top: p.top - size / 2, width: size, height: size, borderRadius: size / 2, backgroundColor: mk.color,
              borderWidth: on ? 3 : 2, borderColor: mk.ring || '#ffffff', alignItems: 'center', justifyContent: 'center', boxShadow: '0px 3px 8px rgba(15,27,45,0.3)' }}>
            {mk.icon ? <Icon name={mk.icon} size={on ? 19 : 16} color="#ffffff" /> : <Text style={{ fontFamily: F.bold, fontSize: on ? 13 : 11, color: '#ffffff' }}>{mk.text}</Text>}
          </Pressable>
        );
      }) : null}
      <View style={{ position: 'absolute', right: 10, top: 10, gap: 8 }}>
        {btn(null, 'Приблизить', () => zoom(1 / 1.6), '+')}
        {btn(null, 'Отдалить', () => zoom(1.6), '−')}
        {me && m.contains(me.lat, me.lng) ? btn('locate', 'Где я', () => { const [cx, cy] = m.project(me.lat, me.lng); setV((x) => clamp({ ...x, cx, cy, span: Math.min(x.span, 3000) })); }) : null}
      </View>
      <Text style={{ position: 'absolute', right: 8, bottom: 6, fontFamily: F.regular, fontSize: 10, color: '#5b6576', backgroundColor: 'rgba(255,255,255,0.75)', paddingHorizontal: 5, borderRadius: 4 }}>
        © OpenStreetMap
      </Text>
      {children}
    </View>
  );
}

/** Показать на карте точку: вид с центром в ней. */
export const focusOn = (lat: number, lng: number, span = 3500) => ({ lat, lng, span });
