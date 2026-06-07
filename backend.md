# Đặc tả Backend — Spotify Mô phỏng Localhost

> Stack đã chốt: **Node.js + Express.js + EJS + MySQL + Prisma + express-session + bcrypt + Multer**.

## 0. Phạm vi tài liệu

Tài liệu này mô tả phần backend/server cho website Spotify mô phỏng dùng trong **bài tập lớn môn học**, chạy trên **localhost**, không triển khai cloud production.

Hệ thống dùng một Express app duy nhất để:

```txt
Render trang EJS
Xử lý form submit
Cung cấp API JSON cho thao tác động
Quản lý session đăng nhập
Kết nối MySQL qua Prisma
Upload file local bằng Multer
Serve file tĩnh trong /public và /uploads
```

Hệ thống không cần xử lý các phần quá nặng như CDN, S3, payment thật, DRM, microservices, streaming bảo mật cấp production hoặc recommendation AI.

---

## 1. Stack kỹ thuật chính thức

| Lớp | Công nghệ |
|---|---|
| Runtime | Node.js |
| Web framework | Express.js |
| Template engine | EJS |
| Database | MySQL |
| ORM | Prisma |
| Auth | express-session + bcrypt |
| Upload | Multer |
| CSS | TailwindCSS |
| Client JS | Vanilla JavaScript modules |
| Chart | Chart.js |
| Audio | HTMLAudioElement |

### 1.1. Vì sao stack này phù hợp

```txt
Express + EJS phù hợp yêu cầu môn học
MySQL dễ cài local và dễ trình bày ERD
Prisma giúp schema, migration, seed data rõ ràng
express-session hợp với server-rendered EJS hơn JWT
Multer đủ dùng cho upload ảnh/audio local
Vanilla JS đủ xử lý player, modal, like, upload preview, chart
```

---

## 2. Bối cảnh hệ thống

Hệ thống có 3 nhóm người dùng:

| Nhóm | Khu vực | Mục tiêu |
|---|---|---|
| User | `/app` | Nghe nhạc, tìm kiếm, tạo playlist, like/follow, nghe podcast |
| Artist | `/artist` | Quản lý nghệ sĩ, track, album, analytics, team |
| Podcaster | `/podcaster` | Quản lý show, episode, upload, analytics, team |
| Admin | `/admin` | Quản trị user, track, podcast, plan, trạng thái nội dung |

Một tài khoản có thể vừa là user nghe nhạc, vừa là owner/editor của artist, vừa là member của podcast show. Vì vậy quyền thật không được quyết định bằng một field `role` duy nhất.

---

## 3. Kiến trúc tổng thể local

```txt
Browser
  ↓ HTTP request
Express Server
  ├── Page Routes      → render EJS
  ├── API Routes       → trả JSON cho fetch()
  ├── Controllers      → nhận request, validate, gọi service
  ├── Services         → xử lý nghiệp vụ
  ├── Prisma Client    → query MySQL
  ├── Middlewares      → auth, permission, upload, error handler
  ├── Views            → EJS layouts/pages/partials/components
  ├── Public           → CSS, JS, images tĩnh
  └── Uploads          → file user upload local
```

### 3.1. Mô hình chạy localhost

```txt
App URL:       http://localhost:3000
Page routes:   http://localhost:3000/app/home
API routes:    http://localhost:3000/api/v1/...
Uploads:       http://localhost:3000/uploads/...
Database:      MySQL local
```

---

## 4. Cấu trúc thư mục đề xuất

```txt
spotify-clone
├── prisma
│   ├── schema.prisma
│   ├── migrations
│   └── seed.js
│
├── src
│   ├── app.js
│   ├── server.js
│   │
│   ├── config
│   │   ├── env.js
│   │   ├── prisma.js
│   │   └── session.js
│   │
│   ├── routes
│   │   ├── page
│   │   │   ├── auth.page.routes.js
│   │   │   ├── user.page.routes.js
│   │   │   ├── artist.page.routes.js
│   │   │   ├── podcaster.page.routes.js
│   │   │   └── admin.page.routes.js
│   │   └── api
│   │       ├── auth.api.routes.js
│   │       ├── media.api.routes.js
│   │       ├── playback.api.routes.js
│   │       ├── playlist.api.routes.js
│   │       ├── library.api.routes.js
│   │       ├── artist.api.routes.js
│   │       ├── podcast.api.routes.js
│   │       └── admin.api.routes.js
│   │
│   ├── controllers
│   ├── services
│   ├── middlewares
│   │   ├── require-auth.js
│   │   ├── require-guest.js
│   │   ├── require-admin.js
│   │   ├── require-artist-role.js
│   │   ├── require-podcast-role.js
│   │   ├── attach-current-user.js
│   │   ├── upload.js
│   │   └── error-handler.js
│   │
│   ├── validators
│   ├── utils
│   ├── constants
│   └── jobs
│       └── publish-scheduled-episodes.js
│
├── views
│   ├── layouts
│   ├── partials
│   ├── components
│   └── pages
│
├── public
│   ├── css
│   ├── js
│   └── images
│
├── uploads
│   ├── images
│   ├── audio
│   └── video
│
├── package.json
├── tailwind.config.js
└── .env
```

---

## 5. Cấu hình môi trường

File `.env`:

```env
NODE_ENV=development
PORT=3000
DATABASE_URL="mysql://root:password@localhost:3306/spotify_clone"
SESSION_SECRET="replace-this-with-long-secret"
SESSION_NAME="spotify_clone_sid"
UPLOAD_DIR="uploads"
APP_BASE_URL="http://localhost:3000"
```

### 5.1. Nguyên tắc cấu hình

```txt
Không hardcode database password trong code
Không commit .env thật lên git
SESSION_SECRET phải đủ dài
UPLOAD_DIR phải nằm trong project, không dùng path tùy ý từ user input
```

---

## 6. Khởi tạo Express app

Express app cần cấu hình:

```txt
View engine: EJS
Static public: /public
Static uploads: /uploads
Body parser: express.urlencoded + express.json
Session: express-session
Current user middleware: res.locals.currentUser
Flash/toast message optional
Routes: page routes + API routes
Global error handler
```

Ví dụ luồng request page:

```txt
GET /app/home
→ attachCurrentUser
→ requireAuth
→ controller lấy tracks/artists/playlists
→ res.render('pages/user/home', { tracks, artists, playlists })
```

Ví dụ luồng request API:

```txt
POST /api/v1/playback/start
→ attachCurrentUser
→ requireAuth
→ validate body
→ playbackService.start()
→ res.json({ success: true, data })
```

---

## 7. Prisma + MySQL

### 7.1. Lệnh cần dùng

```bash
npm install @prisma/client
npm install -D prisma
npx prisma init
npx prisma migrate dev --name init
npx prisma db seed
npx prisma studio
```

### 7.2. Quy ước Prisma

```txt
Model dùng PascalCase: User, Track, Playlist
Field dùng camelCase: displayName, createdAt
Table map sang snake_case nếu cần: @@map("users")
ID dùng String UUID hoặc Int auto increment đều được
Với bài tập, dùng String UUID giúp dễ seed/mock
```

---

## 8. Database schema tổng quan

### 8.1. User và auth

```txt
users
├── id
├── email unique
├── password_hash
├── display_name
├── avatar_url
├── default_role
├── plan
├── status
├── created_at
├── updated_at
└── deleted_at
```

`default_role` chỉ dùng để chọn landing page mặc định sau login, ví dụ redirect về `/app/home`, `/artist/select` hoặc `/podcaster/shows`. Không dùng `default_role` để quyết định quyền quản lý resource.

Quyền thật dựa vào:

```txt
Global admin flag/role
artist_team_members
podcast_team_members
owner_user_id của playlist/show nếu có
```

### 8.2. Media

```txt
media_assets
├── id
├── owner_user_id
├── type
├── original_filename
├── filename
├── mime_type
├── size_bytes
├── local_path
├── public_url
├── duration_ms
├── status
├── created_at
└── deleted_at
```

`type`:

```txt
avatar_image
cover_image
banner_image
track_audio
podcast_audio
podcast_video
```

### 8.3. Artist, album, track

```txt
artists
├── id
├── name
├── slug
├── bio
├── avatar_url
├── banner_url
├── is_verified
├── status
├── created_at
└── updated_at
```

```txt
artist_team_members
├── id
├── artist_id
├── user_id
├── role
├── status
├── created_at
└── updated_at
```

```txt
albums
├── id
├── title
├── artist_id
├── cover_url
├── album_type
├── release_date
├── status
├── created_at
└── updated_at
```

```txt
tracks
├── id
├── title
├── artist_id
├── album_id nullable
├── audio_media_id
├── cover_url
├── duration_ms
├── is_explicit
├── status
├── play_count_cache
├── created_at
└── updated_at
```

`track.status`:

```txt
draft
published
hidden
removed
```

### 8.4. Playlist và library

```txt
playlists
├── id
├── owner_user_id
├── title
├── description
├── cover_url
├── visibility
├── created_at
├── updated_at
└── deleted_at
```

```txt
playlist_tracks
├── id
├── playlist_id
├── track_id
├── added_by
├── position
└── added_at
```

```txt
liked_tracks
├── user_id
├── track_id
└── created_at
```

```txt
saved_albums
├── user_id
├── album_id
└── created_at
```

```txt
followed_artists
├── user_id
├── artist_id
└── created_at
```

```txt
followed_playlists
├── user_id
├── playlist_id
└── created_at
```

### 8.5. Podcast

```txt
podcast_shows
├── id
├── owner_user_id
├── title
├── slug
├── description
├── cover_url
├── category
├── language
├── explicit_setting
├── status
├── created_at
└── updated_at
```

```txt
podcast_team_members
├── id
├── show_id
├── user_id
├── role
├── status
├── created_at
└── updated_at
```

```txt
podcast_episodes
├── id
├── show_id
├── title
├── description
├── audio_media_id
├── duration_ms
├── episode_type
├── explicit
├── status
├── scheduled_at
├── published_at
├── created_by
├── created_at
└── updated_at
```

```txt
subscribed_shows
├── user_id
├── show_id
└── created_at
```

### 8.6. Playback và analytics

```txt
playback_events
├── id
├── playback_session_id
├── user_id
├── entity_type
├── entity_id
├── artist_id nullable
├── show_id nullable
├── event_type
├── duration_played_ms
├── source_type
├── created_at
```

`entity_type`:

```txt
track
episode
```

`event_type`:

```txt
track_started
track_progress
track_completed
episode_started
episode_progress
episode_completed
track_liked
artist_followed
show_subscribed
```

### 8.7. Notifications

```txt
notifications
├── id
├── user_id
├── type
├── title
├── message
├── entity_type
├── entity_id
├── read_at
└── created_at
```

---

## 9. Prisma schema định hướng

Đây không phải schema đầy đủ 100%, nhưng là khung nên bám theo.

```prisma
model User {
  id           String    @id @default(uuid())
  email        String    @unique
  passwordHash String    @map("password_hash")
  displayName  String    @map("display_name")
  avatarUrl    String?   @map("avatar_url")
  defaultRole  String    @default("user") @map("default_role")
  plan         String    @default("free")
  status       String    @default("active")
  createdAt    DateTime  @default(now()) @map("created_at")
  updatedAt    DateTime  @updatedAt @map("updated_at")
  deletedAt    DateTime? @map("deleted_at")

  playlists    Playlist[]
  likedTracks  LikedTrack[]
  artistTeams  ArtistTeamMember[]
  podcastTeams PodcastTeamMember[]

  @@map("users")
}

model Artist {
  id         String   @id @default(uuid())
  name       String
  slug       String   @unique
  bio        String?  @db.Text
  avatarUrl  String?  @map("avatar_url")
  bannerUrl  String?  @map("banner_url")
  isVerified Boolean  @default(false) @map("is_verified")
  status     String   @default("active")
  createdAt  DateTime @default(now()) @map("created_at")
  updatedAt  DateTime @updatedAt @map("updated_at")

  tracks     Track[]
  albums     Album[]
  members    ArtistTeamMember[]

  @@map("artists")
}

model Track {
  id             String   @id @default(uuid())
  title          String
  artistId       String   @map("artist_id")
  albumId        String?  @map("album_id")
  audioMediaId   String?  @map("audio_media_id")
  coverUrl       String?  @map("cover_url")
  durationMs     Int?     @map("duration_ms")
  isExplicit     Boolean  @default(false) @map("is_explicit")
  status         String   @default("draft")
  playCountCache Int      @default(0) @map("play_count_cache")
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")

  artist         Artist   @relation(fields: [artistId], references: [id])
  album          Album?   @relation(fields: [albumId], references: [id])
  playlistItems  PlaylistTrack[]
  likedBy        LikedTrack[]

  @@map("tracks")
}
```

---

## 10. Auth Module

### 10.1. Auth dùng express-session

Hệ thống dùng session cookie thay vì JWT.

Khi login thành công:

```txt
req.session.userId = user.id
```

Mỗi request sau đó:

```txt
attachCurrentUser middleware đọc req.session.userId
→ query User
→ gán req.currentUser và res.locals.currentUser
```

### 10.2. Page routes

```http
GET  /login
POST /login
GET  /register
POST /register
POST /logout
```

### 10.3. API optional

```http
GET /api/v1/auth/me
```

### 10.4. Register flow

```txt
1. Nhận email, password, displayName từ form EJS
2. Validate email format
3. Normalize email về lowercase
4. Kiểm tra email đã tồn tại chưa
5. Hash password bằng bcrypt
6. Tạo user plan = free, status = active
7. Tạo session đăng nhập hoặc redirect login
8. Redirect về /app/home
```

### 10.5. Login flow

```txt
1. Nhận email/password
2. Tìm user theo email
3. Nếu không tồn tại, báo lỗi chung INVALID_CREDENTIALS
4. So sánh password bằng bcrypt.compare
5. Nếu đúng, lưu userId vào session
6. Redirect theo default_role hoặc về /app/home
```

### 10.6. Edge cases

| Tình huống | Xử lý |
|---|---|
| Email trùng khi register | Hiển thị lỗi dưới form |
| Password yếu | Không tạo user |
| Sai email/password | Không nói email có tồn tại hay không |
| User bị khóa | Không cho login |
| Đã login vào /login | Redirect về /app/home |
| Chưa login vào protected route | Redirect về /login |

---

## 11. Middleware phân quyền

### 11.1. `requireAuth`

Dùng cho mọi route cần đăng nhập.

```txt
Nếu req.currentUser tồn tại → next()
Nếu không → redirect /login hoặc trả 401 với API
```

### 11.2. `requireGuest`

Dùng cho `/login`, `/register`.

```txt
Nếu đã login → redirect /app/home
Nếu chưa → next()
```

### 11.3. `requireAdmin`

```txt
Kiểm tra user.defaultRole === 'admin' hoặc bảng global roles nếu có
```

### 11.4. `requireArtistRole(roles)`

```txt
Nhận artistId từ params
Kiểm tra artist_team_members có user hiện tại không
Kiểm tra role thuộc danh sách được phép
```

### 11.5. `requirePodcastRole(roles)`

```txt
Nhận showId từ params
Kiểm tra podcast_team_members có user hiện tại không
Kiểm tra role thuộc danh sách được phép
```

---

## 12. Page route architecture

Vì dùng EJS, route page do Express render trực tiếp.

### 12.1. Public routes

```http
GET /
GET /login
POST /login
GET /register
POST /register
POST /logout
```

### 12.2. User App routes

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
```

### 12.3. Artist Dashboard routes

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
GET  /artist/:artistId/analytics
GET  /artist/:artistId/team
POST /artist/:artistId/team
```

### 12.4. Podcaster Dashboard routes

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

### 12.5. Admin routes

```http
GET  /admin
GET  /admin/users
POST /admin/users/:userId/status
POST /admin/users/:userId/plan
GET  /admin/tracks
POST /admin/tracks/:trackId/status
GET  /admin/podcasts
POST /admin/podcasts/:showId/status
POST /admin/episodes/:episodeId/status
```

---

## 13. API JSON routes

Dù dùng EJS, vẫn nên có API JSON cho các thao tác động bằng `fetch()`.

### 13.1. Playback API

```http
POST /api/v1/playback/start
POST /api/v1/playback/progress
POST /api/v1/playback/complete
GET  /api/v1/playback/recently-played
```

### 13.2. Playlist API

```http
POST   /api/v1/playlists
PATCH  /api/v1/playlists/:playlistId
DELETE /api/v1/playlists/:playlistId
POST   /api/v1/playlists/:playlistId/tracks
DELETE /api/v1/playlists/:playlistId/tracks/:playlistTrackId
PATCH  /api/v1/playlists/:playlistId/tracks/reorder
POST   /api/v1/playlists/:playlistId/follow
DELETE /api/v1/playlists/:playlistId/follow
```

### 13.3. Library API

```http
POST   /api/v1/me/library/tracks/:trackId
DELETE /api/v1/me/library/tracks/:trackId
POST   /api/v1/me/library/albums/:albumId
DELETE /api/v1/me/library/albums/:albumId
POST   /api/v1/me/follow/artists/:artistId
DELETE /api/v1/me/follow/artists/:artistId
POST   /api/v1/me/subscribe/shows/:showId
DELETE /api/v1/me/subscribe/shows/:showId
```

### 13.4. Media API

```http
POST /api/v1/media/upload-image
POST /api/v1/media/upload-audio
POST /api/v1/media/upload-video
GET  /api/v1/media/:mediaId
DELETE /api/v1/media/:mediaId
```

### 13.5. Search API optional

Search có thể render bằng EJS page, nhưng API JSON hữu ích cho search debounce.

```http
GET /api/v1/search?q=love
GET /api/v1/search?q=love&type=track
GET /api/v1/search?q=love&type=artist
GET /api/v1/search?q=love&type=album
GET /api/v1/search?q=love&type=playlist
GET /api/v1/search?q=love&type=podcast
```

---

## 14. Response JSON chuẩn

### 14.1. Success

```json
{
  "success": true,
  "data": {},
  "meta": {
    "timestamp": "2026-06-07T10:00:00.000Z"
  }
}
```

### 14.2. Error

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dữ liệu không hợp lệ.",
    "details": {}
  }
}
```

### 14.3. Page error

Với page routes, lỗi nên render page hoặc redirect kèm message:

```txt
401 → redirect /login
403 → render pages/error/403.ejs
404 → render pages/error/404.ejs
500 → render pages/error/500.ejs
```

---

## 15. Media Upload Module

### 15.1. Cấu trúc thư mục upload

```txt
uploads
├── images
│   ├── avatars
│   ├── covers
│   └── banners
├── audio
│   ├── tracks
│   └── episodes
└── video
    ├── music-videos
    └── podcast-videos
```

### 15.2. Serve static file

```js
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
```

### 15.3. Multer rule

| Loại | Format | Max size đề xuất |
|---|---|---:|
| Avatar | JPG, PNG, WebP | 5MB |
| Cover/banner | JPG, PNG, WebP | 10MB |
| Track audio | MP3, WAV, OGG | 100MB |
| Podcast audio | MP3, WAV, OGG | 300MB |
| Video optional | MP4, WebM | 500MB |

### 15.4. Upload flow

```txt
1. User chọn file ở form EJS
2. Form submit hoặc JS gửi FormData đến API upload
3. Multer validate size + mime type
4. Backend đổi filename bằng UUID
5. Lưu file vào /uploads
6. Tạo media_assets record
7. Trả publicUrl hoặc redirect về form với mediaId hidden input
```

### 15.5. Edge cases

| Tình huống | Xử lý |
|---|---|
| File quá lớn | 413 FILE_TOO_LARGE |
| Sai định dạng | 422 INVALID_MEDIA_TYPE |
| Upload thành công nhưng DB lỗi | Xóa file vật lý nếu có thể |
| File trùng tên | Dùng UUID để tránh trùng |
| Media đang được dùng | Không xóa cứng, hoặc kiểm tra reference |
| File mất khỏi ổ đĩa | MEDIA_FILE_NOT_FOUND khi play |

---

## 16. User Module

### 16.1. Page routes

```http
GET /app/profile
POST /app/profile
GET /app/library
GET /app/liked-songs
```

### 16.2. API hỗ trợ

```http
GET /api/v1/auth/me
```

### 16.3. Profile validation

```txt
displayName không rỗng
avatar phải là image
không cho user tự sửa plan
không trả password_hash ra view hoặc JSON
```

---

## 17. Artist Module

### 17.1. Tạo artist

Khi user tạo artist:

```txt
1. Validate name
2. Tạo artist record
3. Tạo artist_team_members với user hiện tại, role = OWNER
4. Redirect về /artist/:artistId/overview
```

Nếu thiếu bước 3, user tạo xong artist nhưng không có quyền quản lý artist đó.

### 17.2. Artist roles

```txt
OWNER
MANAGER
EDITOR
VIEWER
```

| Role | Quyền |
|---|---|
| OWNER | Toàn quyền, quản lý team |
| MANAGER | Sửa profile, quản lý track, xem analytics |
| EDITOR | Sửa profile, upload/publish track |
| VIEWER | Chỉ xem dashboard/analytics |

### 17.3. Artist page routes

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
GET  /artist/:artistId/analytics
GET  /artist/:artistId/team
POST /artist/:artistId/team
```

### 17.4. Public artist routes

```http
GET /app/artists/:artistId
```

Data cần render:

```txt
artist profile
popular tracks
albums
follow state của current user
```

---

## 18. Track và Album Module

### 18.1. Upload track flow

```txt
1. Artist member vào /artist/:artistId/tracks/new
2. Nhập title, explicit, album optional
3. Upload audio bằng Multer
4. Backend tạo media_assets
5. Backend tạo track status = draft hoặc published
6. Nếu published, track xuất hiện ở user app/search
```

### 18.2. Publish track validation

```txt
User phải là OWNER/MANAGER/EDITOR của artist
Track phải thuộc artist
Track phải có audio_media_id
Media phải là track_audio
Status không phải removed
Title không rỗng
```

### 18.3. Album routes

Page public:

```http
GET /app/albums/:albumId
```

Artist dashboard:

```http
GET  /artist/:artistId/albums
GET  /artist/:artistId/albums/new
POST /artist/:artistId/albums
GET  /artist/:artistId/albums/:albumId/edit
POST /artist/:artistId/albums/:albumId
```

Nếu thời gian ít, album có thể là optional: chỉ dùng để nhóm track, không cần CRUD đầy đủ.

### 18.4. Edge cases

| Tình huống | Xử lý |
|---|---|
| Track chưa có audio | Không cho publish |
| User không thuộc artist | 403 |
| Track removed | Không cho play |
| Track hidden | Không hiện search |
| Album không có track | Vẫn render page với empty state |
| Audio file mất | MEDIA_FILE_NOT_FOUND |

---

## 19. Playlist Module

### 19.1. Page routes

```http
GET  /app/playlists/:playlistId
POST /app/playlists
POST /app/playlists/:playlistId/edit
POST /app/playlists/:playlistId/delete
```

### 19.2. API dynamic routes

```http
POST   /api/v1/playlists/:playlistId/tracks
DELETE /api/v1/playlists/:playlistId/tracks/:playlistTrackId
PATCH  /api/v1/playlists/:playlistId/tracks/reorder
POST   /api/v1/playlists/:playlistId/follow
DELETE /api/v1/playlists/:playlistId/follow
```

### 19.3. Rules

```txt
owner_user_id lấy từ session, không lấy từ body
chỉ owner được sửa/xóa playlist
playlist private chỉ owner xem
track thêm vào phải published
nên chặn thêm trùng track cho đơn giản
```

---

## 20. Library Module

### 20.1. Page route

```http
GET /app/library
GET /app/liked-songs
```

### 20.2. Data cần render `/app/library`

```txt
playlists của user
liked tracks
saved albums
followed artists
followed playlists
subscribed shows
```

### 20.3. API actions

```http
POST   /api/v1/me/library/tracks/:trackId
DELETE /api/v1/me/library/tracks/:trackId
POST   /api/v1/me/follow/artists/:artistId
DELETE /api/v1/me/follow/artists/:artistId
POST   /api/v1/me/subscribe/shows/:showId
DELETE /api/v1/me/subscribe/shows/:showId
```

Các action like/follow/subscribe nên idempotent.

---

## 21. Playback Module

### 21.1. Mục tiêu

Với localhost, playback không cần signed URL. Backend chỉ kiểm tra quyền và trả `audioUrl` local.

### 21.2. Start playback API

```http
POST /api/v1/playback/start
```

Request:

```json
{
  "entityType": "track",
  "entityId": "track_123",
  "sourceType": "playlist",
  "sourceId": "playlist_456"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "playbackSessionId": "pb_123",
    "entityType": "track",
    "entityId": "track_123",
    "title": "Song A",
    "subtitle": "Artist A",
    "audioUrl": "http://localhost:3000/uploads/audio/tracks/song-a.mp3",
    "durationMs": 210000,
    "coverUrl": "http://localhost:3000/uploads/images/covers/song-a.jpg"
  }
}
```

### 21.3. Progress/complete API

```http
POST /api/v1/playback/progress
POST /api/v1/playback/complete
```

Request:

```json
{
  "playbackSessionId": "pb_123",
  "durationPlayedMs": 45000,
  "positionMs": 45000
}
```

### 21.4. Stream hợp lệ cho analytics

Không count `track_started` là stream chính vì dễ double count.

Định nghĩa local:

```txt
Một stream hợp lệ =
- track_completed
hoặc
- track_progress có duration_played_ms >= 30000
```

Episode play hợp lệ tương tự:

```txt
episode_completed
hoặc episode_progress có duration_played_ms >= 30000
```

### 21.5. Edge cases

| Tình huống | Xử lý |
|---|---|
| Track không tồn tại | 404 |
| Track chưa published | 403 |
| Episode scheduled chưa public | 403 |
| Audio file mất | 500 hoặc 404 media |
| Complete gửi nhiều lần | Dedupe theo playbackSessionId |
| User logout | Không cho ghi progress tiếp |

---

## 22. Search Module

### 22.1. Page route

```http
GET /app/search?q=&type=
```

### 22.2. API route optional

```http
GET /api/v1/search?q=&type=
```

### 22.3. Type hỗ trợ

```txt
all
track
artist
album
playlist
podcast
```

### 22.4. MySQL query local

Dùng `LIKE`:

```sql
SELECT * FROM tracks
WHERE status = 'published'
AND LOWER(title) LIKE LOWER(CONCAT('%', ?, '%'));
```

Nếu query rỗng, render browse/trending hoặc hướng dẫn tìm kiếm.

---

## 23. Podcast Module

### 23.1. Tạo show

Khi user tạo podcast show:

```txt
1. Validate title/category/language
2. Tạo podcast_shows
3. Tạo podcast_team_members với user hiện tại, role = OWNER
4. Redirect về /podcaster/shows/:showId
```

### 23.2. Show page routes

```http
GET  /podcaster/shows
GET  /podcaster/shows/new
POST /podcaster/shows
GET  /podcaster/shows/:showId
GET  /podcaster/shows/:showId/edit
POST /podcaster/shows/:showId
GET  /app/podcasts/:showId
```

### 23.3. Episode routes

```http
GET  /podcaster/shows/:showId/episodes
GET  /podcaster/shows/:showId/episodes/new
POST /podcaster/shows/:showId/episodes
GET  /podcaster/episodes/:episodeId/edit
POST /podcaster/episodes/:episodeId
POST /podcaster/episodes/:episodeId/publish
POST /podcaster/episodes/:episodeId/schedule
GET  /app/episodes/:episodeId
```

### 23.4. Public podcast API optional

```http
GET /api/v1/podcasts/shows
GET /api/v1/podcasts/shows/:showId
GET /api/v1/podcasts/shows/:showId/episodes
GET /api/v1/podcasts/episodes/:episodeId
```

### 23.5. Scheduled episode local

Không nên mutate dữ liệu trong GET route. Dùng job đơn giản:

```txt
setInterval mỗi 60 giây
→ tìm episode status = scheduled và scheduled_at <= now
→ đổi status = published
→ set published_at = now
```

---

## 24. Analytics Basic Module

### 24.1. Artist metrics

```txt
Total streams: count stream hợp lệ của track thuộc artist
Total listeners: count distinct user_id có stream hợp lệ
Total likes: count liked_tracks của track thuộc artist
Top tracks: group by track_id order by streams desc
```

### 24.2. Podcast metrics

```txt
Total plays: count play hợp lệ của episode thuộc show
Unique listeners: count distinct user_id
Top episodes: group by episode_id
Completion rate: completed / started nếu có đủ data
```

### 24.3. Analytics routes

```http
GET /artist/:artistId/analytics
GET /podcaster/shows/:showId/analytics
```

API optional cho chart:

```http
GET /api/v1/artists/:artistId/analytics/overview
GET /api/v1/artists/:artistId/analytics/tracks
GET /api/v1/podcaster/shows/:showId/analytics/overview
GET /api/v1/podcaster/episodes/:episodeId/analytics
```

### 24.4. Không có dữ liệu

Không trả lỗi. Trả số 0 và mảng rỗng:

```json
{
  "streams": 0,
  "listeners": 0,
  "topTracks": []
}
```

---

## 25. Premium mock

Không tích hợp thanh toán thật. Dùng field:

```txt
users.plan = free | premium
```

Admin có thể đổi plan:

```http
POST /admin/users/:userId/plan
```

Rule mock:

| Tính năng | Free | Premium |
|---|---:|---:|
| Nghe nhạc | Có | Có |
| Tạo playlist | Có | Có |
| Skip limit | Optional | Không giới hạn |
| Download offline | Không làm thật | Chỉ hiển thị mock UI |
| Lossless | Không làm thật | Chỉ hiển thị mock UI |

---

## 26. Notification Module

### 26.1. Local MVP

```txt
Không gửi email/push thật
Lưu notification vào DB
Hiển thị trên top bar hoặc notification page
```

### 26.2. Routes

```http
GET  /notifications
POST /api/v1/notifications/:notificationId/read
POST /api/v1/notifications/read-all
```

### 26.3. Trigger mẫu

```txt
Artist publish track → tạo notification cho followers
Podcaster publish episode → tạo notification cho subscribers
Team member được thêm → tạo notification cho user đó
```

---

## 27. Admin Module

### 27.1. Chức năng local

```txt
Xem danh sách users
Đổi status user
Đổi plan user
Ẩn/hiện track
Ẩn/hiện podcast show
Ẩn/hiện episode
Xem reports optional
```

### 27.2. Routes

```http
GET  /admin/users
POST /admin/users/:userId/status
POST /admin/users/:userId/plan
GET  /admin/tracks
POST /admin/tracks/:trackId/status
GET  /admin/podcasts
POST /admin/podcasts/:showId/status
POST /admin/episodes/:episodeId/status
```

---

## 28. Validation và security local

### 28.1. Validation bắt buộc

```txt
Không nhận owner_user_id từ form nếu lấy được từ session
Không tin role gửi từ frontend
Không trả password_hash ra view/API
Không cho upload file ngoài định dạng cho phép
Không dùng raw SQL nối chuỗi input trực tiếp
Không cho path traversal khi đọc file
Không cho user sửa resource không thuộc quyền
```

### 28.2. Security tối thiểu

```txt
bcrypt hash password
express-session secret trong .env
cookie httpOnly
validate input server-side
CORS nếu có API gọi từ origin khác
rate limit nhẹ cho login/upload nếu có thời gian
sanitize HTML user nhập nếu render lại trong EJS
```

### 28.3. XSS với EJS

Dùng `<%= value %>` cho text thông thường để EJS escape HTML.

Không dùng `<%- value %>` cho dữ liệu user nhập trừ khi đã sanitize.

---

## 29. Error codes

```txt
AUTH_REQUIRED
INVALID_CREDENTIALS
ACCOUNT_DISABLED
PERMISSION_DENIED
RESOURCE_NOT_FOUND
VALIDATION_ERROR
EMAIL_ALREADY_EXISTS
FILE_TOO_LARGE
INVALID_MEDIA_TYPE
MEDIA_FILE_NOT_FOUND
TRACK_NOT_FOUND
TRACK_UNAVAILABLE
PLAYLIST_NOT_FOUND
PLAYLIST_PRIVATE
NOT_PLAYLIST_OWNER
ARTIST_NOT_FOUND
NOT_ARTIST_MEMBER
SHOW_NOT_FOUND
EPISODE_NOT_FOUND
EPISODE_NOT_READY
MEMBER_ALREADY_EXISTS
USER_NOT_FOUND
```

---

## 30. Seed data

Cần seed để demo nhanh.

### 30.1. Accounts

```txt
admin@example.com / 123456
user@example.com / 123456
artist@example.com / 123456
podcaster@example.com / 123456
```

### 30.2. Dữ liệu mẫu

```txt
5 artists
3 albums
20 tracks có audio local
5 playlists
2 podcast shows
6 podcast episodes
playback_events mẫu
liked_tracks mẫu
followed_artists mẫu
subscribed_shows mẫu
```

### 30.3. Lưu ý seed media

Các track/episode seed cần trỏ tới file thật trong `/uploads/audio/...` hoặc dùng file audio sample ngắn để tránh lỗi playback khi demo.

---

## 31. Thứ tự triển khai backend

### Phase 1 — Nền tảng

```txt
Setup Express + EJS
Setup Prisma + MySQL
Setup Tailwind build
Setup express-session
Register/login/logout
attachCurrentUser middleware
Error pages 403/404/500
```

### Phase 2 — User App core

```txt
Tracks public page/data
Artists public page/data
Search page
Playback start/progress/complete
Liked tracks
Playlist CRUD
```

### Phase 3 — Artist Dashboard

```txt
Create artist + auto owner
Artist select
Edit profile
Upload track
Publish track
Artist analytics
Artist team basic
```

### Phase 4 — Podcaster Dashboard

```txt
Create show + auto owner
Upload episode audio
Publish/schedule episode
Public podcast page
Episode playback
Podcast analytics
```

### Phase 5 — Hoàn thiện demo

```txt
Admin pages
Notifications
Seed data
Validation đầy đủ
Chart data endpoints nếu cần
UI polish
```

---

## 32. Out of scope

Không ưu tiên trong bài local:

```txt
Cloud deployment
S3/CDN
Payment thật
Webhook payment
DRM
Offline download thật
Recommendation AI
Editorial pitch thật
Campaign Kit thật
Music video transcoding
Microservices
Distributed queue
Bot detection nâng cao
```

---

## 33. Acceptance Criteria backend

Backend được coi là đạt nếu:

```txt
Register/login/logout bằng session chạy ổn
Mật khẩu được hash bằng bcrypt
Render được các trang EJS chính
Upload ảnh/audio local bằng Multer được
File upload được serve qua /uploads
Prisma migrate và seed chạy được
User nghe được track qua /api/v1/playback/start
Playback trả playbackSessionId và audioUrl
Progress/complete ghi playback_events
Playlist CRUD được
Like/unlike track được
Follow/unfollow artist được
Artist tạo xong tự có OWNER member
Artist upload/publish track được
Podcaster tạo show xong tự có OWNER member
Podcaster upload/publish/schedule episode được
Analytics không có data thì trả 0, không lỗi
Search tìm được track/artist/album/playlist/podcast bằng MySQL LIKE
Admin đổi plan/status được
Không endpoint quan trọng nào tin ownerId/role gửi từ client
```

---

## 34. Kết luận backend

Backend theo stack **Express + EJS + MySQL + Prisma** nên được hiểu là một server-rendered web app có API động phụ trợ.

Trọng tâm không phải mô phỏng production Spotify, mà là:

```txt
Có kiến trúc rõ ràng
Có database quan hệ tốt
Có phân quyền đúng
Có upload/playback local hoạt động
Có dashboard artist/podcaster
Có analytics cơ bản
Có seed data demo
Có EJS views đúng yêu cầu môn học
```
