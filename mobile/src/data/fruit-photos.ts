// Фото фруктов (решение пользователя 26.10.2026: «для всех фруктов надо сделать фото»): настоящие фотографии с Wikimedia
// Commons, только CC0, общественное достояние, CC BY и CC BY-SA. Файлы — mobile/assets/fruit/<id>.jpg (квадрат 480×480,
// обрезаны и уменьшены), картинки подключает src/ui/fruit-ui.tsx. Авторство обязательно (так требует CC BY): экран
// «Авторы фото» (/fruit-photos) и таблица в docs/apteki-frukty.md. Новое фото — запись здесь, строка в таблице и require.
import { t, type Tx } from './lang';

/** license: 'CC0', 'PD' (общественное достояние) или 'CC BY…'; page — страница файла на Commons. */
export type PhotoCredit = { author: string; license: string; page: string };

export const PHOTO_CREDITS: Record<string, PhotoCredit> = {
  // на вес — FRUITS в data/fruit.ts
  lychee: { author: 'Ivar Leidus', license: 'CC BY-SA 4.0', page: 'https://commons.wikimedia.org/wiki/File:Lychee_fruits_and_seed.jpg' },
  longan: { author: 'Dinkun Chen', license: 'CC BY-SA 4.0', page: 'https://commons.wikimedia.org/wiki/File:Dimocarpus_longan_(2).jpg' },
  mango: { author: 'Ivar Leidus', license: 'CC BY-SA 4.0', page: 'https://commons.wikimedia.org/wiki/File:Mangos_-_single_and_halved.jpg' },
  durian: { author: 'Rod Waddington', license: 'CC BY-SA 2.0', page: 'https://commons.wikimedia.org/wiki/File:Durian_Fruit_in_Yunnan.jpg' },
  mangosteen: { author: 'Ivar Leidus', license: 'CC BY-SA 4.0', page: 'https://commons.wikimedia.org/wiki/File:Mangosteens_-_whole_and_opened.jpg' },
  pitaya: { author: 'Webysther Nunes', license: 'CC BY-SA 4.0', page: 'https://commons.wikimedia.org/wiki/File:Webysther_20150409032418_-_Pitaya.jpg' },
  bayberry: { author: 'Dinkun Chen', license: 'CC BY-SA 4.0', page: 'https://commons.wikimedia.org/wiki/File:Myrica_rubra_in_China.jpg' },
  loquat: { author: 'Dinkun Chen', license: 'CC BY-SA 4.0', page: 'https://commons.wikimedia.org/wiki/File:Loquat_(Eriobotrya_japonica)_in_China.jpg' },
  kiwi: { author: 'André Karwath aka Aka', license: 'CC BY-SA 2.5', page: 'https://commons.wikimedia.org/wiki/File:Kiwi_aka.jpg' },
  pomelo: { author: 'Ivar Leidus', license: 'CC BY-SA 4.0', page: 'https://commons.wikimedia.org/wiki/File:Pomelo_fruit.jpg' },
  orange: { author: 'Evan-Amos', license: 'CC BY-SA 3.0', page: 'https://commons.wikimedia.org/wiki/File:Orange-Fruit-Pieces.jpg' },
  mandarin: { author: 'Joe Ravi', license: 'CC BY-SA 3.0', page: 'https://commons.wikimedia.org/wiki/File:Mandarin_Oranges_(Citrus_Reticulata).jpg' },
  strawberry: { author: 'Ivar Leidus', license: 'CC BY-SA 4.0', page: 'https://commons.wikimedia.org/wiki/File:Garden_strawberry_(Fragaria_%C3%97_ananassa)_single2.jpg' },
  watermelon: { author: 'Mishra12krati', license: 'CC BY-SA 4.0', page: 'https://commons.wikimedia.org/wiki/File:Watermelon_slice.jpg' },
  hami: { author: 'Harrison Keely', license: 'CC BY 4.0', page: 'https://commons.wikimedia.org/wiki/File:A_hami_melon_for_sale_at_a_Publix_market_in_Knoxville,_Tennessee.jpg' },
  cherry: { author: 'Jinsin chen', license: 'CC BY-SA 4.0', page: 'https://commons.wikimedia.org/wiki/File:Cherries_in_Yantai,_China.jpg' },
  chelizi: { author: 'Fumikas Sagisavas', license: 'CC0', page: 'https://commons.wikimedia.org/wiki/File:Chilean_cherries_(1).jpg' },
  grape: { author: 'Anna.Massini', license: 'CC BY 4.0', page: 'https://commons.wikimedia.org/wiki/File:Uva_nera_da_vino_-_grappoli_1.jpg' },
  peach: { author: 'Takkk', license: 'CC BY-SA 3.0', page: 'https://commons.wikimedia.org/wiki/File:Prunus_persica_-_Peach_Hungary.jpg' },
  persimmon: { author: 'Joe Ravi', license: 'CC BY-SA 3.0', page: 'https://commons.wikimedia.org/wiki/File:Fuyu_Persimmon_(Diospyros_Kaki).jpg' },
  pomegranate: { author: 'Ivar Leidus', license: 'CC BY-SA 4.0', page: 'https://commons.wikimedia.org/wiki/File:Pomegranate_fruit_-_whole_and_piece_with_arils.jpg' },
  pineapple: { author: 'UneksAbdullahi', license: 'CC BY-SA 4.0', page: 'https://commons.wikimedia.org/wiki/File:Pineapple-fruit.jpg' },
  coconut: { author: 'Thamizhpparithi Maari', license: 'CC BY-SA 4.0', page: 'https://commons.wikimedia.org/wiki/File:%22Tender_Coconut%22.jpg' },
  pear: { author: 'JJ Harrison', license: 'CC BY-SA 3.0', page: 'https://commons.wikimedia.org/wiki/File:Pyrus_pyrifolia.jpg' },
  apple: { author: 'Superbass', license: 'CC BY-SA 4.0', page: 'https://commons.wikimedia.org/wiki/File:Apfel-Fuji.jpg' },
  // местные сорта со своим видом (LocalFruit.photo в data/shops.ts)
  radish: { author: 'Fumikas Sagisavas', license: 'CC0', page: 'https://commons.wikimedia.org/wiki/File:Green_radish.jpg' },
  'frozen-pear': { author: '闫恩铭 / Enming Yan', license: 'CC BY-SA 4.0', page: 'https://commons.wikimedia.org/wiki/File:Rime_Island_Hantun_Village_16_Frozen_Pear_(Dongli)_and_persimmon_(cropped).jpg' },
  'yellow-peach': { author: 'Jack Dykinga, USDA', license: 'PD', page: 'https://commons.wikimedia.org/wiki/File:Autumn_Red_peaches.jpg' },
  // нарезка — CUTS в data/fruit.ts
  'cut-watermelon': { author: 'Cheikh cherif', license: 'CC BY-SA 4.0', page: 'https://commons.wikimedia.org/wiki/File:Past%C3%A8que-2025.jpg' },
  'cut-pineapple': { author: 'B722N', license: 'CC BY-SA 4.0', page: 'https://commons.wikimedia.org/wiki/File:Sliced_pineapple_in_a_plastic_container.jpg' },
  'cut-hami': { author: 'Dinkun Chen', license: 'CC BY-SA 4.0', page: 'https://commons.wikimedia.org/wiki/File:HAMI_MELON_INSIDE.jpg' },
  'cut-mango': { author: 'Zantastik', license: 'CC BY-SA 3.0', page: 'https://commons.wikimedia.org/wiki/File:Sliced-cubed_Mango_01.jpg' },
  'cut-pitaya': { author: 'rajucreddy', license: 'CC0', page: 'https://commons.wikimedia.org/wiki/File:Whispers_of_Serenity_White_Dragon_Fruit_Cubes_by_Raju_C_Reddy.jpg' },
  'cut-durian': { author: 'TarnishedPath', license: 'CC BY-SA 4.0', page: 'https://commons.wikimedia.org/wiki/File:Durian_flesh_image_1.jpg' },
  'cut-jackfruit': { author: 'PattayaPatrol', license: 'CC BY-SA 4.0', page: 'https://commons.wikimedia.org/wiki/File:DFC_4176_Golden_jackfruit_bulbs_piled_together_ready_to_eat.jpg' },
  'cut-pomelo': { author: 'Allen Timothy Chang (Allentchang)', license: 'CC BY-SA 3.0', page: 'https://commons.wikimedia.org/wiki/File:Pomelo_peeled_sectioned.jpg' },
  'cut-coconut': { author: 'Benjaminong', license: 'CC BY-SA 2.5', page: 'https://commons.wikimedia.org/wiki/File:Coconut_drink.jpg' },
  'cut-mixed': { author: 'HaJunkiyada (Liat Portal)', license: 'CC BY-SA 4.0', page: 'https://commons.wikimedia.org/wiki/File:Liat_Portal_for_Foodie_Disorder_-_Assorted_Fresh_Fruit_Tray.jpg' },
};

/** Подписи фото местных сортов (у остальных — название фрукта или нарезки). */
export const LOCAL_PHOTO_NAMES: Record<string, Tx> = {
  'frozen-pear': t('Мороженая груша 冻梨', 'Frozen pear 冻梨', 'Мұздатылған алмұрт 冻梨', 'Muzlatilgan nok 冻梨'),
  'yellow-peach': t('Жёлтый персик 黄桃', 'Yellow peach 黄桃', 'Сары шабдалы 黄桃', 'Sariq shaftoli 黄桃'),
};

/** Ссылка на текст лицензии. */
export function licenseUrl(l: string): string {
  if (l === 'CC0') return 'https://creativecommons.org/publicdomain/zero/1.0/';
  const m = /^CC (BY(?:-SA)?) ([\d.]+)$/.exec(l);
  return m ? `https://creativecommons.org/licenses/${m[1].toLowerCase()}/${m[2]}/` : '';
}
