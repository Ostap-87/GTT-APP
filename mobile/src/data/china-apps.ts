// «Приложения для Китая» (решения 21.10.2026): что поставить до вылета, со ссылками в магазины. Ссылки проверены
// 21.10.2026 по российским App Store и Google Play. iosCn — на iPhone только в китайском App Store: с российским Apple ID
// не скачать, тогда подсказываем мини-программу внутри WeChat или Alipay.
export type ChinaApp = { key: string; name: string; zh: string; what: string; ios?: string; iosCn?: boolean; android?: string; androidNote?: string; inside?: string };

export const CHINA_APPS: ChinaApp[] = [
  { key: 'alipay', name: 'Alipay', zh: '支付宝', what: 'Оплата по QR почти везде; в нём же — такси DiDi и проезд в метро по QR во многих городах', ios: '333206289', android: 'com.eg.android.AlipayGphone' },
  { key: 'wechat', name: 'WeChat', zh: '微信', what: 'Связь с китайскими партнёрами, гидом и компаниями; WeChat Pay', ios: '414478124', android: 'com.tencent.mm' },
  { key: 'amap', name: 'Amap', zh: '高德地图', what: 'Карты и навигация по Китаю; адреса из этого приложения открываются в нём', ios: '461703208', android: 'com.autonavi.minimap' },
  { key: 'didi', name: 'DiDi', zh: '滴滴', what: 'Такси; то же самое есть внутри Alipay без отдельной установки', ios: '554499054', android: 'com.sdu.didi.psnger' },
  { key: 'trip', name: 'Trip.com', zh: '携程', what: 'Билеты, отели и поезда на русском; если захотите задержаться', ios: '681752345', android: 'ctrip.english' },
  { key: 'meituan', name: 'Meituan', zh: '美团', what: 'Доставка еды и покупок, бронь ресторанов, самокаты; интерфейс на китайском', ios: '423084029', iosCn: true, android: 'com.sankuai.meituan', inside: 'мини-программу 美团 в WeChat' },
  { key: 'dianping', name: 'Dianping', zh: '大众点评', what: 'Рестораны рядом: рейтинги, отзывы, фото блюд; интерфейс на китайском', ios: '351091731', iosCn: true, android: 'com.dianping.v1', inside: 'мини-программу 大众点评 в WeChat' },
  { key: 'shangou', name: 'Taobao Shangou', zh: '淘宝闪购', what: 'Доставка еды и товаров за минуты (бывший Ele.me); интерфейс на китайском', ios: '507161324', android: 'com.taobao.taobao', androidNote: 'На Android — внутри приложения Taobao (раздел 闪购) или в Alipay' },
];

export const appStoreUrl = (id: string) => `https://apps.apple.com/ru/app/id${id}`;
export const playUrl = (pkg: string) => `https://play.google.com/store/apps/details?id=${pkg}`;
