# Spotify Clone - End-to-End Localhost Application

This is a monolithic, localhost-only clone of Spotify. It allows Users, Artists, Podcasters, and Admins to manage and listen to tracks and podcasts.

## Features

- **Public Home**: Listen to previews of tracks and podcasts without an account.
- **Content Filters**: Easily filter tracks and podcasts by genre and category (Pop, Rock, Technology, etc.) across the app.
- **User App**: Discover, search, and listen to published tracks and podcasts. Manage libraries and create playlists.
- **Artist Dashboard**: Create artists, upload tracks with cover art and audio files. View deep analytics including playback completions and listener drop-off rates.
- **Podcaster Dashboard**: Create shows, schedule and publish episodes. Track performance with detailed analytics metrics.
- **Admin Dashboard**: Manage users, tracks, and podcasts. Monitor global statistics.
- **Local Audio Playback**: Tracks and episodes play sequentially via a persistent bottom player.

## Tech Stack

- **Backend**: Express.js, Node.js
- **Database**: MySQL, Prisma ORM
- **Frontend**: EJS, Vanilla JS (Modules), TailwindCSS
- **Storage**: Local filesystem via Multer

## Getting Started

1. **Start the database**:
   ```bash
   docker-compose up -d
   ```
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Run Prisma Migrations**:
   ```bash
   npx prisma migrate dev
   ```
4. **Seed Database**:
   ```bash
   npm run db:seed
   ```
   *Note: This script automatically generates hundreds of database records and dummy audio files (WAV) so you can immediately preview playbacks without needing to upload files manually.*
5. **Start Application**:
   ```bash
   npm run dev
   ```

## Demo Accounts

All demo accounts use the password: `123456`

- **Admin**: `admin@example.com` (Access `/admin`)
- **User**: `user@example.com` (Access `/app/home`)
- **Artist**: `artist@example.com` (Access `/artist/select`)
- **Podcaster**: `podcaster@example.com` (Access `/podcaster/shows`)

## Common Issues

- **Docker MySQL auth failed / P1000 due to old volume**: If you restarted Docker but the password doesn't match `.env`, remove the old Docker volume (`docker-compose down -v`) and try `docker-compose up -d` again.
- **Port 3306 is in use**: You may have a local MySQL instance running. Stop it (`sudo service mysql stop`) before running `docker-compose up -d`.
- **Port 3000 is in use**: Check if another Node.js or React app is running on port 3000 and terminate it before running `npm run dev`.
- **Prisma migrate fails because MySQL isn't ready**: Wait a few seconds after running `docker-compose up -d` before running `npx prisma migrate dev`.
- **Do not commit real uploads**: The `.gitignore` is configured to ignore `uploads/audio/*` and `uploads/images/*`. Keep it that way to avoid bloating the repo with real audio files. Demo tracks will initially show "No Audio" or fail to play until you upload real files via the dashboard.

## Demonstration

Please refer to [docs/demo-script.md](docs/demo-script.md) for a comprehensive demo walkthrough.
