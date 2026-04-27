export const QUIZ_QUESTIONS = [
  {
    id: 1,
    category: 'Cơ Bản',
    question: 'Quy trình chuẩn để khởi động hệ thống máy tính là gì?',
    options: [
      'Phím cứng vật lý (Nút nguồn) trên thân máy',
      'Đánh thức thông qua bàn phím cơ',
      'Sử dụng thiết bị ngoại vi, chuột máy tính',
      'Công tắc khởi động màn hình hiển thị'
    ],
    correct: 0,
    explanation: 'Bạn đã chọn kết quả đúng! Nút nguồn vật lý được thiết kế đặc trưng trên Mainboard để cung cấp điện áp khởi động toàn hệ thống.',
  },
  {
    id: 2,
    category: 'Chuột',
    question: 'Tác vụ Double-click (Nhắp đúp chuột) chịu trách nhiệm thi hành lệnh nào?',
    options: [
      'Truy cập Menu công cụ tuỳ chọn Context',
      'Thực thi chạy trực tiếp một chương trình (Application/File)',
      'Thiết lập Sleep hệ thống',
      'Thực thi lệnh Copy Clipboard'
    ],
    correct: 1,
    explanation: 'Đáp án chuẩn xác! Double-click đại diện cho tập lệnh mở (Open/Run) với khoảng trễ mặc định của Windows là 500ms.',
  },
  {
    id: 3,
    category: 'Bàn phím',
    question: 'Chức năng kỹ thuật của phím Backspace trong quá trình định dạng văn bản?',
    options: [
      'Delete',
      'Enter',
      'Xoá ký tự lùi về bên trái con trỏ',
      'Escape'
    ],
    correct: 2,
    explanation: 'Thao tác cực kỳ chính xác! Khác với phím Delete xoá về phía trước, Backspace lùi vùng nhớ và xoá sạch kỹ tự liền kề.',
  },
  {
    id: 4,
    category: 'Internet',
    question: 'Quy trình ngắt điện an toàn nhất nhằm bảo vệ sự vẹn toàn của phân vùng dữ liệu ổ cứng (Hard Drive)?',
    options: [
      'Ngắt nguồn kết nối phần cứng từ lưới điện',
      'Nhấn giữ vật lý phím nguồn liên tục 10 giây',
      'Truy cập Menu của Hệ điều hành → Shut Down',
      'Tắt tín hiệu đầu ra màn hình'
    ],
    correct: 2,
    explanation: 'Tuyệt vời. Lệnh Shut Down gọi tiến trình OS gửi yêu cầu đóng toàn bộ ứng dụng và ngắt điện tuần tự một cách an toàn nhất.',
  },
  {
    id: 5,
    category: 'Phím tắt',
    question: 'Phân tích chức năng thực tế của Macro lệnh: Ctrl + C ?',
    options: [
      'Gửi yêu cầu Shut Down',
      'Phím tắt Commit và Ghi dữ liệu bộ nhớ',
      'Chép khối dữ liệu vào bộ đệm (Clipboard)',
      'Thiết lập thư mục Directory mới'
    ],
    correct: 2,
    explanation: 'Nhận định chuẩn xác. Lệnh này nạp mọi tập tin / văn bản được bôi đen và đẩy thẳng lên bộ đệm tạm thời (Clipboard Memory).',
  },
  {
    id: 6,
    category: 'Internet',
    question: 'Nền tảng Search Engine tiêu chuẩn số một phục vụ tra cứu thông tin trên Internet toàn cầu?',
    options: [
      'Phần mềm MS Word',
      'Trang tìm kiếm Google (google.com)',
      'Chương trình Notepad',
      'Cửa sổ File Explorer'
    ],
    correct: 1,
    explanation: 'Đúng vậy, hệ thống Google nắm giữ hạ tầng tìm kiếm siêu dữ liệu khổng lồ với các thuật toán tối ưu xếp hạng (SEO) hiệu quả nhất.',
  },
  {
    id: 7,
    category: 'An Toàn',
    question: 'Theo nguyên tắc an toàn thông tin, cần xử lý thế nào khi nhận được email: "Tài khoản mã hóa trúng thưởng 50 triệu..."?',
    options: [
      'Click vào Hyperlink và khai báo trúng thưởng',
      'Share Hyperlink ra toàn mạng xã hội',
      'Cung cấp chuỗi mã OTP để xác nhận bảo mật',
      'Xóa vĩnh viễn và cho vào danh sách Blacklist (Spam/Phishing)'
    ],
    correct: 3,
    explanation: 'Nhận thức bảo mật tuyệt vời! Spam và Phishing là hai loại tội phạm công nghệ phổ biến ngụy trang dưới dạng trúng thưởng.',
  },
  {
    id: 8,
    category: 'Bàn phím',
    question: 'Phím Windows trên Keyboard đại diện cho tiến trình khởi chạy nào của hệ thống Microsoft?',
    options: [
      'Mở Web Browser',
      'Gọi API Tắt thiết bị phần cứng',
      'Mở Start Menu của hệ điều hành',
      'Chụp ảnh giao diện User Interface'
    ],
    correct: 2,
    explanation: 'Chính xác! Phím Windows đóng vai trò nòng cốt để truy xuất ngay lập tức Start Menu - Bảng trung tâm của toàn bộ Windows.',
  },
  {
    id: 9,
    category: 'Internet',
    question: 'Cấu trúc ổ khóa trên thanh điều hướng URL đại diện cho chuẩn kiến trúc nào?',
    options: [
      'Trang web ở trạng thái duy trì cấu hình Loading',
      'Cảnh báo liên kết chết (Dead URL)',
      'Chứng chỉ bảo mật SSL chạy trên nền HTTPS',
      'Giao thức yêu cầu chuỗi đăng nhập Username/Password'
    ],
    correct: 2,
    explanation: 'Hoàn toàn đồng ý. SSL (Secure Sockets Layer) chạy ngầm tạo ra chuẩn mã hoá HTTPS nhằm che giấu luồng dữ liệu.',
  },
  {
    id: 10,
    category: 'An Toàn',
    question: 'Phương thức thiết lập tổ hợp Password (Mật khẩu) đáp ứng tiêu chuẩn an toàn an ninh mạng NIST?',
    options: [
      '12345678',
      'qwertyuiop',
      'Cấu trúc Ngày/Tháng/Năm Sinh',
      'Tổ hợp trên 8 ký tự kèm chữ Hoa, số và Regex ký tự đặc biệt'
    ],
    correct: 3,
    explanation: 'Nhận định rành mạch! Thuật toán dò tìm tổ hợp chuỗi Brute Force sẽ mất hàng năm trời để phá vỡ một chuỗi password phức tạp hợp lệ.',
  },
  {
    id: 11,
    category: 'Văn Phòng',
    question: 'Trong Microsoft Word, tổ hợp phím nào làm "Chữ Đậm" (Bold) văn bản được bôi đen?',
    options: [
      'Ctrl + U',
      'Ctrl + I',
      'Ctrl + B',
      'Ctrl + D'
    ],
    correct: 2,
    explanation: 'Chính xác! Ctrl + B (viết tắt của Bold) kích hoạt cờ (flag) in đậm font chữ trong bộ xử lý văn bản.',
  },
  {
    id: 12,
    category: 'Văn Phòng',
    question: 'Trong Microsoft Excel, đâu là cú pháp của hàm chức năng tính Tổng các ô từ A1 đến A5?',
    options: [
      '=TOTAL(A1:A5)',
      '=SUM(A1:A5)',
      '=PLUS(A1:A5)',
      '=CALC(A1,A5)'
    ],
    correct: 1,
    explanation: 'Rất tốt. "=SUM()" là hàm cơ bản bậc nhất để tính tổng dải dữ liệu.',
  },
  {
    id: 13,
    category: 'Văn Phòng',
    question: 'Phím tắt kinh điển nào trong PowerPoint cho phép khởi chạy trình chiếu chế độ toàn màn hình?',
    options: [
      'Phím Esc',
      'Phím F1',
      'Phím F5',
      'Phím Alt + P'
    ],
    correct: 2,
    explanation: 'Đúng vậy! Phím F5 được cấu hình vĩnh viễn với lệnh "Slide Show từ đầu".',
  },
  {
    id: 14,
    category: 'Văn Phòng',
    question: 'Để căn lề "Đều 2 bên" (Justify) toàn bộ đoạn văn trong Word, ta sử dụng phím tắt nào?',
    options: [
      'Ctrl + J',
      'Ctrl + E',
      'Ctrl + L',
      'Ctrl + R'
    ],
    correct: 0,
    explanation: 'Chuẩn xác. Ctrl + J (Justify) phân bổ khoảng cách từ dãn đều về cả mép trái và mép phải.',
  },
  {
    id: 15,
    category: 'Văn Phòng',
    question: 'Hàm AVERAGE trong Excel có chức năng tính toán giá trị gì trong mảng dữ liệu?',
    options: [
      'Tìm giá trị lớn nhất (Max)',
      'Đếm tổng số dòng có dữ liệu',
      'Tính Trung Bình Cộng của tất cả phần tử số liệu',
      'Làm tròn tỷ lệ % phần trăm thập phân'
    ],
    correct: 2,
    explanation: 'Phân tích rất chuẩn. Hàm AVERAGE lặp (iterate) qua mảng bộ nhớ ô, cộng dồn rồi chia tự động cho tổng số lượng.'
  }
]
