# First Battery Woodmead — landing page

Single-page, static landing site for Google Ads traffic: a vehicle selector
that pushes the visitor into one of two WhatsApp conversations. Plain
HTML/CSS/vanilla JS, no build step, no framework.

## Run locally

Any static file server works (the JS uses `fetch` for `data/vehicles.json`,
so opening `index.html` directly via `file://` won't load the catalogue).

```
npx serve .
# or
python -m http.server 8080
```

Then open the printed localhost URL.

## Before going live

1. **Vehicle data** — `data/vehicles.json` already contains the real
   catalogue (~4,450 make/model/variant combinations, ~75 makes), generated
   from `catalogue.xlsx` in the `battery-whatsapp-bot` project — the same
   spreadsheet the WhatsApp bot itself reads from. It's grouped by make —
   `{ "MAKE": [ { "model", "variant", "years": [...] }, ... ] }` — which
   keeps the payload to ~55KB gzipped instead of ~175KB as flat rows. To
   refresh it after the spreadsheet changes, re-run the generation script
   (ask Claude Code to regenerate it from the current `catalogue.xlsx`, or
   see the aggregation logic in `js/vehicles.js` for the expected shape).

2. **WhatsApp number and copy** — already wired to the real number and
   details pulled from the bot's own code. Edit `js/config.js` if any of
   these change:
   - `whatsappNumber` — digits only, country code, no `+` or spaces.
   - `business.phoneTel` / `phoneDisplay` / `address` / `hoursFull` /
     `hoursLine`.
   - `maps.url` — the Google Maps directions link.
   - `headlines` / `activeHeadline` — three headline variants are already
     written in; flip `activeHeadline` to `"A"`, `"B"`, or `"C"` to test a
     different one, or edit the copy directly.
   - `messages` — the WhatsApp message templates for Chat, Callout, and the
     "Can't find your vehicle?" fallback.

3. **Tracking** — still in `js/config.js`:
   - `ga4MeasurementId` — your GA4 measurement ID (e.g. `G-XXXXXXXXXX`).
     Leave blank to disable analytics entirely.
   - `googleAds.conversionId` / `conversionLabel` — from your Google Ads
     conversion action. When both are set, clicking "Chat on WhatsApp" or
     "Callout" fires a Google Ads conversion event. When either is blank,
     the click instead fires a GA4 `whatsapp_click` event (requires
     `ga4MeasurementId` to be set) so you still have a fallback signal until
     Ads conversion tracking is wired up.
   - UTM handling needs no config: if the landing URL carries
     `utm_campaign` (or `utm_source` as a fallback), it's captured on load
     and prepended to the WhatsApp message as `[Ad: <value>] ...` so you can
     tell which ad drove a conversation from inside WhatsApp itself.

4. **Privacy policy** — `privacy.html` is placeholder copy. Replace with
   your actual policy.

5. **Deploy** — this repo is connected to Vercel (`dkcm/first-battery-bot-page`);
   every push to `main` auto-deploys to `first-batterycenter.co.za`. Other
   branches get their own preview URL.

## Sitelinks

The page is structured as three anchor-linked sections so each can serve as
a distinct Search Ads sitelink destination, each ending in a WhatsApp CTA:

- `/` or `/#battery-finder` — the vehicle selector (default landing target)
- `/#warranty` — warranty terms and genuine stock
- `/#visit-us` — hours, address, and directions

## Structure

```
index.html        markup + inline critical CSS (kept inline to avoid an extra request)
js/config.js       business details, CTA copy, tracking IDs — the only file you should need to edit
js/vehicles.js     loads + indexes data/vehicles.json
js/app.js          UI wiring: combobox, CTA state, sticky bar, UTM + tracking
data/vehicles.json sample catalogue — replace with your real data
privacy.html       placeholder privacy policy
```
