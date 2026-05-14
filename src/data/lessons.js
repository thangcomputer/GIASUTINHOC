export const LESSONS = [
  {
    id: 'ban-phim',
    title: 'Làm Quen Bàn Phím',
    emoji: '️',
    category: 'Cơ Bản',
    level: 'Người mới',
    duration: '15 phút',
    color: '#6366f1',
    description: 'Học cách sử dụng bàn phím, các phím quan trọng và cách gõ tiếng Việt',
    tags: ['Bàn phím', 'Gõ chữ', 'Tiếng Việt'],
    steps: [
      {
        title: 'Bàn phím trông như thế nào?',
        content: `Bàn phím máy tính có nhiều phím, nhưng đừng lo! Chúng ta chỉ cần học những phím quan trọng nhất trước.

** Khu vực chữ cái (A-Z):**
Các phím chữ nằm ở giữa bàn phím - đây là nơi bạn gõ chữ

** Khu vực số (0-9):**  
Ở hàng trên cùng hoặc bên phải (numpad)

**️ Phím chức năng:**
Các phím to ở hai cạnh bên: Shift, Ctrl, Alt, Enter, Backspace`,
        tip: 'Đặt tay nhẹ nhàng lên bàn phím, đừng siết chặt!',
        exercise: 'Hãy nhìn vào bàn phím và tìm phím Enter (to, có mũi tên )'
      },
      {
        title: 'Các phím quan trọng nhất',
        content: `**Enter **
️ Giống như nút "OK" - xác nhận hoặc xuống dòng mới

**Backspace **  
️ Xóa chữ vừa gõ (xóa từ phải sang trái)

**Space (cách) **
️ Phím dài nhất ở đáy - tạo khoảng trắng giữa các từ

**Shift ⬆**
️ Giữ Shift + gõ chữ  ra chữ IN HOA

**Caps Lock **
️ Bật lên  tất cả chữ đều IN HOA tự động`,
        tip: 'Phím Space là phím dài nhất, dễ tìm nhất!',
        exercise: 'Thử gõ tên của bạn trong ô soạn thảo'
      },
      {
        title: 'Phím tắt siêu hữu ích',
        content: `**Ctrl + C = Sao chép**
 Giữ Ctrl, rồi nhấn C  Copy nội dung đã chọn

**Ctrl + V = Dán**
 Giữ Ctrl, rồi nhấn V  Paste nội dung

**Ctrl + Z = Hoàn tác**
️ Giữ Ctrl, rồi nhấn Z  "Xin lỗi, tôi làm sai rồi!"

**Ctrl + S = Lưu**
 Giữ Ctrl, rồi nhấn S  Lưu file đang làm

**Windows + D = Về Desktop**
️ Nhấn phím Windows  Thu nhỏ tất cả cửa sổ`,
        tip: 'Ctrl+Z là phím "undo" - rất hữu ích khi làm sai!',
        exercise: 'Mở Notepad, gõ vài chữ, rồi thử Ctrl+Z để xóa từng chữ'
      },
      {
        title: 'Gõ tiếng Việt',
        content: `Để gõ tiếng Việt, bạn cần phần mềm **Unikey** (phổ biến nhất Việt Nam)

**Kiểu gõ Telex (dễ nhất):**
- aa  â  (ông bà)
- aw  ă  (trăm)
- ow  ơ  (bơ)
- oo  ô  (ông)
- uw  ư  (mưa)

**Dấu thanh:**
- s  sắc (á)
- f  huyền (à)  
- r  hỏi (ả)
- x  ngã (ã)
- j  nặng (ạ)

**Ví dụ:**
- "anh"  gõ: **anh** 
- "ánh"  gõ: **as + nh** = **ánhs** ...  
- Thực ra: gõ **anh** rồi gõ **s**  **ánhs**  **ánh** `,
        tip: 'Bắt đầu với Unikey kiểu Telex - phổ biến và dễ học nhất!',
        exercise: 'Thử gõ "Xin chào" bằng Telex: Xin chaof'
      }
    ]
  },
  {
    id: 'chuot-may-tinh',
    title: 'Sử Dụng Chuột',
    emoji: '️',
    category: 'Cơ Bản',
    level: 'Người mới',
    duration: '10 phút',
    color: '#06b6d4',
    description: 'Học cách cầm chuột, click, double-click và kéo thả',
    tags: ['Chuột', 'Click', 'Kéo thả'],
    steps: [
      {
        title: 'Cách cầm chuột đúng cách',
        content: `️ **Cách đặt tay:**
- Đặt lòng bàn tay lên chuột
- Ngón trỏ đặt lên nút trái
- Ngón giữa đặt lên nút phải (hoặc bánh xe)
- Phần chỏ đặt nhẹ xuống bàn

 **Đúng:** Cầm nhẹ nhàng, thư giãn
 **Sai:** Siết quá chặt gây mỏi tay

 **Mẹo:** Di chuột bằng cổ tay, không dùng cả cánh tay!`,
        tip: 'Đừng căng thẳng! Cầm chuột nhẹ nhàng thôi.',
        exercise: 'Thử di chuột để di chuyển con trỏ trên màn hình'
      },
      {
        title: 'Click trái - Click phải',
        content: `** Click trái (1 lần) = Chọn**
- Click vào biểu tượng  Chọn/đánh dấu nó
- Click vào nút  Thực hiện lệnh

** Double-click (2 lần nhanh) = Mở**  
- Double-click vào file  Mở file
- Double-click vào thư mục  Vào thư mục
- ️ Phải click 2 lần NHANH liên tiếp!

** Click phải = Menu tùy chọn**
- Click phải vào bất cứ đâu  Xem menu
- Thường có: Open, Copy, Delete, Properties...`,
        tip: 'Luyện double-click: nhấn 2 lần nhanh liên tiếp không di chuyển chuột!',
        exercise: 'Click phải vào màn hình desktop xem menu xuất hiện gì'
      },
      {
        title: 'Kéo và Thả (Drag & Drop)',
        content: `**Kéo thả dùng để:**
- Di chuyển file từ nơi này sang nơi khác
- Sắp xếp biểu tượng trên desktop
- Thay đổi kích thước cửa sổ

**Cách thực hiện:**
1. Di chuột đến thứ muốn kéo
2. **Giữ** nút trái chuột (không thả ra)
3. **Di chuyển** chuột đến nơi muốn đặt
4. **Thả** nút trái ra

 **Ví dụ thực tế:**
Giống như cầm một tờ giấy và đặt nó vào ngăn kéo khác!`,
        tip: 'Giữ chắc nút chuột trong lúc kéo, đừng thả ra giữa chừng!',
        exercise: 'Thử kéo một biểu tượng trên Desktop sang vị trí mới'
      }
    ]
  },
  {
    id: 'bat-tat-may',
    title: 'Bật & Tắt Máy Tính',
    emoji: '',
    category: 'Cơ Bản',
    level: 'Người mới',
    duration: '5 phút',
    color: '#10b981',
    description: 'Học cách bật máy tính đúng cách và tắt máy an toàn',
    tags: ['Khởi động', 'Tắt máy', 'An toàn'],
    steps: [
      {
        title: 'Bật máy tính',
        content: `**Các bước bật máy:**

1.  **Kiểm tra nguồn điện** - Dây cắm vào ổ điện chưa?

2.  **Tìm nút nguồn** - Thường có biểu tượng ****
   - Máy để bàn: Nút ở thùng máy (case)
   - Laptop: Nút ở góc trên bàn phím

3.  **Nhấn một lần** - Đừng giữ, chỉ nhấn và thả

4.  **Chờ máy khởi động** - 1-3 phút

5.  **Nhập mật khẩu** (nếu có) rồi Enter

6.  **Thấy Desktop = Máy đã sẵn sàng!**`,
        tip: 'Nếu máy không bật, kiểm tra dây điện trước nhé!',
        exercise: 'Thử bật máy và quan sát quá trình khởi động'
      },
      {
        title: 'Tắt máy đúng cách',
        content: `️ **QUAN TRỌNG:** Không bao giờ rút điện đột ngột!

**Cách tắt máy Windows:**

1. ️ Click vào ** Windows** góc dưới trái

2.  Click vào biểu tượng **nguồn** 

3.  Chọn **"Shut down"** (Tắt máy)

4.  Chờ máy tắt hoàn toàn (30 giây - 1 phút)

5.  Đợi màn hình tối hẳn mới yên tâm đi

**Khi nào dùng Restart?**
 Chọn "Restart" khi máy chạy chậm hoặc sau khi cài phần mềm`,
        tip: 'Lưu hết file đang làm TRƯỚC khi tắt máy nhé!',
        exercise: 'Thực hành: nhấn phím Windows  click biểu tượng nguồn  thấy menu'
      }
    ]
  },
  {
    id: 'internet-co-ban',
    title: 'Internet Cơ Bản',
    emoji: '',
    category: 'Internet',
    level: 'Trung bình',
    duration: '20 phút',
    color: '#f59e0b',
    description: 'Học cách dùng trình duyệt web, tìm kiếm Google và truy cập website',
    tags: ['Internet', 'Google', 'Chrome'],
    steps: [
      {
        title: 'Mở trình duyệt web',
        content: `**Trình duyệt web là gì?**
 Comme là "cánh cửa" vào Internet!

**Các trình duyệt phổ biến:**
-  **Chrome** - Phổ biến nhất, do Google làm
-  **Edge** - Có sẵn trong Windows 11
-  **Firefox** - An toàn, bảo mật tốt

**Cách mở Chrome:**
1. Tìm biểu tượng Chrome  trên Desktop
2. **Double-click** để mở
3. Chờ trình duyệt tải xong

 **Mẹo:** Nếu không thấy biểu tượng, tìm trong Start Menu ( Windows)`,
        tip: 'Chrome là lựa chọn tốt nhất cho người mới bắt đầu!',
        exercise: 'Mở Chrome và quan sát giao diện'
      },
      {
        title: 'Tìm kiếm trên Google',
        content: `**Tìm kiếm Google - Đơn giản lắm!**

1.  Mở Chrome (trình duyệt)

2.  Nhìn vào **ô địa chỉ** ở trên cùng

3. ️ Gõ điều muốn tìm, ví dụ:
   - "thời tiết Hà Nội" ️
   - "công thức nấu phở" 
   - "bài hát Sơn Tùng mới nhất" 

4. ️ Nhấn **Enter**

5.  Kết quả hiện ra  Click vào đường link màu xanh!

**Mẹo tìm kiếm hiệu quả:**
- Gõ ngắn gọn, đủ ý
- Không cần gõ câu hoàn chỉnh`,
        tip: 'Google hiểu tiếng Việt rất tốt - cứ gõ tự nhiên thôi!',
        exercise: 'Thử tìm kiếm "hình ảnh mèo đẹp" và xem kết quả'
      },
      {
        title: 'Vào website trực tiếp',
        content: `**Địa chỉ website (URL) là gì?**
 Giống như địa chỉ nhà - mỗi trang web có địa chỉ riêng!

**Ví dụ địa chỉ phổ biến:**
- youtube.com  Xem video
- facebook.com  Mạng xã hội
- zalo.me  Chat Zalo trên web
- vnexpress.net  Đọc báo

**Cách vào website:**
1. Click vào **ô địa chỉ** (thanh trên cùng)
2. Xóa nội dung cũ (Ctrl + A rồi Delete)
3. **Gõ địa chỉ** website (VD: youtube.com)
4. Nhấn **Enter**

**Hiểu thanh địa chỉ:**
 Có ổ khóa = Website an toàn 
️ Không có ổ khóa = Cẩn thận!`,
        tip: 'Không cần gõ "https://" - gõ thẳng tên website là đủ!',
        exercise: 'Thử vào youtube.com và tìm một video bạn thích'
      }
    ]
  },
  {
    id: 'email-co-ban',
    title: 'Gửi & Nhận Email',
    emoji: '',
    category: 'Internet',
    level: 'Trung bình',
    duration: '25 phút',
    color: '#ec4899',
    description: 'Học cách tạo Gmail và gửi nhận email đơn giản',
    tags: ['Email', 'Gmail', 'Thư điện tử'],
    steps: [
      {
        title: 'Email là gì?',
        content: ` **Email = Thư điện tử**

Giống như gửi thư bình thường, nhưng:
-  **Nhanh hơn:** Đến nơi ngay lập tức
-  **Miễn phí:** Không cần tem, phong bì
-  **Toàn cầu:** Gửi được khắp nơi trên thế giới
-  **Tiện lợi:** Đính kèm ảnh, file dễ dàng

**Địa chỉ email trông như thế này:**
 **tên@gmail.com**
 **tên@yahoo.com**

**Gmail của Google** - phổ biến và miễn phí nhất!

 Mọi người đều cần email để:
- Đăng ký tài khoản online
- Liên lạc công việc
- Nhận thông báo quan trọng`,
        tip: 'Gmail.com là lựa chọn tốt nhất - miễn phí và dễ dùng!',
        exercise: 'Hỏi người thân xem họ dùng email gì nhé'
      },
      {
        title: 'Tạo tài khoản Gmail',
        content: `**Tạo Gmail miễn phí:**

1. Mở Chrome  Gõ **gmail.com**  Enter

2. Click **"Tạo tài khoản"** (Create account)

3. Điền thông tin:
   -  Họ và tên của bạn
   -  Chọn địa chỉ email (vd: nguyenvana2024)
   -  Đặt mật khẩu (ít nhất 8 ký tự)

4. Xác nhận số điện thoại

5.  Hoàn thành!

**Mẹo đặt địa chỉ email:**
- Dùng tên thật của bạn: nguyenvana
- Hoặc thêm số: nguyenvana1960
- Tránh các ký tự khó nhớ`,
        tip: 'Ghi nhớ hoặc viết ra mật khẩu ngay sau khi tạo!',
        exercise: 'Thực hành tạo Gmail với sự hỗ trợ của người thân'
      },
      {
        title: 'Gửi email đầu tiên',
        content: `**Soạn và gửi email:**

1. Vào **gmail.com**  Đăng nhập

2. Click nút **"Soạn thư"** (Compose) - góc trái

3. Điền vào form:
   - **Đến (To):** Địa chỉ email người nhận
   - **Chủ đề (Subject):** Tiêu đề email
   - **Nội dung:** Viết thư của bạn

4. Click **"Gửi"** (Send) - nút xanh

**Ví dụ thực tế:**
- To: con_ban@gmail.com
- Subject: Chúc mừng sinh nhật
- Body: Chúc con sinh nhật vui vẻ, học giỏi! 

**Đính kèm ảnh:**
 Click biểu tượng kẹp giấy  Chọn ảnh  OK`,
        tip: 'Kiểm tra địa chỉ email người nhận thật kỹ trước khi gửi!',
        exercise: 'Gửi email thử nghiệm đến chính địa chỉ email của bạn'
      }
    ]
  },
  {
    id: 'an-toan-mang',
    title: 'An Toàn Trên Mạng',
    emoji: '',
    category: 'An Toàn',
    level: 'Quan trọng',
    duration: '30 phút',
    color: '#ef4444',
    description: 'Học cách bảo vệ bản thân, tránh lừa đảo và giữ an toàn khi dùng Internet',
    tags: ['Bảo mật', 'Lừa đảo', 'Mật khẩu'],
    steps: [
      {
        title: 'Mật khẩu mạnh là gì?',
        content: ` **Mật khẩu yếu = Cửa nhà không khóa!**

**Mật khẩu YẾU (dễ bị hack):**
 123456
 password
 tên + ngày sinh (nguyenan1960)
 Quá ngắn (dưới 8 ký tự)

**Mật khẩu MẠNH:**
 Ít nhất 8 ký tự
 Có chữ HOA + chữ thường
 Có số
 Có ký tự đặc biệt (!@#$)

**Ví dụ mật khẩu mạnh:**
- MeoCon@2024!
- BanThanMoi#567

**Quy tắc vàng:**
-  Không dùng chung mật khẩu cho nhiều tài khoản
-  Ghi mật khẩu vào sổ tay giấy, cất nơi an toàn
-  Đổi mật khẩu mỗi 3-6 tháng`,
        tip: 'Dùng câu câu mình yêu thích làm mật khẩu - dễ nhớ mà mạnh!',
        exercise: 'Tạo 1 mật khẩu mạnh cho mình theo hướng dẫn trên'
      },
      {
        title: 'Nhận diện lừa đảo',
        content: `️ **Cảnh báo:** Kẻ xấu thường dùng nhiều chiêu trò!

**Dấu hiệu LỪA ĐẢO:**
 "Bạn đã trúng thưởng X triệu đồng!"
 "Tài khoản ngân hàng của bạn bị khóa!"
 "Nhấn vào đây để nhận quà miễn phí!"
 Yêu cầu gửi tiền gấp để "giải cứu" ai đó
 Yêu cầu cung cấp OTP qua điện thoại/Zalo

**Khi nhận được tin nhắn lạ:**
1.  **Dừng lại** - đừng vội làm gì
2.  **Nghi ngờ** - tại sao họ liên hệ mình?
3.  **Gọi điện kiểm tra** - hỏi trực tiếp người thân/ngân hàng
4.  **Không click** vào link lạ
5.  **Không cung cấp** số CMND, mật khẩu, OTP`,
        tip: 'Nguyên tắc: "Miễn phí quá tốt thường là BẪY!"',
        exercise: 'Chia sẻ bài học này với người thân để cùng phòng tránh'
      },
      {
        title: 'Bảo vệ thông tin cá nhân',
        content: ` **Thông tin cần TUYỆT ĐỐI giữ bí mật:**

 Mật khẩu (không cho ai biết, kể cả người thân)
 Mã OTP (6 số gửi qua SMS)
 Số thẻ ngân hàng + mã CVV (3 số sau thẻ)
 Số CMND/CCCD

**Cài đặt an toàn:**
 Bật khóa màn hình máy tính
 Đăng xuất khi dùng máy tính công cộng
 Không kết nối Wifi lạ khi giao dịch ngân hàng
 Cập nhật Windows thường xuyên

**Facebook/Zalo an toàn:**
- Không chấp nhận kết bạn người lạ
- Không chia sẻ địa chỉ nhà trên mạng
- Cài đặt riêng tư: chỉ "Bạn bè" xem được`,
        tip: 'Ngân hàng và cơ quan nhà nước KHÔNG BAO GIỜ hỏi mật khẩu qua điện thoại!',
        exercise: 'Kiểm tra cài đặt riêng tư Facebook của bạn ngay hôm nay'
      }
    ]
  },
  {
    id: 'tin-hoc-word',
    title: 'Word Soạn Thảo',
    emoji: '📝',
    category: 'Văn Phòng',
    level: 'Cơ bản',
    duration: '25 phút',
    color: '#2563eb',
    description: 'Kỹ năng soạn thảo văn bản, định dạng font chữ, giãn dòng và in ấn tài liệu',
    tags: ['Word', 'Văn bản', 'In ấn'],
    steps: [
      {
        title: 'Làm quen giao diện Word',
        content: `**Giao diện chính:**\n\n- **Ribbon (Thanh công cụ):** Nằm trên cùng chứa toàn bộ tính năng.\n- **Thẻ Home:** Nơi chứa các công cụ hay dùng nhất (chữ đậm, chữ nghiêng, tô màu).\n- **Thẻ Insert:** Dùng để chèn hình ảnh, bảng biểu.\n- **Trang giấy:** Vùng màu trắng ở giữa để bạn gõ văn bản.\n\n**Thao tác cơ bản:**\n1. Mở Word > Chọn 'Blank document' (Tài liệu trắng).\n2. Gõ bàn phím.\n3. Nhấn Enter để xuống dòng.`,
        tip: 'Lưu ý bật Unikey trước khi gõ để viết được có dấu nhé!',
        exercise: 'Mở Word, gõ một bài thơ gồm 4 dòng và lưu lại.'
      },
      {
        title: 'Định dạng chữ (Font) và Đoạn văn',
        content: `**Trang điểm cho chữ (Font):**\n- Quét khối (bôi đen) chữ cần chọn.\n- **Chữ Đậm (B) / Chữ Nghiêng (I) / Gạch Chân (U)**\n- Chọn cỡ chữ (13 hoặc 14 là chuẩn).\n- Đổi màu chữ bằng biểu tượng chữ A có gạch màu dưới chân.\n\n**Định dạng Đoạn (Paragraph):**\n- Căn trái, Căn giữa, Căn phải, Căn đều 2 bên (Justify).\n- Giãn dòng (Line spacing): Chuẩn là 1.15 hoặc 1.5.`,
        tip: 'Quy tắc vàng: Luôn "bôi đen" trước rồi mới định dạng sau!',
        exercise: 'Bôi đen dòng tiêu đề bài thơ, chọn Chữ Đậm và Căn Giữa.'
      }
    ]
  },
  {
    id: 'tin-hoc-excel',
    title: 'Excel Bảng Tính',
    emoji: '📊',
    category: 'Văn Phòng',
    level: 'Trung bình',
    duration: '35 phút',
    color: '#16a34a',
    description: 'Thiết kế bảng biểu, làm quen các hàm tính toán cơ bản như SUM, AVERAGE',
    tags: ['Excel', 'Bảng tính', 'Tính toán'],
    steps: [
      {
        title: 'Khái niệm Ô, Hàng, Cột',
        content: `**Excel là cuốn vở ô ly khổng lồ!**\n\n- **Cột (Column):** Các cột dọc được đánh dấu bằng chữ cái A, B, C...\n- **Hàng (Row):** Các hàng ngang được đánh số 1, 2, 3...\n- **Ô (Cell):** Sự giao thoa giữa 1 cột và 1 hàng. Ví dụ: A1, B5, C10.\n\n**Cách nhập dữ liệu:**\n1. Click chuột vào 1 ô.\n2. Gõ số hoặc chữ.\n3. Bấm Tab để sang phải, hoặc Enter để xuống dưới.`,
        tip: 'Muốn sửa chữ trong một ô đã gõ, hãy click ĐÚP chuột (2 lần) vào ô đó!',
        exercise: 'Mở Excel, tạo 3 cột: STT, Tên, Số Lượng và điền 2 dòng dữ liệu.'
      },
      {
        title: 'Tính toán cơ bản (SUM, AVERAGE)',
        content: `**Luôn bắt đầu phép tính bằng dấu BẰNG (=)**\n\nVí dụ: Gõ '=5+5' rồi Enter sẽ ra 10.\n\n**Sử dụng Hàm tự động (Functions):**\n- **Hàm SUM (Cộng tổng):** \nGõ '=SUM(A1:A5)' để cộng tất cả các số từ ô A1 đến A5.\n- **Hàm AVERAGE (Trung bình cộng):**\nGõ '=AVERAGE(B1:B3)'.\n\n*Trò ảo thuật Kéo thả:* Trỏ chuột vào góc dưới bên phải của ô kết quả (hiện dấu thập đen), click giữ và KÉO xuống để copy công thức!`,
        tip: 'Hãy tận dụng nút AutoSum (biểu tượng ∑) ở góc trên bên phải để cộng nhanh!',
        exercise: 'Sử dụng hàm SUM để tính tổng cột "Số lượng" bạn vừa tạo.'
      }
    ]
  },
  {
    id: 'tin-hoc-powerpoint',
    title: 'PowerPoint Trình Chiếu',
    emoji: '📽️',
    category: 'Văn Phòng',
    level: 'Cơ bản',
    duration: '20 phút',
    color: '#ea580c',
    description: 'Thiết kế slide thuyết trình, hiệu ứng chuyển động và cách trình chiếu',
    tags: ['Thuyết trình', 'Slide', 'Hiệu ứng'],
    steps: [
      {
        title: 'Tạo Slide chuyên nghiệp',
        content: `**Slide là gì?**\nSlide giống như 1 trang chiếu bóng.\n\n**Cách tạo:**\n1. Mở PowerPoint, chọn một Theme (Mẫu) màu sắc đẹp có sẵn.\n2. Click vào 'Click to add title' để nhập Tiêu đề lớn.\n3. Click vào nút 'New Slide' để tạo trang bấm tiếp theo.\n\n**Chèn hình minh họa:**\nVào thẻ Insert > Pictures > Chọn một ảnh trên máy để chèn vào. Bấm giữ các góc của khung ảnh để thu phóng.`,
        tip: 'Mỗi Slide nên có thật ít chữ (Quy tắc 6x6: Không quá 6 dòng, mỗi dòng không quá 6 chữ)!',
        exercise: 'Tạo 2 slide: Slide 1 ghi Tên Bạn, Slide 2 ghi Sở Thích.'
      },
      {
        title: 'Hiệu ứng (Animations) và Trình chiếu',
        content: `**Làm Slide bay nhảy:**\n1. Bôi đen dòng chữ hoặc chọn hình ảnh.\n2. Vào thẻ **Animations**, bấm chọn 1 hiệu ứng màu xanh lá (như Fade, Fly In, Float In...). Chữ sẽ có số [1] nhỏ hiện kế bên.\n\n**Chuyển trang (Transitions):**\nVào thẻ **Transitions**, chọn một hiệu ứng mở màn đẹp (Push, Wipe, Dissolve) cho cả Slide.\n\n**Bắt đầu diễn thuyết!**\nNhấn phím thần thánh **F5** trên bàn phím để phóng to toàn màn hình. Nhấn phím Mũi tên Phải/Trái để lật trang. Chọn ESC để thoát về.`,
        tip: 'Hiệu ứng "Fade" là hiệu ứng lịch sự, chuyên nghiệp, ít gây rối mắt người xem nhất!',
        exercise: 'Thêm hiệu ứng Fly In cho tên của bạn và nhấn F5 để xem.'
      }
    ]
  }
]

export const CATEGORIES = ['Tất cả', 'Cơ Bản', 'Văn Phòng', 'Internet', 'An Toàn']

export const QUICK_TIPS = [
  { tip: 'Nhấn Ctrl+S để thường xuyên lưu kết quả làm việc.' },
  { tip: 'Nhấn F5 để tải lại bản trình bày.' },
  { tip: 'Dùng phím Win+D để thu gọn toàn bộ về màn hình Desktop.' },
  { tip: 'Nhấn Win+L để lập tức khoá màn hình bảo mật máy tính.' },
  { tip: 'Không bao giờ nhấp vào liên kết đáng ngờ trên Internet.' },
  { tip: 'Kết hợp video bài học, quiz và chat AI để ôn đều đặn — tối ưu hiệu quả học online.' },
]
