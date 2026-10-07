# akshay25vyas.github.io

Personal research homepage of Akshay Vyas, PhD candidate in Computer Science at The University of Texas at Dallas.

Live site: https://akshay25vyas.github.io/

## What's in this repository

Everything sits at the top level, with no folders, so it can be uploaded in one go from GitHub's file picker.

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

## Refresh the LinkedIn preview

LinkedIn caches link previews. After changing `og-card.png` or the page description, paste the site address into https://www.linkedin.com/post-inspector/ and click **Inspect** to refresh it.
