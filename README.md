# FunTok — Advanced Mobile Video Platform Starter 🎬

A minimalist, high-fidelity web-based clone of a short-video sharing platform, optimized for a seamless mobile-first viewport. This project features authentic social interactions, contextual search grids, and a dedicated instant-messaging workflow framework.

## What is Included
- **TikTok-Style Feed:** Mobile-first vertical video scroll layout featuring creator avatar circles and floating interaction nodes.
- **WhatsApp-Style Inbox Layout:** A dedicated direct messaging module featuring interactive chat row lists, custom conversation bubbles (sent vs. received), and simulated real-time creator text replies.
- **Advanced Explore Search Engine:** A 2-column professional search grid component that filters database records instantly based on captions, tags, or usernames.
- **Interactive Reporting Modal:** An expanded content moderation wizard overlay that replaces basic text warnings with selectable report categories.
- **Supabase Authentication Bridge:** Out-of-the-box infrastructure for email/password user accounts, profile registration, and local storage fallback sandboxing.
- **Relational Data Architecture:** Scalable structural blueprints for profiles, short clips, follow matrices, liking logs, and moderation reports.
- **Secure Configuration Matrix:** Frontend browser-safe deployment architecture keeping high-clearance tokens separated from client code.
- **GitHub Pages Ready:** Built as a pure static web architecture layer for instantaneous deployment pipelines.

## One-Time Setup
1. **Provision Database:** Create a new project instance on your cloud dashboard or database manager.
2. **Execute Schema:** Open your SQL manager query execution box and run the complete contents of `schema.sql`.
3. **Configure File Storage:** Provision a secure media hosting bucket named `videos`.
4. **Enforce Access Policies:** Establish security row policies restricting write operations to authenticated creators while leaving read access open to the public stream.
5. **Link Variables:** Copy your endpoint connection details and browser-safe public anonymous tokens into your local `config.js` file.
6. **Local Evaluation:** Double-click `index.html` or launch a local preview engine to test functionality natively inside your browser.
7. **Deploy Pipeline:** Commit these codebase files into a fresh GitHub repository and toggle GitHub Pages access on within the repository settings panel.

## Important Security Note
Never expose high-clearance service tokens or administrative environment keys to the browser viewport layer. Always leverage granular Row Level Security (RLS) policies and asset management filters to shield sensitive data structures.

## Completed & Scaled Checklist
- [x] Integrated round creator avatars with floating actionable badges on the timeline feed.
- [x] Implemented a local storage state tracker to preserve following stats and creator interactions across session refreshes.
- [x] Created an interactive WhatsApp-style inbox layout layer to handle active creator conversation scripts.
- [x] Engineered a dynamic search grid filter query view matching on keyphrase text inputs.
- [x] Upgraded the flagging system to a professional, multi-option reporting ticket selector sheet modal.
- [ ] Implement video transcoding optimizations and dynamic thumbnail generations before launching data pipelines to massive audiences.
- [ ] Connect production backups, live error metrics tracking, and rate-limiting middleware to guard against web traffic spam vectors.
