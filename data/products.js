// Названия и цены перенесены из прайса, предоставленного владельцем проекта.
// Наличие, происхождение, год выпуска и характеристики партий не проверены.
export const CATEGORIES = Object.freeze([
  { id: 'gaba', name: 'ГАБА' },
  { id: 'sheng', name: 'Шен пуэр' },
  { id: 'shu', name: 'Шу пуэр' },
  { id: 'white', name: 'Белый чай' },
  { id: 'green', name: 'Зелёный чай' },
  { id: 'oolong', name: 'Улун' },
  { id: 'red', name: 'Красный чай' },
  { id: 'herbal', name: 'Травяные напитки' },
].map(Object.freeze));

const guide = 'https://www.teasource.com/pages/types-of-tea';
const typical = (text) => Object.freeze({ text, status: 'typical', source: guide });
const unknown = Object.freeze({ text: 'Уточняется', status: 'unknown', source: null });

// Общие ориентиры по видам, а не дегустационные заметки о товарах чайной.
// У неоднозначных категорий и смесей профиль намеренно не заполняется.
const profiles = {
  gaba: { taste: unknown, aroma: unknown },
  sheng: {
    taste: typical('Меняется с выдержкой и хранением: от яркого до более мягкого.'),
    aroma: unknown,
  },
  shu: { taste: typical('Обычно мягкий, с землистым характером.'), aroma: unknown },
  white: {
    taste: typical('От фруктово-травянистого до пряно-древесного, в зависимости от обработки.'),
    aroma: unknown,
  },
  green: {
    taste: typical('Обычно лёгкий, растительный, с умеренной терпкостью.'),
    aroma: unknown,
  },
  oolong: { taste: unknown, aroma: unknown },
  red: { taste: typical('Обычно насыщенный; терпкость и сладость зависят от стиля.'), aroma: unknown },
  herbal: { taste: unknown, aroma: unknown },
};

const rows = [
  ['gaba-pohorony-svini', 'ГАБА «Похороны свиньи»', 'gaba', 100000],
  ['gaba-shepot-tigra', 'ГАБА «Шепот тигра»', 'gaba', 120000],
  ['gaba-tri-docheri', 'ГАБА «3 дочери»', 'gaba', 130000],
  ['dong-ding', 'Дун Дин «Морозный пик»', 'oolong', 80000],
  ['sheng-bangchan', 'Шен Пуэр «Бангчан»', 'sheng', 120000],
  ['sheng-seven-sons', 'Шен Пуэр «Семь сыновей»', 'sheng', 80000],
  ['sheng-green-lao', 'Шен Пуэр «Зеленый Лао», плитка, 2000г', 'sheng', 100000],
  ['shu-laobanzhang', 'Шу Пуэр «Лаобаньчжан»', 'shu', 70000],
  ['shu-bread', 'Шу Пуэр «Хлебный»', 'shu', 100000],
  ['shu-jujube', 'Шу Пуэр «Ююба», рассыпной, 1992г', 'shu', 100000],
  ['shu-golden-tiger', 'Шу Пуэр «Золотой Тигр»', 'shu', 120000],
  ['shu-long-bao', 'Шу Пуэр «Лонг Бао»', 'shu', 120000],
  ['shu-v93', 'Шу Пуэр V93', 'shu', 120000],
  ['shu-emperor-dragon', 'Шу Пуэр «Дракон Императора», премиум', 'shu', 150000],
  ['shu-imperial-spring', 'Шу Пуэр (Мэнхай Гунтин) «Императорская Весна», премиум', 'shu', 150000],
  ['white-ancient-dragon', 'Белый Чай (Бай Ча) «Древний Хвост Дракона»', 'white', 80000],
  ['white-silver-needles', 'Белый Чай «Серебряные иглы»', 'white', 150000],
  ['bi-luo-chun', 'Би Ло Чунь «Изумрудные спирали весны»', 'green', 80000],
  ['long-jing', 'Лун Цзин «Колодец Дракона»', 'green', 100000],
  ['tie-guanyin-coal', 'Те Гуань Инь «Фуцзяньский уголь» (обжаренный на углях)', 'oolong', 100000],
  ['tie-guanyin-special', 'Те Гуань Инь «Особый»', 'oolong', 150000],
  ['oolong-orange', 'Улун «Заводной апельсин»', 'oolong', 80000],
  ['phoenix-dancong', 'Фен Хуан Дань Цун «Я Ши Сян» («Чайная гейша»)', 'oolong', 90000],
  ['oolong-ginseng', 'Улун в обсыпке женьшень', 'oolong', 100000],
  ['jin-jun-mei', 'Цзинь Цзюнь Мей «Золотые брови»', 'red', 60000],
  ['dian-hong-ruby', 'Дянь Хун «Рубиновые улитки»', 'red', 70000],
  ['dian-hong-monkey', 'Дянь Хун Цзинь Хоу «Золотая обезьяна»', 'red', 120000],
  ['dian-hong-snail', 'Дянь Хун Цзинь Ло «Золотая улитка»', 'red', 120000],
  ['da-hong-pao', 'Да Хун Пао «Премиум»', 'oolong', 100000],
  ['sagan-dailya', 'Саган Дайля', 'herbal', 150000, 10],
];

export const PRODUCTS = Object.freeze(rows.map(([id, name, categoryId, basePriceVnd, baseWeightGrams = 20]) => Object.freeze({
  id, name, categoryId, basePriceVnd, baseWeightGrams,
  image: null,
  imageAlt: null,
  description: null,
  availability: 'unknown',
  taste: profiles[categoryId].taste,
  aroma: profiles[categoryId].aroma,
  source: 'Прайс, предоставленный владельцем проекта; актуальность цен не подтверждена.',
})));
