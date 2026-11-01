# Bac app (أستاذ الشارع | فضاء التلميذ)

- Content images live in `img/<pack>/<key>.webp` (one small file per page). The app loads only the image it needs.
- The `uNN-xx.js` / `ft-NN.js` packs are the source files. After adding or changing any pack, ALWAYS run:
  `node tools/split-packs.js` — it regenerates `img/` and the `IMGS` list in `index.html`.
  (Never make students download a whole pack just to see one exercise — that caused endless "جاري التحميل".)
- Bump `CACHE` in `sw.js` when shipping changes.
