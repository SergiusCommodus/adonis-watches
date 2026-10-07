# Adonis

The website for **Adonis**, a Carlisle Capital LLC venture: chronographs born of the golden age of spaceflight and crowned with the laurel of Apollo.

The home page opens with a hoplite who throws his spear; the strike cuts the night open and reveals the site. The intro plays once per browser session, can be skipped with the button or the Escape key, and is replaced by a short fade for visitors who prefer reduced motion. Add `?intro` to the home page address to replay it.

## Pages

| File | Page |
| --- | --- |
| `index.html` | Home, with the intro |
| `watches.html` | The Mission Collection and comparison |
| `watches/mission-i-aegean.html` | Mission I Aegean |
| `watches/mission-i-helios.html` | Mission I Helios |
| `watches/mission-hybrid-nyx.html` | Mission Hybrid Nyx |
| `watches/mission-hybrid-olympus.html` | Mission Hybrid Olympus |
| `hybrid.html` | Mission Hybrid technology |
| `app.html` | The Adonis app |
| `heritage.html` | Brand story |
| `reserve.html` | Reservation list and questions |
| `privacy.html` | Privacy notice |
| `404.html` | Page not found |

## Going live checklist

1. **Collect reservations.** Create a free form at [formspree.io](https://formspree.io), copy its endpoint (it looks like `https://formspree.io/f/abcdwxyz`) and paste it into `formEndpoint` in `assets/js/config.js`. Until then the forms tell visitors that reservations open soon, so no sign ups are lost silently.
2. **Social links.** Add your Instagram and TikTok links in the same file. Empty links stay hidden.
3. **Custom domain (optional).** In the repository go to Settings, Pages, Custom domain, and enter your domain. If you use a custom domain, change the `href` values that start with `/adonis-watches/` in `404.html` to start with `/`.
4. **Trademark.** Run a clearance search for ADONIS in classes 14 and 9 before you spend on marketing.

## Editing

Everything is plain HTML, CSS and JavaScript with no build step. Edit a file, commit, and GitHub Pages republishes in about a minute.

* Styles: `assets/css/style.css` (site) and `assets/css/intro.css` (opening sequence)
* Behaviour: `assets/js/main.js` (menu, galleries, forms) and `assets/js/intro.js` (opening sequence)
* Images: `assets/img`. Large images also have a `-640` copy that phones load instead; if you replace an image, replace both.
* Soundtrack: `assets/audio/anthem.mp3`, controlled by `assets/js/audio.js`
* Fonts: Cinzel, Cormorant Garamond and Jost, self hosted in `assets/fonts` under the SIL Open Font License

Prices, dates and specifications on the site are marked as preliminary where they are not final. Keep it that way until production figures are confirmed.

Adonis is an independent brand. It is not affiliated with or endorsed by any space agency or watch company.
