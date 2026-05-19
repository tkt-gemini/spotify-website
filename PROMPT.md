Đóng vai trò là một Kiến trúc sư Phần mềm và Kỹ sư Full-stack. Hãy xây dựng một nền tảng phát trực tuyến âm nhạc và Podcast mang tên "Antigravity". Hệ thống sử dụng nền tảng Node.js, framework Express và công cụ tạo giao diện EJS. Dự án này phải tuân thủ nghiêm ngặt cấu trúc thư mục tiêu chuẩn sinh ra từ công cụ tự động của Express mà không được tự ý gộp nhóm thư mục.

Mục tiêu là tạo ra một trải nghiệm người dùng liền mạch tương tự như Spotify ở chế độ giao diện tối, nơi âm nhạc phát liên tục không bị ngắt quãng khi người dùng duyệt qua các trang khác nhau.

**1. YÊU CẦU KIẾN TRÚC GIAO DIỆN VÀ TRẢI NGHIỆM NGƯỜI DÙNG (UI/UX)**
Hệ thống giao diện phải được chia thành các phân vùng cố định không bị ảnh hưởng bởi quá trình cuộn trang tổng thể. Các phân vùng bao gồm:

* **Thanh điều hướng trên cùng:** Chứa các nút quay lại/tiến tới trong lịch sử duyệt web, thanh tìm kiếm thời gian thực (chỉ xuất hiện ở trang tìm kiếm) và menu thông tin người dùng thả xuống.
* **Thanh điều khiển phát nhạc cố định:** Đặt ở dưới cùng màn hình. Nó phải hiển thị thông tin bài hát hiện tại (ảnh bìa, tiêu đề, tác giả) bên trái; cụm nút điều khiển luồng phát (phát/tạm dừng, bài trước/sau, xáo trộn, lặp lại) và thanh tiến trình thời gian ở giữa; bộ điều khiển âm lượng ở bên phải.
* **Thư viện bên trái:** Một cột cố định chứa menu điều hướng chính, các bộ lọc phân loại nội dung (danh sách phát, nghệ sĩ, podcast) và danh sách cuộn hiển thị thư viện cá nhân của người dùng. Tích hợp tính năng tạo danh sách phát nhanh tại đây.
* **Bảng thông tin bên phải:** Hiển thị bối cảnh của nội dung đang phát, bao gồm tiểu sử nghệ sĩ, số lượt nghe, hoặc hiển thị quảng cáo tính năng cao cấp nếu là tài khoản miễn phí.
* **Vùng nội dung trung tâm:** Đây là khu vực duy nhất thay đổi nội dung dựa trên thao tác chuyển trang của người dùng. Vùng này và khu vực danh sách thư viện bên trái phải có khả năng cuộn nội dung độc lập với nhau.

**2. CƠ CHẾ HOẠT ĐỘNG KHÔNG GIÁN ĐOẠN (SEAMLESS NAVIGATION)**
Để đảm bảo âm thanh không bị ngắt khi người dùng lướt web, bạn phải xây dựng một cơ chế định hướng phía máy khách kết hợp với phản hồi thông minh từ máy chủ:

* **Phía máy khách:** Mọi thao tác nhấn vào các liên kết điều hướng nội bộ phải bị chặn hành vi tải lại trang mặc định. Thay vào đó, hệ thống sẽ gửi yêu cầu ngầm định đến máy chủ để lấy phần nội dung mới, đồng thời cập nhật thanh địa chỉ của trình duyệt để duy trì lịch sử truy cập chuẩn xác.
* **Phía máy chủ:** Máy chủ phải có khả năng nhận diện các yêu cầu chuyển trang ngầm định này. Nếu là yêu cầu ngầm, máy chủ chỉ trả về đúng mảnh giao diện của vùng nội dung trung tâm. Nếu người dùng truy cập trực tiếp bằng đường dẫn hoặc làm mới trang, máy chủ phải trả về toàn bộ bộ khung giao diện hoàn chỉnh.

**3. YÊU CẦU XỬ LÝ DỮ LIỆU VÀ TRUYỀN PHÁT MULTIMEDIA**

* **Dữ liệu giả lập:** Thiết lập một tập hợp dữ liệu động ngay tại máy chủ bao gồm thông tin chi tiết về các bài hát, tập podcast và danh sách phát để phục vụ cho việc hiển thị và tương tác.
* **Truyền phát âm thanh:** Máy chủ không được gửi toàn bộ tệp âm thanh trong một lần tải. Bắt buộc phải xây dựng một luồng truyền dữ liệu hỗ trợ phân đoạn dải byte. Máy chủ sẽ đọc và trả dữ liệu âm thanh dựa trên yêu cầu từ điểm neo thời gian của trình duyệt, giúp người dùng có thể tua nhanh đến bất kỳ thời điểm nào của bài hát/podcast ngay lập tức mà không cần chờ tải toàn bộ.
* **Đồng bộ trạng thái:** Khi một bài hát được chọn từ bất kỳ đâu trong hệ thống, thông tin mô tả chi tiết và tệp âm thanh tương ứng phải được chuyển ngay lập tức xuống thanh điều khiển phát nhạc dưới cùng để bắt đầu phát. Thanh tiến trình phải chạy đồng bộ thời gian thực với nội dung đang phát.

**4. PHÂN QUYỀN VÀ QUẢN TRỊ NỘI DUNG**

* **Phân cấp người dùng:** Xây dựng hệ thống kiểm tra quyền truy cập. Nếu người dùng sử dụng tài khoản miễn phí cố tình phát một nội dung được gắn cờ "Độc quyền/Cao cấp", máy chủ phải từ chối luồng phát và trả về tín hiệu lỗi. Máy khách sẽ bắt tín hiệu này để hiển thị thông báo yêu cầu nâng cấp tài khoản.
* **Trang dành cho nhà sáng tạo:** Thiết kế một khu vực quản trị độc lập cho phép người dùng tải lên đồng thời hình ảnh đại diện và tệp âm thanh.
* **Thống kê lượt nghe:** Xây dựng một luồng ghi nhận ngầm. Khi người dùng phát một nội dung liên tục vượt qua một ngưỡng thời gian nhất định (ví dụ 30 giây), máy khách sẽ gửi một tín hiệu ghi nhận lượt nghe hợp lệ lên máy chủ để cập nhật cơ sở dữ liệu.

Hãy cung cấp giải pháp lập trình chi tiết, phân chia rõ ràng trách nhiệm của từng tệp tin trong hệ thống theo đúng cấu trúc tiêu chuẩn để đáp ứng toàn bộ các yêu cầu nghiệp vụ trên.
