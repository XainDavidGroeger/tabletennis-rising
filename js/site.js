// Links und Zähler an EINER Stelle. Leere Werte = Knopf zeigt „bald“ und ist nicht klickbar.
const LINKS = {
  steam: "",       // z. B. "https://store.steampowered.com/app/1234560/Rising_Spin/"
  android: "",     // erst Google-Gruppe für den geschlossenen Test, später Play-Store-Link
  appstore: "",    // App-Store-Link (nach Launch)
  appstorePt: "",  // Anbieter-Token (pt=) aus App Store Connect für Kampagnenlinks
  discord: "https://discord.gg/ZTBFkWCBxx",     // Einladungslink ohne Ablauf, z. B. "https://discord.gg/xxxx"
  // Seite /tester (Android-Test): Platzhalter, David trägt die drei Links ein
  testerGroup: "",   // Google Group, z. B. "https://groups.google.com/g/rising-spin-tester"
  testerOptin: "",   // Opt-in-Link des geschlossenen Tests aus der Play Console, z. B. "https://play.google.com/apps/testing/<paket>"
  discordTester: "https://discord.gg/ZTBFkWCBxx", // Einladung direkt in #android-tester (sonst wie discord)
  goatcounter: "", // z. B. "rising-spin" → zählt über https://rising-spin.goatcounter.com
};

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

function initLinks(utm) {
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
initLinks(utm);
initPlayer();
initLightbox();
initMenu();
initCounter();
document.querySelectorAll("[data-year]").forEach((el) => { el.textContent = new Date().getFullYear(); });
