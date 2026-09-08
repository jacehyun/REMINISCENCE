# RÉMINISCENCE

A cozy, scrapbook-style photo memory wall — built as a Firebase assignment, styled like a page torn out of a *Life is Strange* journal.

Every memory lives on a hand-tilted polaroid you can flip through in a carousel, tag with a mood, search by caption, and drop into a full scrapbook grid view. Adding a memory feels like sliding a new photo into a frame, not filling out a form.

![Status](https://img.shields.io/badge/status-active-brightgreen) ![Stack](https://img.shields.io/badge/stack-vanilla%20JS-yellow) ![Backend](https://img.shields.io/badge/backend-Firebase-orange)

## ✨ Features

- **Polaroid carousel** — memories drift in from either side with a soft tilt and depth fade, center card always in focus
- **Full grid ("View All") mode** — toggle to see every memory at once, scrapbook-style
- **Mood tagging & search** — filter by Happy / Calm / Sad / Excited / Nostalgic, or search captions live
- **Add a Memory modal** — polaroid-shaped photo drop-in with live preview, one-line mood pills, caption field
- **Ambient rewind-style page loader** — a green ripple "surfaces" the wall once your actual memories (not just placeholders) are ready
- **Background music player** — toggleable, autoplay-safe (respects browser autoplay policy)
- **Admin panel** (`admin.html`) — Firebase Auth–gated dashboard to review and delete memories, restricted to a single admin UID via Firestore security rules
- Fully responsive, works as a static site with **zero backend/server code**

## 🛠 Tech stack

- Vanilla HTML / CSS / JavaScript — no framework, no build step
- **Firebase Firestore** — memory data, realtime updates via `onSnapshot`
- **Firebase Authentication** (Email/Password) — admin panel access control
- **Cloudinary** — unsigned image upload/hosting for submitted photos
- Google Fonts (Caveat, DM Sans, Indie Flower)

## 📂 Project structure

```
├── index.html          # Main site
├── admin.html           # Admin dashboard (auth-gated)
├── style.css             # Main site styles
├── admin.css             # Admin dashboard styles
├── script.js              # Main site logic
├── admin.js                # Admin panel logic
├── images/                  # UI art, backgrounds, icon assets
└── music/                     # Background track
```

## 🎵 Credits

- Background music: *"Art of Life"* by LesFM

## 👤 Author

Created by **John Carlo C. Lacson** — Platform Technologies, 4th Year

