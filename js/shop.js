import { PRODUCTS, CATEGORIES } from '../data/products.js';
import { SHOP_CONFIG } from '../data/shop-config.js';
import { addItem, updateItem, removeItem, calculateCart, formatOrder, formatMoney,
  itemKey, loadCart, saveCart, selectProducts, unitPrice } from './cart.js';

const $ = (selector, parent = document) => parent.querySelector(selector);
const categoryNames = new Map(CATEGORIES.map((category) => [category.id, category.name]));
const selectedWeights = new Map();
const storage = {
  getItem: (key) => window.localStorage.getItem(key),
  setItem: (key, value) => window.localStorage.setItem(key, value),
};
const restored = loadCart(storage);
let items = restored.items;
let announcementTimer;
let dismissTimer;

function announce(message) {
  const status = $('#shop-announcement');
  clearTimeout(announcementTimer);
  clearTimeout(dismissTimer);
  status.textContent = '';
  announcementTimer = setTimeout(() => { status.textContent = message; }, 30);
  dismissTimer = setTimeout(() => { status.textContent = ''; }, 6500);
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function weightSelect(id, value, label) {
  const select = element('select', 'shop-select');
  select.id = id;
  select.setAttribute('aria-label', label);
  for (const grams of SHOP_CONFIG.weights) {
    const option = element('option', '', `${grams} г`);
    option.value = String(grams);
    option.selected = grams === value;
    select.append(option);
  }
  return select;
}

function profileField(label, profile) {
  const wrapper = element('div', 'shop-profile-field');
  const title = element('dt', '', label);
  const value = element('dd');
  if (profile.status === 'typical') value.append(element('span', 'shop-profile-tag', 'Типичный профиль · '));
  value.append(document.createTextNode(profile.text));
  wrapper.append(title, value);
  return wrapper;
}

function renderProducts() {
  const products = selectProducts($('#shop-search').value, $('#shop-category').value, $('#shop-sort').value);
  const fragment = document.createDocumentFragment();
  for (const product of products) {
    const card = element('article', 'shop-product');
    card.dataset.productId = product.id;
    card.setAttribute('aria-labelledby', `product-title-${product.id}`);
    const visual = element('div', `shop-product-visual shop-tone-${product.categoryId}`);
    const emblem = element('span', 'shop-product-emblem', '茶');
    emblem.setAttribute('aria-hidden', 'true');
    // Изображение используется только после предоставления фото именно этого товара.
    if (product.image) {
      const image = element('img', 'shop-product-image');
      image.src = product.image;
      image.alt = product.imageAlt || product.name;
      image.loading = 'lazy';
      visual.append(image);
    } else {
      visual.append(emblem, element('span', 'shop-photo-caption', 'Демо · Без фото'));
    }
    const body = element('div', 'shop-product-body');
    const top = element('div', 'shop-product-top');
    const number = element('span', 'tea-number', String(PRODUCTS.indexOf(product) + 1).padStart(2, '0'));
    top.append(element('span', 'shop-category-name', categoryNames.get(product.categoryId)), number);
    const heading = element('h3', 'shop-product-title', product.name);
    heading.id = `product-title-${product.id}`;
    const details = element('details', 'shop-product-details');
    const summary = element('summary', '', 'Подробности');
    summary.setAttribute('aria-label', `Подробности: ${product.name}`);
    const description = element('p', 'shop-description', product.description || 'Демо · Описание конкретного товара не предоставлено.');
    const profiles = element('dl', 'shop-profiles');
    profiles.append(profileField('Вкус', product.taste), profileField('Аромат', product.aroma));
    const profileNote = element('p', 'shop-profile-note');
    const typicalProfiles = [product.taste, product.aroma].filter((profile) => profile.status === 'typical');
    if (typicalProfiles.length) {
      profileNote.textContent = 'Ориентир вида чая, не подтверждённые характеристики этого товара. ';
      const source = element('a', '', 'Источник ↗');
      source.href = typicalProfiles[0].source;
      source.target = '_blank';
      source.rel = 'noopener noreferrer';
      profileNote.append(source);
    } else profileNote.textContent = 'Точный вкус и аромат уточняются. По названию товара их определить нельзя.';
    const availability = element('p', 'shop-availability', product.availability === 'unknown'
      ? 'Наличие не подтверждено · Демо' : product.availability === 'out-of-stock' ? 'Нет в наличии' : 'В наличии');
    const basePrice = element('p', 'shop-base-price', `${formatMoney(product.basePriceVnd)} / ${product.baseWeightGrams} г — по прайсу`);
    const comparison = element('p', 'shop-comparison-price', `${formatMoney(unitPrice(product, 100))} / 100 г · для сравнения`);
    const purchase = element('div', 'shop-purchase');
    const controls = element('div', 'shop-product-controls');
    const weight = selectedWeights.get(product.id) || SHOP_CONFIG.weights[0];
    const label = element('label', 'shop-field', 'Вес');
    label.htmlFor = `product-weight-${product.id}`;
    const select = weightSelect(label.htmlFor, weight, `Вес: ${product.name}`);
    select.dataset.action = 'product-weight';
    label.append(select);
    const price = element('p', 'shop-selected-price', `${formatMoney(unitPrice(product, weight))} / ${weight} г`);
    price.id = `product-price-${product.id}`;
    select.setAttribute('aria-describedby', price.id);
    controls.append(label, price);
    const add = element('button', 'button shop-add', 'В корзину +');
    add.type = 'button';
    add.dataset.action = 'add';
    add.disabled = product.availability === 'out-of-stock';
    add.setAttribute('aria-label', `Добавить в корзину: ${product.name}`);
    details.append(summary, description, availability, basePrice, profileNote);
    purchase.append(controls, comparison, add);
    body.append(top, heading, profiles, purchase, details);
    card.append(visual, body);
    fragment.append(card);
  }
  $('#shop-products').replaceChildren(fragment);
  $('#shop-results').textContent = `Найдено: ${products.length} из ${PRODUCTS.length}`;
  $('#shop-empty-results').hidden = products.length > 0;
}

function renderCart() {
  const cart = calculateCart(items);
  $('#shop-cart-count').textContent = String(cart.quantity);
  $('#shop-cart-count').closest('a').setAttribute('aria-label', `Корзина: ${cart.quantity} единиц`);
  $('#shop-cart-empty').hidden = cart.lines.length > 0;
  $('#shop-cart-content').hidden = cart.lines.length === 0;
  $('#shop-copy').disabled = cart.lines.length === 0;
  const fragment = document.createDocumentFragment();
  for (const line of cart.lines) {
    const row = element('article', 'shop-cart-row');
    row.dataset.key = line.key;
    const information = element('div', 'shop-cart-info');
    information.append(element('h3', '', line.product.name),
      element('p', 'shop-cart-unit', `${formatMoney(line.product.basePriceVnd)} / ${line.product.baseWeightGrams} г · наличие не подтверждено`));
    const fields = element('div', 'shop-cart-fields');
    const suffix = `${line.productId}-${line.weightGrams}`;
    const weightLabel = element('label', 'shop-field', 'Вес единицы');
    weightLabel.htmlFor = `cart-weight-${suffix}`;
    const select = weightSelect(weightLabel.htmlFor, line.weightGrams, `Вес в корзине: ${line.product.name}`);
    select.dataset.action = 'cart-weight';
    weightLabel.append(select);
    const quantityLabel = element('label', 'shop-field', 'Количество');
    quantityLabel.htmlFor = `cart-quantity-${suffix}`;
    const quantity = element('input', 'shop-input');
    quantity.id = quantityLabel.htmlFor;
    quantity.type = 'number';
    quantity.min = '1';
    quantity.max = String(SHOP_CONFIG.maxQuantity);
    quantity.step = '1';
    quantity.inputMode = 'numeric';
    quantity.value = String(line.quantity);
    quantity.setAttribute('aria-label', `Количество: ${line.product.name}, ${line.weightGrams} г`);
    quantity.dataset.action = 'quantity';
    quantityLabel.append(quantity);
    fields.append(weightLabel, quantityLabel);
    const end = element('div', 'shop-cart-end');
    end.append(element('p', 'shop-line-total', formatMoney(line.totalVnd)),
      element('p', 'shop-line-weight', `${line.totalGrams} г всего`));
    const remove = element('button', 'shop-remove', 'Удалить');
    remove.type = 'button';
    remove.dataset.action = 'remove';
    remove.setAttribute('aria-label', `Удалить: ${line.product.name}, ${line.weightGrams} г`);
    end.append(remove);
    row.append(information, fields, end);
    fragment.append(row);
  }
  $('#shop-cart-items').replaceChildren(fragment);
  $('#shop-total-weight').textContent = `${cart.totalGrams} г`;
  $('#shop-subtotal').textContent = formatMoney(cart.subtotalVnd);
  $('#shop-discount-label').textContent = `Демо-скидка ${cart.discountPercent}%`;
  $('#shop-discount').textContent = `−${formatMoney(cart.discountVnd)}`;
  $('#shop-total').textContent = formatMoney(cart.totalVnd);
  $('#shop-order-text').value = formatOrder(items);
  $('#shop-mobile-cart').hidden = cart.quantity === 0;
  $('#shop-mobile-cart-count').textContent = String(cart.quantity);
  $('#shop-mobile-cart-total').textContent = formatMoney(cart.totalVnd);
  $('#shop-mobile-cart-link').setAttribute('aria-label', `Перейти в корзину: ${cart.quantity} шт., ${formatMoney(cart.totalVnd)} с учётом демо-скидки`);
  document.documentElement.classList.toggle('has-mobile-cart', cart.quantity > 0);
}

function commitCart(next, message) {
  items = next;
  const saved = saveCart(storage, items);
  $('#shop-storage-warning').hidden = saved;
  if (!saved) $('#shop-storage-warning').textContent = 'В этом браузере корзина работает без сохранения. Скопируйте заказ перед закрытием страницы.';
  renderCart();
  announce(message);
}

function focusCartControl(key, action) {
  const row = [...document.querySelectorAll('.shop-cart-row')].find((node) => node.dataset.key === key);
  const target = row?.querySelector(`[data-action="${action}"]`) || $('#cart-title');
  target.focus({ preventScroll: true });
}

$('#shop-products').addEventListener('change', (event) => {
  const select = event.target.closest('select[data-action="product-weight"]');
  if (!select) return;
  const card = select.closest('[data-product-id]');
  const product = PRODUCTS.find((candidate) => candidate.id === card.dataset.productId);
  const weight = Number(select.value);
  selectedWeights.set(product.id, weight);
  const price = formatMoney(unitPrice(product, weight));
  $('.shop-selected-price', card).textContent = `${price} / ${weight} г`;
  announce(`${product.name}: ${weight} г, ${price} до скидки.`);
});

$('#shop-products').addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action="add"]');
  if (!button) return;
  const id = button.closest('[data-product-id]').dataset.productId;
  const weight = selectedWeights.get(id) || SHOP_CONFIG.weights[0];
  const product = PRODUCTS.find((candidate) => candidate.id === id);
  try { commitCart(addItem(items, id, weight), `Добавлено: ${product.name}, ${weight} г. Корзина пересчитана.`); }
  catch (error) { announce(error.message); }
});

$('#shop-cart-items').addEventListener('change', (event) => {
  const input = event.target.closest('[data-action]');
  if (!input) return;
  const key = input.closest('[data-key]').dataset.key;
  const old = items.find((item) => itemKey(item) === key);
  const value = Number(input.value);
  const patch = input.dataset.action === 'cart-weight' ? { weightGrams: value } : { quantity: value };
  try {
    const next = updateItem(items, key, patch);
    commitCart(next, 'Корзина пересчитана.');
    focusCartControl(itemKey({ ...old, ...patch }), input.dataset.action);
  } catch (error) {
    renderCart();
    focusCartControl(key, input.dataset.action);
    announce(error.message);
  }
});

$('#shop-cart-items').addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action="remove"]');
  if (!button) return;
  const key = button.closest('[data-key]').dataset.key;
  const index = items.findIndex((item) => itemKey(item) === key);
  const next = removeItem(items, key);
  commitCart(next, 'Товар удалён. Корзина пересчитана.');
  focusCartControl(next[Math.min(index, next.length - 1)] ? itemKey(next[Math.min(index, next.length - 1)]) : '', 'remove');
});

$('#shop-search').addEventListener('input', renderProducts);
$('#shop-category').addEventListener('change', renderProducts);
$('#shop-sort').addEventListener('change', renderProducts);
$('#shop-reset').addEventListener('click', () => {
  $('#shop-search').value = '';
  $('#shop-category').value = 'all';
  $('#shop-sort').value = 'default';
  renderProducts();
  $('#shop-search').focus();
});

$('#shop-copy').addEventListener('click', async () => {
  const text = formatOrder(items);
  if (!text) return;
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText(text);
    announce('Заказ скопирован. Ничего не отправлено владельцу.');
  } catch {
    $('#shop-order-preview').open = true;
    const preview = $('#shop-order-text');
    preview.focus();
    preview.select();
    announce('Автоматическое копирование недоступно. Текст выделен: скопируйте его вручную. Ничего не отправлено.');
  }
});

// Резервируем место под фактическую высоту панели, в том числе при переносе суммы.
const mobileCart = $('#shop-mobile-cart');
function syncMobileCartSpace() {
  const height = mobileCart.getBoundingClientRect().height;
  document.documentElement.style.setProperty('--mobile-cart-space', `${height > 0 ? Math.ceil(height) + 16 : 100}px`);
}
if ('ResizeObserver' in window) new ResizeObserver(syncMobileCartSpace).observe(mobileCart);
window.addEventListener('resize', syncMobileCartSpace);
document.addEventListener('focusin', (event) => {
  if (!(event.target instanceof HTMLElement) || !event.target.matches('a, button, input, select, textarea, summary')
    || mobileCart.hidden || mobileCart.contains(event.target)
    || !window.matchMedia('(max-width: 900px)').matches) return;
  const bounds = event.target.getBoundingClientRect();
  if (bounds.bottom > mobileCart.getBoundingClientRect().top - 16) {
    event.target.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }
});
for (const category of CATEGORIES) {
  const option = element('option', '', category.name);
  option.value = category.id;
  $('#shop-category').append(option);
}
if (SHOP_CONFIG.telegramChannelUrl) {
  const url = new URL(SHOP_CONFIG.telegramChannelUrl);
  if (url.protocol === 'https:' && url.hostname === 't.me' && !url.search && !url.hash
    && /^\/(?:s\/)?[a-z][a-z0-9_]{3,}\/?$/i.test(url.pathname) && url.pathname !== '/share') {
    $('#shop-telegram').href = url.href;
    $('#shop-telegram').hidden = false;
  }
}
renderProducts();
renderCart();
$('#shop-loading').hidden = true;
if (restored.warning) {
  $('#shop-storage-warning').textContent = restored.warning;
  $('#shop-storage-warning').hidden = false;
}
