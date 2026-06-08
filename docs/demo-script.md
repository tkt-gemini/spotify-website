# Spotify Clone - Demo Script

This document provides a step-by-step walkthrough for demonstrating the core features of the Spotify Clone project. 

> **Important Setup**
> Before the demo, ensure the app is running and the database is seeded (`npm run db:seed`). The seed script creates the initial demo accounts and structures but does NOT include real audio files in the repo. To demonstrate playback, you will need to upload real `.mp3` or `.wav` files during the demo.

---

## 1. User Application Flow

**Goal:** Demonstrate the end-user experience, including searching, library management, and playback.

1. **Login:** Go to `http://localhost:3000/login` and log in as the default user:
   - Email: `user@example.com`
   - Password: `123456`
2. **Home Page:** Observe the "Home" page with published tracks. Notice the sidebar highlighting the active tab.
3. **Search:** 
   - Click "Search" in the sidebar.
   - Search for "Demo". Observe results split into Tracks, Artists, Playlists, etc.
   - Try the filters (Tracks only, Artists only).
4. **Library & Playlists:**
   - Click "Your Library" in the sidebar.
   - Click "Create Playlist". A new playlist (e.g., "My Playlist #1234") is created.
   - Go to Search, find a track, and notice you can like it. However, adding to playlist is done from the playlist detail view or search (depending on UI). Let's go to the new Playlist detail page and use the "Add to Playlist" button next to available tracks.
5. **Playback (Note: Initial seed data lacks real audio):**
   - Click the "Play" button on a track.
   - The bottom player will appear.
   - *Since seed data doesn't have real audio, it may immediately stop or fail silently.* To see real playback, we must proceed to the Artist flow.

---

## 2. Artist Dashboard Flow

**Goal:** Show how an artist creates content, uploads media, and manages tracks.

1. **Login:** Log out, then log in as:
   - Email: `artist@example.com`
   - Password: `123456`
2. **Dashboard Entry:** 
   - You will land on `/artist/select`. Click "Go to Dashboard" for "Demo Artist".
3. **Overview & Analytics:**
   - Observe the Overview page. Note the analytics at the top (Total Tracks, Published Tracks).
   - Go to the Analytics tab to see Likes and Plays (initially 0 or seeded values).
4. **Upload a Real Track (CRITICAL FOR DEMO):**
   - Go to the **Tracks** tab.
   - Click **"Add New Track"**.
   - Fill in a title: `My Real Hit Song`.
   - **Cover Image:** Upload any image file (`.jpg`, `.png`).
   - **Audio File:** Upload a real `.mp3` or `.wav` file from your computer.
   - Select "Save as Draft".
5. **Publish Track:**
   - Back in the Tracks list, see the new track is "DRAFT".
   - Edit the track and select "Publish", or use the Publish button if available.
   - The track is now PUBLISHED and available to users.
6. **Verify Playback:**
   - Log out, log back in as `user@example.com`.
   - Search for `My Real Hit Song`.
   - Click Play. The bottom player will appear and audio will play. Notice the bottom player UI updates with the cover image and title.

---

## 3. Podcaster Dashboard Flow

**Goal:** Show podcast creation, episode scheduling, and playback.

1. **Login:** Log out, then log in as:
   - Email: `podcaster@example.com`
   - Password: `123456`
2. **Dashboard Entry:**
   - You will land on `/podcaster/shows`. Click "Manage Show" for "Demo Podcast Show".
3. **Upload an Episode (CRITICAL FOR DEMO):**
   - Go to the **Episodes** tab.
   - Click **"New Episode"**.
   - Fill in title: `Episode 2: The Real Talk`.
   - **Audio File:** Upload a real audio file.
   - Select "Publish" immediately.
4. **Schedule an Episode:**
   - Create another episode (no audio needed if just testing draft, but upload audio if you want to publish later).
   - In the edit screen, select a future date and click "Schedule". The status will change to DRAFT with a scheduled date.
5. **Verify Playback:**
   - Log out, log in as `user@example.com`.
   - Search for `Episode 2: The Real Talk` or find the Podcast.
   - Click Play. The bottom player handles the podcast episode correctly.

---

## 4. Admin Dashboard Flow

**Goal:** Demonstrate content moderation and user management.

1. **Login:** Log out, then log in as:
   - Email: `admin@example.com`
   - Password: `123456`
2. **Overview:**
   - Notice the global statistics (Total Users, Total Artists, Total Playback Events).
3. **User Management:**
   - Go to the **Users** tab.
   - Change `user@example.com`'s role to `ARTIST`. 
   - Try to change `admin@example.com`'s role to `USER`. An error banner should appear: "Cannot demote the last remaining admin".
4. **Content Moderation:**
   - Go to the **Tracks** tab.
   - Find the track you uploaded earlier. Change its status from `PUBLISHED` to `HIDDEN` or `ARCHIVED`.
   - Log out, log back in as a regular user, and verify the track is no longer visible in search or library.
5. **Podcast Moderation:**
   - Go to the **Podcasts** tab.
   - Change a show's status to `REMOVED`.

---

## 5. Error Pages (Bonus)

- Try to visit an invalid URL (e.g., `http://localhost:3000/some-random-page`). You will see the custom `404 - Page Not Found` UI.
- Log in as a regular `USER` and try to directly access `http://localhost:3000/admin`. You will see the custom `403 - Forbidden` UI instead of a blank string or crashing app.
