# Gałki Display

TV menu system for an ice cream shop — real-time flavor board + admin panel + Google Sheets backend.

---

## Stack

```
Google Sheets  ←→  Google Apps Script (REST API)
                              ↑  ↓
                     admin/index.html  (mobile admin)
                         index.html    (TV display)
                    (hosted on GitHub Pages)
```

---

## Setup

### 1. Google Sheets

Create a spreadsheet with three tabs:

**`smaki`** — ice cream flavors

| nazwa | kategoria | aktywny | brak | kolejnosc | nazwa_en | alkohol | wegan |
|-------|-----------|---------|------|-----------|----------|---------|-------|
| Truskawka | owocowy | TRUE | FALSE | 1 | Strawberry | FALSE | FALSE |

Valid categories: `śmietankowy` · `owocowy` · `orzechowy` · `sorbety`

**`polewki`** — toppings

| nazwa | aktywny | brak | alkohol | nazwa_en | wegan |
|-------|---------|------|---------|----------|-------|
| Sos czekoladowy | TRUE | FALSE | FALSE | Chocolate Sauce | FALSE |

**`meta`**

| A | B |
|---|---|
| lastUpdate | 0 |

---

### 2. Google Apps Script

1. In the spreadsheet: **Extensions → Apps Script**
2. Replace all default code with the contents of `appsscript/Code.gs`
3. Save

**Set your PIN** — go to **Project Settings → Script Properties → Add property**:
- Key: `PIN`
- Value: your chosen PIN

**Deploy as Web App**:
1. **Deploy → New deployment → Web app**
2. Execute as: **Me** · Who has access: **Anyone**
3. Copy the deployment URL (`https://script.google.com/macros/s/.../exec`)

> After any change to `Code.gs` you must create a new deployment version for changes to take effect.

---

### 3. GitHub Pages

Fork this repo, then go to **Settings → Pages → Source: GitHub Actions**.

Any push to `main` triggers an automatic deploy.

---

### 4. Admin panel

Open `/admin/` on your phone. The Apps Script URL is configured directly in `admin/index.html` — set `HARDCODED_API_URL` to your deployment URL.

PIN authentication: set the same PIN in `admin/index.html` (`const PIN`) and in Script Properties.

---

### 5. TV display

Open the root URL on a device connected to the TV. The display:
- Polls for updates every 10 seconds
- Scales to any screen resolution (1920×1080 base, CSS transform)
- Click anywhere to enter fullscreen
- Compatible with LG WebOS 4 (Chromium ~53)

Set `HARDCODED_API_URL` in `index.html` to skip the setup overlay on the TV.

---

## File structure

```
/
├── index.html              # TV display
├── admin/
│   └── index.html          # Admin panel (mobile)
├── brand/
│   ├── logo-cut.png
│   ├── logo.png
│   ├── cards/
│   │   └── icedog.png
│   └── smaki/
│       └── 1–20.png        # Flavor card assets
├── appsscript/
│   └── Code.gs             # Google Apps Script
└── .github/
    └── workflows/
        └── deploy.yml      # GitHub Pages auto-deploy
```

---

## Daily use

- **Mark out of stock**: check the ✕ box in admin → Save → TV updates within 10s
- **Reorder**: drag the ⠿ handle on any row
- **Add flavor/topping**: click the + button at the bottom of the list

---

## Troubleshooting

**TV not loading data** — verify the Apps Script URL is correct and the deployment has access set to *Anyone*.

**Admin save fails** — make sure you deployed a new version after editing `Code.gs`.

**Changes not showing on TV** — wait ~10s or press F5 to force reload.

**GitHub Pages not working** — check the Actions tab for failed workflow runs; confirm Source is set to *GitHub Actions* in Pages settings.
