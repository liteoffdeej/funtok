# FunTok — complete starter

## What is included
- Mobile-first vertical short-video feed
- Supabase email/password authentication
- PostgreSQL schema for profiles, videos, likes, comments and reports
- Supabase Storage upload flow
- Basic reporting/moderation hook
- Safe browser configuration: only a publishable/anon key belongs in `config.js`
- GitHub Pages-compatible static frontend

## One-time setup
1. Create a Supabase project.
2. Open SQL Editor and run `schema.sql`.
3. Create a Storage bucket named `videos`.
4. Add Storage policies that let authenticated users upload into a folder named with their own user ID; keep public/private access appropriate for your deployment.
5. Put the project's URL and browser-safe publishable/anon key into `config.js`.
6. Test locally.
7. Put these files into a GitHub repository and enable GitHub Pages.

## Important
Do not put a Supabase service-role key in browser code. Use Row Level Security and Storage policies.

## Production checklist
- Add age-appropriate community rules and moderation.
- Add block/mute/report tools.
- Add rate limits and spam protection.
- Validate file type and size server-side.
- Add video transcoding/thumbnails before scaling.
- Keep private user data out of public tables.
- Add backups and monitoring.
- Review the hosting/storage provider's current limits and terms before launch.
