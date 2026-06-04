# Đặc tả hệ thống Spotify Web

## 1. Mục đích tài liệu

Tài liệu này mô tả các nhóm người dùng, đối tượng dữ liệu chính và thao tác quản lý trong hệ thống Spotify Web ở mức phân tích hệ thống. Phạm vi không chỉ dừng ở người dùng nghe nhạc thông thường mà mở rộng sang thư viện cá nhân, playlist, hồ sơ người dùng, tìm kiếm, phát nội dung, artist profile, podcast/creator, kiểm duyệt và quản trị nội dung.

Tài liệu không phân chia tài khoản theo `Free` hoặc `Premium` vì phạm vi yêu cầu hiện tại không cần xét đến khác biệt gói dịch vụ. Nếu hệ thống cần xử lý thanh toán hoặc giới hạn tính năng theo gói trong tương lai, có thể bổ sung phân hệ `Subscription` sau mà không làm thay đổi mô hình cốt lõi.

---

## 2. Phạm vi hệ thống

Spotify Web có thể được mô tả như một hệ sinh thái gồm nhiều phân hệ:

1. **Web Player** — Cho phép người dùng nghe nhạc, podcast, audiobook. Quản lý phát/dừng, chuyển bài, queue, shuffle, repeat, âm lượng. Hiển thị nội dung đang phát và trạng thái phiên nghe.

2. **Account & Profile** — Quản lý đăng ký, đăng nhập, hồ sơ cá nhân, ảnh đại diện, tên hiển thị, và các thông tin công khai như playlist, người theo dõi.

3. **Library** — Quản lý các nội dung người dùng lưu hoặc theo dõi: bài hát đã thích, album đã lưu, artist đã follow, podcast/show đã follow, episode đã lưu, playlist cá nhân, playlist đã follow và playlist folder.

4. **Playlist Management** — Cho phép tạo, sửa, xóa, đổi tên, thêm mô tả, đổi ảnh bìa, thêm/xóa/sắp xếp bài hát. Quản lý trạng thái công khai/riêng tư và hỗ trợ collaborative playlist.

5. **Search & Discovery** — Tìm kiếm bài hát, album, artist, playlist, podcast show, episode, audiobook và hồ sơ người dùng. Hỗ trợ khám phá nội dung dựa trên hành vi nghe, nội dung đã lưu và tín hiệu tương tác.

6. **Artist Management** — Dành cho nghệ sĩ hoặc đội ngũ quản lý artist profile. Nhạc được đưa lên nền tảng thông qua distributor hoặc label; artist/team quản lý hồ sơ và dữ liệu hiệu suất.

7. **Creator / Podcast Management** — Dành cho podcaster hoặc creator quản lý podcast show và episode. Hỗ trợ chỉnh sửa thông tin show, episode, ảnh bìa, mô tả, danh mục, ngôn ngữ và thống kê tăng trưởng.

8. **Moderation & Admin** — Dành cho hệ thống nội bộ. Quản lý báo cáo vi phạm, nội dung không phù hợp, metadata sai, ảnh hồ sơ/playlist vi phạm, nội dung explicit bị gắn nhãn sai và tài khoản bị hạn chế.

---

## 3. Nguyên tắc mô hình hóa

### 3.1. Không gộp mọi vai trò vào một trường `role` duy nhất

Không nên thiết kế:

```text
User.role = normal | artist | podcaster | admin
```

Cách này thiếu linh hoạt vì một tài khoản có thể vừa là người nghe, vừa có quyền quản lý một artist profile, vừa có quyền quản lý một podcast show.

Nên thiết kế theo hướng tách biệt tài khoản khỏi các thực thể nội dung:

```text
UserAccount       — Tài khoản đăng nhập chung.
UserProfile       — Hồ sơ nghe nhạc/cá nhân của tài khoản.
ArtistProfile     — Hồ sơ công khai của nghệ sĩ; có thể do nhiều UserAccount quản lý.
PodcastShow       — Chương trình podcast; có thể do nhiều UserAccount quản lý.
AdminUser         — Tài khoản nội bộ có quyền quản trị hoặc kiểm duyệt.
```

### 3.2. Tài khoản và thực thể nội dung là hai khái niệm khác nhau

`UserAccount` không đồng nghĩa với `ArtistProfile` hoặc `PodcastShow`. Ví dụ:

- Một người dùng bình thường có `UserAccount` và `UserProfile`.
- Một nghệ sĩ dùng `UserAccount` để quản lý `ArtistProfile` thông qua `ArtistTeamMember`.
- Một công ty quản lý nghệ sĩ có thể có nhiều tài khoản cùng quản lý một `ArtistProfile`.
- Một creator có thể quản lý nhiều `PodcastShow`.
- Một `PodcastShow` có thể có nhiều người cùng quản lý qua `CreatorTeamMember`.

### 3.3. Library không chỉ là playlist

Thư viện của người dùng cần quản lý nhiều loại quan hệ riêng biệt:

- Lưu bài hát (liked songs).
- Lưu album.
- Follow artist.
- Follow podcast/show.
- Lưu episode.
- Tạo playlist.
- Follow playlist của người khác.
- Ghim item trong thư viện.
- Tổ chức playlist bằng folder.

Việc lưu một loại nội dung không nên tự động kéo theo lưu tất cả nội dung liên quan. Ví dụ, lưu album không đồng nghĩa với lưu toàn bộ track trong album đó vào Liked Songs.

---

## 4. Các nhóm tác nhân trong hệ thống

### 4.1. Guest / Anonymous Visitor

`Guest` là người chưa đăng nhập hoặc chưa có tài khoản.

**Quyền thao tác:**
- Truy cập một số trang công khai nếu có link hoặc thông qua tìm kiếm.
- Xem thông tin cơ bản của bài hát, album, artist, playlist, podcast hoặc user profile công khai.
- Xem trang giới thiệu, trang đăng nhập/đăng ký.
- Có thể được nghe thử hoặc yêu cầu đăng nhập tùy theo chính sách hệ thống.

**Giới hạn:** Guest không thể tạo playlist, lưu bài hát, follow bất kỳ đối tượng nào, quản lý hồ sơ cá nhân, có lịch sử nghe cá nhân hóa, nhận đề xuất cá nhân hóa đầy đủ, quản lý artist profile/podcast show, hoặc gửi báo cáo dưới danh tính tài khoản.

---

### 4.2. Registered Listener

`Registered Listener` là người dùng đã đăng nhập bằng tài khoản Spotify.

**Quyền thao tác:**
- Đăng nhập và đăng xuất.
- Quản lý hồ sơ cá nhân.
- Tìm kiếm nội dung.
- Nghe nhạc, podcast hoặc loại nội dung được hỗ trợ.
- Tạo và quản lý playlist cá nhân.
- Lưu bài hát, album hoặc episode.
- Follow artist, podcast/show, playlist và user khác.
- Xem thư viện cá nhân và lịch sử nghe gần đây.
- Quản lý cài đặt quyền riêng tư.
- Báo cáo nội dung vi phạm.

> **Lưu ý về thuật ngữ:** Không dùng từ `normal` để mô tả nhóm này vì không rõ nghĩa trong đặc tả hệ thống. Nên dùng `Registered Listener` hoặc `ListenerUser`.

---

### 4.3. Artist Team Member

`Artist Team Member` là tài khoản có quyền quản lý một hoặc nhiều `ArtistProfile`. Tài khoản này có thể là chính nghệ sĩ, manager, label, marketer, thành viên đội ngũ truyền thông, hoặc người được cấp quyền xem dữ liệu.

**Quyền thao tác:**
- Claim hoặc yêu cầu quyền quản lý artist profile.
- Cập nhật ảnh đại diện, hình ảnh hồ sơ, bio và liên kết liên quan.
- Quản lý các phần hiển thị công khai của artist profile.
- Theo dõi dữ liệu hiệu suất bài hát, album và playlist.
- Theo dõi dữ liệu người nghe và thống kê tăng trưởng.
- Quản lý các công cụ quảng bá nếu đủ điều kiện.

**Giới hạn:** Artist Team Member không upload nhạc trực tiếp lên Spotify Web Player. Nhạc được đưa lên qua distributor, label hoặc hệ thống phân phối nội dung. Artist Team Member chủ yếu quản lý hồ sơ và dữ liệu hiệu suất của nội dung đã được phân phối.

---

### 4.4. Creator / Podcaster

`Creator` hoặc `Podcaster` là tài khoản có quyền quản lý một hoặc nhiều `PodcastShow`.

**Quyền thao tác:**
- Tạo hoặc claim podcast show.
- Cập nhật tên show, mô tả, ảnh bìa, danh mục, ngôn ngữ và trạng thái explicit.
- Tạo, chỉnh sửa hoặc quản lý episode.
- Theo dõi lượt nghe, follower và dữ liệu tăng trưởng.
- Quản lý cách show hiển thị trên Spotify.
- Quản lý thumbnail hoặc metadata nếu podcast có video.

**Giới hạn:** Creator không đồng nghĩa với Artist Team Member. Một tài khoản có thể có cả hai quyền nhưng hệ thống nên lưu hai loại quyền này riêng biệt vì đối tượng quản lý khác nhau: Artist Team Member quản lý `ArtistProfile`, Creator quản lý `PodcastShow`.

---

### 4.5. Admin / Moderator

`Admin` hoặc `Moderator` là tài khoản nội bộ của hệ thống.

**Quyền thao tác:**
- Xem danh sách báo cáo vi phạm và kiểm tra nội dung bị report.
- Gỡ hoặc ẩn nội dung vi phạm.
- Khóa, hạn chế hoặc khôi phục tài khoản theo chính sách hệ thống.
- Xử lý ảnh hồ sơ, ảnh playlist hoặc mô tả không phù hợp.
- Kiểm tra nội dung explicit bị gắn nhãn sai.
- Sửa metadata bị lỗi nếu có quyền catalog.
- Hỗ trợ xử lý tranh chấp bản quyền hoặc nội dung mạo danh.
- Quản lý trạng thái kiểm duyệt của track, episode, playlist, profile hoặc image.

**Giới hạn:** Quyền admin nên được tách khỏi tài khoản người dùng công khai để tránh nhầm lẫn giữa hành vi cá nhân và hành vi quản trị.

---

## 5. Các đối tượng dữ liệu chính

### 5.1. Sơ đồ quan hệ tổng thể

```text
UserAccount ─────────────────────────────────────────────────────────┐
  │                                                                   │
  ├── UserProfile (1-1)                                               │
  ├── Library (1-1)                                                   │
  │     └── LibraryItem (1-n)  [item_type: track|album|artist|       │
  │                              playlist|show|episode]               │
  ├── Playlist (1-n, owner)                                           │
  │     └── PlaylistTrack (n-n) ──── Track                           │
  ├── PlaylistFolder (1-n)                                            │
  │     └── FolderPlaylist (n-n) ─── Playlist                        │
  ├── Follow (1-n) [target_type: user|artist|playlist|show]          │
  ├── ListeningHistory (1-n)                                          │
  ├── PlaybackSession (1-1 active)                                    │
  │     └── QueueItem (1-n)                                           │
  ├── SearchHistory (1-n)                                             │
  ├── RecommendationSignal (1-n)                                      │
  ├── Report (1-n, reporter)                                          │
  ├── ArtistTeamMember (1-n) ──── ArtistProfile                      │
  │                                     │                             │
  │                                     ├── Album (1-n)              │
  │                                     │     └── Track (1-n)        │
  │                                     └── TrackArtist (n-n, role)  │
  ├── CreatorTeamMember (1-n) ─── PodcastShow                        │
  │                                     └── PodcastEpisode (1-n)     │
  └── AdminUser (1-1, nếu là admin)                                   │
                                                                      │
AuditLog ─── ghi lại hành động của UserAccount / AdminUser ──────────┘
```

---

### 5.2. UserAccount

Đại diện cho tài khoản đăng nhập. Là thực thể trung tâm cho các thao tác đăng nhập và định danh.

```text
UserAccount
- user_id
- email                  (unique)
- password_hash
- oauth_provider         (null nếu dùng email/password)
- display_name
- avatar_url
- country
- date_of_birth
- created_at
- updated_at
- status: active | suspended | deleted
```

---

### 5.3. UserProfile

Đại diện cho hồ sơ công khai hoặc bán công khai của người dùng. Tách khỏi `UserAccount` để phân biệt dữ liệu đăng nhập với dữ liệu hiển thị.

```text
UserProfile
- profile_id
- user_id                (FK → UserAccount)
- display_name
- avatar_url
- bio
- show_recent_artists: true | false
- show_public_playlists: true | false
- created_at
- updated_at
```

**Dữ liệu có thể hiển thị công khai:** tên hiển thị, ảnh đại diện, playlist công khai, nghệ sĩ đã nghe gần đây (nếu user cho phép), danh sách người theo dõi và đang theo dõi.

---

### 5.4. Library

Đại diện cho thư viện cá nhân của người dùng. Mỗi `UserAccount` có một `Library`.

```text
Library
- library_id
- user_id                (FK → UserAccount, unique)
- created_at
- updated_at
```

---

### 5.5. LibraryItem

Đại diện cho một nội dung được lưu hoặc ghim trong thư viện. Dùng `item_type` để phân biệt loại nội dung; `item_id` trỏ đến bảng tương ứng.

```text
LibraryItem
- library_item_id
- library_id             (FK → Library)
- item_type: track | album | artist | playlist | show | episode | audiobook
- item_id
- saved_at
- pinned: true | false
```

> Trong triển khai thực tế có thể tách thành các bảng riêng như `SavedTrack`, `SavedAlbum`, `FollowedArtist` để tối ưu truy vấn.

---

### 5.6. Playlist

Đại diện cho danh sách phát do người dùng hoặc hệ thống tạo.

```text
Playlist
- playlist_id
- owner_user_id          (FK → UserAccount)
- name
- description
- cover_image_url
- visibility: public | private
- collaborative: true | false
- created_at
- updated_at
- status: active | deleted | hidden
```

**Quan hệ:** `Playlist` 1-n `PlaylistTrack` n-1 `Track`

---

### 5.7. PlaylistTrack

Bảng nối many-to-many giữa `Playlist` và `Track`.

```text
PlaylistTrack
- playlist_track_id
- playlist_id            (FK → Playlist)
- track_id               (FK → Track)
- added_by_user_id       (FK → UserAccount)
- added_at
- position
```

**Quy tắc:**
- Một track có thể xuất hiện nhiều lần trong cùng một playlist nếu hệ thống cho phép.
- `position` dùng để sắp xếp thứ tự phát.
- `added_by_user_id` quan trọng trong collaborative playlist để xác định ai thêm bài.

---

### 5.8. PlaylistCollaborator

Bảng quản lý quyền cộng tác nếu hệ thống hỗ trợ collaborative playlist.

```text
PlaylistCollaborator
- playlist_id            (FK → Playlist)
- user_id                (FK → UserAccount)
- permission: view | edit
- invited_by_user_id
- invited_at
- status: invited | accepted | removed
```

---

### 5.9. PlaylistFolder và FolderPlaylist

`PlaylistFolder` là cấu trúc tổ chức để gom nhiều playlist lại, không trực tiếp phát nhạc.

```text
PlaylistFolder
- folder_id
- owner_user_id          (FK → UserAccount)
- name
- created_at
- updated_at

FolderPlaylist
- folder_id              (FK → PlaylistFolder)
- playlist_id            (FK → Playlist)
- position
```

> Xóa folder không nhất thiết xóa playlist bên trong — hệ thống cần phân biệt xóa cấu trúc folder và xóa playlist thật sự.

---

### 5.10. Follow

Đại diện cho quan hệ theo dõi. Dùng `target_type` + `target_id` để theo dõi nhiều loại đối tượng khác nhau.

```text
Follow
- follow_id
- follower_user_id       (FK → UserAccount)
- target_type: user | artist | playlist | show
- target_id
- followed_at
```

---

### 5.11. ArtistProfile

Đại diện cho hồ sơ công khai của nghệ sĩ. Không gắn trực tiếp với một `UserAccount` — quyền quản lý được kiểm soát qua `ArtistTeamMember`.

```text
ArtistProfile
- artist_id
- name
- avatar_url
- header_image_url
- bio
- verified_status: true | false
- monthly_listeners
- social_links
- merch_links
- created_at
- updated_at
```

**Quan hệ:** `ArtistProfile` 1-n `Album` 1-n `Track`; `ArtistProfile` n-n `Track` (qua `TrackArtist`)

---

### 5.12. ArtistTeamMember

Đại diện cho quyền quản lý artist profile. Cho phép nhiều tài khoản cùng quản lý một profile với các vai trò khác nhau.

```text
ArtistTeamMember
- artist_team_member_id
- artist_id              (FK → ArtistProfile)
- user_id                (FK → UserAccount)
- role: owner | editor | viewer | marketer
- invited_at
- accepted_at
- status: invited | active | removed
```

---

### 5.13. Album

Đại diện cho một album, single hoặc compilation.

```text
Album
- album_id
- artist_id              (FK → ArtistProfile, primary artist)
- title
- cover_image_url
- release_date
- album_type: album | single | ep | compilation
- created_at
- updated_at
```

---

### 5.14. Track

Đại diện cho một bài hát hoặc nội dung âm thanh dạng track.

```text
Track
- track_id
- album_id               (FK → Album)
- title
- duration_ms
- explicit: true | false
- popularity_score
- audio_file_reference
- rights_holder_id       (FK → RightsHolder)
- release_date
- status: active | unavailable | removed
```

**Lưu ý:**
- `status` xử lý trường hợp bài hát bị gỡ, hết quyền phân phối, hoặc không khả dụng ở khu vực.
- `rights_holder_id` liên kết với chủ sở hữu quyền hoặc đơn vị phân phối.

---

### 5.15. TrackArtist

Bảng nối many-to-many giữa `Track` và `ArtistProfile`, hỗ trợ nhiều nghệ sĩ tham gia một bài hát.

```text
TrackArtist
- track_id               (FK → Track)
- artist_id              (FK → ArtistProfile)
- role: primary | featured | remixer | producer
- position
```

---

### 5.16. PodcastShow

Đại diện cho một chương trình podcast.

```text
PodcastShow
- show_id
- title
- description
- cover_image_url
- category
- language
- explicit: true | false
- owner_creator_id       (FK → UserAccount, người tạo ban đầu)
- created_at
- updated_at
- status: active | hidden | removed
```

**Quan hệ:** `PodcastShow` 1-n `PodcastEpisode`

---

### 5.17. PodcastEpisode

Đại diện cho một tập podcast.

```text
PodcastEpisode
- episode_id
- show_id                (FK → PodcastShow)
- title
- description
- duration_ms
- release_date
- explicit: true | false
- audio_file_reference
- video_file_reference   (null nếu không có video)
- status: draft | scheduled | published | hidden | removed
```

---

### 5.18. CreatorTeamMember

Đại diện cho quyền quản lý podcast show. Tương tự `ArtistTeamMember` nhưng áp dụng cho `PodcastShow`.

```text
CreatorTeamMember
- creator_team_member_id
- show_id                (FK → PodcastShow)
- user_id                (FK → UserAccount)
- role: owner | editor | analyst | viewer
- invited_at
- accepted_at
- status: invited | active | removed
```

---

### 5.19. PlaybackSession

Đại diện cho phiên phát nội dung hiện tại của người dùng. Mỗi user có tối đa một session đang active.

```text
PlaybackSession
- session_id
- user_id                (FK → UserAccount)
- current_item_type: track | episode | audiobook
- current_item_id
- device_id
- playback_state: playing | paused | stopped
- progress_ms
- shuffle_enabled: true | false
- repeat_mode: off | one | context
- started_at
- updated_at
```

**Quan hệ:** `PlaybackSession` 1-n `QueueItem`

---

### 5.20. QueueItem

Đại diện cho item trong hàng đợi phát của một phiên.

```text
QueueItem
- queue_item_id
- session_id             (FK → PlaybackSession)
- item_type: track | episode | audiobook
- item_id
- position
- added_by_user_id
- added_at
```

---

### 5.21. ListeningHistory

Đại diện cho lịch sử nghe, được ghi khi user nghe đủ điều kiện (thường là một khoảng thời gian tối thiểu).

```text
ListeningHistory
- history_id
- user_id                (FK → UserAccount)
- item_type: track | episode | audiobook
- item_id
- played_at
- duration_played_ms
- completed: true | false
- source_type: album | playlist | artist | search | recommendation | library
- source_id
```

**Vai trò:** Hiển thị nội dung đã nghe gần đây, cá nhân hóa đề xuất, phân tích hành vi nghe, và thống kê tổng hợp cho artist/creator.

---

### 5.22. SearchHistory

Đại diện cho lịch sử tìm kiếm của người dùng đã đăng nhập.

```text
SearchHistory
- search_id
- user_id                (FK → UserAccount)
- keyword
- filters
- searched_at
```

---

### 5.23. RecommendationSignal

Đại diện cho tín hiệu hành vi dùng để cá nhân hóa đề xuất.

```text
RecommendationSignal
- signal_id
- user_id                (FK → UserAccount)
- signal_type: play | like | save | skip | repeat | follow | search | add_to_playlist
- target_type: track | album | artist | playlist | show | episode
- target_id
- weight
- created_at
```

---

### 5.24. Report

Đại diện cho báo cáo vi phạm từ người dùng.

```text
Report
- report_id
- reporter_user_id       (FK → UserAccount)
- target_type: user_profile | playlist | playlist_cover | track | album | artist | show | episode | image
- target_id
- reason
- description
- status: pending | reviewing | rejected | action_taken
- reviewed_by_admin_id   (FK → AdminUser, null nếu chưa xử lý)
- created_at
- reviewed_at
```

---

### 5.25. AdminUser

Đại diện cho tài khoản quản trị nội bộ. Được liên kết với `UserAccount` nội bộ tách biệt khỏi tài khoản người dùng công khai.

```text
AdminUser
- admin_id
- user_id                (FK → UserAccount)
- admin_role: content_moderator | catalog_admin | support_agent | safety_admin | system_admin
- status: active | disabled
- created_at
```

---

### 5.26. ModerationQueue

Đại diện cho hàng đợi kiểm duyệt nội dung.

```text
ModerationQueue
- queue_id
- report_id              (FK → Report)
- priority: low | medium | high | critical
- assigned_admin_id      (FK → AdminUser, null nếu chưa giao)
- status: pending | assigned | resolved
- created_at
- resolved_at
```

---

### 5.27. ImageAsset

Quản lý trạng thái kiểm duyệt của các ảnh được upload lên hệ thống.

```text
ImageAsset
- image_id
- owner_type: user | playlist | artist | show | episode
- owner_id
- url
- uploaded_by_user_id    (FK → UserAccount)
- moderation_status: pending | approved | rejected | removed
- created_at
```

---

### 5.28. ContentExplicitLabel

Quản lý nhãn explicit riêng biệt để hỗ trợ cập nhật từ nhiều nguồn khác nhau.

```text
ContentExplicitLabel
- target_type: track | episode | audiobook
- target_id
- explicit: true | false
- source: rights_holder | creator | moderator | automated
- updated_at
```

---

### 5.29. ContentAvailability

Quản lý tính khả dụng của nội dung theo khu vực địa lý.

```text
ContentAvailability
- availability_id
- target_type: track | album | episode | audiobook
- target_id
- country_code
- available: true | false
- start_date
- end_date
```

**Lý do cần có:** Quyền phân phối khác nhau theo quốc gia; nội dung bị gỡ tạm thời; một số loại nội dung chỉ hỗ trợ ở một số thị trường.

---

### 5.30. RightsHolder và ContentRights

Quản lý thông tin chủ sở hữu quyền và phạm vi phân phối.

```text
RightsHolder
- rights_holder_id
- name
- type: label | distributor | publisher | creator | other
- contact_info

ContentRights
- content_rights_id
- target_type
- target_id
- rights_holder_id       (FK → RightsHolder)
- territory
- start_date
- end_date
```

---

### 5.31. AuditLog

Ghi lại các thao tác quan trọng của user hoặc admin để phục vụ truy vết.

```text
AuditLog
- audit_id
- actor_type: user | admin | system
- actor_id
- action
- target_type
- target_id
- before_value
- after_value
- created_at
```

**Các thao tác cần ghi log:** đổi email, đổi mật khẩu, cập nhật profile, upload ảnh, tạo/xóa playlist, cấp/thu hồi quyền artist/creator, publish/gỡ episode, gỡ nội dung vi phạm, khóa/mở khóa tài khoản, thay đổi nhãn explicit.

---

## 6. Quản lý tài khoản và hồ sơ

### 6.1. Đăng ký tài khoản

**Input:** Email hoặc OAuth provider; mật khẩu nếu dùng email/password; tên hiển thị; ngày sinh; quốc gia/khu vực; đồng ý điều khoản sử dụng.

**Xử lý:**
1. Kiểm tra email đã tồn tại hay chưa.
2. Kiểm tra định dạng email và độ mạnh mật khẩu.
3. Mã hóa mật khẩu.
4. Tạo `UserAccount`.
5. Tạo `UserProfile`.
6. Tạo `Library`.
7. Khởi tạo cài đặt mặc định về quyền riêng tư và thông báo.

**Output:** Tài khoản được tạo; người dùng có thể đăng nhập và sử dụng thư viện cá nhân.

---

### 6.2. Đăng nhập

**Input:** Email/username hoặc OAuth provider; mật khẩu hoặc mã xác thực từ provider.

**Xử lý:**
1. Xác thực thông tin đăng nhập.
2. Kiểm tra trạng thái tài khoản (`active` / `suspended` / `deleted`).
3. Tạo phiên đăng nhập.
4. Cập nhật thời gian đăng nhập gần nhất.

**Output:** Người dùng được chuyển vào Web Player hoặc trang chủ tài khoản.

---

### 6.3. Quản lý hồ sơ

User có thể: đổi tên hiển thị, đổi ảnh đại diện, chỉnh sửa thông tin công khai, quản lý playlist nào hiển thị trên profile, bật/tắt hiển thị nghệ sĩ đã nghe gần đây, và xem danh sách người theo dõi/đang theo dõi.

**Ràng buộc:**
- Ảnh đại diện không được vi phạm quy định nền tảng.
- Tên hiển thị không được mạo danh hoặc chứa nội dung bị cấm.
- Một số thông tin định danh có thể cần xác thực trước khi đổi.

---

## 7. Quản lý Library

### 7.1. Mục đích

Library giúp người dùng lưu và truy cập nhanh các nội dung quan tâm. Library có thể chứa: liked songs, saved albums, followed artists, followed podcast shows, saved podcast episodes, user playlists, followed playlists, playlist folders, và recently played items.

---

### 7.2. Lưu bài hát

**Xử lý:**
1. Kiểm tra user đã đăng nhập.
2. Kiểm tra track tồn tại và khả dụng.
3. Tạo `LibraryItem` với `item_type = track`.
4. Tạo `RecommendationSignal` với `signal_type = like` hoặc `save`.

**Kết quả:** Track xuất hiện trong Liked Songs; hệ thống có thêm tín hiệu cho đề xuất cá nhân.

---

### 7.3. Lưu album

**Xử lý:**
1. Kiểm tra album tồn tại.
2. Tạo `LibraryItem` với `item_type = album`.
3. Không tự động lưu toàn bộ track vào liked songs.

**Kết quả:** Album xuất hiện trong thư viện; các track trong album không được đánh dấu là liked.

---

### 7.4. Follow artist

**Xử lý:**
1. Kiểm tra artist tồn tại.
2. Tạo `Follow` với `target_type = artist`.
3. Tạo `LibraryItem` với `item_type = artist`.
4. Tạo `RecommendationSignal` với `signal_type = follow`.

**Kết quả:** Artist xuất hiện trong Library; hệ thống ưu tiên gợi ý nội dung mới từ artist đó.

---

### 7.5. Follow podcast show

**Xử lý:**
1. Kiểm tra show tồn tại.
2. Tạo `Follow` với `target_type = show`.
3. Tạo `LibraryItem` với `item_type = show`.

**Kết quả:** Podcast show xuất hiện trong thư viện; user dễ truy cập episode mới.

---

### 7.6. Ghim item trong Library

**Xử lý:**
1. Kiểm tra item đã tồn tại trong Library.
2. Cập nhật `LibraryItem.pinned = true`.

**Kết quả:** Item được ưu tiên hiển thị trong thư viện. Pin chỉ là trạng thái giao diện, không thay thế cho save/follow.

---

## 8. Quản lý Playlist

### 8.1. Tạo playlist

**Input:** Tên playlist; mô tả (tùy chọn); ảnh bìa (tùy chọn); trạng thái public/private.

**Xử lý:**
1. Kiểm tra user đã đăng nhập.
2. Tạo bản ghi `Playlist`.
3. Gắn playlist với `owner_user_id`.
4. Tạo `LibraryItem` để thêm playlist vào Library của user.
5. Nếu có ảnh bìa, tạo `ImageAsset` và kiểm tra nội dung.

**Output:** Playlist mới được tạo và xuất hiện trong thư viện.

---

### 8.2. Đổi tên playlist

**Xử lý:**
1. Kiểm tra user có quyền sửa playlist (owner hoặc collaborator có `permission = edit`).
2. Kiểm tra tên mới không rỗng và không vi phạm nội dung.
3. Cập nhật `Playlist.name` và `updated_at`.

---

### 8.3. Thêm mô tả playlist

**Xử lý:**
1. Kiểm tra quyền sở hữu hoặc quyền chỉnh sửa.
2. Kiểm tra độ dài và nội dung mô tả.
3. Cập nhật `Playlist.description`.

---

### 8.4. Đổi ảnh bìa playlist

**Xử lý:**
1. User tải ảnh lên.
2. Hệ thống kiểm tra: định dạng file, kích thước file, tỷ lệ ảnh, nội dung vi phạm.
3. Tạo `ImageAsset` với `moderation_status = pending`.
4. Cập nhật `Playlist.cover_image_url`.

**Ràng buộc ảnh bìa:** Không chứa nội dung phản cảm, thù ghét, vi phạm bản quyền, mạo danh, hoặc gây hiểu nhầm.

---

### 8.5. Thêm track vào playlist

**Xử lý:**
1. Kiểm tra playlist tồn tại và user có quyền chỉnh sửa.
2. Kiểm tra track tồn tại và khả dụng.
3. Tạo `PlaylistTrack` với `position` ở cuối playlist hoặc vị trí user chọn.
4. Ghi `added_by_user_id` và `added_at`.
5. Cập nhật `Playlist.updated_at`.

---

### 8.6. Xóa track khỏi playlist

**Xử lý:**
1. Kiểm tra user có quyền chỉnh sửa.
2. Xóa bản ghi `PlaylistTrack` tương ứng.
3. Cập nhật lại `position` của các track còn lại.
4. Cập nhật `Playlist.updated_at`.

---

### 8.7. Sắp xếp track trong playlist

**Xử lý:**
1. Kiểm tra quyền chỉnh sửa.
2. Nhận danh sách thứ tự mới.
3. Cập nhật `position` cho các `PlaylistTrack`.
4. Đảm bảo không mất hoặc trùng item ngoài ý muốn.

---

### 8.8. Đặt playlist public/private

**Public playlist:** Có thể hiển thị trên hồ sơ nếu user cho phép; có thể được người khác truy cập hoặc tìm thấy; có thể được follow.

**Private playlist:** Không hiển thị công khai trên profile; không xuất hiện trong kết quả tìm kiếm công khai; chỉ owner hoặc người được cấp quyền mới truy cập được.

---

### 8.9. Collaborative playlist

Khi `Playlist.collaborative = true`, hệ thống sử dụng bảng `PlaylistCollaborator` để quản lý quyền.

**Collaborator** (với `permission = edit`) có thể: thêm track, xóa track do mình thêm, sắp xếp lại playlist, và rời khỏi playlist.

**Owner** có thể: mời collaborator, xóa collaborator, tắt collaborative mode, và chuyển playlist về private.

---

### 8.10. Playlist folder

User có thể: tạo folder, đổi tên folder, thêm/xóa playlist vào folder, sắp xếp playlist trong folder, và xóa folder.

> Xóa folder không nhất thiết xóa playlist bên trong. Hệ thống nên phân biệt rõ hai thao tác: xóa cấu trúc folder và xóa playlist thật sự.

---

## 9. Quản lý Follow và Social

### 9.1. Follow user

**Xử lý:**
1. Kiểm tra User B tồn tại và không phải chính User A.
2. Tạo `Follow` với `target_type = user` và `target_id = user_b_id`.
3. Cập nhật follower/following count nếu hệ thống lưu cache.

**Kết quả:** User A xuất hiện trong danh sách follower của User B; User B xuất hiện trong following của User A.

---

### 9.2. Unfollow

**Xử lý:**
1. Tìm bản ghi `Follow` tương ứng.
2. Xóa hoặc đánh dấu inactive.
3. Cập nhật các số liệu liên quan.

---

### 9.3. Quản lý follower

User có thể: xem danh sách follower và following; chặn hoặc hạn chế user khác nếu hệ thống hỗ trợ; ẩn một số hoạt động nghe thông qua cài đặt quyền riêng tư.

---

## 10. Tìm kiếm và Khám phá nội dung

### 10.1. Search

Search áp dụng cho: Track, Album, Artist, Playlist, Podcast show, Podcast episode, Audiobook (nếu khu vực hỗ trợ), User profile.

**Input:** Từ khóa; bộ lọc loại nội dung; quốc gia/khu vực; ngôn ngữ; tín hiệu cá nhân hóa nếu user đăng nhập.

**Output:** Danh sách kết quả theo loại, được xếp hạng theo độ liên quan, độ phổ biến, lịch sử nghe và tính khả dụng theo khu vực.

---

### 10.2. Discovery

Discovery là nhóm tính năng giúp người dùng tìm nội dung mới, dựa trên các tín hiệu từ: lịch sử nghe, nội dung đã lưu, playlist đã tạo, artist/podcast đã follow, nội dung được nghe lặp lại hoặc bị skip, nội dung đang phổ biến, và dữ liệu tương đồng giữa người dùng.

**Các entity liên quan:** `RecommendationSignal`, `ListeningHistory`, `LibraryItem`, `Follow`, `PlaylistTrack`, `SearchHistory`.

---

## 11. Quản lý Phát nội dung

### 11.1. Play

**Xử lý:**
1. Kiểm tra item tồn tại và khả dụng tại khu vực của user (kiểm tra `ContentAvailability`).
2. Tạo hoặc cập nhật `PlaybackSession`.
3. Cập nhật `playback_state = playing`.
4. Ghi vào `ListeningHistory` khi đủ điều kiện (nghe đủ thời gian tối thiểu).

---

### 11.2. Pause

**Xử lý:** Tìm `PlaybackSession` đang hoạt động → Cập nhật `playback_state = paused` → Lưu `progress_ms`.

---

### 11.3. Resume

**Xử lý:** Tìm phiên phát gần nhất → Kiểm tra item vẫn khả dụng → Phát tiếp từ `progress_ms` → Cập nhật `playback_state = playing`.

---

### 11.4. Seek

**Xử lý:** Nhận vị trí mới từ user → Kiểm tra không vượt quá `duration_ms` → Cập nhật `progress_ms` → Tiếp tục phát từ vị trí mới.

---

### 11.5. Queue

User có thể: xem queue, thêm item vào queue, xóa item khỏi queue, và sắp xếp lại queue nếu hệ thống hỗ trợ. Mỗi item trong queue được lưu dưới dạng `QueueItem` với `position` xác định thứ tự phát.

---

### 11.6. Shuffle và Repeat

**Shuffle:** Phát các item trong context (playlist, album, queue) theo thứ tự ngẫu nhiên. Cập nhật `PlaybackSession.shuffle_enabled`.

**Repeat:** Ba chế độ — `off` (không lặp), `one` (lặp một item), `context` (lặp toàn bộ playlist/album/queue). Cập nhật `PlaybackSession.repeat_mode`.

---

## 12. Quản lý Artist Profile

### 12.1. Claim artist profile

**Xử lý:**
1. User gửi yêu cầu claim artist profile kèm thông tin xác minh (website, social link, vai trò).
2. Hệ thống xác minh mối liên hệ giữa user và artist.
3. Nếu hợp lệ, tạo `ArtistTeamMember` với role phù hợp.
4. Ghi `AuditLog`.

**Output:** User có quyền truy cập artist dashboard và quản lý hồ sơ theo phân quyền.

---

### 12.2. Cập nhật artist profile

Artist Team Member có thể cập nhật: ảnh đại diện, header image, bio, link mạng xã hội, merch, và playlist được ghim hoặc giới thiệu.

**Ràng buộc:** Nội dung không được vi phạm bản quyền, mạo danh artist khác, hoặc gây hiểu nhầm. Một số thay đổi có thể cần kiểm duyệt (tạo `ImageAsset` với `moderation_status = pending`).

---

### 12.3. Quản lý dữ liệu hiệu suất

Artist Team Member có thể xem: lượt nghe, listener, playlist performance, quốc gia/thành phố người nghe, hiệu suất từng track, và tăng trưởng theo thời gian.

> Dữ liệu analytics phải được tổng hợp, không tiết lộ thông tin cá nhân cụ thể của từng listener.

---

### 12.4. Quan hệ giữa Artist và Track

```text
ArtistProfile  1 ─── n  Album
Album          1 ─── n  Track
ArtistProfile  n ─── n  Track  (qua TrackArtist, hỗ trợ featured artist)
```

---

## 13. Quản lý Podcast / Creator

### 13.1. Tạo hoặc claim podcast show

**Xử lý:**
1. Creator đăng nhập.
2. Gửi thông tin podcast show (tên, mô tả, danh mục, ngôn ngữ, ảnh bìa) hoặc yêu cầu claim show có sẵn.
3. Hệ thống xác minh quyền sở hữu.
4. Tạo `PodcastShow` và `CreatorTeamMember` với role `owner`.

---

### 13.2. Cập nhật podcast show

Creator có thể cập nhật: tên show, mô tả, ảnh bìa, danh mục, ngôn ngữ, trạng thái explicit, và thông tin hiển thị công khai.

---

### 13.3. Tạo episode

**Input:** Tiêu đề, mô tả, file audio/video, thời lượng, ngày phát hành, trạng thái explicit, trạng thái xuất bản (draft / scheduled / published).

**Xử lý:**
1. Kiểm tra creator có quyền với show.
2. Kiểm tra metadata bắt buộc và file media.
3. Tạo `PodcastEpisode`.
4. Nếu `scheduled`, hệ thống phát hành tự động vào thời điểm đã đặt.
5. Nếu `published`, episode hiển thị ngay cho listener.

---

### 13.4. Creator analytics

Creator có thể xem: lượt phát episode, follower của show, audience retention, impression, tăng trưởng theo thời gian, và hiệu suất theo từng episode.

> Analytics phải ở dạng tổng hợp để bảo vệ quyền riêng tư của listener.

---

## 14. Kiểm duyệt và Báo cáo vi phạm

### 14.1. Gửi report

Registered Listener có thể report: playlist name, playlist cover, playlist description, user profile, artist profile, track metadata, podcast show, podcast episode, nội dung explicit bị gắn nhãn sai, nội dung mạo danh hoặc vi phạm bản quyền.

**Xử lý:**
1. User chọn lý do report và nhập mô tả bổ sung.
2. Hệ thống tạo `Report`.
3. Tạo `ModerationQueue` để đưa report vào hàng đợi.
4. Moderator xem xét và đưa ra kết luận: không vi phạm, cảnh báo, ẩn nội dung, gỡ nội dung, khóa/hạn chế tài khoản, hoặc chuyển cho bộ phận khác.
5. Ghi `AuditLog` cho mọi quyết định kiểm duyệt.

---

### 14.2. Ưu tiên xử lý trong Moderation Queue

Report được ưu tiên dựa trên: mức độ nghiêm trọng, số lượng report trùng lặp, phạm vi tiếp cận của đối tượng bị report, và nội dung liên quan đến an toàn người dùng, mạo danh, hoặc bản quyền.

---

### 14.3. Kiểm duyệt ảnh

Các loại ảnh cần kiểm tra: ảnh đại diện user, ảnh bìa playlist, ảnh artist profile, ảnh podcast show, thumbnail episode (nếu có video). Tất cả ảnh upload đều tạo `ImageAsset` với `moderation_status = pending` trước khi được duyệt.

---

### 14.4. Xử lý nhãn explicit sai

**Xử lý:**
1. User report nội dung explicit bị gắn nhãn sai.
2. Moderator hoặc hệ thống kiểm tra dựa trên `ContentExplicitLabel`.
3. Nếu report đúng, cập nhật `explicit` và lưu `source = moderator`.
4. Ghi lịch sử thay đổi vào `AuditLog`.

---

## 15. Quản lý Catalog nội dung

### 15.1. Catalog

Catalog là tập hợp tất cả nội dung có thể xuất hiện trên Spotify: Artist, Album, Track, Podcast show, Podcast episode, Audiobook, Playlist. Mỗi đối tượng catalog cần có đầy đủ metadata: tên, mô tả, ảnh, ngày phát hành, người sở hữu/quản lý, thời lượng, nhãn explicit, quyền phân phối theo khu vực, và trạng thái khả dụng.

---

### 15.2. Content Availability

Một nội dung có thể khả dụng ở một số khu vực nhưng không khả dụng ở khu vực khác. Quản lý qua `ContentAvailability`.

---

### 15.3. Rights Holder

Phân hệ `RightsHolder` và `ContentRights` giúp hệ thống xác định nội dung nào được phép phát, ở đâu, trong thời gian nào và thuộc quyền quản lý của bên nào.

---

## 16. Ma trận quyền thao tác

| Chức năng | Guest | Registered Listener | Artist Team Member | Creator / Podcaster | Admin / Moderator |
|---|:---:|:---:|:---:|:---:|:---:|
| Xem trang public | ✓ | ✓ | ✓ | ✓ | ✓ |
| Đăng ký / đăng nhập | ✓ | ✓ | ✓ | ✓ | ✓ |
| Quản lý hồ sơ cá nhân | ✗ | ✓ | ✓ | ✓ | ✓ |
| Tìm kiếm nội dung | Giới hạn | ✓ | ✓ | ✓ | ✓ |
| Nghe nội dung | Giới hạn | ✓ | ✓ | ✓ | ✓ |
| Tạo playlist | ✗ | ✓ | ✓ | ✓ | ✓ |
| Sửa / xóa playlist cá nhân | ✗ | ✓ | ✓ | ✓ | ✓ |
| Thêm / xóa track trong playlist | ✗ | ✓ | ✓ | ✓ | ✓ |
| Đặt playlist public / private | ✗ | ✓ | ✓ | ✓ | ✓ |
| Follow user / artist / show / playlist | ✗ | ✓ | ✓ | ✓ | ✓ |
| Lưu track / album / episode | ✗ | ✓ | ✓ | ✓ | ✓ |
| Xem lịch sử nghe | ✗ | ✓ | ✓ | ✓ | ✓ |
| Claim artist profile | ✗ | Nếu đủ điều kiện | ✓ | Không chính | Hỗ trợ |
| Quản lý artist profile | ✗ | Nếu được cấp quyền | ✓ | Không chính | ✓ |
| Xem artist analytics | ✗ | Nếu được cấp quyền | ✓ | Không chính | ✓ |
| Claim podcast show | ✗ | Nếu đủ điều kiện | Không chính | ✓ | Hỗ trợ |
| Quản lý podcast show / episode | ✗ | Nếu được cấp quyền | Không chính | ✓ | ✓ |
| Xem creator analytics | ✗ | Nếu được cấp quyền | Không chính | ✓ | ✓ |
| Gửi report | ✗ | ✓ | ✓ | ✓ | ✓ |
| Xử lý report | ✗ | ✗ | ✗ | ✗ | ✓ |
| Gỡ nội dung vi phạm | ✗ | ✗ | ✗ | ✗ | ✓ |
| Khóa / hạn chế tài khoản | ✗ | ✗ | ✗ | ✗ | ✓ |

---

## 17. Các luồng thao tác tiêu biểu

### 17.1. User tạo playlist mới

```text
Actor: Registered Listener

1. User chọn Create playlist.
2. Hệ thống tạo Playlist với tên mặc định.
3. User đổi tên playlist.
4. User thêm mô tả nếu muốn.
5. User tải ảnh bìa nếu muốn → Hệ thống tạo ImageAsset.
6. User thêm track vào playlist → Hệ thống tạo PlaylistTrack.
7. User đặt playlist public hoặc private.
8. Playlist xuất hiện trong Library dưới dạng LibraryItem.
```

**Entity bị ảnh hưởng:** `Playlist`, `PlaylistTrack`, `LibraryItem`, `ImageAsset`, `RecommendationSignal`

---

### 17.2. User lưu một bài hát

```text
Actor: Registered Listener

1. User chọn biểu tượng lưu/thích trên track.
2. Hệ thống kiểm tra track tồn tại và user chưa lưu track này.
3. Hệ thống tạo LibraryItem với item_type = track.
4. Hệ thống tạo RecommendationSignal với signal_type = save.
5. Track xuất hiện trong Liked Songs.
```

**Entity bị ảnh hưởng:** `LibraryItem`, `RecommendationSignal`

---

### 17.3. User follow artist

```text
Actor: Registered Listener

1. User mở artist profile.
2. User chọn Follow.
3. Hệ thống tạo Follow với target_type = artist.
4. Hệ thống tạo LibraryItem với item_type = artist.
5. Hệ thống tạo RecommendationSignal với signal_type = follow.
6. Artist xuất hiện trong Library.
```

**Entity bị ảnh hưởng:** `Follow`, `LibraryItem`, `RecommendationSignal`

---

### 17.4. Artist team claim profile

```text
Actor: Artist Team Member

1. User đăng nhập và gửi yêu cầu claim artist profile.
2. User điền thông tin xác minh (website, social, vai trò).
3. Hệ thống xác minh user có liên quan đến artist.
4. Nếu hợp lệ, hệ thống tạo ArtistTeamMember với status = active.
5. Hệ thống ghi AuditLog.
6. User được cấp quyền vào artist dashboard theo role.
```

**Entity bị ảnh hưởng:** `ArtistProfile`, `ArtistTeamMember`, `UserAccount`, `AuditLog`

---

### 17.5. Creator đăng một podcast episode

```text
Actor: Creator / Podcaster

1. Creator chọn podcast show cần quản lý.
2. Creator tạo episode mới, nhập metadata và upload file audio/video.
3. Hệ thống kiểm tra creator có quyền với show (CreatorTeamMember).
4. Hệ thống kiểm tra file và metadata bắt buộc.
5. Creator chọn: lưu draft, đặt lịch, hoặc publish ngay.
6. Hệ thống cập nhật status của PodcastEpisode tương ứng.
7. Episode hiển thị cho listener khi được publish.
```

**Entity bị ảnh hưởng:** `PodcastEpisode`, `ContentExplicitLabel`, `ImageAsset`, `AuditLog`

---

### 17.6. User report playlist cover

```text
Actor: Registered Listener

1. User mở playlist và chọn report.
2. User chọn lý do: ảnh bìa không phù hợp.
3. Hệ thống tạo Report với target_type = playlist_cover.
4. Hệ thống tạo ModerationQueue.
5. Moderator kiểm tra ImageAsset.
6. Nếu vi phạm, moderator cập nhật ImageAsset.moderation_status = removed.
7. Hệ thống cập nhật Report.status = action_taken.
8. Ghi AuditLog.
```

**Entity bị ảnh hưởng:** `Report`, `ModerationQueue`, `ImageAsset`, `Playlist`, `AuditLog`

---

## 18. Ràng buộc dữ liệu

### 18.1. Ràng buộc tài khoản

- Email phải là duy nhất trên toàn hệ thống.
- Tài khoản `suspended` không được thực hiện các thao tác nhạy cảm (tạo playlist, report, follow).
- Tài khoản `deleted` không được hiển thị công khai.
- Một user không được tự follow chính mình.

---

### 18.2. Ràng buộc playlist

- Playlist phải có `owner_user_id`.
- Tên playlist không được rỗng.
- User chỉ sửa playlist nếu là `owner` hoặc `collaborator` có `permission = edit`.
- Playlist `private` không xuất hiện trong kết quả tìm kiếm công khai và không hiển thị trên profile.
- Playlist có `status = hidden | removed` không được hiển thị trong search công khai.

---

### 18.3. Ràng buộc library

- Một user không được có hai `LibraryItem` trùng `item_type` + `item_id`.
- `pinned = true` chỉ áp dụng cho item đã tồn tại trong Library.
- Xóa `LibraryItem` không xóa nội dung gốc.
- Xóa playlist khỏi Library không nhất thiết xóa playlist nếu user chỉ follow playlist đó.

---

### 18.4. Ràng buộc artist

- Một `ArtistProfile` có thể có nhiều `ArtistTeamMember`.
- Một `UserAccount` có thể quản lý nhiều `ArtistProfile`.
- Quyền xem analytics phụ thuộc vào `role` trong `ArtistTeamMember`.
- Thay đổi ảnh hoặc bio có thể tạo `ImageAsset` với `moderation_status = pending` trước khi hiển thị.

---

### 18.5. Ràng buộc podcast

- `PodcastEpisode` phải thuộc về một `PodcastShow`.
- Creator chỉ sửa show/episode nếu có `CreatorTeamMember` với quyền phù hợp.
- Episode có `status = draft` không hiển thị công khai.
- Episode có `status = scheduled` chỉ hiển thị khi đến `release_date`.
- Episode có `status = removed` không xuất hiện trong search công khai.

---

### 18.6. Ràng buộc moderation

- Mỗi `Report` phải có `target_type` và `target_id` rõ ràng.
- Mọi quyết định của moderator phải được ghi `AuditLog`.
- Nội dung bị gỡ cần lưu lý do và thời điểm.
- Nếu report bị từ chối, lưu lý do để tránh kiểm duyệt lặp lại không cần thiết.

---

## 19. Yêu cầu phi chức năng

### 19.1. Bảo mật

- Mật khẩu phải được hash trước khi lưu.
- Phiên đăng nhập phải có thời hạn.
- API kiểm tra quyền trước khi cho phép sửa dữ liệu.
- Admin action phải được phân quyền và ghi log.
- Dữ liệu nhạy cảm không được trả về cho client nếu không cần thiết.

---

### 19.2. Quyền riêng tư

- Người dùng kiểm soát nội dung nào hiển thị trên profile.
- Listening history cá nhân không công khai nếu user không cho phép.
- Analytics cho artist/creator ở dạng tổng hợp — không hiển thị danh tính cụ thể của từng listener.

---

### 19.3. Khả năng mở rộng

- Search cần hỗ trợ lượng dữ liệu lớn.
- Playback session cần cập nhật gần thời gian thực.
- Recommendation cần xử lý dữ liệu hành vi lớn.
- Library và playlist cần tối ưu truy vấn theo user.
- Analytics nên dùng hệ thống tổng hợp riêng thay vì truy vấn trực tiếp dữ liệu thô liên tục.

---

### 19.4. Tính khả dụng khi nội dung bị thay đổi trạng thái

- Nếu một track bị gỡ, playlist vẫn tồn tại nhưng track hiển thị là `unavailable`.
- Nếu artist profile bị ẩn, các track vẫn có thể tồn tại tùy theo quyền phân phối.
- Nếu podcast episode bị `removed`, show vẫn có thể tồn tại và hiển thị các episode còn lại.
- Nếu user xóa tài khoản, playlist công khai có thể bị xóa, ẩn hoặc chuyển trạng thái tùy theo chính sách hệ thống.

---

## 20. Nguồn tham khảo

- Spotify Support — Your Library: https://support.spotify.com/us/article/your-library/
- Spotify Support — Create and edit playlists: https://support.spotify.com/us/article/create-playlists/
- Spotify Support — Playlist privacy and access: https://support.spotify.com/us/article/playlist-privacy-and-access/
- Spotify Support — Playlist folders: https://support.spotify.com/us/article/playlist-folders/
- Spotify Support — Manage and customize your Spotify profile: https://support.spotify.com/us/article/spotify-profile/
- Spotify Support — Explicit content settings: https://support.spotify.com/us/article/explicit-content/
- Spotify for Artists — Get started: https://artists.spotify.com/get-started
- Spotify for Artists — Analytics: https://artists.spotify.com/analytics
- Spotify for Creators: https://creators.spotify.com/
- Spotify for Creators — Growth features: https://creators.spotify.com/features/growth
- Spotify for Developers — Web API: https://developer.spotify.com/documentation/web-api
- Spotify for Developers — Search API: https://developer.spotify.com/documentation/web-api/reference/search