// Контакты поездки и экстренные номера страны поездки. Номера в демо — примеры; в приложении их задаёт координатор.
import { Linking, Pressable, Text, View } from 'react-native';

import { countryOf } from '@/data/countries';
import { CONTACTS, TRIP, hotelOf } from '@/data/trip';
import { Icon } from '@/ui/Icon';
import { Card, H3, Plain, Row, T } from '@/ui/kit';
import { C, F } from '@/ui/theme';

const call = (phone: string) => Linking.openURL(`tel:${phone.replace(/[\s-]/g, '')}`);

export default function Contacts() {
  const h = hotelOf(TRIP.today);
  const people = [...CONTACTS, ...(h ? [{ name: h.name, role: 'Отель сегодня', phones: h.phone ? [h.phone] : [], im: h.phone ? 'Стойка регистрации' : 'Телефон пришлёт координатор' }] : [])];
  const country = countryOf(TRIP.country);
  return (
    <Plain>
      <T muted>Номера в демо — примеры; в приложении их задаёт координатор.</T>
      <Card>
        {people.map((p) => (
          <Row
            key={p.name}
            title={p.name}
            sub={<View><Text style={{ fontFamily: F.regular, fontSize: 12.5, color: C.muted }}>{p.role}</Text>{p.phones.map((ph) => <Text key={ph} selectable style={{ fontFamily: F.medium, fontSize: 14, color: C.ink, fontVariant: ['tabular-nums'] }}>{ph}</Text>)}<Text style={{ fontFamily: F.regular, fontSize: 12.5, color: C.muted }}>{p.im}</Text></View>}
            right={!p.phones.length ? undefined :
              <Pressable onPress={() => call(p.phones[0])} accessibilityRole="button" accessibilityLabel={`Позвонить: ${p.name}`} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: C.blueSoft, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="phone" size={20} color={C.blueInk} />
              </Pressable>
            }
          />
        ))}
      </Card>
      <Card tone="warn">
        <H3>{`Экстренные службы: ${country.ru}`}</H3>
        {country.emergency.map(([n, l]) => (
          <Row key={n} title={<Text style={{ fontFamily: F.bold, fontSize: 18, color: C.ink }}>{n}</Text>} sub={l} onPress={() => call(n)} label={`Позвонить ${n}: ${l}`} />
        ))}
        <T muted>{`Посольство России ${country.inRu} — [телефон уточнить]`}</T>
      </Card>
    </Plain>
  );
}
