import { PRODUCTS } from '../data/products.js';
import { SHOP_CONFIG } from '../data/shop-config.js';

const byId = new Map(PRODUCTS.map((product) => [product.id, product]));
export const itemKey = (item) => `${item.productId}:${item.weightGrams}`;
export const getProduct = (id) => byId.get(id);
export const formatMoney = (amount) => `${new Intl.NumberFormat('ru-RU').format(amount)} ₫`;

export function unitPrice(product, weightGrams) {
  if (!product || !SHOP_CONFIG.weights.includes(weightGrams)) throw new RangeError('Выберите вес 20, 50, 100 или 200 г.');
  return Math.round(product.basePriceVnd * weightGrams / product.baseWeightGrams);
}

// Недоверенные данные из localStorage проходят проверку перед использованием.
export function sanitizeCart(items) {
  if (!Array.isArray(items)) return [];
  const merged = new Map();
  for (const item of items.slice(0, 1000)) {
    if (!item || typeof item !== 'object' || !byId.has(item.productId)
      || !SHOP_CONFIG.weights.includes(item.weightGrams)
      || !Number.isSafeInteger(item.quantity) || item.quantity < 1) continue;
    const key = itemKey(item);
    const quantity = Math.min(SHOP_CONFIG.maxQuantity, item.quantity + (merged.get(key)?.quantity || 0));
    merged.set(key, { productId: item.productId, weightGrams: item.weightGrams, quantity });
  }
  return [...merged.values()];
}

export function addItem(items, productId, weightGrams) {
  const product = byId.get(productId);
  unitPrice(product, weightGrams);
  if (product.availability === 'out-of-stock') throw new RangeError('Товар недоступен.');
  const cart = sanitizeCart(items);
  const existing = cart.find((item) => item.productId === productId && item.weightGrams === weightGrams);
  if (existing) {
    if (existing.quantity >= SHOP_CONFIG.maxQuantity) throw new RangeError('Максимум 99 единиц одного товара и веса.');
    existing.quantity += 1;
  } else cart.push({ productId, weightGrams, quantity: 1 });
  return cart;
}

export function updateItem(items, key, patch) {
  const cart = sanitizeCart(items);
  const index = cart.findIndex((item) => itemKey(item) === key);
  if (index < 0) return cart;
  const next = { ...cart[index], ...patch, productId: cart[index].productId };
  unitPrice(byId.get(next.productId), next.weightGrams);
  if (!Number.isSafeInteger(next.quantity) || next.quantity < 1 || next.quantity > SHOP_CONFIG.maxQuantity) {
    throw new RangeError('Количество должно быть целым числом от 1 до 99.');
  }
  const duplicate = cart.find((item, i) => i !== index && itemKey(item) === itemKey(next));
  if (duplicate && duplicate.quantity + next.quantity > SHOP_CONFIG.maxQuantity) {
    throw new RangeError('После объединения получится больше 99 единиц. Уменьшите количество.');
  }
  cart[index] = next;
  return sanitizeCart(cart);
}

export function removeItem(items, key) {
  return sanitizeCart(items).filter((item) => itemKey(item) !== key);
}

export function calculateCart(items) {
  const lines = sanitizeCart(items).map((item) => {
    const product = byId.get(item.productId);
    return { ...item, product, key: itemKey(item), unitPriceVnd: unitPrice(product, item.weightGrams),
      totalGrams: item.weightGrams * item.quantity,
      totalVnd: unitPrice(product, item.weightGrams) * item.quantity };
  });
  const totalGrams = lines.reduce((sum, line) => sum + line.totalGrams, 0);
  const subtotalVnd = lines.reduce((sum, line) => sum + line.totalVnd, 0);
  const percent = SHOP_CONFIG.discountTiers.find((tier) => totalGrams >= tier.minimumGrams)?.percent || 0;
  const discountVnd = Math.round(subtotalVnd * percent / 100);
  return { lines, totalGrams, subtotalVnd, discountPercent: percent, discountVnd,
    totalVnd: subtotalVnd - discountVnd,
    quantity: lines.reduce((sum, line) => sum + line.quantity, 0) };
}

export function loadCart(storage) {
  try {
    const raw = storage.getItem(SHOP_CONFIG.storageKey);
    if (raw === null) return { items: [], warning: '' };
    const saved = JSON.parse(raw);
    if (!saved || saved.version !== SHOP_CONFIG.storageVersion || !Array.isArray(saved.items)) {
      return { items: [], warning: 'Сохранённая корзина имеет неподдерживаемый формат. Начните новую.' };
    }
    const items = sanitizeCart(saved.items);
    const changed = JSON.stringify(items) !== JSON.stringify(saved.items);
    return { items, warning: changed ? 'Корзина восстановлена; некорректные или устаревшие позиции исправлены.' : '' };
  } catch {
    return { items: [], warning: 'Не удалось восстановить корзину. Она будет работать в этой вкладке; сохранение может быть недоступно.' };
  }
}

export function saveCart(storage, items) {
  try {
    storage.setItem(SHOP_CONFIG.storageKey, JSON.stringify({ version: SHOP_CONFIG.storageVersion, items: sanitizeCart(items) }));
    return true;
  } catch { return false; }
}

export function formatOrder(items) {
  const cart = calculateCart(items);
  if (!cart.lines.length) return '';
  return [
    SHOP_CONFIG.name,
    'ДЕМОНСТРАЦИОННЫЙ ЗАКАЗ — не отправлен и не подтверждён',
    '',
    ...cart.lines.map((line, i) => `${i + 1}. ${line.product.name}\n   ${line.weightGrams} г × ${line.quantity} = ${line.totalGrams} г; ${formatMoney(line.unitPriceVnd)} за единицу; всего ${formatMoney(line.totalVnd)}`),
    '',
    `Общий вес: ${cart.totalGrams} г`,
    `До скидки: ${formatMoney(cart.subtotalVnd)}`,
    `Демонстрационная скидка ${cart.discountPercent}%: −${formatMoney(cart.discountVnd)}`,
    `Итого: ${formatMoney(cart.totalVnd)}`,
    '',
    'Демо: скидка 5% от 50 г, 10% от 100 г по общему весу всех товаров, включая Саган Дайля. Скидки не складываются.',
    'Наличие и актуальность цен не подтверждены. Доставка не включена. Оплата и отправка заказа не выполняются.',
  ].join('\n');
}

export function normalizeSearch(text) {
  return String(text).normalize('NFKC').toLocaleLowerCase('ru').replaceAll('ё', 'е')
    .replace(/[«»“”„"']/g, '').replace(/\s+/g, ' ').trim();
}

export function selectProducts(query = '', categoryId = 'all', sort = 'default') {
  const needle = normalizeSearch(query);
  const selected = PRODUCTS.filter((product) => (categoryId === 'all' || product.categoryId === categoryId)
    && normalizeSearch(product.name).includes(needle));
  if (sort === 'price-asc' || sort === 'price-desc') {
    const direction = sort === 'price-asc' ? 1 : -1;
    selected.sort((a, b) => direction * (a.basePriceVnd / a.baseWeightGrams - b.basePriceVnd / b.baseWeightGrams));
  }
  return selected;
}
