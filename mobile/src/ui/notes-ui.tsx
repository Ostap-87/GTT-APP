// Заметки к визиту: текст, голос (диктофон), фото с камеры или из галереи; список заметок с воспроизведением голоса.
// У каждой заметки — темы для майндмэпа (найдены по словам, можно поправить) и отметка «Договорённость».
import { AudioModule, RecordingPresets, setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus, useAudioRecorder, useAudioRecorderState } from 'expo-audio';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Image, Platform, Pressable, Text, TextInput, View } from 'react-native';

import { keepFile } from '@/data/media';
import { noteDeal, noteThemes } from '@/data/mindmap';
import { THEMES, themeOf } from '@/data/themes';
import { useToast } from '@/state/toast';
import { useVisits, type VNote } from '@/state/visits';
import { Icon } from './Icon';
import { Button, Chips, Pick, inputStyle } from './kit';
import { C, F } from './theme';

const mmss = (sec: number) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;

/** Фото: с камеры или из галереи, сжатое — для заметок и визиток. Возвращает постоянный путь к файлу. */
export async function pickPhoto(from: 'camera' | 'library'): Promise<{ uri: string; base64?: string | null } | null> {
  const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: Platform.OS === 'web' ? 0.5 : 0.7 };
  if (from === 'camera') {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted && Platform.OS !== 'web') return null;
  }
  const r = from === 'camera' ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
  if (r.canceled || !r.assets?.length) return null;
  return { uri: r.assets[0].uri };
}

export function NoteComposer({ visit }: { visit: string }) {
  const { addNote } = useVisits();
  const toast = useToast();
  const [text, setText] = useState('');
  const recorder = useAudioRecorder({ ...RecordingPresets.HIGH_QUALITY, directory: 'document' } as typeof RecordingPresets.HIGH_QUALITY);
  const rec = useAudioRecorderState(recorder);

  const toggleRec = async () => {
    try {
      if (rec.isRecording) {
        await recorder.stop();
        const sec = Math.round((rec.durationMillis || 0) / 1000);
        if (recorder.uri) addNote(visit, { kind: 'voice', uri: await keepFile(recorder.uri, Platform.OS === 'web' ? 'webm' : 'm4a'), sec });
        toast('Голосовая заметка сохранена');
        return;
      }
      const perm = await AudioModule.requestRecordingPermissionsAsync();
      if (!perm.granted) return toast('Нужен доступ к микрофону — разрешите в настройках телефона');
      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
    } catch {
      toast('Не получилось включить запись');
    }
  };
  const photo = async (from: 'camera' | 'library') => {
    try {
      const p = await pickPhoto(from);
      if (!p) return;
      addNote(visit, { kind: 'photo', uri: await keepFile(p.uri, 'jpg') });
      toast('Фото добавлено к визиту');
    } catch {
      toast('Не получилось добавить фото');
    }
  };
  const saveText = () => {
    const t = text.trim();
    if (!t) return toast('Напишите заметку');
    addNote(visit, { kind: 'text', text: t });
    setText('');
    toast('Заметка сохранена');
  };

  return (
    <View style={{ gap: 8 }}>
      <TextInput value={text} onChangeText={setText} placeholder="Что важно запомнить: цифры, идеи, договорённости" placeholderTextColor={C.muted} multiline accessibilityLabel="Новая заметка к визиту" style={[inputStyle, { minHeight: 60 }]} />
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        <View style={{ flexGrow: 1 }}><Button title="Сохранить" small onPress={saveText} /></View>
        <View style={{ flexGrow: 1 }}>
          <Button title={rec.isRecording ? `Стоп · ${mmss((rec.durationMillis || 0) / 1000)}` : 'Голос'} icon={rec.isRecording ? 'stop' : 'mic'} kind={rec.isRecording ? 'dark' : 'light'} small onPress={toggleRec} label={rec.isRecording ? 'Остановить запись' : 'Записать голосовую заметку'} />
        </View>
        <View style={{ flexGrow: 1 }}><Button title="Фото" icon="camera" kind="light" small onPress={() => photo('camera')} label="Сфотографировать" /></View>
        <View style={{ flexGrow: 1 }}><Button title="Галерея" kind="light" small onPress={() => photo('library')} label="Добавить фото из галереи" /></View>
      </View>
    </View>
  );
}

function VoiceRow({ n, onDelete }: { n: VNote; onDelete: () => void }) {
  const player = useAudioPlayer(n.uri ? { uri: n.uri } : null);
  const st = useAudioPlayerStatus(player);
  const play = () => {
    if (st.playing) return player.pause();
    if (st.duration && st.currentTime >= st.duration - 0.1) player.seekTo(0);
    player.play();
  };
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <Pressable onPress={play} accessibilityRole="button" accessibilityLabel={st.playing ? 'Пауза' : 'Прослушать заметку'} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: C.blue, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={st.playing ? 'stop' : 'play'} size={16} color="#fff" />
      </Pressable>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: F.semibold, fontSize: 14, color: C.ink }}>{`Голосовая заметка · ${mmss(n.sec || st.duration || 0)}`}</Text>
        <Text style={{ fontFamily: F.regular, fontSize: 12, color: C.muted }}>{n.at}</Text>
      </View>
      <DeleteBtn onPress={onDelete} />
    </View>
  );
}

function DeleteBtn({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel="Удалить заметку" hitSlop={8} style={{ padding: 6 }}>
      <Icon name="trash" size={18} color={C.muted} />
    </Pressable>
  );
}

export function NoteList({ visit }: { visit: string }) {
  const { notesOf, removeNote } = useVisits();
  const notes = notesOf(visit);
  const photos = notes.filter((n) => n.kind === 'photo');
  if (!notes.length) return <Text style={{ fontFamily: F.regular, fontSize: 13, color: C.muted }}>Заметок пока нет. Всё, что вы сюда добавите, попадёт в итоги поездки.</Text>;
  return (
    <View>
      {notes.filter((n) => n.kind !== 'photo').map((n) => (
        <View key={n.id} style={{ paddingVertical: 8, gap: 6, borderTopWidth: 1, borderTopColor: C.line2 }}>
          {n.kind === 'voice' ? (
            <VoiceRow n={n} onDelete={() => removeNote(visit, n.id)} />
          ) : (
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                {n.kind === 'guide' ? <Text style={{ fontFamily: F.semibold, fontSize: 12, color: C.blueInk }}>Рассказ гида</Text> : null}
                <Text style={{ fontFamily: F.regular, fontSize: 14, lineHeight: 20, color: C.ink }}>{n.text}</Text>
                <Text style={{ fontFamily: F.regular, fontSize: 12, color: C.muted }}>{n.at}</Text>
              </View>
              <DeleteBtn onPress={() => removeNote(visit, n.id)} />
            </View>
          )}
          <NoteTags visit={visit} n={n} />
        </View>
      ))}
      {photos.length ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: C.line2 }}>
          {photos.map((p) => (
            <Pressable key={p.id} onLongPress={() => removeNote(visit, p.id)} accessibilityLabel={`Фото ${p.at}, долгое нажатие — удалить`}>
              <Image source={{ uri: p.uri }} style={{ width: 96, height: 96, borderRadius: 10, backgroundColor: C.line2 }} />
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function Tag({ color, label }: { color: string; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: C.line2 }}>
      <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: color }} />
      <Text style={{ fontFamily: F.medium, fontSize: 11.5, color: C.ink }}>{label}</Text>
    </View>
  );
}

/** Темы заметки для майндмэпа: показываем найденные, по нажатию — выбор вручную. */
function NoteTags({ visit, n }: { visit: string; n: VNote }) {
  const { updateNote } = useVisits();
  const [open, setOpen] = useState(false);
  const tags = noteThemes(n);
  const deal = noteDeal(n);
  const toggle = (k: string) => updateNote(visit, n.id, { tags: tags.includes(k) ? tags.filter((x) => x !== k) : [...tags, k] });
  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
        {deal ? <Tag color={C.warn} label="Договорённость" /> : null}
        {tags.map((k) => <Tag key={k} color={themeOf(k)?.color || C.muted} label={themeOf(k)?.ru || k} />)}
        <Pressable onPress={() => setOpen(!open)} accessibilityRole="button" accessibilityState={{ expanded: open }} accessibilityLabel={open ? 'Готово, свернуть темы' : 'Темы заметки для майндмэпа'} hitSlop={6}>
          <Text style={{ fontFamily: F.semibold, fontSize: 12, color: C.blue, paddingVertical: 3 }}>{open ? 'Готово' : tags.length || deal ? 'Изменить темы' : '+ тема'}</Text>
        </Pressable>
      </View>
      {open ? (
        <Chips>
          <Pick title="Договорённость" on={deal} onPress={() => updateNote(visit, n.id, { deal: !deal })} />
          {THEMES.map((t) => <Pick key={t.key} title={t.ru} on={tags.includes(t.key)} onPress={() => toggle(t.key)} />)}
        </Chips>
      ) : null}
    </View>
  );
}
