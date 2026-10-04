# Mô hình tế bào động vật 3D (Three.js)

Trang web tương tác trình diễn **tế bào động vật nhân thực** ở dạng 3D, dành cho học sinh THPT
(chương "Cấu trúc tế bào", Sinh học 10). Giao diện tiếng Việt, chạy được trên điện thoại, **hoạt động cả khi offline**.
Toàn bộ hình học được dựng bằng mã (không có model 3D tải về).

## Cách chạy

Trang dùng ES module và importmap trỏ tới file cục bộ nên cần một **máy chủ tĩnh**
(mở thẳng `index.html` bằng `file://` bị trình duyệt chặn module, trang sẽ hiện nhắc nhở thay vì màn hình trắng).

```bash
# từ gốc repo, một trong các cách sau
npx serve cell3d
python3 -m http.server 8080 --directory cell3d
python3 cell3d/tools/serve.py 8080
```

Sau đó mở `http://localhost:8080`. Thêm `?debug` vào địa chỉ để hiện FPS, số tam giác và số draw call.

Không cần bước build, không có phụ thuộc lúc chạy ngoài các tệp trong `vendor/`.

## Cách dùng

| Thao tác | Cách làm |
|---|---|
| Xoay / thu phóng / dịch | Kéo, cuộn hoặc chụm hai ngón (OrbitControls có quán tính) |
| Chọn bào quan | Chạm vào bào quan, hoặc chọn trong tab **Bào quan** (bắt buộc dùng danh sách cho ribosome vì rất nhỏ) |
| Cắt lớp | Tab **Công cụ**: thanh trượt, chọn trục X/Y/Z, đổi phía cắt |
| Nhãn | Nút thẻ ở góc trên phải hoặc tab **Công cụ** |
| Tham quan | Tab **Công cụ** → **Tham quan** (mỗi điểm 6 giây, có Trước / Sau / Tạm dừng; phím ← → khi đang tham quan; chạm vào cảnh để tạm dừng) |
| Đường đi của protein | Tab **Công cụ** → **Đường đi của protein** (7 bước, lặp liên tục, có thể tạm dừng hoặc nhảy bước) |
| Khác | Đặt lại camera, toàn màn hình, **Nguồn tham khảo** |

Điều khiển bằng bàn phím: Tab / Shift+Tab để di chuyển, Enter hoặc Space để bấm, mũi tên trái-phải để đổi tab,
đổi điểm tham quan hoặc bước protein, Esc để thoát chế độ.
Hệ thống tôn trọng `prefers-reduced-motion`: tắt chuyển động trang trí, camera chuyển cảnh ngay, đường đi protein khởi động ở trạng thái tạm dừng.

## Cấu trúc

```
cell3d/
  index.html
  src/
    main.js              khởi tạo, vòng lặp render, tự hạ độ phân giải khi FPS thấp
    layout.js            hằng số bố cục tế bào dùng chung (vị trí nhân, Golgi, ellipsoid màng, chỗ đã chiếm)
    util.js              PRNG mulberry32, nhiễu có seed, Fibonacci sphere, easing
    data/organelles.js   MỌI nội dung chữ: tên, chức năng, điều thú vị, kích thước thật, màu, vị trí, góc camera, các bước, chuỗi giao diện
    builders/*.js        mỗi bào quan một hàm build(rng, ctx) trả về Object3D (membrane, nucleus, rer, ser, ribosome, golgi,
                         mitochondria, smallorganelles, centrosome, cytoskeleton, pathway) + materials.js + world.js
    interaction/*.js     cameraRig, picking, clipping, labels, tour, pathwayMode, highlight, selection
    ui/*.js, styles.css  bảng điều khiển (bottom sheet / sidebar), thanh công cụ, màn hình tải, hộp thoại nguồn
  vendor/                three.js r186 (+ addon cần dùng), font Be Vietnam Pro (lưu tại chỗ)
  assets/                (trống: không dùng model/texture tải về)
  tools/                 serve.py, scenarios.mjs (chụp màn hình), verify.mjs (kiểm tra nghiệm thu), tris.mjs, shot.mjs
  screenshots/           ảnh chụp 3 khung hình x 6 trạng thái
  CREDITS.md             nguồn và giấy phép
```

**Sửa nội dung** (tên, mô tả, màu, chuỗi giao diện, thứ tự tham quan, các bước protein) chỉ cần sửa `src/data/organelles.js`.
Tọa độ `position`/`cam` trong file đó là gợi ý; bộ dựng "bắt" vào vật thể thật gần nhất (ví dụ ribosome gắn trên lưới nội chất).
Mọi phép ngẫu nhiên dùng PRNG có seed (`SEED` trong `layout.js`) nên mỗi lần tải ra cùng một bố cục.

## Kiểm tra tự động

Cần Playwright và Chromium. Chạy máy chủ ở cổng 8123 rồi:

```bash
python3 cell3d/tools/serve.py 8123 &
node cell3d/tools/scenarios.mjs cell3d/screenshots   # chụp 18 ảnh, báo cảnh báo/lỗi console
node cell3d/tools/verify.mjs                          # chọn bằng chạm/danh sách, quan hệ vị trí, số đếm, mạng, không WebGL
node cell3d/tools/tris.mjs                            # số tam giác theo từng mesh
```

Trong môi trường không có GPU, thêm `--use-angle=swiftshader --enable-unsafe-swiftshader` (các script đã bật sẵn).
