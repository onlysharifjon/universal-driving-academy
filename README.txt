UNIVERSAL DRIVING ACADEMY — LANDING PAGE

Files to publish: dist/
Entry page: dist/index.html
Styles: dist/styles.css
Interactive guide: dist/app.js
Public business contacts: dist/config.js

Edit only verified phone, Telegram URL and address in UDA_CONTACT.
Accepted Telegram URL format: https://t.me/username
No contacts or course prices were invented. A contact notice is displayed
until the business owner supplies real details. The guide gives a preparation
recommendation and saves/copies it; it does not submit an application.

Preview with a static HTTP server, for example:
python -m http.server 4173 --bind 127.0.0.1 --directory dist

Brand logo: outlined SVG from the approved UDA vector reconstruction.
Hero image: AI-generated illustrative brand concept, not a photo of actual facilities.
Font: Manrope, SIL Open Font License (dist/assets/manrope-OFL.txt).

Animated Earth: dist/animations.js and dist/globe.css use a spherical WebGL
renderer with a NASA Blue Marble texture (source-assets/Earth-CREDIT.txt).
The wheel and orbit animation uses dist/cta-motion.css. Both sections respect
reduced-motion preferences, pause when out of view or when the page is hidden,
and share accessible pause/resume controls. WebGL has a static spherical fallback.

Validation: JavaScript syntax, local assets, HTML anchors, unique IDs,
SVG validity, responsive/reduced-motion rules and source review.
Automated browser visual and interaction QA was not run because permission was denied.
