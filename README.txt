UNIVERSAL DRIVING ACADEMY — LANDING PAGE

Files to publish: dist/
Entry page: dist/index.html
Styles: dist/styles.css
Interactive guide: dist/app.js
Languages: dist/translations.js, dist/quiz-translations.js and dist/i18n.js
Categories and learning details: dist/offerings.css
Public business contacts: dist/config.js

Edit only verified phone, Telegram URL and address in UDA_CONTACT.
Accepted Telegram URL format: https://t.me/username
No contacts or course prices were invented. A contact notice is displayed
until the business owner supplies real details. The guide gives a preparation
recommendation and saves/copies it; it does not submit an application.

The website supports Uzbek (Latin), Russian and English. The header language
selection is saved locally when browser storage is available. A ?lang=uz,
?lang=ru or ?lang=en URL also selects the display language. The lesson language
is chosen independently in the guide. The five-step guide includes experience,
goal, license category, lesson language and preferred time. Category buttons
prefill the requested category; saved recommendations include these choices.

Owner-provided course details: A, B, C, D, BE, DE and CE; female instructors
for female students and male instructors for male students; lessons in Uzbek,
Russian and English; flexible scheduling; driving practice in different weather.

Preview with a static HTTP server, for example:
python -m http.server 4173 --bind 127.0.0.1 --directory dist

Brand logo: outlined SVG from the approved UDA vector reconstruction.
Hero carousel: seven AI-generated illustrative vehicle concepts, not photos of
the academy's actual fleet or facilities. Optimized 1024px WebP files are at
dist/assets/category-{a,b,c,d,be,de,ce}.webp. Exact generation prompts are kept
in source-assets/category-*-prompt.txt. Built-in image generation was used.
The full square images remain uncropped; category captions sit below them.
Carousel behavior: dist/carousel.js and dist/carousel.css. It advances every
six seconds with previous/next, category selectors and pause/play controls.
Manual interaction pauses autoplay, and reduced-motion mode uses manual slides.
Font: Manrope, SIL Open Font License (dist/assets/manrope-OFL.txt).

Animated Earth: dist/animations.js and dist/globe.css use a spherical WebGL
renderer with a NASA Blue Marble texture (source-assets/Earth-CREDIT.txt).
The wheel and orbit animation uses dist/cta-motion.css. Both sections respect
reduced-motion preferences, pause when out of view or when the page is hidden,
and share accessible pause/resume controls. WebGL has a static spherical fallback.

Validation: JavaScript syntax, local assets, HTML anchors, unique IDs,
SVG validity, responsive/reduced-motion rules and source review.
Automated browser visual and interaction QA was not run because permission was denied.
