# Đặc tả Frontend — Spotify Mô phỏng Localhost với EJS

> Stack đã chốt: **Express.js + EJS + TailwindCSS + Vanilla JavaScript modules + Chart.js + HTMLAudioElement**.

## 0. Phạm vi tài liệu

Tài liệu này mô tả phần giao diện của website Spotify mô phỏng dùng trong **bài tập lớn môn học**, chạy trên localhost và render bằng **EJS**.

Khác với React/Vite SPA, frontend trong tài liệu này là **server-rendered multi-page app**:

```txt
Express route nhận request
Controller lấy data từ MySQL qua Prisma service
res.render() EJS page
Browser nhận HTML hoàn chỉnh
Vanilla JS xử lý các thao tác động như player, like, modal, upload preview, chart
```

Không dùng:

```txt
React
Vite
React Router
TanStack Query
Zustand
Recharts
```

Dùng:

```txt
EJS layouts/pages/partials/components
TailwindCSS
Vanilla JavaScript modules
fetch API cho thao tác động
Chart.js cho dashboard
HTMLAudioElement cho player
```

---

## 1. Mục tiêu frontend EJS

Frontend phục vụ 4 khu vực:

| Khu vực | Route prefix | Mục tiêu |
|---|---|---|
| Public/Auth | `/`, `/login`, `/register` | Landing, đăng nhập, đăng ký |
| User App | `/app` | Nghe nhạc, tìm kiếm, playlist, library, podcast |
| Artist Dashboard | `/artist` | Quản lý artist, track, album, analytics, team |
| Podcaster Dashboard | `/podcaster` | Quản lý show, episode, analytics, team |
| Admin | `/admin` | Quản trị user, plan, status nội dung |

Frontend chịu trách nhiệm:

```txt
Render UI bằng EJS
Tổ chức layout/partial/component
Hiển thị dữ liệu controller truyền vào
Gửi form submit đến Express routes
Gọi API JSON bằng fetch cho action động
Điều khiển audio player bằng HTMLAudioElement
Hiển thị chart bằng Chart.js
Hiển thị loading/error/empty state ở mức phù hợp
Ẩn/hiện nút theo quyền từ server truyền xuống
```

Nguyên tắc quan trọng:

```txt
EJS chỉ ẩn/hiện UI theo quyền.
Backend middleware/service vẫn phải kiểm tra quyền thật.
```

---

## 2. Kiến trúc frontend trong Express app

```txt
views
├── layouts
│   ├── auth.ejs
│   ├── user-app.ejs
│   ├── artist-dashboard.ejs
│   ├── podcaster-dashboard.ejs
│   └── admin.ejs
│
├── partials
│   ├── head.ejs
│   ├── scripts.ejs
│   ├── flash.ejs
│   ├── user-menu.ejs
│   ├── user-sidebar.ejs
│   ├── artist-sidebar.ejs
│   ├── podcaster-sidebar.ejs
│   ├── admin-sidebar.ejs
│   └── bottom-player.ejs
│
├── components
│   ├── track-row.ejs
│   ├── track-card.ejs
│   ├── artist-card.ejs
│   ├── album-card.ejs
│   ├── playlist-card.ejs
│   ├── podcast-card.ejs
│   ├── episode-row.ejs
│   ├── stat-card.ejs
│   ├── status-badge.ejs
│   ├── empty-state.ejs
│   ├── error-state.ejs
│   └── pagination.ejs
│
└── pages
    ├── auth
    │   ├── login.ejs
    │   └── register.ejs
    ├── user
    │   ├── home.ejs
    │   ├── search.ejs
    │   ├── library.ejs
    │   ├── liked-songs.ejs
    │   ├── playlist-detail.ejs
    │   ├── album-detail.ejs
    │   ├── artist-detail.ejs
    │   ├── podcast-detail.ejs
    │   ├── episode-detail.ejs
    │   └── profile.ejs
    ├── artist
    │   ├── select.ejs
    │   ├── create.ejs
    │   ├── overview.ejs
    │   ├── profile.ejs
    │   ├── tracks.ejs
    │   ├── track-form.ejs
    │   ├── albums.ejs
    │   ├── album-form.ejs
    │   ├── analytics.ejs
    │   └── team.ejs
    ├── podcaster
    │   ├── shows.ejs
    │   ├── show-form.ejs
    │   ├── show-detail.ejs
    │   ├── episodes.ejs
    │   ├── episode-form.ejs
    │   ├── analytics.ejs
    │   └── team.ejs
    ├── admin
    │   ├── dashboard.ejs
    │   ├── users.ejs
    │   ├── tracks.ejs
    │   └── podcasts.ejs
    └── error
        ├── 403.ejs
        ├── 404.ejs
        └── 500.ejs
```

---

## 3. Static assets và client JS

```txt
public
├── css
│   ├── tailwind.css
│   └── app.css optional
├── js
│   ├── main.js
│   ├── api.js
│   ├── player.js
│   ├── playlist-actions.js
│   ├── library-actions.js
│   ├── upload-preview.js
│   ├── modal.js
│   ├── toast.js
│   ├── search.js
│   ├── charts.js
│   └── dashboard.js
└── images
    └── default-cover.png
```

### 3.1. JS module nguyên tắc

```txt
Không viết JS inline quá nhiều trong EJS
Mỗi behavior nên nằm trong file JS riêng
Dùng data-* attributes để truyền ID từ EJS sang JS
Dùng fetch() cho API JSON
Dùng progressive enhancement: nếu JS lỗi, form submit cơ bản vẫn nên dùng được ở một số nơi
```

Ví dụ EJS:

```html
<button
  class="js-like-track"
  data-track-id="<%= track.id %>"
  data-liked="<%= track.isLiked ? 'true' : 'false' %>"
>
  Like
</button>
```

JS:

```js
document.addEventListener('click', async (event) => {
  const button = event.target.closest('.js-like-track');
  if (!button) return;

  const trackId = button.dataset.trackId;
  const liked = button.dataset.liked === 'true';

  const url = `/api/v1/me/library/tracks/${trackId}`;
  const method = liked ? 'DELETE' : 'POST';

  const res = await fetch(url, { method });
  if (!res.ok) return;

  button.dataset.liked = liked ? 'false' : 'true';
  button.textContent = liked ? 'Like' : 'Liked';
});
```

---

## 4. TailwindCSS setup

### 4.1. Cách dùng

Dùng Tailwind cho EJS bằng build CSS ra `public/css/tailwind.css`.

`tailwind.config.js` cần scan EJS:

```js
export default {
  content: [
    './views/**/*.ejs',
    './public/js/**/*.js'
  ],
  theme: {
    extend: {}
  },
  plugins: []
};
```

Script trong `package.json`:

```json
{
  "scripts": {
    "dev": "nodemon src/server.js",
    "css:dev": "tailwindcss -i ./src/styles/input.css -o ./public/css/tailwind.css --watch",
    "css:build": "tailwindcss -i ./src/styles/input.css -o ./public/css/tailwind.css --minify"
  }
}
```

### 4.2. Style guideline

```txt
Ưu tiên class Tailwind trực tiếp trong EJS
Component lặp nhiều thì tách partial/component
Màu nền tối kiểu Spotify
Button/action quan trọng rõ hover/focus
Dashboard table đủ khoảng cách, dễ đọc
```

---

## 5. Layouts

## 5.1. Auth Layout

Dùng cho `/login`, `/register`.

```txt
AuthLayout
├── Head
├── Centered Auth Card
│   ├── Logo
│   ├── Form
│   └── Error message
└── Scripts
```

Data cần truyền:

```txt
title
formValues optional
errors optional
```

---

## 5.2. User App Layout

```txt
UserAppLayout
├── Head
├── Left Sidebar
│   ├── Logo
│   ├── Home
│   ├── Search
│   ├── Library
│   ├── Liked Songs
│   └── User playlists
├── Top Bar
│   ├── Page title/search optional
│   ├── Notifications optional
│   └── User menu
├── Main Content
└── Bottom Player
```

Lưu ý quan trọng:

```txt
EJS multi-page app sẽ reload toàn trang khi chuyển route.
Nếu dùng cách MVP đơn giản, audio sẽ dừng/reset khi chuyển trang.
Điều này chấp nhận được cho bài tập nếu đã ghi rõ.
```

Optional Advanced:

```txt
Dùng app-shell AJAX partial để thay main content mà không reload bottom player.
```

---

## 5.3. Artist Dashboard Layout

```txt
ArtistDashboardLayout
├── Sidebar
│   ├── Overview
│   ├── Profile
│   ├── Tracks
│   ├── Albums
│   ├── Analytics
│   └── Team
├── Top Bar
│   ├── Artist switcher
│   └── User menu
└── Main Content
```

Data layout cần:

```txt
currentUser
currentArtist
artistRole
```

---

## 5.4. Podcaster Dashboard Layout

```txt
PodcasterDashboardLayout
├── Sidebar
│   ├── Shows
│   ├── Episodes
│   ├── Analytics
│   └── Team
├── Top Bar
│   ├── Show switcher
│   └── User menu
└── Main Content
```

---

## 5.5. Admin Layout

```txt
AdminLayout
├── Sidebar
│   ├── Dashboard
│   ├── Users
│   ├── Tracks
│   └── Podcasts
├── Top Bar
└── Main Content
```

---

## 6. Page routes

### 6.1. Public/Auth

```http
GET /
GET /login
POST /login
GET /register
POST /register
POST /logout
```

### 6.2. User App

```http
GET /app/home
GET /app/search
GET /app/library
GET /app/liked-songs
GET /app/playlists/:playlistId
GET /app/albums/:albumId
GET /app/artists/:artistId
GET /app/podcasts/:showId
GET /app/episodes/:episodeId
GET /app/profile
POST /app/profile
```

### 6.3. Artist Dashboard

```http
GET  /artist/select
GET  /artist/new
POST /artist
GET  /artist/:artistId/overview
GET  /artist/:artistId/profile
POST /artist/:artistId/profile
GET  /artist/:artistId/tracks
GET  /artist/:artistId/tracks/new
POST /artist/:artistId/tracks
GET  /artist/:artistId/tracks/:trackId/edit
POST /artist/:artistId/tracks/:trackId
POST /artist/:artistId/tracks/:trackId/publish
GET  /artist/:artistId/albums
GET  /artist/:artistId/albums/new
POST /artist/:artistId/albums
GET  /artist/:artistId/analytics
GET  /artist/:artistId/team
POST /artist/:artistId/team
```

### 6.4. Podcaster Dashboard

```http
GET  /podcaster/shows
GET  /podcaster/shows/new
POST /podcaster/shows
GET  /podcaster/shows/:showId
GET  /podcaster/shows/:showId/edit
POST /podcaster/shows/:showId
GET  /podcaster/shows/:showId/episodes
GET  /podcaster/shows/:showId/episodes/new
POST /podcaster/shows/:showId/episodes
GET  /podcaster/episodes/:episodeId/edit
POST /podcaster/episodes/:episodeId
POST /podcaster/episodes/:episodeId/publish
POST /podcaster/episodes/:episodeId/schedule
GET  /podcaster/shows/:showId/analytics
GET  /podcaster/shows/:showId/team
POST /podcaster/shows/:showId/team
```

---

## 7. Auth UI

## 7.1. Login Page

Route:

```http
GET /login
POST /login
```

Fields:

```txt
email
password
```

UI states:

| State | UI |
|---|---|
| Bình thường | Form email/password |
| Sai tài khoản | Error message trong card |
| Đang submit | Disable button optional |
| Đã login | Redirect `/app/home` |

Không cần gọi fetch; form có thể submit truyền thống.

---

## 7.2. Register Page

Route:

```http
GET /register
POST /register
```

Fields:

```txt
displayName
email
password
confirmPassword optional
```

Validation hiển thị:

```txt
Email không hợp lệ
Password quá ngắn
Display name rỗng
Email đã tồn tại
```

---

## 8. User App Pages

## 8.1. Home Page

Route:

```http
GET /app/home
```

Controller lấy:

```txt
newTracks
popularArtists
publicPlaylists
podcastShows
recentlyPlayed optional
```

EJS components:

```txt
track-card.ejs
artist-card.ejs
playlist-card.ejs
podcast-card.ejs
```

Empty state:

```txt
Nếu chưa có seed data, hiển thị thông báo "Chưa có dữ liệu mẫu".
```

---

## 8.2. Search Page

Route:

```http
GET /app/search?q=&type=
```

Render server-side:

```txt
Nếu q có giá trị → controller query MySQL LIKE → render results
Nếu q rỗng → render browse/categories/hướng dẫn tìm kiếm
```

Optional dynamic search:

```txt
search.js debounce input 300ms
fetch /api/v1/search?q=&type=
render lại vùng results bằng JS
```

Filters:

```txt
All
Tracks
Artists
Albums
Playlists
Podcasts
```

Edge cases:

```txt
Query quá ngắn
Không có kết quả
Track removed không hiện
Playlist private không hiện
```

---

## 8.3. Library Page

Route:

```http
GET /app/library
```

Controller lấy:

```txt
userPlaylists
likedTracks
savedAlbums
followedArtists
followedPlaylists
subscribedShows
```

UI:

```txt
Tabs hoặc section list:
- Playlists
- Liked Songs
- Albums
- Artists
- Podcasts
```

Empty states:

```txt
Chưa có playlist → CTA tạo playlist
Chưa like bài nào → CTA đi tìm kiếm
Chưa follow artist → CTA khám phá artist
```

---

## 8.4. Playlist Detail Page

Route:

```http
GET /app/playlists/:playlistId
```

Controller lấy:

```txt
playlist
tracks
isOwner
isFollowed
```

UI:

```txt
PlaylistHeader
PlayButton
FollowButton
Edit/Delete nếu owner
TrackTable
AddTrackModal nếu owner
```

Dynamic actions:

```txt
Play track → fetch /api/v1/playback/start
Like track → fetch library API
Remove track → fetch playlist API hoặc form POST
Follow playlist → fetch follow API
```

Edge cases:

```txt
Playlist private không phải owner → 403/404
Playlist rỗng → empty state
Track removed → row disabled
```

---

## 8.5. Album Detail Page

Route:

```http
GET /app/albums/:albumId
```

Controller lấy:

```txt
album
artist
tracks trong album
isSavedAlbum
```

UI:

```txt
AlbumHero
SaveAlbumButton
TrackTable
ArtistLink
```

Edge cases:

```txt
Album không tồn tại → 404
Album chưa có track → empty state
Track hidden/removed không hiện hoặc disabled
```

---

## 8.6. Artist Detail Page

Route:

```http
GET /app/artists/:artistId
```

Controller lấy:

```txt
artist
popularTracks
albums
isFollowed
```

UI:

```txt
ArtistHero
FollowButton
PopularTracks
AlbumsSection
```

Dynamic actions:

```txt
Follow/unfollow artist
Play track
Like track
```

---

## 8.7. Podcast Show Detail Page

Route:

```http
GET /app/podcasts/:showId
```

Controller lấy:

```txt
show
publishedEpisodes
isSubscribed
```

UI:

```txt
PodcastHero
SubscribeButton
EpisodeList
```

Edge cases:

```txt
Show không có episode
Show removed/hidden
Episode scheduled chưa hiện
```

---

## 8.8. Episode Detail Page

Route:

```http
GET /app/episodes/:episodeId
```

Controller lấy:

```txt
episode
show
relatedEpisodes optional
```

UI:

```txt
EpisodeHeader
PlayButton
Description
ShowLink
RelatedEpisodes optional
```

Edge cases:

```txt
Episode chưa published → 404 hoặc 403
Episode removed → 404
Audio missing → play API báo lỗi
```

---

## 9. Global Player với EJS

## 9.1. Vấn đề cần hiểu

Vì EJS là multi-page app, khi click link chuyển route, browser reload toàn trang. Khi reload, audio trong `BottomPlayer` cũng bị reset.

Vì vậy đặc tả chọn:

```txt
Local MVP:
- Player hoạt động tốt trong cùng một page
- Khi chuyển trang, audio có thể dừng/reset
- Metadata track gần nhất có thể lưu localStorage để hiển thị lại
```

Optional Advanced:

```txt
App-shell AJAX partial navigation để player không reset
```

## 9.2. Bottom Player partial

`partials/bottom-player.ejs`:

```txt
CurrentTrackInfo
Play/Pause
ProgressBar
VolumeControl
Hidden audio element
```

## 9.3. Player JS

`public/js/player.js` chịu trách nhiệm:

```txt
Bắt click .js-play-entity
Gọi POST /api/v1/playback/start
Nhận playbackSessionId + audioUrl
Set audio.src
Gọi audio.play()
Update title/cover/progress
Định kỳ gửi progress
Khi ended gửi complete
```

EJS button mẫu:

```html
<button
  class="js-play-entity"
  data-entity-type="track"
  data-entity-id="<%= track.id %>"
  data-source-type="playlist"
  data-source-id="<%= playlist.id %>"
>
  Play
</button>
```

## 9.4. Playback states

| State | UI |
|---|---|
| Chưa có track | Player disabled |
| Đang load | Button spinner optional |
| Đang phát | Icon pause |
| Pause | Icon play |
| Lỗi media | Toast "Không thể phát nội dung này" |
| API 403/404 | Toast lỗi tương ứng |

---

## 10. Playlist UI

## 10.1. Create playlist

Có thể dùng modal hoặc page/form nhỏ.

Fields:

```txt
title
description
visibility
cover image optional
```

Submit:

```http
POST /app/playlists
```

Hoặc dynamic:

```http
POST /api/v1/playlists
```

## 10.2. Edit playlist

Chỉ owner thấy nút:

```txt
Edit
Delete
Add track
Remove track
```

Nếu backend trả 403, frontend hiển thị toast hoặc render error page.

---

## 11. Artist Dashboard Pages

## 11.1. Artist Select Page

Route:

```http
GET /artist/select
```

Controller lấy:

```txt
artists user đang là member
```

UI:

```txt
Artist cards
CTA tạo artist mới
```

Nếu user chưa có artist:

```txt
Hiển thị empty state + nút Create Artist
```

---

## 11.2. Create Artist Page

Route:

```http
GET /artist/new
POST /artist
```

Fields:

```txt
name
bio optional
avatar optional
banner optional
```

Sau khi tạo:

```txt
Backend tự thêm user hiện tại vào artist_team_members role OWNER
Redirect /artist/:artistId/overview
```

---

## 11.3. Artist Overview Page

Route:

```http
GET /artist/:artistId/overview
```

Controller lấy:

```txt
totalTracks
totalStreams
totalListeners
totalLikes
topTracks
recentEvents
```

Components:

```txt
stat-card.ejs
track-row.ejs
Chart.js canvas optional
```

---

## 11.4. Artist Profile Page

Route:

```http
GET  /artist/:artistId/profile
POST /artist/:artistId/profile
```

Fields:

```txt
name
bio
avatar
banner
social links optional
```

Permission UI:

```txt
VIEWER: form disabled
EDITOR/MANAGER/OWNER: được lưu
```

Backend vẫn phải kiểm tra role.

---

## 11.5. Artist Tracks Page

Route:

```http
GET /artist/:artistId/tracks
```

UI table columns:

```txt
Title
Status
Duration
Play Count
Created At
Actions
```

Actions:

```txt
Edit
Publish
Hide/Remove optional
```

---

## 11.6. Create/Edit Track Page

Routes:

```http
GET  /artist/:artistId/tracks/new
POST /artist/:artistId/tracks
GET  /artist/:artistId/tracks/:trackId/edit
POST /artist/:artistId/tracks/:trackId
POST /artist/:artistId/tracks/:trackId/publish
```

Form fields:

```txt
title
album optional
explicit checkbox
audio file
cover image optional
status action: save draft / publish
```

Upload:

```txt
Có thể dùng multipart form submit trực tiếp
Hoặc JS upload trước rồi lưu mediaId hidden input
```

Validation UI:

```txt
title bắt buộc
audio bắt buộc khi publish
file audio đúng định dạng
cover là image
```

---

## 11.7. Artist Analytics Page

Route:

```http
GET /artist/:artistId/analytics?from=&to=
```

Controller lấy:

```txt
summary metrics
topTracks
streamsByDate optional
```

Chart.js:

```html
<canvas id="streamsChart" data-chart='<%- JSON.stringify(streamsByDate) %>'></canvas>
```

Lưu ý: nếu dùng `<%- JSON.stringify(...) %>` cần đảm bảo dữ liệu không chứa HTML/user input nguy hiểm, hoặc encode an toàn.

Empty state:

```txt
Chưa có dữ liệu trong khoảng thời gian này.
```

---

## 11.8. Artist Team Page

Route:

```http
GET  /artist/:artistId/team
POST /artist/:artistId/team
```

UI:

```txt
Team table
Email input
Role select
Remove button
```

Local simplification:

```txt
Chỉ thêm user đã tồn tại bằng email
Không gửi email invite thật
```

---

## 12. Podcaster Dashboard Pages

## 12.1. Shows Page

Route:

```http
GET /podcaster/shows
```

Controller lấy:

```txt
shows user đang là member
```

UI:

```txt
ShowGrid
CreateShowButton
```

---

## 12.2. Create/Edit Show Page

Routes:

```http
GET  /podcaster/shows/new
POST /podcaster/shows
GET  /podcaster/shows/:showId/edit
POST /podcaster/shows/:showId
```

Fields:

```txt
title
description
category
language
explicit setting
cover image
```

Sau khi tạo show:

```txt
Backend tự thêm user hiện tại vào podcast_team_members role OWNER
```

---

## 12.3. Episode List Page

Route:

```http
GET /podcaster/shows/:showId/episodes
```

Columns:

```txt
Title
Status
Published At
Duration
Plays
Actions
```

Actions:

```txt
Edit
Publish
Schedule
Remove/Hide optional
```

---

## 12.4. Create/Edit Episode Page

Routes:

```http
GET  /podcaster/shows/:showId/episodes/new
POST /podcaster/shows/:showId/episodes
GET  /podcaster/episodes/:episodeId/edit
POST /podcaster/episodes/:episodeId
POST /podcaster/episodes/:episodeId/publish
POST /podcaster/episodes/:episodeId/schedule
```

Fields:

```txt
title
description
show notes optional
audio file
episode type
explicit checkbox
publish mode: draft / publish now / schedule
scheduled date
```

Validation UI:

```txt
title bắt buộc
audio bắt buộc khi publish
schedule date không hợp lệ thì báo lỗi
```

---

## 12.5. Podcast Analytics Page

Route:

```http
GET /podcaster/shows/:showId/analytics
```

Metrics:

```txt
total plays
unique listeners
followers/subscribers
top episodes
completion rate optional
```

Chart.js optional:

```txt
Episode plays by date
Top episodes bar chart
```

---

## 12.6. Podcast Team Page

Route:

```http
GET  /podcaster/shows/:showId/team
POST /podcaster/shows/:showId/team
```

UI tương tự Artist Team Page.

---

## 13. Admin Pages

## 13.1. Admin Dashboard

Route:

```http
GET /admin
```

Metrics:

```txt
total users
total tracks
total artists
total podcast shows
total episodes
```

## 13.2. Users Page

Routes:

```http
GET  /admin/users
POST /admin/users/:userId/status
POST /admin/users/:userId/plan
```

UI:

```txt
User table
Status select
Plan select
```

## 13.3. Tracks/Podcasts Admin

Routes:

```http
GET  /admin/tracks
POST /admin/tracks/:trackId/status
GET  /admin/podcasts
POST /admin/podcasts/:showId/status
POST /admin/episodes/:episodeId/status
```

---

## 14. Upload UI

### 14.1. Upload preview module

`upload-preview.js` xử lý:

```txt
Hiển thị tên file
Hiển thị size file
Preview ảnh cover/avatar/banner
Validate cơ bản trước khi submit
Disable submit nếu file quá lớn
```

### 14.2. Form upload kiểu EJS truyền thống

Ví dụ:

```html
<form method="POST" enctype="multipart/form-data" action="/artist/<%= artist.id %>/tracks">
  <input type="text" name="title" />
  <input type="file" name="audio" accept="audio/*" />
  <input type="file" name="cover" accept="image/*" />
  <button type="submit">Save</button>
</form>
```

### 14.3. Upload bằng fetch optional

Dùng khi muốn upload không reload page:

```txt
Tạo FormData
POST /api/v1/media/upload-audio
Nhận mediaId/publicUrl
Gán vào hidden input
```

---

## 15. Modal, toast, confirm dialog

Vì không dùng React, các UI interaction này nên viết bằng Vanilla JS.

### 15.1. Modal

```txt
Nút có data-modal-target
JS thêm/bỏ class hidden
Đóng bằng Esc hoặc click overlay optional
```

### 15.2. Toast

```txt
Dùng query param/flash message từ server sau redirect
Dùng JS toast cho API action dynamic
```

### 15.3. Confirm dialog

Dùng cho:

```txt
Xóa playlist
Remove track khỏi playlist
Remove member
Hide track/episode
```

---

## 16. Chart.js

### 16.1. Cách truyền data

Controller truyền `chartData` vào EJS.

EJS render:

```html
<script type="application/json" id="artistStreamsData">
  <%- JSON.stringify(streamsByDate) %>
</script>
<canvas id="artistStreamsChart"></canvas>
```

JS đọc:

```js
const el = document.getElementById('artistStreamsData');
const data = JSON.parse(el.textContent);
```

### 16.2. Dashboard không có data

Nếu data rỗng:

```txt
Không render chart trống khó hiểu
Hiển thị empty state: "Chưa có dữ liệu"
```

---

## 17. Permission handling trong EJS

Controller nên truyền quyền vào view:

```js
res.render('pages/artist/profile', {
  artist,
  artistRole,
  canEditProfile,
  canManageTeam
});
```

Trong EJS:

```ejs
<% if (canEditProfile) { %>
  <button type="submit">Save</button>
<% } %>
```

Nhưng backend route POST vẫn phải có middleware permission.

Không được chỉ dựa vào việc ẩn button.

---

## 18. Loading/Error/Empty states với EJS

Vì EJS render server-side, nhiều loading state không cần như SPA. Tuy nhiên vẫn cần:

### 18.1. Page error state

```txt
403 page
404 page
500 page
Form validation error
```

### 18.2. Empty state

```txt
Chưa có playlist
Chưa có liked songs
Artist chưa có track
Podcast show chưa có episode
Analytics chưa có dữ liệu
```

### 18.3. Dynamic action loading

Cho các nút dùng fetch:

```txt
Play
Like
Follow
Subscribe
Remove track
```

JS nên disable button tạm thời khi request đang chạy.

---

## 19. Responsive design

Ưu tiên desktop/laptop vì bài tập lớn thường demo trên máy tính.

### 19.1. Desktop MVP

```txt
Sidebar cố định
Main content scroll
Bottom player cố định
Dashboard table/chart đầy đủ
```

### 19.2. Mobile optional

```txt
Sidebar chuyển thành drawer
Bottom player compact
Table chuyển thành card list
```

---

## 20. Accessibility cơ bản

Nên có:

```txt
Button có text hoặc aria-label
Input có label
Form error liên kết với field
Modal có nút đóng rõ ràng
Không dùng màu làm tín hiệu duy nhất
Có focus ring cho input/button
Audio controls dùng được bằng keyboard cơ bản
```

---

## 21. Demo flow

### 21.1. User demo

```txt
Login user@example.com
Vào /app/home
Search bài hát
Play track
Like track
Tạo playlist
Thêm track vào playlist
Mở playlist và phát nhạc
Mở artist detail
Follow artist
Mở podcast show
Play episode
```

### 21.2. Artist demo

```txt
Login artist@example.com
Vào /artist/select
Chọn artist
Sửa artist profile
Upload track mới
Publish track
Mở /app/search để thấy track mới
Quay lại analytics xem streams
Thêm team member bằng email
```

### 21.3. Podcaster demo

```txt
Login podcaster@example.com
Vào /podcaster/shows
Tạo podcast show
Upload episode audio
Publish episode
Mở /app/podcasts/:showId
Play episode
Quay lại dashboard xem plays
```

### 21.4. Admin demo

```txt
Login admin@example.com
Vào /admin/users
Đổi plan user free/premium
Vào /admin/tracks
Ẩn một track
Vào /admin/podcasts
Ẩn một show hoặc episode
```

---

## 22. Những phần optional

Không nên cố làm nếu thời gian ít:

```txt
AJAX partial navigation giữ player không reset
Drag-drop reorder playlist nâng cao
Responsive mobile hoàn chỉnh
Music video
Lyrics sync
Friend activity realtime
Wrapped
Payment thật
Recommendation phức tạp
RSS XML nếu không yêu cầu
```

---

## 23. Thứ tự triển khai frontend EJS

### Phase 1 — Layout và auth

```txt
Setup EJS view engine
Setup TailwindCSS
Tạo layouts auth/user/artist/podcaster/admin
Login/register pages
Flash/error messages
User menu/logout
```

### Phase 2 — User App

```txt
Home page
Search page
Track card/row components
Bottom player partial
player.js
Library page
Playlist detail/create/edit
```

### Phase 3 — Artist Dashboard

```txt
Artist select/create
Artist overview
Profile form
Tracks table
Track upload form
Analytics page với Chart.js
Team page
```

### Phase 4 — Podcaster Dashboard

```txt
Shows page
Create/edit show
Episodes table
Episode upload form
Podcast analytics
Team page
```

### Phase 5 — Admin và polish

```txt
Admin pages
Empty/error states
Toast/modal/confirm
Upload preview
Seed demo path
UI cleanup
```

---

## 24. Acceptance Criteria frontend

Frontend được coi là đạt nếu:

```txt
Login/register/logout render bằng EJS hoạt động
Có layout riêng cho user/artist/podcaster/admin
Sidebar và topbar hiển thị đúng theo khu vực
Home hiển thị track/artist/playlist/podcast từ database
Search tìm được track/artist/album/playlist/podcast
Playlist detail hiển thị track và quyền owner
Player phát được track/episode bằng HTMLAudioElement
Like/follow/subscribe dùng fetch hoặc form đều hoạt động
Library hiển thị liked tracks/followed artists/subscribed shows
Artist dashboard upload/publish track được
Artist analytics hiển thị số liệu hoặc empty state
Podcaster dashboard tạo show/episode được
Episode audio upload và play được
Admin đổi plan/status được
Không page nào vỡ layout khi dữ liệu rỗng
Các action không đủ quyền không hiển thị nút và backend vẫn chặn khi gọi trực tiếp
```

---

## 25. Kết luận frontend

Với yêu cầu dùng EJS, frontend nên được thiết kế như một **server-rendered web app có JavaScript động vừa đủ**.

Trọng tâm là:

```txt
EJS layout rõ ràng
Partial/component tái sử dụng tốt
TailwindCSS nhất quán
Vanilla JS chỉ xử lý interaction cần thiết
HTMLAudioElement phát nhạc local
Chart.js hiển thị analytics
Form submit và fetch API phối hợp hợp lý
```

Không cần cố biến EJS thành React. Chỉ cần đảm bảo giao diện đủ tốt, luồng demo rõ, code chia partial/component sạch và backend kiểm tra quyền đầy đủ.
