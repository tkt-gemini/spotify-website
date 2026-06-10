# Final Spec Audit Report (Sau Phase 8)

Tài liệu này đối chiếu toàn bộ codebase hiện tại với `backend.md` và `frontend.md` sau khi đã hoàn thành các Phase 1–8.

## 1. Tổng quan hoàn thiện

* **Ước lượng Backend**: ~98%
* **Ước lượng Frontend**: ~95%
* **Đánh giá**:
  * **Có đủ để demo/nộp không?**: Hoàn toàn đủ. Các luồng tính năng chính từ đăng nhập, quản lý thư viện, quản trị cho đến upload audio, ảnh và phát nhạc đều hoạt động rất trơn tru.
  * **Có còn thiếu Must-Fix không?**: Không còn Must-Fix critical.
  * **Có còn thiếu Should-Fix không?**: Còn một số chức năng nhỏ (Should-Fix) liên quan đến quản lý Profile (banner/avatar) cho Artist, Team management.
  * **Có còn thiếu Optional không?**: Còn nhiều phần tuỳ chọn (AJAX player xuyên suốt các page, event tracking real-time tiến trình phát nhạc) không cần thiết cho phạm vi bài tập EJS local.

---

## 2. Ký hiệu sử dụng
* ✅ Đã có và hoạt động đúng spec
* ⚠️ Có nhưng thiếu/khác spec
* ❌ Chưa có
* 🔘 Optional/out-of-scope hoặc không cần thiết cho demo

---

## 3. Audit theo từng nhóm

### A. Project structure
* ✅ Layouts
* ✅ Partials
* ✅ Components
* ✅ Public assets
* ✅ Upload folders (`/uploads/images`, `/uploads/audio`)
* ✅ Vendor scripts (đã load Chart.js)

### B. Backend schema
* ✅ User
* ✅ Artist
* ✅ ArtistTeamMember
* ✅ Album
* ✅ Track
* ✅ Playlist
* ✅ PlaylistTrack
* ✅ LikedTrack
* ✅ FollowedArtist
* ✅ FollowedPlaylist
* ✅ SavedAlbum
* ✅ PodcastShow
* ✅ PodcastEpisode
* ✅ PodcastTeamMember
* ✅ SubscribedShow
* ✅ MediaAsset
* ✅ PlaybackEvent
* ✅ Notification (có schema, chưa implement logic sâu do out-of-scope)
* ✅ Enums (`Role`, `Plan`, `UserStatus`, `ContentStatus`, `TeamRole`, `PlaybackEventType`, `MediaType`)

### C. Auth/session/security
* ✅ Register
* ✅ Login
* ✅ Logout
* ✅ bcrypt password hashing
* ✅ express-session
* ✅ requireAuth
* ✅ requireGuest
* ✅ requireAdmin
* ✅ disabled user handling (tài khoản disabled không thể login/duy trì session)
* ✅ last active admin guard (không thể tự vô hiệu hoá bản thân nếu là admin duy nhất)
* ✅ role/team permission checks (Artist & Podcast theo `['OWNER', 'MANAGER', ...]`)
* ✅ Không tin ownerId/role từ client (Lấy từ session/DB)

### D. User App pages
* ✅ `GET /app/home`
* ✅ `GET /app/search`
* ✅ `GET /app/library`
* 🔘 `GET /app/liked-songs` (Gộp chung giao diện trong Library)
* ✅ `GET /app/profile`
* ✅ `POST /app/profile`
* ✅ `GET /app/playlists/:playlistId`
* ✅ `GET /app/albums/:albumId`
* ✅ `GET /app/artists/:artistId`
* ✅ `GET /app/podcasts/:showId`
* ✅ `GET /app/episodes/:episodeId`

### E. User App APIs
* ✅ `POST /api/v1/playback/start`
* 🔘 `POST /api/v1/playback/progress` (Optional)
* 🔘 `POST /api/v1/playback/complete` (Optional)
* 🔘 `GET /api/v1/playback/recently-played` (Optional)
* ✅ `POST /api/v1/me/library/tracks/:trackId`
* ✅ `DELETE /api/v1/me/library/tracks/:trackId`
* ✅ `POST /api/v1/me/library/albums/:albumId`
* ✅ `DELETE /api/v1/me/library/albums/:albumId`
* ✅ `POST /api/v1/me/follow/artists/:artistId`
* ✅ `DELETE /api/v1/me/follow/artists/:artistId`
* ✅ `POST /api/v1/me/subscribe/shows/:showId`
* ✅ `DELETE /api/v1/me/subscribe/shows/:showId`
* ✅ `POST /api/v1/playlists/:playlistId/tracks`
* ✅ `DELETE /api/v1/playlists/:playlistId/tracks/:playlistTrackId`
* 🔘 Follow playlist API (Optional)
* 🔘 Playlist reorder API (Optional)

### F. Artist dashboard
* ✅ `GET /artist/select`
* 🔘 `GET /artist/new` / `POST /artist` (Chủ yếu Admin thao tác hoặc Seed)
* ✅ `GET /artist/:artistId/overview`
* 🔘 `GET /artist/:artistId/profile` / `POST /artist/:artistId/profile` (Nằm trong Should-Fix)
* ✅ `GET /artist/:artistId/tracks`
* ✅ `GET /artist/:artistId/tracks/new`
* ✅ `POST /artist/:artistId/tracks`
* ✅ `GET /artist/:artistId/tracks/:trackId/edit`
* ✅ `POST /artist/:artistId/tracks/:trackId`
* 🔘 `POST /artist/:artistId/tracks/:trackId/publish` (Dùng Form Update có truyền status)
* ✅ `GET /artist/:artistId/albums`
* ✅ `GET /artist/:artistId/albums/new`
* ✅ `POST /artist/:artistId/albums`
* ✅ `GET /artist/:artistId/albums/:albumId/edit`
* ✅ `POST /artist/:artistId/albums/:albumId`
* ✅ `GET /artist/:artistId/analytics`
* 🔘 `GET /artist/:artistId/team` / `POST /artist/:artistId/team` (Optional)

### G. Podcaster dashboard
* ✅ `GET /podcaster/shows`
* ✅ `GET /podcaster/shows/new`
* ✅ `POST /podcaster/shows`
* ✅ `GET /podcaster/shows/:showId`
* ✅ `GET /podcaster/shows/:showId/edit`
* ✅ `POST /podcaster/shows/:showId`
* ✅ `GET /podcaster/shows/:showId/episodes`
* ✅ `GET /podcaster/shows/:showId/episodes/new`
* ✅ `POST /podcaster/shows/:showId/episodes`
* ✅ `GET /podcaster/episodes/:episodeId/edit`
* ✅ `POST /podcaster/episodes/:episodeId`
* 🔘 `POST /podcaster/episodes/:episodeId/publish` / `schedule` (Gộp trong form Edit)
* ✅ `GET /podcaster/shows/:showId/analytics`
* 🔘 `GET /podcaster/shows/:showId/team` (Optional)

### H. Admin dashboard
* ✅ `GET /admin` hoặc `/admin/dashboard`
* ✅ `GET /admin/users`
* ✅ `POST /admin/users/:userId/default-role`
* ✅ `POST /admin/users/:userId/plan`
* ✅ `POST /admin/users/:userId/status`
* ✅ `GET /admin/tracks`
* ✅ `POST /admin/tracks/:trackId/status`
* ✅ `GET /admin/podcasts`
* ✅ `POST /admin/podcasts/:showId/status`
* ✅ `POST /admin/episodes/:episodeId/status`

### I. Upload/local media
* ✅ Track audio upload
* ✅ Track cover upload
* ✅ Album cover upload
* 🔘 Artist avatar/banner (Optional/Should-fix)
* ✅ Podcast show cover upload
* ✅ Podcast episode audio upload
* ✅ MIME validation (chỉ định định dạng ảnh/audio hợp lệ)
* ✅ File size limit (10MB/100MB qua multer)
* ✅ UUID filename (crypto.randomUUID)
* ✅ Serve static `/uploads`
* ✅ `.gitignore` đã bỏ qua file user tải lên

### J. Playback/player
* ✅ HTMLAudioElement
* ✅ Play track
* ✅ Play episode
* ✅ Disabled play button nếu không có audioUrl
* ✅ Playback start event (Gửi `/api/v1/playback/start` thành công)
* 🔘 Playback progress/complete event (Out-of-scope)
* ✅ Bottom player UI
* ✅ Không lỗi JS nghiêm trọng

### K. Library/social actions
* ✅ Like/unlike track
* ✅ Follow/unfollow artist
* ✅ Save/unsave album
* ✅ Subscribe/unsubscribe show
* 🔘 Follow/unfollow playlist (Optional)
* ✅ Library hiển thị đúng: liked tracks, followed artists, saved albums, subscribed shows.

### L. Search
* ✅ Search track
* ✅ Search artist
* ✅ Search album
* ✅ Search playlist
* ✅ Search podcast
* ✅ Server-rendered EJS search (hoạt động khi nhập query param `?q=`)
* 🔘 AJAX search (Optional, server search đã đáp ứng MVP)

### M. Analytics
* ✅ Artist analytics
* ✅ Podcaster analytics
* ✅ Admin overview stats
* ✅ Chart.js local (đổ biểu đồ động qua DOM API)
* ✅ Canvas thật
* ✅ Empty state khi không có data
* ✅ PlaybackEvent query đúng type

### N. Documentation
* ✅ README.md (Có setup, demo script, notes)
* ✅ setup commands
* ✅ WSL/Docker Compose/MySQL notes
* ✅ Prisma migrate/seed instructions
* ✅ demo accounts
* ✅ demo script (Gộp trong README)
* ✅ common issues
* ✅ upload/local storage notes

---

## 4. Acceptance Criteria

### Backend Acceptance Criteria

| Criteria | Trạng thái | Ghi chú |
|---|---|---|
| Có seed data idempotent (admin, demo user) | ✅ | Có file `seed.js` xoá sạch db trước khi seed. Đầy đủ user mẫu. |
| Authentication dùng cookie-based session | ✅ | Dùng `express-session` gắn vào memory store. |
| Mật khẩu hash bằng bcrypt | ✅ | Hash đầy đủ trong register/seed. Đổi password cũng mã hoá lại. |
| Check permission bằng middleware chặt chẽ | ✅ | Các route được wrap bởi `requireArtistRole`, `requirePodcastRole`, `requireAdmin`. |
| Ngăn user bị DISABLED truy cập /api/ /app | ✅ | Check middleware logout tự động nếu tài khoản disable. |
| Admin cuối cùng không tự khoá/hạ quyền | ✅ | Xử lý logic an toàn trong Admin controller. |
| Các bảng quan trọng có `status` Enum | ✅ | Album, Track, Podcast, Episode đều có trạng thái. |
| Upload file qua Multer (local), validate size | ✅ | Check MIME chặt chẽ và size `10MB`, `100MB`. |
| Trả `403` HTTP Code hợp lý với API | ✅ | Đã mapping đúng lỗi khi có request trái phép. |
| Route render error page 403, 404, 500 EJS | ✅ | Có layout error/403, error/404. |

### Frontend Acceptance Criteria

| Criteria | Trạng thái | Ghi chú |
|---|---|---|
| Giao diện Dark mode (zinc, green) | ✅ | Dùng chuẩn màu Tailwind theme. |
| Dùng EJS layout component system | ✅ | Cấu trúc layout chia thành partials/components rất gọn. |
| Dùng JS Vanilla cho form fetch | ✅ | Các nút Like/Follow dùng fetch API không reload trang. |
| Search API / Server-rendered form | ✅ | Server-side form GET `?q=`. Hoạt động tốt. |
| Chart.js render analytics dashboard | ✅ | Render Canvas tại Artist và Podcaster dashboards. |
| Form upload audio và hình ảnh hoạt động | ✅ | Render và gửi request FormData trơn tru. |
| Trạng thái DRAFT chỉ hiện với chủ sở hữu | ✅ | Admin/Artist/Podcaster chủ xem được, User App ẩn đi. |
| Trạng thái DISABLED, HIDDEN, REMOVED | ✅ | Quản trị viên xử lý trạng thái này trên Dashboard, ẩn khỏi User. |

---

## 5. Phân loại gap cuối cùng

### A. Must-Fix còn lại
* **Không còn Must-Fix critical.** Mọi tính năng cốt lõi cho một nền tảng âm nhạc (auth, nghe nhạc, library, upload, cms) đều đã được thực hiện và kiểm tra qua browser chạy ổn định.

### B. Should-Fix còn lại
* **Artist/Podcaster Team Management**: Có giao diện EJS để thêm user khác làm editor, manager.
* **Artist/Podcast Profile Edit**: Chỉnh sửa banner, avatar, đổi description (một form setting cho entity Profile).
* **Follow Playlist**: Cho phép lưu playlist của user khác.

### C. Optional / Out-of-scope
* App-shell AJAX navigation giữ bottom player khi chuyển trang.
* Cải thiện thông báo toast system góc phải màn hình.
* Hiển thị notification real-time (tính năng socket).

---

## 6. Kết luận cuối báo cáo

* **Project đã đủ demo/nộp chưa?**
  * **Đã hoàn toàn đủ điều kiện nộp bài.** Các chức năng đã chạy khép kín từ khâu backend quản trị đến frontend người dùng nghe nhạc. File `.env`, package.json và hướng dẫn README đã sẵn sàng để giáo viên / đồng đội clone về chạy local theo vài dòng lệnh chuẩn.

* **Nếu đủ, còn những điểm nào nên nói trước khi demo?**
  * Nhấn mạnh việc chuyển trang sẽ bị reset audio player vì theo scope MVC đơn giản (chưa dùng framework SPA như React hay Pjax). 
  * Hãy login vào nhiều role khác nhau (như hướng dẫn trong `README.md`) để biểu diễn quá trình chia nhỏ role thay vì một cục `role: "admin"` truyền thống.

* **Có nên làm Phase 9 không?**
  * Không bắt buộc vì có thể ảnh hưởng đến độ ổn định của bản release hiện tại. 
  * Nếu muốn điểm tối đa và dư thời gian, Phase 9 nên tập trung làm **Team Management** (Artist Dashboard và Podcaster Dashboard) + tính năng **Edit Profile (Avatar/Banner)**.
