/* ---------- Types ---------- */
interface Offer { seller: string; price: number }
interface Product { id: number; name: string; platform: string; region: string; sold: number; offers: Offer[] }
interface ProductView { id: number; name: string; platform: string; region: string; sold: number; price: number; offerCount: number }
interface Banner { title: string; subtitle: string; cta: string; link: string }
interface CartItem { pid: number; oi: number; qty: number }
interface User { email: string; password: string }
interface Session { email: string }
interface OrderLine { name: string; seller: string; key: string }
interface Order { id: number; user: string; date: number; total: number; lines: OrderLine[] }
interface StoreParams { q?: string; platform?: string; region?: string; maxPrice?: string; sort?: string }

/* ---------- Mock backend (each "service" is separate; the UI only renders what it gets) ---------- */
const DB = {
  products: [
    { id: 1, name: "Elden Ring", platform: "Steam", region: "Global", sold: 980, offers: [{ seller: "KeyKing", price: 34.5 }, { seller: "GameHub", price: 36.9 }, { seller: "PixelStore", price: 39.99 }] },
    { id: 2, name: "Cyberpunk 2077", platform: "GOG", region: "Global", sold: 760, offers: [{ seller: "KeyKing", price: 22.1 }, { seller: "DigitalDen", price: 24.5 }] },
    { id: 3, name: "FIFA 24", platform: "EA App", region: "Europe", sold: 540, offers: [{ seller: "GameHub", price: 29.0 }, { seller: "PixelStore", price: 31.5 }] },
    { id: 4, name: "Minecraft Java Edition", platform: "Microsoft", region: "Global", sold: 1200, offers: [{ seller: "DigitalDen", price: 19.9 }, { seller: "KeyKing", price: 21.0 }] },
    { id: 5, name: "The Witcher 3: Wild Hunt", platform: "GOG", region: "Global", sold: 890, offers: [{ seller: "PixelStore", price: 7.5 }, { seller: "GameHub", price: 8.2 }] },
    { id: 6, name: "Hogwarts Legacy", platform: "Steam", region: "Europe", sold: 670, offers: [{ seller: "KeyKing", price: 41.0 }, { seller: "DigitalDen", price: 43.5 }] },
    { id: 7, name: "Forza Horizon 5", platform: "Xbox", region: "United States", sold: 430, offers: [{ seller: "GameHub", price: 26.0 }, { seller: "KeyKing", price: 27.9 }] },
    { id: 8, name: "God of War", platform: "PlayStation", region: "Europe", sold: 510, offers: [{ seller: "PixelStore", price: 25.0 }, { seller: "DigitalDen", price: 27.0 }] },
    { id: 9, name: "Red Dead Redemption 2", platform: "Steam", region: "Global", sold: 820, offers: [{ seller: "KeyKing", price: 28.9 }, { seller: "GameHub", price: 30.5 }, { seller: "PixelStore", price: 31.0 }] },
    { id: 10, name: "Super Mario Odyssey", platform: "Nintendo", region: "Europe", sold: 390, offers: [{ seller: "DigitalDen", price: 44.0 }, { seller: "GameHub", price: 46.0 }] },
    { id: 11, name: "Counter-Strike 2 Prime", platform: "Steam", region: "Global", sold: 300, offers: [{ seller: "KeyKing", price: 12.0 }] },
    { id: 12, name: "Starfield", platform: "Xbox", region: "Global", sold: 350, offers: [{ seller: "PixelStore", price: 38.0 }, { seller: "GameHub", price: 40.0 }] },
  ] as Product[],
  banners: [{ title: "Weekend sale: up to 40% off", subtitle: "Digital game keys from trusted sellers", cta: "Shop now", link: "#/store" }] as Banner[],
  dealIds: [5, 2, 11, 9],
};

const minPrice = (p: Product): number => Math.min(...p.offers.map((o) => o.price));
const toView = (p: Product): ProductView => ({
  id: p.id, name: p.name, platform: p.platform, region: p.region, sold: p.sold,
  price: minPrice(p), offerCount: p.offers.length,
});

function lev(a: string, b: string): number {
  const m: number[][] = [];
  for (let i = 0; i <= a.length; i++) m[i] = [i];
  for (let j = 0; j <= b.length; j++) m[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      m[i][j] = Math.min(m[i - 1][j] + 1, m[i][j - 1] + 1, m[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return m[a.length][b.length];
}

function matches(name: string, q: string): boolean {
  const words = name.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  return q.toLowerCase().split(/\s+/).filter(Boolean).every((t) => {
    const tol = t.length > 5 ? 2 : t.length > 3 ? 1 : 0;
    return words.some((w) => w.includes(t) || Math.min(lev(w, t), lev(w.slice(0, t.length), t)) <= tol);
  });
}

const sorters: Record<string, (a: ProductView, b: ProductView) => number> = {
  popular: (a, b) => b.sold - a.sold,
  price_asc: (a, b) => a.price - b.price,
  price_desc: (a, b) => b.price - a.price,
  name: (a, b) => a.name.localeCompare(b.name),
};

const Api = {
  banner: async (): Promise<Banner> => DB.banners[0],
  bestSellers: async (): Promise<ProductView[]> =>
    [...DB.products].sort((a, b) => b.sold - a.sold).slice(0, 4).map(toView),
  deals: async (): Promise<ProductView[]> =>
    DB.products.filter((p) => DB.dealIds.includes(p.id)).map(toView),
  products: async ({ q, platform, region, maxPrice, sort }: StoreParams): Promise<ProductView[]> => {
    let r = DB.products.map(toView);
    if (q) r = r.filter((p) => matches(p.name, q));
    if (platform) r = r.filter((p) => p.platform === platform);
    if (region) r = r.filter((p) => p.region === region);
    if (maxPrice) r = r.filter((p) => p.price <= Number(maxPrice));
    return r.sort(sorters[sort || "popular"] ?? sorters.popular);
  },
  facets: async (): Promise<{ platforms: string[]; regions: string[] }> => ({
    platforms: [...new Set(DB.products.map((p) => p.platform))],
    regions: [...new Set(DB.products.map((p) => p.region))],
  }),
  product: async (id: number | string): Promise<Product | undefined> =>
    DB.products.find((p) => p.id === Number(id)),
};

/* ---------- Local state: users, session, cart, orders (localStorage with in-memory fallback) ---------- */
const mem: Record<string, unknown> = {};
let nextRoute: string | null = null;

function load<T>(k: string, d: T): T {
  try {
    const raw = localStorage.getItem(k);
    if (raw !== null) return JSON.parse(raw) as T;
  } catch { /* storage unavailable */ }
  return (mem[k] as T) ?? d;
}
function save<T>(k: string, v: T): void {
  mem[k] = v;
  try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage unavailable */ }
}
const session = (): Session | null => load<Session | null>("session", null);
const cart = (): CartItem[] => load<CartItem[]>("cart", []);

/* ---------- Helpers ---------- */
const ESC: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const esc = (s: string | number): string => String(s).replace(/[&<>"']/g, (c) => ESC[c]);
const $ = <T extends HTMLElement>(sel: string): T => document.querySelector(sel) as T;
const money = (n: number): string => "€" + n.toFixed(2);
const go = (h: string): void => { location.hash = h; };
const genKey = (): string =>
  Array.from({ length: 3 }, () => Math.random().toString(36).slice(2, 7).toUpperCase()).join("-");

function parse(): { parts: string[]; params: Record<string, string> } {
  const [path, qs] = (location.hash.slice(1) || "/").split("?");
  return {
    parts: path.split("/").filter(Boolean),
    params: Object.fromEntries(new URLSearchParams(qs || "")),
  };
}

const productCard = (p: ProductView): string => `
  <a class="card" href="#/product/${p.id}">
    <div class="card__cover">${esc(p.name.charAt(0))}<span class="badge">${esc(p.platform)}</span></div>
    <div class="card__body">
      <h3 class="card__title">${esc(p.name)}</h3>
      <div class="card__region">${esc(p.region)}</div>
      <div class="card__from">From <span class="card__price">${money(p.price)}</span></div>
      <div class="card__offers">${p.offerCount} offer${p.offerCount === 1 ? "" : "s"}</div>
    </div>
  </a>`;
const grid = (a: ProductView[]): string =>
  a.length ? `<div class="grid">${a.map(productCard).join("")}</div>` : `<p class="muted">No products found.</p>`;

function renderNav(): void {
  const s = session();
  const count = cart().reduce((n, i) => n + i.qty, 0);
  $("#nav").innerHTML =
    `<a class="nav__link" href="#/cart">Cart<span class="pill">${count}</span></a>` +
    (s
      ? `<a class="nav__link" href="#/orders">Orders</a><span class="nav__user">${esc(s.email)}</span><a class="nav__link" href="#" id="out">Sign out</a>`
      : `<a class="nav__link" href="#/login">Sign in</a><a class="btn btn--small" href="#/register">Register</a>`);
  const out = document.getElementById("out");
  if (out) out.onclick = (e) => { e.preventDefault(); save("session", null); go("#/"); void render(); };
}

const authForm = (title: string, id: string): string => `
  <div class="panel panel--narrow">
    <h1>${title}</h1>
    <form id="${id}" class="form">
      <label>Email <input name="email" type="email" required></label>
      <label>Password <input name="password" type="password" minlength="6" required></label>
      <button class="btn">${title}</button>
      <p id="err" class="error"></p>
    </form>
  </div>`;

/* ---------- Pages ---------- */
const pages = {
  async home(): Promise<string> {
    const [b, best, deals] = await Promise.all([Api.banner(), Api.bestSellers(), Api.deals()]);
    return `
      <section class="hero">
        <h1>${esc(b.title)}</h1>
        <p>${esc(b.subtitle)}</p>
        <a class="btn" href="${esc(b.link)}">${esc(b.cta)}</a>
      </section>
      <section><h2 class="section-title">Best sellers</h2>${grid(best)}</section>
      <section><h2 class="section-title">Deals</h2>${grid(deals)}</section>`;
  },

  async store(params: StoreParams): Promise<string> {
    const f = await Api.facets();
    const items = await Api.products(params);
    const opt = (arr: string[], v?: string): string =>
      `<option value="">All</option>` + arr.map((x) => `<option${x === v ? " selected" : ""}>${esc(x)}</option>`).join("");
    const sorts: [string, string][] = [["popular", "Most popular"], ["price_asc", "Price: low to high"], ["price_desc", "Price: high to low"], ["name", "Name"]];
    return `
      <h1>${params.q ? `Results for "${esc(params.q)}"` : "Store"}</h1>
      <div class="layout">
        <aside class="panel">
          <form id="ff" class="form">
            <label>Search <input name="q" value="${esc(params.q || "")}"></label>
            <label>Platform <select name="platform">${opt(f.platforms, params.platform)}</select></label>
            <label>Region <select name="region">${opt(f.regions, params.region)}</select></label>
            <label>Max price (€) <input name="maxPrice" type="number" min="0" step="1" value="${esc(params.maxPrice || "")}"></label>
            <label>Sort by <select name="sort">${sorts.map(([v, l]) => `<option value="${v}"${params.sort === v ? " selected" : ""}>${l}</option>`).join("")}</select></label>
            <button class="btn">Apply</button>
          </form>
        </aside>
        <section>
          <p class="muted">${items.length} product(s)</p>
          ${grid(items)}
        </section>
      </div>`;
  },

  async product(id: string): Promise<string> {
    const p = await Api.product(id);
    if (!p) return `<p class="muted">Product not found.</p>`;
    const offers = p.offers.map((o, i) => ({ ...o, i })).sort((a, b) => a.price - b.price);
    return `
      <div class="product">
        <div class="product__cover">${esc(p.name.charAt(0))}</div>
        <div>
          <h1>${esc(p.name)}</h1>
          <p><span class="badge badge--inline">${esc(p.platform)}</span> <span class="muted">Region: ${esc(p.region)} · Delivery: digital key</span></p>
          <h2 class="section-title">Offers</h2>
          <div class="offers">
            ${offers.map((o) => `
              <div class="offer">
                <span class="offer__seller">${esc(o.seller)}</span>
                <span class="offer__price">${money(o.price)}</span>
                <button class="btn btn--small" data-add="${p.id}:${o.i}">Add to cart</button>
              </div>`).join("")}
          </div>
        </div>
      </div>`;
  },

  async cart(): Promise<string> {
    const c = cart();
    if (!c.length) return `<h1>Cart</h1><p class="muted">Your cart is empty.</p>`;
    let total = 0;
    const rows = await Promise.all(c.map(async (it, idx) => {
      const p = (await Api.product(it.pid)) as Product;
      const o = p.offers[it.oi];
      total += o.price * it.qty;
      return `<tr><td>${esc(p.name)}</td><td>${esc(o.seller)}</td><td>${money(o.price)}</td><td>${it.qty}</td>
        <td><button class="btn btn--ghost btn--small" data-rm="${idx}">Remove</button></td></tr>`;
    }));
    return `
      <h1>Cart</h1>
      <div class="panel">
        <table class="table"><thead><tr><th>Product</th><th>Seller</th><th>Price</th><th>Qty</th><th></th></tr></thead><tbody>${rows.join("")}</tbody></table>
        <p class="total">Total: ${money(total)}</p>
        <a class="btn" href="#/checkout">Proceed to checkout</a>
      </div>`;
  },

  async checkout(): Promise<string> {
    if (!session()) { nextRoute = "#/checkout"; go("#/login"); return ""; }
    const c = cart();
    if (!c.length) return `<h1>Checkout</h1><p class="muted">Cart is empty.</p>`;
    let total = 0;
    for (const it of c) { const p = (await Api.product(it.pid)) as Product; total += p.offers[it.oi].price * it.qty; }
    return `
      <div class="panel panel--narrow">
        <h1>Checkout</h1>
        <p class="total">Total: ${money(total)}</p>
        <p class="muted">Simulated payment. No real money is charged.</p>
        <form id="pay" class="form">
          <label>Card number <input name="card" value="4242 4242 4242 4242" required></label>
          <button class="btn">Pay ${money(total)}</button>
        </form>
      </div>`;
  },

  async orders(): Promise<string> {
    const s = session();
    if (!s) { nextRoute = "#/orders"; go("#/login"); return ""; }
    const o = load<Order[]>("orders", []).filter((x) => x.user === s.email);
    if (!o.length) return `<h1>Orders</h1><p class="muted">No orders yet.</p>`;
    return `<h1>Orders</h1>` + o.slice().reverse().map((x) => `
      <div class="panel">
        <h3>Order #${x.id} · ${esc(new Date(x.date).toLocaleString())} · ${money(x.total)}</h3>
        <ul class="keys">${x.lines.map((l) => `<li>${esc(l.name)} (${esc(l.seller)}) <code>${esc(l.key)}</code></li>`).join("")}</ul>
      </div>`).join("");
  },

  async login(): Promise<string> { return authForm("Sign in", "login"); },
  async register(): Promise<string> { return authForm("Register", "register"); },
};

/* ---------- Router ---------- */
async function render(): Promise<void> {
  renderNav();
  const { parts, params } = parse();
  const r = parts[0] || "home";
  let html: string;
  switch (r) {
    case "home": html = await pages.home(); break;
    case "store": html = await pages.store(params); break;
    case "product": html = await pages.product(parts[1]); break;
    case "cart": html = await pages.cart(); break;
    case "checkout": html = await pages.checkout(); break;
    case "orders": html = await pages.orders(); break;
    case "login": html = await pages.login(); break;
    case "register": html = await pages.register(); break;
    default: html = `<p class="muted">Page not found.</p>`;
  }
  $("#app").innerHTML = html;
}
window.addEventListener("hashchange", () => void render());
void render();

/* ---------- Events ---------- */
$<HTMLFormElement>("#sf").addEventListener("submit", (e) => {
  e.preventDefault();
  go("#/store?q=" + encodeURIComponent($<HTMLInputElement>("#q").value));
});

document.addEventListener("submit", (e) => {
  const f = e.target as HTMLFormElement;
  const fd = Object.fromEntries(new FormData(f)) as Record<string, string>;

  if (f.id === "ff") {
    e.preventDefault();
    const p = new URLSearchParams(Object.entries(fd).filter(([, v]) => v));
    go("#/store?" + p.toString());
    void render();
  }

  if (f.id === "register" || f.id === "login") {
    e.preventDefault();
    const users = load<User[]>("users", []);
    const email = fd.email.toLowerCase();
    const u = users.find((x) => x.email === email);
    const err = $("#err");
    if (f.id === "register") {
      if (u) { err.textContent = "Account already exists."; return; }
      users.push({ email, password: fd.password }); // demo only: not hashed
      save("users", users);
    } else if (!u || u.password !== fd.password) {
      err.textContent = "Invalid email or password.";
      return;
    }
    save<Session>("session", { email });
    const next = nextRoute || "#/";
    nextRoute = null;
    go(next);
    void render();
  }

  if (f.id === "pay") {
    e.preventDefault();
    void (async () => {
      const c = cart();
      const s = session() as Session;
      const lines: OrderLine[] = [];
      let total = 0;
      for (const it of c) {
        const p = (await Api.product(it.pid)) as Product;
        const o = p.offers[it.oi];
        for (let i = 0; i < it.qty; i++) lines.push({ name: p.name, seller: o.seller, key: genKey() });
        total += o.price * it.qty;
      }
      const orders = load<Order[]>("orders", []);
      const order: Order = { id: orders.length + 1, user: s.email, date: Date.now(), total, lines };
      orders.push(order);
      save("orders", orders);
      save<CartItem[]>("cart", []);
      renderNav();
      $("#app").innerHTML = `
        <div class="panel panel--narrow">
          <h1>Payment successful</h1>
          <p>Order #${order.id}</p>
          <ul class="keys">${lines.map((l) => `<li>${esc(l.name)} <code>${esc(l.key)}</code></li>`).join("")}</ul>
          <a class="btn" href="#/orders">View orders</a>
        </div>`;
    })();
  }
});

document.addEventListener("click", (e) => {
  const t = e.target as HTMLElement;
  const d = t.dataset;
  if (d.add) {
    const [pid, oi] = d.add.split(":").map(Number);
    const c = cart();
    const ex = c.find((i) => i.pid === pid && i.oi === oi);
    if (ex) ex.qty++; else c.push({ pid, oi, qty: 1 });
    save("cart", c);
    renderNav();
    t.textContent = "Added";
  }
  if (d.rm !== undefined) {
    const c = cart();
    c.splice(Number(d.rm), 1);
    save("cart", c);
    void render();
  }
});
