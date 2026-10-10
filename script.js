const products = {
  pouch: { name: 'Sunny-side pouch', detail: 'Crochet · cotton yarn', price: 1250, icon: '✿' },
  hoop: { name: 'Wildflower hoop', detail: 'Hand embroidery · 6 inch', price: 1800, icon: '✿' },
  print: { name: 'Slow down art print', detail: 'Archival print · A5', price: 650, icon: '✳' },
  charm: { name: 'Little love charm', detail: 'Crochet · bag charm', price: 480, icon: '♡' }
};
const cart = new Map();
const formatPrice = value => `₹ ${value.toLocaleString('en-IN')}`;
const countNode = document.querySelector('#cart-count');
const mobileCountNode = document.querySelector('#mobile-cart-count');
const cartItemsNode = document.querySelector('#cart-items');
const cartEmptyNode = document.querySelector('#cart-empty');
const cartFooterNode = document.querySelector('#cart-footer');
const drawer = document.querySelector('#cart-drawer');
const overlay = document.querySelector('#overlay');
let toastTimer;

function updateCart() {
  const entries = [...cart.entries()];
  const count = entries.reduce((total, [, quantity]) => total + quantity, 0);
  const total = entries.reduce((sum, [id, quantity]) => sum + products[id].price * quantity, 0);
  countNode.textContent = count;
  mobileCountNode.textContent = `(${count})`;
  cartEmptyNode.hidden = count > 0;
  cartFooterNode.hidden = count === 0;
  document.querySelector('#cart-total').textContent = formatPrice(total);
  cartItemsNode.innerHTML = entries.map(([id, quantity]) => {
    const item = products[id];
    return `<article class="cart-row"><div class="cart-thumb" aria-hidden="true">${item.icon}</div><div><h3>${item.name}</h3><p>${item.detail}</p><div class="quantity"><button data-quantity="${id}" data-change="-1" aria-label="Remove one ${item.name}">−</button><span>${quantity}</span><button data-quantity="${id}" data-change="1" aria-label="Add one ${item.name}">+</button><button class="remove-item" data-remove="${id}">Remove</button></div></div><strong>${formatPrice(item.price * quantity)}</strong></article>`;
  }).join('');
}

function showToast(message) {
  const node = document.querySelector('#toast');
  node.textContent = message;
  node.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => node.classList.remove('show'), 2300);
}

function openCart() {
  drawer.classList.add('open');
  drawer.setAttribute('aria-hidden', 'false');
  overlay.hidden = false;
  requestAnimationFrame(() => overlay.classList.add('visible'));
  document.body.classList.add('drawer-open');
  document.querySelector('.close-drawer').focus();
}

function closeCart() {
  drawer.classList.remove('open');
  drawer.setAttribute('aria-hidden', 'true');
  overlay.classList.remove('visible');
  document.body.classList.remove('drawer-open');
  setTimeout(() => { if (!drawer.classList.contains('open')) overlay.hidden = true; }, 300);
}

document.querySelectorAll('.add-button').forEach(button => button.addEventListener('click', () => {
  const id = button.dataset.id;
  cart.set(id, (cart.get(id) || 0) + 1);
  updateCart();
  showToast(`${products[id].name} tucked into your bag ♡`);
}));
document.querySelector('#cart-open').addEventListener('click', openCart);
document.querySelector('#mobile-cart-open').addEventListener('click', () => { document.querySelector('#mobile-nav').classList.remove('open'); document.querySelector('#menu-toggle').setAttribute('aria-expanded', 'false'); openCart(); });
document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', closeCart));
document.querySelector('#keep-browsing').addEventListener('click', closeCart);
overlay.addEventListener('click', closeCart);
document.addEventListener('keydown', event => { if (event.key === 'Escape') { closeCart(); document.querySelector('#menu-toggle').setAttribute('aria-expanded', 'false'); document.querySelector('#mobile-nav').classList.remove('open'); } });
cartItemsNode.addEventListener('click', event => {
  const changeButton = event.target.closest('[data-quantity]');
  const removeButton = event.target.closest('[data-remove]');
  if (changeButton) {
    const id = changeButton.dataset.quantity;
    const next = (cart.get(id) || 0) + Number(changeButton.dataset.change);
    if (next <= 0) cart.delete(id); else cart.set(id, next);
    updateCart();
  }
  if (removeButton) { cart.delete(removeButton.dataset.remove); updateCart(); }
});
document.querySelector('#checkout-button').addEventListener('click', () => showToast('Checkout preview — your bag is ready for the next step.'));

const menuToggle = document.querySelector('#menu-toggle');
const mobileNav = document.querySelector('#mobile-nav');
menuToggle.addEventListener('click', () => {
  const open = menuToggle.getAttribute('aria-expanded') !== 'true';
  menuToggle.setAttribute('aria-expanded', String(open));
  mobileNav.classList.toggle('open', open);
});
mobileNav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => { menuToggle.setAttribute('aria-expanded', 'false'); mobileNav.classList.remove('open'); }));

// Keep the full header over the homepage, then tuck it into a glass pill
// once the hero has passed. Returning to the top restores the full header.
const siteHeader = document.querySelector('.site-header');
const homeHero = document.querySelector('#home');
let headerScrollQueued = false;
function syncHeaderToScroll() {
  headerScrollQueued = false;
  const compact = homeHero.getBoundingClientRect().bottom <= siteHeader.offsetHeight + 12;
  siteHeader.classList.toggle('is-compact', compact);
  if (compact && mobileNav.classList.contains('open')) {
    mobileNav.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
  }
}
window.addEventListener('scroll', () => {
  if (headerScrollQueued) return;
  headerScrollQueued = true;
  window.requestAnimationFrame(syncHeaderToScroll);
}, { passive: true });
syncHeaderToScroll();

const gallery = document.querySelector('#gallery-track');
const progress = document.querySelector('#gallery-progress');
let isDown = false, startX = 0, scrollAtStart = 0, moved = false;
gallery.addEventListener('pointerdown', event => {
  if (event.pointerType === 'mouse' && event.button !== 0) return;
  isDown = true; moved = false; startX = event.clientX; scrollAtStart = gallery.scrollLeft;
  gallery.classList.add('dragging');
  if (event.pointerType === 'mouse') gallery.setPointerCapture(event.pointerId);
});
gallery.addEventListener('pointermove', event => {
  if (!isDown) return;
  const delta = event.clientX - startX;
  if (Math.abs(delta) > 4) moved = true;
  if (moved) gallery.scrollLeft = scrollAtStart - delta;
});
const stopDrag = () => { isDown = false; gallery.classList.remove('dragging'); };
gallery.addEventListener('pointerup', stopDrag);
gallery.addEventListener('pointercancel', stopDrag);
gallery.addEventListener('lostpointercapture', stopDrag);
gallery.addEventListener('click', event => { if (moved) { event.preventDefault(); event.stopPropagation(); } });
gallery.addEventListener('scroll', () => {
  const max = gallery.scrollWidth - gallery.clientWidth;
  progress.style.width = `${max > 0 ? 20 + 80 * gallery.scrollLeft / max : 100}%`;
}, { passive: true });
document.querySelector('#gallery-prev').addEventListener('click', () => gallery.scrollBy({ left: -gallery.clientWidth * .72, behavior: 'smooth' }));
document.querySelector('#gallery-next').addEventListener('click', () => gallery.scrollBy({ left: gallery.clientWidth * .72, behavior: 'smooth' }));

document.querySelectorAll('.filter-pill').forEach(button => button.addEventListener('click', () => {
  document.querySelector('.filter-pill.active').classList.remove('active');
  button.classList.add('active');
  const filter = button.dataset.filter;
  document.querySelectorAll('.product-card').forEach(card => { card.hidden = filter !== 'all' && card.dataset.category !== filter; });
}));

const orderDialog = document.querySelector('#order-dialog');
document.querySelector('#custom-open').addEventListener('click', () => orderDialog.showModal());
document.querySelector('#dialog-close').addEventListener('click', () => orderDialog.close());
orderDialog.addEventListener('click', event => { if (event.target === orderDialog) orderDialog.close(); });
document.querySelector('#custom-form').addEventListener('submit', event => {
  event.preventDefault();
  if (!event.currentTarget.reportValidity()) return;
  const form = event.currentTarget;
  document.querySelector('#form-success').hidden = false;
  form.querySelector('.form-submit').disabled = true;
  form.querySelector('.form-submit').textContent = 'Idea saved for this preview ✓';
  form.querySelector('.form-note').textContent = 'Your idea has not been sent. Connect an order service to receive real requests.';
});

// Reveal the editorial sections as they enter view; reduced-motion users see
// the complete page without waiting for scroll animations.
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if ('IntersectionObserver' in window && !reduceMotion) {
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -36px 0px' });
  document.querySelectorAll('#gallery .gallery-card, #shop .product-card, #about .intro-grid, .studio-note').forEach((element, index) => {
    element.classList.add('motion-reveal');
    if (element.matches('.product-card')) element.style.setProperty('--reveal-delay', `${(index % 4) * 85}ms`);
    revealObserver.observe(element);
  });
}

updateCart();
