# CineTogether

Watch movies together with live video, synced playback, chat and reactions.

## Why Netlify alone is not enough

Netlify hosts **static files only**. CineTogether also needs a small always-on Node server
(`server.ts`) for rooms, chat, play/pause sync and the video-call signaling. That server
cannot run on Netlify, so on a Netlify-only deploy the page loads but rooms never connect.

## Option A: one service (simplest)

Deploy the whole repo to **Render** (free), Railway or Fly.io. Share *that* URL.

Render: New > Blueprint > pick this repo (it reads `render.yaml`), or New > Web Service with
- Build command: `npm install && npm run build`
- Start command: `npm start`

## Option B: keep Netlify + add the server

1. Deploy the repo to Render as above. Open `https://YOUR-APP.onrender.com/healthz`, you should see `{"ok":true,...}`.
2. In Netlify: Site configuration > Environment variables > add
   `VITE_SERVER_URL = https://YOUR-APP.onrender.com`
3. Trigger a new Netlify deploy (Deploys > Trigger deploy > Clear cache and deploy).

Free Render services sleep after ~15 min idle; the first request can take ~30-60 s to wake up.

## Run locally

```
npm install
npm run dev      # http://localhost:3000
```

Open it in two different browsers (or one normal + one private window) to test as two people.

## Email account and room names

Sign in or create an account by entering an email address and selecting **Continue with this email**. This flow does not send a verification code. Account email and name are stored in SQLite at `data/cinetogether.sqlite`. People choose the name other participants see when creating or joining a room. Do not commit the database file. For deployments, use persistent disk storage for `data/` or replace SQLite with a managed database so accounts survive instance replacement.

## Notes

- Account email and display name are stored in SQLite; the current browser also keeps the active profile for the session.
- Rooms live in server memory; they reset when the server restarts.
- Video calls use public STUN servers. Some strict networks/mobile carriers need a TURN server to connect.
"# ANcinetogether" 
