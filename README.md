# akshay25vyas.github.io

Personal research homepage of Akshay Vyas, PhD candidate in Computer Science at The University of Texas at Dallas.

Live site: https://akshay25vyas.github.io/

## What's in this repository

Everything for the homepage sits at the top level, so it can be uploaded in one go from GitHub's file picker. The one folder, `neural-dual-bounds/`, holds the project page for the NeurIPS 2026 paper.

| Files | What they are |
|---|---|
| `index.html` | The whole site: text, styles and scripts in one file |
| `404.html` | Page shown for broken links |
| `*-thumb.*`, `*-full.*`, `*-timeline.jpg` | Paper figures and their thumbnails |
| `*.woff2` | Newsreader and IBM Plex Sans fonts (SIL Open Font License, see the LICENSE files) |
| `og-card.png` | The preview image LinkedIn and other sites show when the link is shared |
| `qr-website.*`, `qr-resume.*` | QR codes for the site and the resume (SVG shown on the page, PNG for download) |
| `favicon.svg`, `favicon-32.png`, `apple-touch-icon.png` | Browser and phone icons |
| `robots.txt`, `sitemap.xml` | Help search engines find the site |
| `neural-dual-bounds/` | Project page for the NeurIPS 2026 Spotlight paper, with its PDF (see below) |

## Neural Dual Bounds project page

Live at https://akshay25vyas.github.io/neural-dual-bounds/. This is the address for the "Project Page URL" field on the NeurIPS poster page.

| Files in `neural-dual-bounds/` | What they are |
|---|---|
| `index.html` | The page. It is generated, so edit the sources in `_src/` and rebuild instead of editing it directly |
| `Neural_Dual_Bounds_NeurIPS_2026.pdf` | The camera-ready paper. To update it, upload a new file with the same name |
| `og-card.png`, `paper-first-page.jpg` | Link preview image and the paper thumbnail |
| `katex/` | Fonts and styles for the math (MIT license, included) |
| `_src/` | Build sources, data parsed from the paper's tables, and tests. Not published. `_src/README.md` explains how to rebuild |

The homepage links to it from the Nov 2026 news item, from the PDF and Project page buttons on the paper under Publications, and from the links under "Learned inference with guarantees" in Research.

### The video presentation

The video recorded for NeurIPS is linked from those same three places on the homepage (the news item, the Video button on the paper, the links under Research) and from the project page (the Video button at the top and the Video row under the abstract).

The address is the share link from the SlidesLive recorder. When the talk has a public page in the SlidesLive library or on neurips.cc, swap the address:

1. In `index.html`, search for `slideslive` and replace the address in all three places. Inside HTML, write `&` as `&amp;`.
2. In `neural-dual-bounds/_src/build.mjs`, change `VIDEO_URL` near the top and rebuild (see `_src/README.md`). The project page is generated, so do not edit its `index.html` by hand.

## Add your photo and CV

Both are optional and switch on by themselves once the file exists. Upload them to the top level of the repository with Add file, then Upload files.

- **Photo:** a square headshot named exactly `photo.jpg`. Until then the site shows your initials.
- **CV:** a PDF named exactly `Akshay_Vyas_public_resume.pdf`. The "Download CV" button and the "CV (PDF)" link then appear. To update it, upload a new file with the same name; it replaces the old one.

## QR codes

The "QR codes" link in the sidebar and in Contact opens a small card with two codes, one for https://akshay25vyas.github.io/ and one for the resume PDF. On a phone it shows one large code at a time, with a Website/Resume switch. Each code has "Copy link" and "Save image" buttons, and the PNGs are large enough to print on a poster.

To open the card directly, go to https://akshay25vyas.github.io/#qr. Bookmark that on your phone for career fairs and poster sessions.

The resume code points at `Akshay_Vyas_public_resume.pdf`. Keep that filename when you update the resume and the code keeps working. If the filename ever changes, regenerate `qr-resume.svg` and `qr-resume.png`.

## Edit text later

1. Open `index.html` on GitHub and click the pencil icon.
2. Use Ctrl+F (Cmd+F on a Mac) to find the sentence you want to change and edit it.
3. Click **Commit changes**. The live site updates within a few minutes.

News items are near the top of the page body, under `<section id="news"`. Copy one `<li>...</li>` line and change its date and text to add a new one.

Students you have mentored are under `<section id="teaching"`. Each `<li class="tl">...</li>` block is one student: the dates on the left, then the name, a one-line role, a short paragraph and optional link pills. Copy a block to add a student, and keep the most recent one on top. The courses you have assisted are in the same section under "Teaching assistant"; the second line of each course is a good place for the semester and instructor.

The short personal section is under `<section id="beyond"`. It is two paragraphs of plain text.

Projects are under `<section id="projects"`. Each `<article class="pub project">` is one card: a poster image on the left (the DARPA PTG card uses the YouTube thumbnail of the program video and links to it) and the title, description and link pills on the right. Copy a whole `<article>...</article>` block to add another project.

## Refresh the LinkedIn preview

LinkedIn caches link previews. After changing `og-card.png` or the page description, paste the site address into https://www.linkedin.com/post-inspector/ and click **Inspect** to refresh it.
