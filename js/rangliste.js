// Online-Rangliste: lädt die öffentliche JSON vom Rising-Spin-Server (docs/server.md) und zeigt die Top 100.
// `players` kann {} (noch niemand), ein Objekt (Schlüssel = Spieler-ID) oder eine Liste sein.
// Test ohne Server-Daten: ?demo=1 an die URL hängen (erfundene Spieler, nur lokal sinnvoll).
(() => {
  const URL_JSON = "https://vps-01b89b67.vps.ovh.net/rangliste.json";
  const TOP = 100;
  const box = document.querySelector("[data-ranking]");
  if (!box) return;
  const en = document.documentElement.lang === "en";
  const T = en ? {
    all: "All", season: "Season", updated: "Updated", rank: "Rank", player: "Player", league: "League",
    games: "Games", record: "W–L", prov: "provisional", provHint: "Fewer than 10 ranked games: rating still settling.",
    loading: "Loading leaderboard …", error: "The leaderboard can't be reached right now. Please try again later.",
    retry: "Try again", emptyTitle: "Season {s} starts soon", emptyText: "No one has played a ranked online match yet. The first players will appear here.",
    filterEmpty: "No one in this league yet.", shown: "Top {n} of {t} players", filter: "Filter by league", demo: "Demo data (not real)",
  } : {
    all: "Alle", season: "Saison", updated: "Stand", rank: "Platz", player: "Spieler", league: "Liga",
    games: "Spiele", record: "S–N", prov: "vorläufig", provHint: "Weniger als 10 Ranglistenspiele: Wertung pendelt sich noch ein.",
    loading: "Rangliste wird geladen …", error: "Die Rangliste ist gerade nicht erreichbar. Bitte später noch einmal versuchen.",
    retry: "Nochmal laden", emptyTitle: "Saison {s} startet bald", emptyText: "Noch hat niemand ein Online-Ranglistenspiel gemacht. Die ersten Spieler erscheinen hier.",
    filterEmpty: "In dieser Liga ist noch niemand.", shown: "Top {n} von {t} Spielern", filter: "Nach Liga filtern", demo: "Demo-Daten (nicht echt)",
  };
  // Fallback, falls `leagues` fehlt (Stand Server 28.11.2026).
  const LEAGUES = [
    { id: "kreisliga", min: 0, name: "Kreisliga" }, { id: "bezirksliga", min: 1050, name: "Bezirksliga" },
    { id: "landesliga", min: 1150, name: "Landesliga" }, { id: "oberliga", min: 1250, name: "Oberliga" },
    { id: "regionalliga", min: 1350, name: "Regionalliga" }, { id: "bundesliga", min: 1450, name: "Bundesliga" },
  ];
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
  const slug = (s) => String(s || "").toLowerCase().replace(/[^a-z]/g, "");
  let state = { leagues: LEAGUES, players: [], season: 1, updated: 0, filter: "all", demo: false };

  function leagueOf(p, leagues) {
    const key = slug(p.league);
    const hit = leagues.find((l) => slug(l.id) === key || slug(l.name) === key);
    if (hit) return hit;
    // Ohne Liga-Feld: aus RRP und den Schwellen ableiten.
    return [...leagues].sort((a, b) => b.min - a.min).find((l) => num(p.rrp) >= num(l.min)) || leagues[0];
  }

  function normalize(data) {
    const leagues = Array.isArray(data.leagues) && data.leagues.length ? data.leagues : LEAGUES;
    const raw = Array.isArray(data.players) ? data.players : Object.values(data.players || {});
    const players = raw.filter((p) => p && typeof p === "object").map((p) => ({
      rank: num(p.rank), name: String(p.name || "?").slice(0, 40), rrp: Math.round(num(p.rrp)),
      games: num(p.games), wins: num(p.wins), losses: num(p.losses), provisional: !!p.provisional,
      league: leagueOf(p, leagues),
    }));
    players.sort((a, b) => (a.rank && b.rank ? a.rank - b.rank : b.rrp - a.rrp));
    players.forEach((p, i) => { if (!p.rank) p.rank = i + 1; });
    return { leagues, players, season: num(data.season) || 1, updated: num(data.updated) };
  }

  function badge(l) {
    const tier = Math.max(0, state.leagues.findIndex((x) => x.id === l.id));
    return `<span class="lg lg--${tier}" title="${esc(l.name)}${l.min ? ` (${en ? "from" : "ab"} ${l.min} RRP)` : ""}"><span>${esc(l.name)}</span></span>`;
  }

  function render() {
    const { leagues, players, season, updated, filter } = state;
    const head = box.querySelector("[data-ranking-meta]");
    const when = updated ? new Date(updated).toLocaleString(en ? "en-GB" : "de-DE", { dateStyle: "medium", timeStyle: "short" }) : "";
    head.innerHTML = `<span class="rk-season">${T.season} ${season}</span>${when ? `<span>${T.updated}: ${esc(when)}</span>` : ""}`
      + (state.demo ? `<span class="rk-demo">${T.demo}</span>` : "");
    const body = box.querySelector("[data-ranking-body]");
    const chips = box.querySelector("[data-ranking-filter]");
    if (!players.length) {
      chips.hidden = true;
      body.innerHTML = `<div class="rk-empty panel"><div class="rk-empty__ball" aria-hidden="true"></div>`
        + `<h2>${esc(T.emptyTitle.replace("{s}", season))}</h2><p>${T.emptyText}</p>`
        + `<div class="rk-ladder">${leagues.map(badge).join("")}</div></div>`;
      return;
    }
    const count = (id) => players.filter((p) => p.league.id === id).length;
    chips.hidden = false;
    chips.innerHTML = [["all", T.all, players.length], ...leagues.map((l) => [l.id, l.name, count(l.id)])]
      .map(([id, name, n]) => `<button type="button" class="rk-chip${id === filter ? " is-on" : ""}" data-f="${esc(id)}" aria-pressed="${id === filter}">${esc(name)} <b>${n}</b></button>`).join("");
    const all = filter === "all" ? players : players.filter((p) => p.league.id === filter);
    const list = all.slice(0, TOP);
    if (!list.length) { body.innerHTML = `<p class="rk-none">${T.filterEmpty}</p>`; return; }
    body.innerHTML = `<p class="rk-count">${esc(T.shown.replace("{n}", Math.min(TOP, list.length)).replace("{t}", all.length))}</p>`
      + `<ol class="rk-list" aria-label="${T.player}">`
      + `<li class="rk-row rk-row--head" aria-hidden="true"><span>${T.rank}</span><span>${T.player}</span><span>RRP</span><span>${T.games}</span><span>${T.record}</span></li>`
      + list.map((p) => `<li class="rk-row${p.rank <= 3 ? ` rk-row--top rk-row--p${p.rank}` : ""}">`
        + `<span class="rk-rank">${p.rank}</span>`
        + `<span class="rk-name"><strong>${esc(p.name)}</strong>${badge(p.league)}${p.provisional ? `<span class="rk-prov" title="${T.provHint}">${T.prov}</span>` : ""}</span>`
        + `<span class="rk-rrp">${p.rrp}${p.provisional ? "<i>?</i>" : ""}</span>`
        + `<span class="rk-games"><small>${T.games} </small>${p.games}</span>`
        + `<span class="rk-wl"><span class="w">${p.wins}</span>–<span class="l">${p.losses}</span></span></li>`).join("")
      + `</ol><p class="rk-legend"><span class="rk-prov">${T.prov}</span> ${T.provHint}</p>`;
  }

  function demoData() {
    const names = ["Mia K.", "TopspinTom", "Jule", "Kaiser42", "Netzroller", "Lena B.", "Schnittmeister", "Ole", "Pingo", "Ballkönigin", "Ritter", "Smashi"];
    const players = names.map((name, i) => {
      const games = i === 9 ? 4 : 40 - i * 3, wins = Math.round(games * (0.8 - i * 0.04));
      return { name, rrp: 1520 - i * 48, games, wins, losses: games - wins, provisional: games < 10 };
    });
    return { leagues: LEAGUES, players, season: 1, updated: Date.now() };
  }

  async function load() {
    const body = box.querySelector("[data-ranking-body]");
    body.innerHTML = `<p class="rk-none">${T.loading}</p>`;
    try {
      let data;
      if (new URLSearchParams(location.search).has("demo")) { data = demoData(); state.demo = true; } else {
        const res = await fetch(URL_JSON, { cache: "no-cache" });
        if (!res.ok) throw new Error(res.status);
        data = await res.json();
      }
      state = { ...state, ...normalize(data) };
      render();
    } catch (e) {
      body.innerHTML = `<div class="rk-empty panel"><p>${T.error}</p><button type="button" class="btn btn--small" data-retry>${T.retry}</button></div>`;
      body.querySelector("[data-retry]").addEventListener("click", load);
    }
  }

  box.querySelector("[data-ranking-filter]").setAttribute("aria-label", T.filter);
  box.addEventListener("click", (e) => {
    const b = e.target.closest("[data-f]");
    if (!b) return;
    state.filter = b.dataset.f;
    render();
  });
  load();
})();
