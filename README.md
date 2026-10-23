# Robotechs website

Version **1.0.0** · October 20, 2026

The website for Robotechs FTC 25611 in Clarksburg, Maryland. Includes Home, About Us, Engineering, Events, Support Us, Resources, Tutorials, Contact, ten event detail pages, Privacy, Terms, and a custom 404 page.

## Run locally

Open `index.html` directly. Local navigation maps to the HTML files; a `file://` address will still show `.html`.

For a hosted preview with working clean URLs:

```
python preview.py
```

Then open `http://127.0.0.1:8000`. The preview serves only the public website files. It is for local development, not an Internet-facing production server.

## Check the source

```
python validate.py
node --check site.js
node --check form-utils.js
```

## Build for hosting

```
python build-site.py --url https://your-real-domain.org
```

Replace the address with the actual HTTPS site root. The generated `dist/` folder contains the public release, absolute social/canonical metadata, a sitemap, robots.txt, clean-URL routing files and security headers. The build accepts `SITE_URL` or Netlify’s `URL` environment variable when `--url` is omitted.

Upload the contents of `dist/` to a host supporting the provided routing configuration:

- **Netlify:** the included `netlify.toml` runs the build and publishes `dist/`. Set the production domain through Netlify; `URL` supplies the configured site address.
- **Apache:** enable rewrite/header support and deploy `dist/` at the domain root, including `.htaccess`.
- **Other hosts:** configure equivalent clean-URL rewrites and the custom 404 response. The files use root-relative clean links; project-subdirectory hosting needs an additional base-path configuration.

Public URLs include `/`, `/about`, `/engineering`, `/events`, `/support`, `/resources`, `/tutorials`, and `/contact`. Old `.html` requests redirect to their clean equivalents. GitHub stores the source; importing the repository does not itself deploy or replace the Wix website.

## Content and privacy

- Photos use the original file bytes. No image compression or resizing is applied. Main photos are preloaded. Offscreen photos load as they approach the viewport, with two background downloads at a time, including horizontally clipped galleries. No-JavaScript fallbacks retain native lazy loading. Hosting configuration caches original photos for seven days across page visits.
- Fonts and animation libraries are bundled locally. Their original notices and Outfit’s licence are included under `assets/`.
- No analytics, private dashboard, login, password, or submission server is included.
- The contact form validates input and prepares an email in the visitor’s email application. The visitor reviews and sends it there; the website does not store contact submissions.
- The privacy notice remembers only its dismissal preference. Visitors can reopen it from the footer.
- The 2026–27 robot remains in development. Telugu class demo details remain to be announced.

The site includes original team photos and third-party marks. No new blanket open-source or photo-reuse licence is granted by this repository.

## Updating the website

Edit the HTML, `style.css`, and `site.js` directly. Shared header/footer markup appears in each HTML file. After changing common navigation, keep those copies consistent and run validation. Retain original image quality when replacing photos.

Before a production launch, check the actual hosting URL, TLS/redirect behavior, social previews, document access, mobile layouts, photo permissions and roster details. See `RELEASE-NOTES.md` for the checks performed and their limits.
