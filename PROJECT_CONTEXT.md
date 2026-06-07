# Project Context

This is a localhost university Spotify clone project.

## Environment

The project runs in WSL.

- Code runs inside WSL
- Node.js runs inside WSL
- Prisma runs inside WSL
- MySQL runs in Docker through Docker Compose
- Database URL: mysql://root:root@127.0.0.1:3306/spotify_clone

## Stack

- Node.js + Express.js
- EJS
- MySQL
- Prisma
- express-session + bcrypt
- Multer
- TailwindCSS
- Vanilla JavaScript modules
- Chart.js
- HTMLAudioElement

## Rules

Do not use React.
Do not use Vite.
Do not use JWT.
Do not use MongoDB.
Do not use cloud storage.

Use Express routes + EJS pages.
Use Prisma with MySQL.
Use express-session for login.
Use Multer for local uploads.
Use Docker Compose only for MySQL.

## Main commands

npm install
docker compose up -d
npx prisma generate
npm run db:migrate
npm run db:seed
npm run dev

## Main URLs

- App: http://localhost:3000
- Adminer: http://localhost:8080
- Login: http://localhost:3000/login
- User App: http://localhost:3000/app/home
- Artist Dashboard: http://localhost:3000/artist/select
- Podcaster Dashboard: http://localhost:3000/podcaster/shows