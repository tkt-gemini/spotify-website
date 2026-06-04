# Đặc tả giao diện và luồng thao tác người dùng trên Spotify Web

## 1. Mục đích tài liệu

Tài liệu này bổ sung cho `spotify_web_system_spec.md`. Nếu tài liệu hệ thống mô tả đối tượng dữ liệu, vai trò người dùng, quyền thao tác và quan hệ database, thì tài liệu này mô tả lớp giao diện: người dùng nhìn thấy gì, nhấn vào đâu, thứ tự thao tác ra sao, hệ thống phản hồi thế nào và dữ liệu nào bị thay đổi.

**Phạm vi:**
- Giao diện Spotify Web Player cho người nghe.
- Luồng thao tác của Guest và Registered Listener.
- Quản lý thư viện, playlist, hồ sơ, follow, tìm kiếm và phát nội dung.
- Giao diện quản lý artist profile (Spotify for Artists).
- Giao diện quản lý podcast/creator (Spotify for Creators).
- Giao diện moderation/admin ở mức phân tích hệ thống.
- Mapping giữa thao tác giao diện và entity/database.

Tài liệu không phân chia tài khoản theo Free/Premium.

---

## 2. Mẫu đặc tả chuẩn

Mỗi luồng chức năng được mô tả theo mẫu sau:

```text
### Tên luồng

**Actor:** Ai thực hiện.
**Màn hình cha:** User đang ở trang/khu vực nào.
**Khu vực con:** Thành phần nằm trong phần nào của giao diện.
**Điều kiện hiển thị:** Khi nào thành phần xuất hiện.

**Thành phần UI:** Nút, menu, input, tab, icon, modal.

**Các bước thao tác:**
1. User ...
2. Hệ thống ...

**Phản hồi khi thành công:** Giao diện thay đổi thế nào.
**Phản hồi khi thất bại:** Lỗi hiển thị ở đâu, dạng gì.
**Entity bị ảnh hưởng:** Đọc entity nào; ghi/cập nhật entity nào.
```

**Ví dụ áp dụng mẫu:**

```text
### User thêm bài hát vào playlist

Actor: Registered Listener
Màn hình cha: Search Results hoặc Album Detail
Khu vực con: Track row

Thành phần UI: Nút ba chấm (More options) → Context menu → Submenu playlist

Các bước thao tác:
1. User nhấn nút ba chấm ở dòng bài hát.
2. Chọn "Add to playlist".
3. Chọn playlist đích từ submenu.

Phản hồi khi thành công: Toast "Added to [playlist name]" hiển thị ngắn.
Phản hồi khi thất bại: Toast lỗi nếu mạng gián đoạn.
Entity bị ảnh hưởng: Tạo PlaylistTrack; cập nhật Playlist.updated_at; ghi RecommendationSignal.
```

---

## 3. Cấu trúc tổng thể giao diện

### 3.1. Application Shell

```text
Spotify Web Application
├── Top Bar / Global Header
├── Left Sidebar
│   ├── Main Navigation (Home, Search, Your Library)
│   ├── Library Controls (Create/Plus, filter chips, sort, search in library)
│   └── Library Item List
├── Main Content Area
│   ├── Home Page
│   ├── Search / Browse Page
│   ├── Search Results Page
│   ├── Playlist Detail Page
│   ├── Album Detail Page
│   ├── Artist Profile Page
│   ├── Podcast Show Page
│   ├── Episode Detail Page
│   ├── User Profile Page
│   ├── Artist Dashboard Page
│   ├── Creator Dashboard Page
│   └── Admin / Moderation Page
├── Optional Right Panel (Now Playing, Lyrics, Friend Activity)
├── Bottom Playback Bar
│   ├── Current Item (cover, title, artist, save button)
│   ├── Playback Controls (shuffle, prev, play/pause, next, repeat, progress bar)
│   └── Utility Area (queue, device picker, volume)
└── Overlay Layer
    ├── Context Menu
    ├── Modal Dialog (edit, confirm, upload)
    ├── Toast Notification
    ├── Tooltip
    └── Error Banner
```

---

### 3.2. Top Bar / Global Header

Khu vực điều hướng cấp cao, nằm ở phía trên màn hình.

```text
Top Bar
├── Back / Forward buttons
├── Search Field (hoặc Search Shortcut)
└── Profile Menu
    ├── Profile → mở User Profile Page
    ├── Account → mở trang account
    ├── Settings → mở trang cài đặt
    ├── Support
    └── Log out
```

**Hành vi:**
- Nhấn **Back/Forward**: điều hướng trong lịch sử trang nội bộ.
- Nhấn **Search Field**: focus input tìm kiếm.
- Chọn **Log out**: hủy phiên đăng nhập, đưa user về trạng thái Guest.

---

### 3.3. Left Sidebar

Khu vực điều hướng chính và quản lý nhanh thư viện.

```text
Left Sidebar
├── Navigation: Home | Search | Your Library
├── Library Header: label + Create/Plus button + Collapse/Expand
├── Library Filters: Playlists | Artists | Albums | Podcasts & Shows
├── Library Search & Sort
└── Library Item List
    ├── Liked Songs
    ├── User Playlists
    ├── Followed Playlists
    ├── Saved Albums
    ├── Followed Artists
    ├── Followed Shows
    └── Playlist Folders
```

**Hành vi:**
- Nhấn **Plus/Create**: mở menu tạo mới (Playlist hoặc Folder).
- Nhấn filter chip: danh sách chỉ hiển thị loại nội dung tương ứng.
- Nhấn một item: Main Content Area mở trang chi tiết tương ứng.

---

### 3.4. Cấu trúc chung của trang chi tiết

```text
Detail Page
├── Header
│   ├── Cover / Avatar / Artwork
│   ├── Type label (Playlist / Album / Artist / Podcast...)
│   ├── Title
│   ├── Owner / Artist / Creator + Metadata
│   └── Action buttons (Play, Save/Follow, More options)
├── Content Body
│   ├── Track list / Episode list / Cards
│   ├── Description / About
│   └── Related content / Recommendations
└── Footer (metadata bổ sung, copyright...)
```

---

### 3.5. Bottom Playback Bar

Thanh điều khiển phát nội dung, hiển thị từ mọi trang.

```text
Bottom Playback Bar
├── Current Item: cover | title | artist/show | save button
├── Playback Controls: Shuffle | Prev | Play/Pause | Next | Repeat | Progress bar
└── Utility: Now Playing view | Lyrics | Queue | Device picker | Volume
```

---

### 3.6. Overlay Layer

- **Context Menu**: mở khi nhấn nút ba chấm trên track, playlist, artist...
- **Modal Dialog**: mở khi cần nhập liệu (Edit details) hoặc xác nhận (Delete playlist, Upload ảnh).
- **Toast Notification**: thông báo nhanh cho thao tác thành công hoặc lỗi nhỏ.
- **Error Banner**: lỗi nghiêm trọng hơn, thường cần hành động từ user.

---

## 4. Luồng Guest

### 4.1. Guest mở Spotify Web Player

**Actor:** Guest / Anonymous Visitor
**Màn hình cha:** Landing Page hoặc Web Player ở trạng thái chưa đăng nhập

**Thành phần UI:** Nút Sign up, nút Log in, một số nội dung công khai.

**Các bước thao tác:**
1. Guest truy cập Spotify Web Player.
2. Hệ thống tải Application Shell ở trạng thái chưa đăng nhập.
3. Guest có thể xem một số nội dung công khai.
4. Nhấn **Log in** → chuyển sang màn hình đăng nhập.
5. Nhấn **Sign up** → chuyển sang màn hình đăng ký.

**Phản hồi khi Guest cố thực hiện thao tác cần tài khoản:**
- Modal login prompt xuất hiện với hai lựa chọn: Log in hoặc Sign up.

**Entity bị ảnh hưởng:** Không tạo dữ liệu cá nhân. Có thể ghi anonymous session tùy chính sách.

---

### 4.2. Guest xem trang nội dung công khai

**Màn hình cha:** Public Content Page (Public Playlist, Artist Profile, Album, Podcast Show, User Profile)

**Các bước thao tác:**
1. Guest mở link tới nội dung công khai.
2. Hệ thống tải trang chi tiết với metadata: tên, ảnh bìa, artist/creator/owner, danh sách track/episode.
3. Guest nhấn Play hoặc thao tác cá nhân hóa → Hệ thống kiểm tra đăng nhập.

**Phản hồi:**
- Xem thông tin công khai: được phép.
- Thao tác cần tài khoản: mở login prompt.
- Nội dung không còn công khai: hiển thị thông báo không truy cập được.

---

## 5. Luồng đăng ký, đăng nhập, đăng xuất

### 5.1. Đăng ký tài khoản

**Actor:** Guest
**Màn hình cha:** Sign Up Page

```text
Registration Form
├── Email / Phone / OAuth option
├── Password input
├── Display name input
├── Date of birth input
├── Country / Region selector
├── Terms agreement checkbox
└── Sign up button
```

**Các bước thao tác:**
1. Guest nhấn **Sign up** ở Top Bar hoặc login prompt.
2. Hệ thống mở Sign Up Page.
3. User chọn phương thức đăng ký (Email, Phone, hoặc OAuth).
4. User nhập thông tin bắt buộc và tick đồng ý điều khoản.
5. Nhấn **Sign up** → Hệ thống kiểm tra dữ liệu.

**Phản hồi khi thành công:** Chuyển vào Web Player ở trạng thái đã đăng nhập; Home Page hiển thị; Library cá nhân xuất hiện ở sidebar.

**Phản hồi khi thất bại:**
- Email đã tồn tại → lỗi inline dưới input email.
- Mật khẩu không hợp lệ → hướng dẫn sửa inline.
- Thiếu trường bắt buộc → highlight trường cần nhập.
- Lỗi mạng → error banner.

**Entity bị ảnh hưởng:** Tạo mới `UserAccount`, `UserProfile`, `Library` và default privacy settings.

---

### 5.2. Đăng nhập

**Actor:** Guest hoặc Registered Listener chưa đăng nhập
**Màn hình cha:** Login Page

```text
Login Form
├── Email / Username / Phone input
├── Password input
├── OAuth login buttons
├── Log in button
├── Forgot password link
└── Sign up link
```

**Các bước thao tác:**
1. User nhấn **Log in** → Hệ thống mở Login Page.
2. User nhập email và mật khẩu hoặc chọn OAuth.
3. Nhấn **Log in** → Hệ thống xác thực.

**Phản hồi khi thành công:** Chuyển về Web Player; tải profile, library, recently played và playback state.

**Phản hồi khi thất bại:**
- Sai email/mật khẩu → thông báo lỗi chung (không chỉ rõ sai trường nào, tránh leak thông tin).
- Tài khoản bị khóa → hiển thị trạng thái tài khoản và hướng dẫn liên hệ.
- OAuth thất bại → quay lại Login Page với thông báo lỗi.
- Mất kết nối → error banner.

**Entity bị ảnh hưởng:** Cập nhật session và `last_login_at`.

---

### 5.3. Đăng xuất

**Các bước thao tác:**
1. User nhấn avatar/display name ở góc trên bên phải.
2. Profile Menu mở ra → Chọn **Log out**.
3. Hệ thống hủy phiên đăng nhập.

**Phản hồi:** Web Player về trạng thái Guest; Library cá nhân ẩn; user được chuyển về trang login hoặc landing.

**Entity bị ảnh hưởng:** Hủy session/token. Không xóa dữ liệu user.

---

## 6. Home Page

### 6.1. Mở Home Page

**Actor:** Guest hoặc Registered Listener
**Thao tác:** Nhấn **Home** ở Left Sidebar.

```text
Home Page
├── Greeting / Personalized Header
├── Recently Played
├── Made For You / Recommendations
├── Jump Back In
├── Popular Artists / Albums / Playlists
└── Podcast Recommendations
```

**Phản hồi:**
- Registered Listener: nội dung cá nhân hóa dựa trên `ListeningHistory`, `LibraryItem`, `Follow`, `RecommendationSignal`.
- Guest: nội dung tổng quát hoặc yêu cầu đăng nhập để cá nhân hóa.

---

### 6.2. User chọn một card trên Home

**Thành phần UI:** Playlist card, Album card, Artist card, Podcast card — với Play button overlay khi hover.

**Các bước thao tác:**
1. User di chuột vào card.
2. Nhấn card → mở trang detail tương ứng.
3. Nhấn Play overlay → nội dung phát ngay, Bottom Playback Bar cập nhật.

**Phản hồi:**
- Nếu nội dung không khả dụng → toast lỗi.

**Entity bị ảnh hưởng:** Nếu phát: tạo/cập nhật `PlaybackSession`; ghi `ListeningHistory` khi đủ điều kiện.

---

## 7. Search và Browse

### 7.1. Mở Search Page và tìm kiếm

**Actor:** Guest hoặc Registered Listener
**Thao tác:** Nhấn **Search** ở Left Sidebar.

```text
Search Page (chưa nhập keyword)
├── Search Input
├── Browse Categories (Music, Podcasts, Genres, Moods...)
└── Recent Searches (nếu đã đăng nhập)
```

**Khi user nhập keyword:**
1. User nhấn Search Input và gõ từ khóa.
2. Hệ thống có thể hiển thị autocomplete suggestions.
3. User nhấn Enter hoặc chọn gợi ý.

```text
Search Results Page
├── Search Input (chứa keyword)
├── Filter Tabs: All | Songs | Artists | Albums | Playlists | Podcasts & Shows | Episodes | Profiles
├── Top Result
├── Songs List
├── Artists Grid
├── Albums Grid
├── Playlists Grid
├── Shows Grid
└── Profiles List
```

**Phản hồi khi thành công:** Kết quả được nhóm theo loại; user nhấn filter để chỉ xem một loại.

**Phản hồi khi không có kết quả:** Empty state với gợi ý kiểm tra chính tả hoặc thử keyword khác.

**Entity bị ảnh hưởng:** Tạo `SearchHistory` nếu đã đăng nhập; có thể tạo `RecommendationSignal` với `signal_type = search`.

---

### 7.2. Mở kết quả tìm kiếm

| Loại kết quả | Thao tác | Kết quả |
|---|---|---|
| Track | Nhấn Play | Track phát, Bottom Playback Bar cập nhật |
| Track | Nhấn tên artist/album | Mở Artist Profile / Album Detail |
| Artist | Nhấn card | Mở Artist Profile Page |
| Album | Nhấn card | Mở Album Detail Page |
| Playlist | Nhấn card | Mở Playlist Detail Page |
| Podcast show | Nhấn card | Mở Podcast Show Page |
| Profile | Nhấn card | Mở User Profile Page |

---

## 8. Phát nội dung

### 8.1. Phát track

**Actor:** Registered Listener (Guest có thể bị hạn chế)
**Màn hình cha:** Playlist Detail, Album Detail, Search Results, Artist Profile
**Khu vực con:** Track List

```text
Track Row
├── Index / Play icon (khi hover)
├── Track title
├── Artist name
├── Album name (nếu có)
├── Date added (trong playlist)
├── Duration
├── Save button
└── More options button (ba chấm)
```

**Các bước thao tác:**
1. User hover vào dòng track → icon số thứ tự đổi thành Play.
2. User nhấn Play hoặc double-click vào dòng.
3. Hệ thống kiểm tra track tồn tại và khả dụng (`ContentAvailability`).
4. Hệ thống bắt đầu phát.

**Phản hồi khi thành công:**
- Bottom Playback Bar hiển thị cover, tên track, artist.
- Progress bar bắt đầu chạy.
- Dòng track hiện tại được highlight.
- Queue/context được chuẩn bị từ playlist/album hiện tại.

**Phản hồi khi thất bại:**
- Track unavailable → track bị mờ hoặc toast thông báo không phát được.
- Mất mạng → lỗi playback với tùy chọn thử lại.
- Chưa đăng nhập và thao tác bị hạn chế → login modal.

**Entity bị ảnh hưởng:** Tạo/cập nhật `PlaybackSession`; ghi `ListeningHistory` khi đủ điều kiện; tạo `RecommendationSignal` với `signal_type = play`.

---

### 8.2. Điều khiển phát (Pause, Resume, Seek, Next, Previous)

**Pause:**
- User nhấn **Pause** ở Bottom Playback Bar.
- `playback_state = paused`; `progress_ms` được lưu lại.
- Nút đổi thành Play; progress bar dừng.

**Resume:**
- User nhấn **Play**.
- Hệ thống phát tiếp từ `progress_ms`; `playback_state = playing`.

**Seek:**
- User kéo điểm tiến trình trên Progress Bar đến vị trí mới.
- Hệ thống kiểm tra vị trí không vượt `duration_ms`.
- Cập nhật `progress_ms` và tiếp tục phát.

**Next:**
- Hệ thống xác định item tiếp theo trong queue hoặc context.
- Nếu không có item tiếp theo, xử lý theo chế độ `repeat`.

**Previous:**
- Nếu track đang phát dưới ~3 giây: quay về item trước.
- Nếu đã phát lâu hơn: phát lại từ đầu track hiện tại.

---

### 8.3. Shuffle và Repeat

**Shuffle:**
- User nhấn icon **Shuffle**.
- Bật: thứ tự phát tiếp theo trong context được xáo trộn ngẫu nhiên.
- Tắt: thứ tự quay về context gốc.
- Cập nhật `PlaybackSession.shuffle_enabled`.

**Repeat:**
- User nhấn icon **Repeat**, chuyển giữa 3 trạng thái: `off` → `context` → `one`.
- `off`: không lặp.
- `context`: lặp toàn bộ playlist/album/queue.
- `one`: lặp một item.
- Cập nhật `PlaybackSession.repeat_mode`.

---

### 8.4. Queue

**Mở Queue:**
- User nhấn icon **Queue** ở Utility Area của Bottom Playback Bar.
- Hiển thị: Now Playing → Next in Queue → Next From Context.

```text
Queue Page
├── Now Playing
├── Next in Queue (QueueItem 1, 2, n...)
└── Next From Context (playlist/album/radio)
```

**Thêm item vào Queue:**
1. User nhấn ba chấm trên track/episode → chọn **Add to queue**.
2. Hệ thống thêm item vào cuối queue.
3. Toast xác nhận; nếu Queue Page đang mở, item mới xuất hiện cuối danh sách.

**Entity bị ảnh hưởng:** Tạo `QueueItem`; cập nhật thứ tự queue.

---

### 8.5. Chọn thiết bị phát

1. User nhấn icon thiết bị trong Utility Area.
2. Device Picker mở danh sách thiết bị khả dụng.
3. User chọn thiết bị → Hệ thống chuyển playback sang thiết bị đó.
4. Cập nhật `PlaybackSession.device_id`.

---

## 9. Library

### 9.1. Mở và quản lý Your Library

**Thao tác:** Nhấn **Your Library** ở Left Sidebar.

```text
Your Library
├── Header: Your Library title + Create/Plus + Collapse/Expand
├── Filters: Playlists | Artists | Albums | Podcasts & Shows
├── Search and Sort in Library
└── Item List: Liked Songs | Playlists | Folders | Albums | Artists | Shows
```

**Lọc Library:** Nhấn filter chip → danh sách chỉ hiển thị loại tương ứng; nếu không có item → empty state.

**Tìm trong Library:** Nhấn icon search → nhập keyword → danh sách lọc realtime.

**Sắp xếp Library:** Nhấn dropdown sort → chọn tiêu chí (Recents, Recently added, Alphabetical, Creator).

---

### 9.2. Pin và Unpin item trong Library

**Pin:**
1. User nhấn chuột phải hoặc ba chấm trên item trong Library.
2. Chọn **Pin to top** → item được đưa lên đầu danh sách.
3. Cập nhật `LibraryItem.pinned = true`.

**Unpin:**
1. User mở context menu của item đã pin → chọn **Unpin**.
2. Cập nhật `LibraryItem.pinned = false`.

---

## 10. Lưu và Follow nội dung

### 10.1. Lưu track vào Liked Songs

**Thành phần UI:** Save button (dấu cộng hoặc heart icon) trên Track Row hoặc Bottom Playback Bar.

**Các bước thao tác:**
1. User nhấn nút lưu cạnh track.
2. Hệ thống kiểm tra đã đăng nhập và track chưa được lưu.
3. Tạo `LibraryItem` với `item_type = track`.

**Phản hồi:** Nút đổi sang trạng thái đã lưu (filled); Track xuất hiện trong Liked Songs; toast xác nhận.

**Bỏ lưu track:** Nhấn lại nút → xóa/deactivate `LibraryItem` → track bị xóa khỏi Liked Songs.

---

### 10.2. Lưu album

**Màn hình cha:** Album Detail Page → Album Header → Save Button.

**Thao tác:** Nhấn nút Save/Add ở header album → Tạo `LibraryItem` với `item_type = album`.

**Lưu ý:** Track trong album không tự động trở thành liked songs.

---

### 10.3. Follow artist

**Màn hình cha:** Artist Profile Page → Artist Header → Follow button.

**Thao tác:** Nhấn **Follow** → Tạo `Follow` (target_type = artist), `LibraryItem` (item_type = artist), `RecommendationSignal` (signal_type = follow).

**Phản hồi:** Nút đổi thành **Following**; Artist xuất hiện trong Library.

**Unfollow:** Nhấn **Following** → Xóa/deactivate `Follow` và cập nhật `LibraryItem`.

---

### 10.4. Follow podcast show

**Màn hình cha:** Podcast Show Page → Show Header → Follow button.

**Thao tác:** Nhấn **Follow** → Tạo `Follow` (target_type = show) và `LibraryItem` (item_type = show).

**Phản hồi:** Show xuất hiện trong Library; episode mới dễ truy cập hơn.

---

### 10.5. Lưu episode

**Thao tác:** Nhấn nút save/add trên episode → Tạo `LibraryItem` với `item_type = episode`.

---

### 10.6. Follow playlist của người khác

**Màn hình cha:** Playlist Detail Page (không phải owner).

**Thao tác:** Nhấn Save/Follow/Add to Library → Tạo `Follow` (target_type = playlist) hoặc `LibraryItem`.

**Bỏ follow:** Nhấn lại nút → Xóa `Follow`/`LibraryItem`.

---

## 11. Playlist

### 11.1. Tạo playlist mới từ Left Sidebar

**Actor:** Registered Listener
**Khu vực:** Left Sidebar → Library Header → Plus/Create button

**Các bước thao tác:**
1. User nhấn **Plus/Create** → menu tạo mới mở ra.
2. User chọn **Create a new playlist**.
3. Hệ thống tạo playlist với tên mặc định và mở Playlist Detail Page.
4. User đổi tên, thêm mô tả, tải ảnh bìa, thêm bài hát và đặt visibility.

**Phản hồi:** Playlist mới xuất hiện trong Library; Playlist Detail Page mở để chỉnh sửa ngay.

**Entity bị ảnh hưởng:** Tạo `Playlist` và `LibraryItem`.

---

### 11.2. Tạo playlist từ một track

1. User nhấn ba chấm trên track → chọn **Add to playlist** → chọn **New playlist**.
2. Hệ thống tạo playlist mới và thêm track vào ngay.

**Entity bị ảnh hưởng:** Tạo `Playlist`, `PlaylistTrack`, `LibraryItem`.

---

### 11.3. Mở Playlist Detail Page

```text
Playlist Detail Page
├── Header: cover | type label | name | description | owner | số bài | tổng thời lượng
├── Action Row: Play | Save/Follow (nếu không phải owner) | More options | Collaborative action
├── Track Table: index | title | album | date added | duration | save | more options
└── Recommendations / Add songs section
```

**Hiển thị theo quyền:**
- **Owner:** hiển thị thao tác Edit details, Delete, Make private/public, Add songs.
- **Viewer:** hiển thị Follow/Save playlist nếu playlist public.
- **Private và không có quyền:** hiển thị lỗi không truy cập được.

---

### 11.4. Chỉnh sửa thông tin playlist (Edit details)

**Thao tác chung:** User nhấn tên playlist hoặc ba chấm → chọn **Edit details** → Modal chỉnh sửa mở ra.

**Đổi tên:** Nhập tên mới (không được rỗng, không vi phạm nội dung) → nhấn **Save** → Cập nhật `Playlist.name` + `updated_at`.

**Thêm/sửa mô tả:** Nhập mô tả vào textarea → nhấn **Save** → Cập nhật `Playlist.description`.

**Đổi ảnh bìa:**
1. Trong modal, user nhấn vùng ảnh bìa → file picker mở.
2. User chọn ảnh → Hệ thống kiểm tra định dạng, kích thước, nội dung.
3. Preview ảnh trong modal → nhấn **Save**.
4. Tạo `ImageAsset` (moderation_status = pending); cập nhật `Playlist.cover_image_url`.

**Phản hồi khi thất bại:** Lỗi hiển thị inline dưới input; ảnh không hợp lệ → giữ ảnh cũ và hiển thị lỗi.

---

### 11.5. Thêm track vào playlist

**Từ Track Context Menu:**
1. User nhấn ba chấm trên track → chọn **Add to playlist** → chọn playlist đích.
2. Tạo `PlaylistTrack`; cập nhật `Playlist.updated_at`; toast xác nhận.

**Từ khu vực đề xuất trong Playlist:**
1. User cuộn xuống phần gợi ý hoặc ô tìm kiếm trong playlist.
2. Nhấn **Add** bên cạnh track được đề xuất.

---

### 11.6. Xóa track khỏi playlist

1. User nhấn ba chấm trên track → chọn **Remove from this playlist**.
2. Hệ thống xóa `PlaylistTrack`; cập nhật `position` các track còn lại; cập nhật `updated_at`.
3. Track biến mất khỏi Track Table; tổng số bài cập nhật.

---

### 11.7. Sắp xếp thứ tự track

1. User kéo track đến vị trí mới (drag & drop).
2. Hệ thống hiển thị vị trí thả → user thả → cập nhật `PlaylistTrack.position`.

---

### 11.8. Đặt playlist public / private

**Thao tác:** Nhấn ba chấm ở Playlist Header → chọn **Make private** hoặc **Make public**.

**Public:** Playlist hiển thị trên profile (nếu cài đặt cho phép) và có thể được follow.

**Private:** Ẩn khỏi profile công khai; không xuất hiện trong search; người đang follow có thể mất quyền truy cập.

**Entity bị ảnh hưởng:** Cập nhật `Playlist.visibility`.

---

### 11.9. Chia sẻ playlist

1. User nhấn ba chấm → chọn **Share** → chọn **Copy link** hoặc nền tảng khác.
2. Toast: "Link copied".
3. Không thay đổi dữ liệu playlist; có thể ghi share event.

---

### 11.10. Xóa playlist do mình tạo

1. User mở context menu của playlist → chọn **Delete**.
2. Confirmation modal mở → user xác nhận.
3. `Playlist.status = deleted`; xóa/ẩn `LibraryItem`; hệ thống chuyển về Library hoặc Home.

> Hủy: modal đóng, không thay đổi dữ liệu.

---

### 11.11. Playlist folder

**Tạo folder:**
1. User nhấn **Plus/Create** → chọn **Folder** → nhập tên → nhấn Enter/Save.
2. Tạo `PlaylistFolder`; folder xuất hiện trong Library.

**Thêm playlist vào folder:**
1. User kéo playlist vào folder (drag & drop).
2. Tạo/cập nhật `FolderPlaylist`; cập nhật `position`.

**Hành vi:** Xóa folder không xóa playlist bên trong.

---

## 12. User Profile và Social

### 12.1. Mở hồ sơ cá nhân

**Thao tác:** Nhấn avatar ở Top Bar → chọn **Profile**.

```text
User Profile Page
├── Header: avatar | display name | follower count | following count | Edit button (nếu là chính user)
├── Public Playlists
├── Recently Played Artists (nếu bật)
├── Followers
└── Following
```

---

### 12.2. Chỉnh sửa hồ sơ cá nhân

1. User mở profile của mình → nhấn **Edit profile**.
2. Modal chỉnh sửa mở: có thể đổi display name, avatar, bio.
3. Nhấn **Save** → Cập nhật `UserProfile`; nếu đổi avatar: tạo/cập nhật `ImageAsset`.

**Phản hồi khi thất bại:** Ảnh/tên vi phạm → hiển thị lỗi hoặc đưa vào kiểm duyệt pending.

---

### 12.3. Follow / Unfollow user khác

**Follow:**
1. Mở profile người khác → nhấn **Follow**.
2. Tạo `Follow` (target_type = user); nút đổi thành **Following**.

**Unfollow:**
1. Nhấn **Following** → xác nhận nếu cần → Xóa/deactivate `Follow`.

---

### 12.4. Quản lý playlist hiển thị trên profile

Trong playlist detail, user có thể ẩn/hiển thị playlist trên profile qua cài đặt visibility. Playlist `private` không bao giờ hiển thị công khai.

---

## 13. Artist Profile Page (dành cho người nghe)

### 13.1. Mở Artist Profile Page

**Thao tác:** Nhấn tên artist hoặc artist card ở bất kỳ trang nào.

```text
Artist Profile Page
├── Header: artist image | name | verified indicator | monthly listeners | Follow button | More options
├── Popular Tracks
├── Discography: Albums | Singles & EPs | Compilations
├── Artist Playlists
├── Fans Also Like
├── About
└── Merch / Events (nếu có)
```

---

### 13.2. Phát popular track

User hover vào track trong Popular Tracks → nhấn Play → track phát, Bottom Playback Bar cập nhật.

**Entity bị ảnh hưởng:** Cập nhật `PlaybackSession`; ghi `ListeningHistory`.

---

### 13.3. Xem discography

User chọn filter (Albums / Singles & EPs / Compilations) → nhấn card → mở Album Detail Page.

---

## 14. Album Detail Page

```text
Album Detail Page
├── Header: cover | type label (Album/Single/EP) | title | artist | release year | số track | tổng thời lượng
├── Action Row: Play | Save album | More options
├── Track List: số thứ tự | title | duration | save | more options
└── Copyright / Label / Release metadata
```

**Phát album:** Nhấn **Play** ở header → hệ thống phát track đầu tiên; queue/context được tạo từ toàn bộ album.

**Entity bị ảnh hưởng:** Cập nhật `PlaybackSession` với context album.

---

## 15. Podcast Show và Episode

### 15.1. Mở Podcast Show Page

```text
Podcast Show Page
├── Header: cover | type label (Podcast) | title | creator | description | Follow button | More options
├── Episode List: title | release date | description preview | duration | Play | Save | More options
└── About / Details
```

---

### 15.2. Phát và lưu episode

**Phát:** Nhấn **Play** trên episode → phát, Bottom Playback Bar cập nhật; user có thể seek như track.

**Entity bị ảnh hưởng:** Cập nhật `PlaybackSession`; ghi `ListeningHistory` (item_type = episode).

**Lưu episode:** Nhấn nút save → Tạo `LibraryItem` (item_type = episode).

---

## 16. Báo cáo nội dung

### 16.1. Report nội dung (tổng quát)

**Actor:** Registered Listener
**Truy cập:** Nhấn ba chấm ở bất kỳ nội dung nào → chọn **Report**.

**Luồng chung:**
1. Report Modal mở; user chọn lý do (nội dung không phù hợp, mạo danh, vi phạm bản quyền, ảnh bìa vi phạm, explicit label sai, lý do khác).
2. User nhập mô tả bổ sung nếu cần.
3. Nhấn **Submit** → Tạo `Report` và `ModerationQueue`.
4. Toast: "Báo cáo đã được gửi"; modal đóng.

**Phản hồi khi thất bại:** Chưa chọn lý do → lỗi inline trong modal.

**Đối tượng có thể report:** playlist, playlist cover, user profile, artist profile, track, album, podcast show, podcast episode, ảnh bìa, nhãn explicit sai.

---

## 17. Giao diện Artist Team (Spotify for Artists)

### 17.1. Cấu trúc tổng quát

```text
Spotify for Artists
├── Access / Claim Flow
├── Artist Selector (nếu quản lý nhiều artist)
├── Artist Dashboard
│   ├── Overview
│   ├── Music
│   ├── Audience
│   ├── Playlists
│   ├── Profile
│   ├── Promo Tools
│   └── Team
└── Settings / Account
```

---

### 17.2. Claim artist profile

**Actor:** Artist Team Member
**Màn hình cha:** Spotify for Artists — Access/Claim Flow

**Thành phần UI:** Search artist input → Artist result list → Request access button → Verification form → Submit.

**Các bước thao tác:**
1. User đăng nhập vào Spotify for Artists.
2. Chọn **Claim artist profile** hoặc **Get access**.
3. Tìm artist bằng tên, URL hoặc URI.
4. Chọn artist đúng → điền thông tin xác minh (website, social link, distributor/label, vai trò).
5. Gửi request.

**Phản hồi khi thành công:** Hiển thị pending request screen; khi được duyệt, user thấy Artist Dashboard.

**Phản hồi khi thất bại:**
- Artist đã có team: yêu cầu xin admin hiện tại mời.
- Thiếu thông tin xác minh: form hiển thị lỗi inline.

**Entity bị ảnh hưởng:** Tạo pending `ArtistTeamMember`; ghi `AuditLog`; sau khi duyệt, `status = active`.

---

### 17.3. Artist Dashboard

```text
Artist Dashboard
├── Sidebar: Overview | Music | Audience | Playlists | Profile | Promo Tools | Team
└── Main Panel: Metrics cards | Charts | Tables | Editable content
```

---

### 17.4. Cập nhật artist profile

**Thao tác:** Chọn **Profile** trong sidebar → chọn phần cần sửa → upload ảnh hoặc nhập nội dung → nhấn **Save**.

**Có thể cập nhật:** Avatar, header image, bio, social links, merch links, artist pick.

**Phản hồi khi thành công:** Preview hoặc trạng thái đã lưu; nếu cần kiểm duyệt → hiển thị pending.

**Phản hồi khi thất bại:** Nội dung vi phạm → lỗi; không đủ quyền → nút Save bị disabled.

**Entity bị ảnh hưởng:** Cập nhật `ArtistProfile`; tạo/cập nhật `ImageAsset`; ghi `AuditLog`.

---

### 17.5. Xem artist analytics

1. Chọn tab **Audience**, **Music** hoặc **Playlists**.
2. Chọn khoảng thời gian; có thể chọn track/album cụ thể để xem chi tiết.

**Dữ liệu hiển thị (dạng tổng hợp):** Streams, Saves, Listeners, Followers, Playlist adds, Audience geography.

> Analytics không hiển thị danh tính cụ thể của từng listener.

---

### 17.6. Quản lý team artist

**Thao tác:** Chọn tab **Team** → nhấn **Invite** → nhập email → chọn vai trò (Owner/Admin / Editor / Viewer / Marketer) → gửi lời mời.

Khi người được mời chấp nhận, `ArtistTeamMember.status = active`.

**Entity bị ảnh hưởng:** Tạo/cập nhật `ArtistTeamMember`; ghi `AuditLog`.

---

## 18. Giao diện Creator / Podcast Management (Spotify for Creators)

### 18.1. Cấu trúc tổng quát

```text
Spotify for Creators
├── Creator Home
├── Create / Claim Show Flow
├── Show Selector (nếu quản lý nhiều show)
├── Show Dashboard
│   ├── Overview
│   ├── Episodes
│   ├── Analytics
│   ├── Customization
│   ├── Monetization (nếu có)
│   └── Settings / Team
└── Episode Editor
```

---

### 18.2. Tạo podcast show mới

**Actor:** Creator / Podcaster

**Thành phần UI:** Create show button → Show creation form → Submit.

**Các bước thao tác:**
1. Đăng nhập → chọn **Create new show**.
2. Nhập: tên show, mô tả, danh mục, ngôn ngữ, explicit status.
3. Tải ảnh bìa.
4. Nhấn **Create**.

**Phản hồi khi thành công:** Show được tạo; chuyển vào Show Dashboard.

**Phản hồi khi thất bại:** Thiếu metadata → lỗi inline; ảnh không hợp lệ → yêu cầu upload lại.

**Entity bị ảnh hưởng:** Tạo `PodcastShow`, `CreatorTeamMember` (role = owner), `ImageAsset`.

---

### 18.3. Chỉnh sửa thông tin show

**Thao tác:** Chọn **Customization** hoặc **Show settings** → form thông tin show → chỉnh sửa → nhấn **Save**.

**Có thể chỉnh sửa:** Tên, mô tả, ảnh bìa, danh mục, ngôn ngữ, trạng thái explicit.

**Entity bị ảnh hưởng:** Cập nhật `PodcastShow`; tạo/cập nhật `ImageAsset`; cập nhật `ContentExplicitLabel`.

---

### 18.4. Tạo episode mới

**Actor:** Creator / Podcaster
**Màn hình cha:** Show Dashboard → Episodes tab → Episode Editor

**Thành phần UI:** New episode button → Episode Editor (upload area + metadata form + publish controls).

**Các bước thao tác:**
1. Chọn tab **Episodes** → nhấn **New episode**.
2. Episode Editor mở → upload audio/video.
3. Nhập: title, description, release date, explicit status, season/episode number.
4. Chọn action: **Save draft**, **Schedule**, hoặc **Publish now**.

**Phản hồi theo action:**
- **Save draft:** Episode lưu ở trạng thái `draft`; không hiển thị công khai.
- **Schedule:** Episode ở trạng thái `scheduled`; công khai khi đến `release_date`.
- **Publish now:** Episode chuyển `published`; listener thấy ngay.

**Entity bị ảnh hưởng:** Tạo/cập nhật `PodcastEpisode`, `ContentExplicitLabel`, `ImageAsset` (nếu có thumbnail); ghi `AuditLog`.

---

### 18.5. Xem creator analytics

1. Chọn tab **Analytics** → chọn khoảng thời gian.
2. Có thể xem toàn show hoặc từng episode cụ thể.

**Dữ liệu hiển thị (dạng tổng hợp):** Starts, Streams, Listeners, Followers, Impressions, Audience retention, Follower growth.

---

## 19. Giao diện Admin / Moderation

### 19.1. Cấu trúc tổng quát

```text
Admin Console
├── Dashboard
├── Moderation Queue
├── Report Detail
├── User Management
├── Content Management
├── Artist / Creator Support
├── Audit Logs
└── System Settings
```

---

### 19.2. Moderation Queue

**Actor:** Admin / Moderator
**Thao tác:** Đăng nhập Admin Console → chọn **Moderation Queue**.

```text
Moderation Queue
├── Filter Bar: Target type | Reason | Priority | Status | Date range
├── Report Table: Report ID | Target type | Reason | Reporter | Priority | Status | Created time
└── Bulk Actions (nếu có)
```

**Entity bị ảnh hưởng:** Đọc `Report`, `ModerationQueue`, target content.

---

### 19.3. Xem chi tiết và xử lý report

**Thao tác:** Nhấn vào một report trong queue.

```text
Report Detail
├── Report Summary
├── Target Preview (image / text / metadata / audio reference + public visibility state)
├── Reporter Information
├── Previous Reports on same target
├── Policy Checklist
├── Moderator Notes
└── Action Panel: Reject | Warn | Hide | Remove | Escalate | Suspend account
```

**Luồng xử lý:**
1. Moderator xem nội dung bị report.
2. Chọn kết luận và nhập ghi chú.
3. Nhấn **Submit decision** → Hệ thống yêu cầu xác nhận nếu action nghiêm trọng.
4. Xác nhận → Hệ thống áp dụng action.

**Phản hồi:** Report chuyển trạng thái `resolved/action_taken`; target content được cập nhật; action được ghi log; nếu cần, gửi thông báo cho user liên quan.

**Entity bị ảnh hưởng:** Cập nhật `Report.status`, `ModerationQueue.status`; cập nhật target content (`Playlist.status`, `UserAccount.status`, `ImageAsset.moderation_status`, `PodcastEpisode.status`, `Track.status`); tạo `AuditLog`.

---

## 20. Trạng thái giao diện dùng chung

### 20.1. Loading state

Hiển thị khi hệ thống đang tải dữ liệu. Không để màn hình trống hoàn toàn — hiển thị skeleton hoặc placeholder giữ cấu trúc dự kiến. Nếu tải quá lâu, hiển thị lỗi hoặc nút thử lại.

---

### 20.2. Empty state

| Ngữ cảnh | Thông báo | Hành động gợi ý |
|---|---|---|
| Library trống | "Your Library is empty" | Tìm kiếm hoặc tạo playlist |
| Search không có kết quả | "No results found for [keyword]" | Kiểm tra chính tả, thử keyword khác |
| Playlist trống | "Let's add something to your playlist" | Hiển thị ô tìm kiếm bài hát |
| Analytics không có dữ liệu | "No data available yet" | Hướng dẫn hoặc liên kết hỗ trợ |

---

### 20.3. Error state

| Loại lỗi | Cách hiển thị |
|---|---|
| Thao tác nhỏ thất bại (thêm vào playlist, lưu bài...) | Toast lỗi ngắn |
| Nhập liệu không hợp lệ trong form | Inline error dưới field |
| Trang không truy cập được / nội dung không tồn tại | Full-page error |
| Cần đăng nhập | Modal login prompt |
| Session hết hạn | Modal yêu cầu đăng nhập lại |
| Mất kết nối mạng | Error banner với tùy chọn thử lại |

---

### 20.4. Permission state

```text
Nếu là owner:       Hiển thị Edit details, Delete, Make private/public, Add songs.
Nếu là collaborator: Hiển thị thao tác thêm/xóa/sắp xếp theo permission.
Nếu chỉ là viewer:  Không hiển thị edit actions; hiển thị Follow/Save playlist.
Nếu là guest:       Hiển thị login prompt khi thao tác cá nhân hóa.
```

---

## 21. Mapping giữa thao tác giao diện và entity hệ thống

| Thao tác giao diện | Entity đọc | Entity ghi / cập nhật |
|---|---|---|
| Đăng ký | Account lookup | `UserAccount`, `UserProfile`, `Library` |
| Đăng nhập | `UserAccount` | Session, `last_login_at` |
| Mở Home | `ListeningHistory`, `LibraryItem`, `RecommendationSignal` | View event (tùy chính sách) |
| Search keyword | Catalog entities | `SearchHistory`, `RecommendationSignal` |
| Mở playlist | `Playlist`, `PlaylistTrack`, `Track`, `UserProfile` | View event (tùy chính sách) |
| Tạo playlist | `UserAccount`, `Library` | `Playlist`, `LibraryItem` |
| Đổi tên playlist | `Playlist` | `Playlist.name`, `updated_at`, `AuditLog` |
| Đổi ảnh playlist | `Playlist` | `ImageAsset`, `Playlist.cover_image_url` |
| Thêm track vào playlist | `Track`, `Playlist` | `PlaylistTrack`, `RecommendationSignal` |
| Xóa track khỏi playlist | `PlaylistTrack` | Xóa/cập nhật `PlaylistTrack` |
| Đặt playlist private/public | `Playlist` | `Playlist.visibility` |
| Follow playlist | `Playlist` | `Follow` hoặc `LibraryItem` |
| Lưu track | `Track` | `LibraryItem`, `RecommendationSignal` |
| Lưu album | `Album` | `LibraryItem` |
| Follow artist | `ArtistProfile` | `Follow`, `LibraryItem`, `RecommendationSignal` |
| Follow podcast show | `PodcastShow` | `Follow`, `LibraryItem` |
| Lưu episode | `PodcastEpisode` | `LibraryItem` |
| Phát track/episode | `Track`/`Episode`, `ContentAvailability` | `PlaybackSession`, `ListeningHistory` |
| Thêm vào queue | `Track`/`Episode` | `QueueItem` |
| Seek | `PlaybackSession` | `PlaybackSession.progress_ms` |
| Shuffle / Repeat | `PlaybackSession` | `PlaybackSession.shuffle_enabled` / `repeat_mode` |
| Chọn thiết bị | `PlaybackSession` | `PlaybackSession.device_id` |
| Mở profile | `UserProfile`, `Playlist`, `Follow` | View event (tùy chính sách) |
| Edit profile | `UserProfile` | `UserProfile`, `ImageAsset`, `AuditLog` |
| Follow user | `UserProfile` | `Follow` |
| Report content | Target entity | `Report`, `ModerationQueue` |
| Claim artist | `ArtistProfile` + verification data | `ArtistTeamMember`, `AuditLog` |
| Edit artist profile | `ArtistProfile` | `ArtistProfile`, `ImageAsset`, `AuditLog` |
| View artist analytics | Analytics aggregate | Dashboard event (tùy chính sách) |
| Create podcast show | `UserAccount` | `PodcastShow`, `CreatorTeamMember`, `ImageAsset` |
| Create episode | `PodcastShow`, `CreatorTeamMember` | `PodcastEpisode`, `ContentExplicitLabel`, `AuditLog` |
| Moderate report | `Report`, target entity | `Report.status`, target status, `AuditLog` |

---

## 22. Nguồn tham khảo

- Spotify Support — Web Player Help: https://support.spotify.com/us/article/web-player-help/
- Spotify Support — Your Library: https://support.spotify.com/us/article/your-library/
- Spotify Support — Search: https://support.spotify.com/us/article/search/
- Spotify Support — Create and edit playlists: https://support.spotify.com/us/article/create-playlists/
- Spotify Support — Playlist privacy and access: https://support.spotify.com/us/article/playlist-privacy-and-access/
- Spotify Support — Playlist folders: https://support.spotify.com/us/article/playlist-folders/
- Spotify Support — Customize your playlist cover: https://support.spotify.com/us/article/add-playlist-cover/
- Spotify Support — Profile and playlist image guidelines: https://support.spotify.com/us/article/profile-and-playlist-image-guidelines/
- Spotify Support — Manage and customize your Spotify profile: https://support.spotify.com/us/article/spotify-profile/
- Spotify Support — Follow your friends and manage followers: https://support.spotify.com/us/article/follow-friends-manage-followers/
- Spotify Support — Play Queue: https://support.spotify.com/us/article/play-queue/
- Spotify Support — Spotify Connect: https://support.spotify.com/us/article/spotify-connect/
- Spotify Support — Explicit content settings: https://support.spotify.com/us/article/explicit-content/
- Spotify for Artists — Get started: https://artists.spotify.com/en/get-started
- Spotify for Artists — Analytics: https://artists.spotify.com/en/analytics
- Spotify for Creators: https://creators.spotify.com/
