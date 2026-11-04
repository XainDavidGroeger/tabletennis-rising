// Links und Zähler an EINER Stelle. Leere Werte = Knopf zeigt „bald“ und ist nicht klickbar.
const LINKS = {
  steam: "",       // z. B. "https://store.steampowered.com/app/1234560/Rising_Spin/"
  android: "",     // erst Google-Gruppe für den geschlossenen Test, später Play-Store-Link
  appstore: "",    // App-Store-Link (nach Launch)
  appstorePt: "",  // Anbieter-Token (pt=) aus App Store Connect für Kampagnenlinks
  discord: "https://discord.gg/ZTBFkWCBxx",     // Einladungslink ohne Ablauf, z. B. "https://discord.gg/xxxx"
  // Kanäle: erscheinen als Symbolleiste im Footer jeder Seite und auf /links. Leer = nicht anzeigen.
  youtube: "https://www.youtube.com/channel/UCbypCdB_ChAtPiVcS55eVgg",
  tiktok: "https://www.tiktok.com/@risingspin",
  instagram: "https://www.instagram.com/risingspin",
  facebook: "https://www.facebook.com/profile.php?id=61596075187460", // bei Kurznamen tauschen (facebook.com/risingspin)
  // Seite /tester (Android-Test): Platzhalter, David trägt die drei Links ein
  testerGroup: "",   // Google Group, z. B. "https://groups.google.com/g/rising-spin-tester"
  testerOptin: "",   // Opt-in-Link des geschlossenen Tests aus der Play Console, z. B. "https://play.google.com/apps/testing/<paket>"
  discordTester: "https://discord.gg/ZTBFkWCBxx", // Einladung direkt in #android-tester (sonst wie discord)
  goatcounter: "", // z. B. "rising-spin" → zählt über https://rising-spin.goatcounter.com
};

// Strich-Symbole (24er-Raster, currentColor), damit sie zur Schrift passen.
const ICONS = {
  steam: '<circle cx="12" cy="12" r="10"/><circle cx="15.5" cy="9" r="2.5"/><path d="M2.5 14.5 8 17m5.5-6.5L9 15.5"/><circle cx="8.5" cy="16.5" r="2"/>',
  discord: '<path d="M8 6.5c-1.6.3-3 .8-4 1.5C2.6 10.5 2 13.5 2 16.5c1.4 1.4 3.4 2.3 5 2.5l1.2-2M16 6.5c1.6.3 3 .8 4 1.5 1.4 2.5 2 5.5 2 8.5-1.4 1.4-3.4 2.3-5 2.5l-1.2-2M6.5 16c3.6 1.6 7.4 1.6 11 0M7.5 8.3c3-1 6-1 9 0"/><circle cx="9" cy="12.5" r="1.3"/><circle cx="15" cy="12.5" r="1.3"/>',
  youtube: '<path d="M2.5 17a24 24 0 0 1 0-10 2 2 0 0 1 1.4-1.4 50 50 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24 24 0 0 1 0 10 2 2 0 0 1-1.4 1.4 50 50 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/><path d="m10 15 5-3-5-3z"/>',
  tiktok: '<path d="M14 3v12a4 4 0 1 1-4-4"/><path d="M14 3c.5 2.8 2.3 4.5 5 5"/>',
  instagram: '<rect x="2.5" y="2.5" width="19" height="19" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/>',
  facebook: '<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>',
};
const SOCIAL = [["youtube", "YouTube"], ["tiktok", "TikTok"], ["instagram", "Instagram"], ["facebook", "Facebook"], ["discord", "Discord"]];
// Website-Wurzel aus dem Pfad dieses Skripts (Seiten liegen unterschiedlich tief).
const ROOT = new URL("..", document.currentScript ? document.currentScript.src : location.href).href;

function icon(kind) {
  return `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[kind]}</svg>`;
}

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign"];

// UTM aus der URL (QR-Pfade /f1/ usw. leiten mit UTM hierher) und für Unterseiten merken.
function readUtm() {
  const q = new URLSearchParams(location.search);
  const utm = {};
  UTM_KEYS.forEach((k) => { if (q.get(k)) utm[k] = q.get(k); });
  try {
    if (Object.keys(utm).length) sessionStorage.setItem("utm", JSON.stringify(utm));
    else return JSON.parse(sessionStorage.getItem("utm") || "{}");
  } catch (e) { /* Speicher gesperrt: nur die aktuelle URL zählt */ }
  return utm;
}

function withUtm(kind, url, utm) {
  if (!Object.keys(utm).length) return url;
  const u = new URL(url);
  if (kind === "steam") UTM_KEYS.forEach((k) => utm[k] && u.searchParams.set(k, utm[k]));
  if (kind === "android" && u.hostname === "play.google.com") {
    u.searchParams.set("referrer", new URLSearchParams(utm).toString());
  }
  if (kind === "appstore" && utm.utm_campaign) {
    if (LINKS.appstorePt) u.searchParams.set("pt", LINKS.appstorePt);
    u.searchParams.set("ct", utm.utm_campaign);
  }
  return u.toString();
}

// Kanal-Leiste unter dem Footer jeder Seite, plus Verweis auf den Link-Hub /links.
function initSocial() {
  const foot = document.querySelector(".foot .wrap");
  if (!foot) return;
  const en = document.documentElement.lang === "en";
  const nav = document.createElement("nav");
  nav.className = "social";
  nav.setAttribute("aria-label", en ? "Channels" : "Kanäle");
  nav.innerHTML = SOCIAL.filter(([kind]) => LINKS[kind])
    .map(([kind, name]) => `<a data-link="${kind}" title="${name}">${icon(kind)}<span>${name}</span></a>`).join("")
    + `<a class="social__all" href="${ROOT}${en ? "en/links/" : "links/"}">${en ? "All links" : "Alle Links"}</a>`;
  foot.querySelector(".foot__in").after(nav);
}

function initLinks(utm) {
  document.querySelectorAll("[data-icon]").forEach((a) => a.insertAdjacentHTML("afterbegin", icon(a.dataset.icon)));
  document.querySelectorAll("[data-link]").forEach((a) => {
    const kind = a.dataset.link;
    const url = LINKS[kind];
    if (url) {
      a.href = withUtm(kind, url, utm);
      a.rel = "noopener";
      a.target = "_blank";
    } else {
      a.classList.add("is-soon");
      a.removeAttribute("href");
      a.setAttribute("aria-disabled", "true");
    }
  });
}

// Trailer und Kapitel-Intros: Kachel antippen = Video in den großen Player laden und starten.
function initPlayer() {
  const video = document.querySelector("[data-player]");
  const title = document.querySelector("[data-player-title]");
  if (!video) return;
  document.querySelectorAll(".clip").forEach((b) => b.addEventListener("click", () => {
    document.querySelectorAll(".clip").forEach((c) => c.classList.toggle("is-active", c === b));
    video.poster = b.dataset.poster;
    video.src = b.dataset.video;
    if (title) title.textContent = b.dataset.title;
    video.play();
    video.scrollIntoView({ behavior: "smooth", block: "center" });
  }));
}

function initLightbox() {
  const dlg = document.querySelector(".lightbox");
  if (!dlg || !dlg.showModal) return;
  const img = dlg.querySelector("img");
  document.querySelectorAll("[data-full]").forEach((b) => b.addEventListener("click", () => {
    img.src = b.dataset.full;
    img.alt = b.querySelector("img").alt;
    dlg.showModal();
  }));
  dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });
}

function initMenu() {
  const btn = document.querySelector(".menu-btn");
  const nav = document.querySelector(".nav");
  if (!btn || !nav) return;
  btn.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    btn.setAttribute("aria-expanded", String(open));
  });
  nav.addEventListener("click", (e) => { if (e.target.closest("a")) nav.classList.remove("open"); });
}

function initCounter() {
  if (!LINKS.goatcounter || location.hostname === "localhost" || location.hostname === "127.0.0.1") return;
  const s = document.createElement("script");
  s.async = true;
  s.src = "https://gc.zgo.at/count.js";
  s.dataset.goatcounter = `https://${LINKS.goatcounter}.goatcounter.com/count`;
  document.head.append(s);
}

const utm = readUtm();
initSocial();
initLinks(utm);
initPlayer();
initLightbox();
initMenu();
initCounter();
document.querySelectorAll("[data-year]").forEach((el) => { el.textContent = new Date().getFullYear(); });
