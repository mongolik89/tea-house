// На узких экранах показываем кнопку меню. Без JavaScript ссылки остаются видимыми.
const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#site-nav');
const mobileScreen = window.matchMedia('(max-width: 900px)');

function setMenu(open) {
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.querySelector('.menu-label').textContent = open ? 'Закрыть' : 'Меню';
  navigation.hidden = mobileScreen.matches && !open;
}

function syncMenu() {
  menuButton.hidden = !mobileScreen.matches;
  setMenu(false);
}

menuButton.addEventListener('click', () => {
  setMenu(menuButton.getAttribute('aria-expanded') !== 'true');
});

navigation.addEventListener('click', (event) => {
  if (event.target.closest('a') && mobileScreen.matches) setMenu(false);
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
    setMenu(false);
    menuButton.focus();
  }
});

document.addEventListener('click', (event) => {
  if (mobileScreen.matches && !event.target.closest('.site-header')) setMenu(false);
});

mobileScreen.addEventListener('change', syncMenu);
syncMenu();
