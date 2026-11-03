# Website (Entwurf)

Statische Seite für „Tabletennis – The Rising“. Konzept, Kosten und Livegang-Schritte: [docs/marketing/website.md](../docs/marketing/website.md).

- Ansehen: `python tools/website_serve.py` → http://localhost:8080/
- Links (Steam, Android-Test, App Store, Discord, YouTube, GoatCounter): nur in `js/site.js` (`LINKS`) eintragen.
- Bilder/Schriften/Video neu erzeugen: `python tools/website_assets.py` (ohne Video: `--no-video`).
- Platzhalter vor dem Livegang finden: `grep -rn "\[\[" website`
- QR-Pfade: `f1/`, `f2/`, `e1/`, `flyer/` (Weiterleitung mit UTM). Neue Variante = Ordner kopieren.

| Pfad | Inhalt |
|---|---|
| `index.html`, `en/index.html` | Startseite DE/EN |
| `presse/`, `en/press/` | Pressekit |
| `impressum/` | Impressum (ausgefüllt) |
| `css/site.css` | Design „Goldene Stunde“ aus `scripts/ui_style.gd` |
| `img/`, `fonts/`, `video/` | erzeugt von `tools/website_assets.py` |
