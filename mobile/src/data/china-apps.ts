// «Приложения для Китая» (решение 21.10.2026): что поставить до вылета, со ссылками в магазины. Ссылки проверены
// 21.10.2026 — все пять есть в российских App Store и Google Play (скачиваются с российского аккаунта).
export const CHINA_APPS = [
  { key: 'alipay', name: 'Alipay', zh: '支付宝', what: 'Оплата по QR почти везде; в нём же — такси DiDi и проезд в метро по QR во многих городах', ios: '333206289', android: 'com.eg.android.AlipayGphone' },
  { key: 'wechat', name: 'WeChat', zh: '微信', what: 'Связь с китайскими партнёрами, гидом и компаниями; WeChat Pay', ios: '414478124', android: 'com.tencent.mm' },
  { key: 'amap', name: 'Amap', zh: '高德地图', what: 'Карты и навигация по Китаю; адреса из этого приложения открываются в нём', ios: '461703208', android: 'com.autonavi.minimap' },
  { key: 'didi', name: 'DiDi', zh: '滴滴', what: 'Такси; то же самое есть внутри Alipay без отдельной установки', ios: '554499054', android: 'com.sdu.didi.psnger' },
  { key: 'trip', name: 'Trip.com', zh: '携程', what: 'Билеты, отели и поезда на русском; если захотите задержаться', ios: '681752345', android: 'ctrip.english' },
] as const;

export const appStoreUrl = (id: string) => `https://apps.apple.com/ru/app/id${id}`;
export const playUrl = (pkg: string) => `https://play.google.com/store/apps/details?id=${pkg}`;
