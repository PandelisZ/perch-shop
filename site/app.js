// Perch shop: a small demo store used to benchmark browser-testing tools.
// Each deployment path selects a build of the shop by its index in BUILDS
// (window.PERCH_BUILD). The
// meaning of each build lives in BUILDS below; the URL slugs are opaque so a
// tester cannot infer a planted bug from the address.

const BUILDS = {
  base: {},
  // Five product changes that are not bugs.
  move: { moveButtons: true },
  rename: { renameButtons: true },
  menu: { upgradeInMenu: true },
  postcode: { requirePostcode: true },
  copy: { newConfirmationCopy: true },
  // Six planted bugs.
  "bug-preview": { bugPreviewAmount: true },
  "bug-total": { bugCartTotal: true },
  "bug-count": { bugItemCount: true },
  "bug-declined": { bugDeclinedPaid: true },
  "bug-charge": { bugChargedAmount: true },
  "bug-confirm": { bugBrokenConfirm: true },
  // Every bug at once, for exploratory bug hunts.
  "all-bugs": {
    bugPreviewAmount: true,
    bugCartTotal: true,
    bugItemCount: true,
    bugDeclinedPaid: true,
    bugChargedAmount: true,
    bugBrokenConfirm: true,
  },
};

const F = Object.values(BUILDS)[Number(window.PERCH_BUILD) || 0] || {};

const ACCOUNT = { email: "robin@perch.test", password: "perch-demo", name: "Robin" };
const PRODUCTS = [
  { id: "mug", name: "Perch mug", price: 12 },
  { id: "tote", name: "Perch tote", price: 16 },
  { id: "notebook", name: "Perch notebook", price: 8 },
];
const PRO_PRORATED = 10;
const SUCCESS_CARD = "4242424242424242";
const DECLINED_CARD = "4000000000000002";
const POSTCODE_HINT = "A1A1A1";

const initialCart = () => [
  { id: "mug", qty: 1 },
  { id: "tote", qty: 1 },
];

let state = {
  user: null,
  signInError: "",
  plan: "Free",
  previewOpen: false,
  menuOpen: false,
  billingNotice: "",
  cart: initialCart(),
  cartCountCache: 2,
  payment: null, // { kind: "success" | "declined" | "error", text }
  orderNumber: 1001,
};

const money = (n) => `$${n.toFixed(2)}`;
const product = (id) => PRODUCTS.find((p) => p.id === id);
const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

function cartTotal() {
  if (F.bugCartTotal) {
    // Planted bug: quantity is ignored when totalling.
    return state.cart.reduce((sum, line) => sum + product(line.id).price, 0);
  }
  return state.cart.reduce((sum, line) => sum + product(line.id).price * line.qty, 0);
}

function itemCount() {
  const count = state.cart.reduce((sum, line) => sum + line.qty, 0);
  if (F.bugItemCount) {
    // Planted bug: the count only ever grows.
    state.cartCountCache = Math.max(state.cartCountCache, count);
    return state.cartCountCache;
  }
  return count;
}

function set(patch) {
  state = { ...state, ...patch };
  render();
}

// ---------- views ----------

function signInView() {
  return `
  <main class="signin">
    <h1>Perch</h1>
    <p class="muted">Sign in to your shop account.</p>
    <form id="signin" novalidate>
      <label>Email <input name="email" type="email" autocomplete="username" /></label>
      <label>Password <input name="password" type="password" autocomplete="current-password" /></label>
      ${state.signInError ? `<p role="alert" class="error">${esc(state.signInError)}</p>` : ""}
      <button type="submit">Sign in</button>
    </form>
    <p class="muted small">Demo account: ${ACCOUNT.email} / ${ACCOUNT.password}</p>
  </main>`;
}

function upgradeButtonLabel() {
  return F.renameButtons ? "Review Pro upgrade" : "Upgrade to Pro";
}

function billingView() {
  const upgrade =
    state.plan === "Free"
      ? F.upgradeInMenu
        ? `<div class="menu-wrap">
             <button id="plan-menu" aria-haspopup="menu" aria-expanded="${state.menuOpen}">Plan options</button>
             ${
               state.menuOpen
                 ? `<div role="menu" aria-label="Plan options">
                      <button role="menuitem" id="upgrade">${upgradeButtonLabel()}</button>
                      <button role="menuitem" id="compare">Compare plans</button>
                    </div>`
                 : ""
             }
           </div>`
        : `<button id="upgrade">${upgradeButtonLabel()}</button>`
      : "";

  const preview = state.previewOpen
    ? `<section role="dialog" aria-label="Invoice preview" class="preview">
         <h3>Invoice preview</h3>
         <p>Pro plan, billed monthly</p>
         <p>Prorated amount: ${money(F.bugPreviewAmount ? 12 : PRO_PRORATED)}</p>
         <div class="row">
           <button id="confirm-upgrade">Confirm upgrade</button>
           ${F.bugBrokenConfirm ? `<button id="complete-upgrade">Complete upgrade</button>` : ""}
           <button id="cancel-upgrade" class="secondary">Cancel</button>
         </div>
       </section>`
    : "";

  const planLine = `<p>Current plan: ${state.plan}</p>`;
  const body = F.moveButtons
    ? `${upgrade}<p class="muted">Pro adds priority shipping and gift wrapping.</p>${planLine}`
    : `${planLine}<p class="muted">Pro adds priority shipping and gift wrapping.</p>${upgrade}`;

  return `
  <section role="region" aria-label="Billing" class="card">
    <h2>Billing</h2>
    ${body}
    ${state.billingNotice ? `<p role="status">${esc(state.billingNotice)}</p>` : ""}
    ${preview}
  </section>`;
}

function productsView() {
  return `
  <section role="region" aria-label="Products" class="card">
    <h2>Products</h2>
    <ul class="products">
      ${PRODUCTS.map(
        (p) => `<li><span>${p.name}</span><span>${money(p.price)}</span>
          <button data-add="${p.id}" aria-label="Add ${p.name} to cart">Add to cart</button></li>`,
      ).join("")}
    </ul>
  </section>`;
}

function cartView() {
  const rows = state.cart
    .map((line) => {
      const p = product(line.id);
      const removeLabel = `${F.renameButtons ? "Delete" : "Remove"} ${p.name}`;
      const remove = `<button data-remove="${p.id}" class="secondary">${removeLabel}</button>`;
      const qty = `<span class="qty">
          <button data-dec="${p.id}" aria-label="Decrease ${p.name} quantity">−</button>
          <span>Quantity: ${line.qty}</span>
          <button data-inc="${p.id}" aria-label="Increase ${p.name} quantity">+</button>
        </span>`;
      const total = `<span>${money(p.price * line.qty)}</span>`;
      return `<li>${F.moveButtons ? remove : ""}<span class="name">${p.name}</span>${qty}${total}${F.moveButtons ? "" : remove}</li>`;
    })
    .join("");

  return `
  <section role="region" aria-label="Your cart" class="card">
    <h2>Your cart</h2>
    ${state.cart.length ? `<ul class="cart">${rows}</ul>` : `<p class="muted">Your cart is empty.</p>`}
    <p>Items in cart: ${itemCount()}</p>
    <p><strong>Cart total: ${money(cartTotal())}</strong></p>
  </section>`;
}

function checkoutView() {
  const p = state.payment;
  return `
  <section role="region" aria-label="Checkout" class="card">
    <h2>Checkout</h2>
    <form id="checkout" novalidate>
      <label>Card number <input name="card" inputmode="numeric" autocomplete="off" /></label>
      <label>Name on card <input name="name" autocomplete="off" /></label>
      ${
        F.requirePostcode
          ? `<label>Delivery postcode <input name="postcode" autocomplete="off" /></label>
             <p class="muted small">For test orders use postcode ${POSTCODE_HINT}.</p>`
          : ""
      }
      <button type="submit">Pay now</button>
    </form>
    <p class="muted small">Test cards: ${SUCCESS_CARD.replace(/(.{4})/g, "$1 ").trim()} succeeds, ${DECLINED_CARD.replace(/(.{4})/g, "$1 ").trim()} is declined.</p>
    ${p ? `<div role="${p.kind === "success" ? "status" : "alert"}" class="${p.kind}">${p.html}</div>` : ""}
  </section>`;
}

function shopView() {
  return `
  <header>
    <strong>Perch</strong>
    <span>Signed in as ${esc(state.user.name)}</span>
    <button id="signout" class="secondary">Sign out</button>
  </header>
  <main class="grid">
    ${billingView()}
    ${productsView()}
    ${cartView()}
    ${checkoutView()}
  </main>`;
}

function render() {
  document.getElementById("app").innerHTML = state.user ? shopView() : signInView();
}

// ---------- behaviour ----------

function signIn(form) {
  const email = form.email.value.trim().toLowerCase();
  const password = form.password.value;
  if (email === ACCOUNT.email && password === ACCOUNT.password) {
    set({ user: { name: ACCOUNT.name }, signInError: "" });
  } else {
    set({ signInError: "Incorrect email or password." });
  }
}

function pay(form) {
  const card = form.card.value.replace(/\s+/g, "");
  const name = form.name.value.trim();
  if (!state.cart.length) return set({ payment: { kind: "error", html: "Your cart is empty." } });
  if (!card || !name) return set({ payment: { kind: "error", html: "Enter a card number and the name on the card." } });
  if (F.requirePostcode && !form.postcode.value.trim()) {
    return set({ payment: { kind: "error", html: "Enter a delivery postcode." } });
  }

  const declined = card === DECLINED_CARD;
  if (card !== SUCCESS_CARD && !declined) {
    return set({ payment: { kind: "error", html: "That card number is not valid." } });
  }

  if (declined && !F.bugDeclinedPaid) {
    return set({ payment: { kind: "declined", html: "Payment declined. Your card was not charged." } });
  }

  const charged = F.bugChargedAmount ? product(state.cart[0].id).price * state.cart[0].qty : cartTotal();
  const order = state.orderNumber;
  const headline = F.newConfirmationCopy ? "Thanks, your order is on its way!" : "Payment successful";
  set({
    payment: {
      kind: "success",
      html: `<p><strong>${headline}</strong></p><p>Order #${order} confirmed. Charged ${money(charged)} to the card ending ${card.slice(-4)}.</p>`,
    },
    cart: [],
    cartCountCache: 0,
    orderNumber: order + 1,
  });
}

document.addEventListener("submit", (e) => {
  e.preventDefault();
  if (e.target.id === "signin") signIn(e.target);
  if (e.target.id === "checkout") pay(e.target);
});

document.addEventListener("click", (e) => {
  const t = e.target.closest("button");
  if (!t) return;
  const d = t.dataset;

  if (t.id === "signout") return set({ ...freshSession(), user: null });
  if (t.id === "plan-menu") return set({ menuOpen: !state.menuOpen });
  if (t.id === "compare") return set({ menuOpen: false, billingNotice: "Pro: priority shipping and gift wrapping for $10.00 a month." });
  if (t.id === "upgrade") return set({ previewOpen: true, menuOpen: false, billingNotice: "" });
  if (t.id === "cancel-upgrade") return set({ previewOpen: false });
  if (t.id === "confirm-upgrade") {
    if (F.bugBrokenConfirm) return set({ billingNotice: "To finish, press Complete upgrade." });
    return set({ plan: "Pro", previewOpen: false, billingNotice: "You are now on the Pro plan." });
  }
  if (t.id === "complete-upgrade") return set({ plan: "Pro", previewOpen: false, billingNotice: "You are now on the Pro plan." });

  if (d.add) {
    const existing = state.cart.find((l) => l.id === d.add);
    const cart = existing
      ? state.cart.map((l) => (l.id === d.add ? { ...l, qty: l.qty + 1 } : l))
      : [...state.cart, { id: d.add, qty: 1 }];
    return set({ cart, payment: null });
  }
  if (d.inc) return set({ cart: state.cart.map((l) => (l.id === d.inc ? { ...l, qty: l.qty + 1 } : l)) });
  if (d.dec) {
    return set({
      cart: state.cart.map((l) => (l.id === d.dec ? { ...l, qty: l.qty - 1 } : l)).filter((l) => l.qty > 0),
    });
  }
  if (d.remove) return set({ cart: state.cart.filter((l) => l.id !== d.remove) });
});

function freshSession() {
  return {
    signInError: "",
    plan: "Free",
    previewOpen: false,
    menuOpen: false,
    billingNotice: "",
    cart: initialCart(),
    cartCountCache: 2,
    payment: null,
  };
}

render();
