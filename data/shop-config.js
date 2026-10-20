// Только настройки демонстрации. Это не подтверждённые условия продажи.
export const SHOP_CONFIG = Object.freeze({
  name: 'Дом чайной жабы',
  currency: 'VND',
  weights: Object.freeze([20, 50, 100, 200]),
  maxQuantity: 99,
  storageKey: 'tea-house-demo-cart-v1',
  storageVersion: 1,
  telegramChannelUrl: 'https://t.me/nhatrang_tea',
  discountTiers: Object.freeze([
    Object.freeze({ minimumGrams: 100, percent: 10 }),
    Object.freeze({ minimumGrams: 50, percent: 5 }),
  ]),
});
