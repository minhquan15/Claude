# Nhiệm vụ: Mô hình tế bào động vật 3D tương tác bằng Three.js

Bạn là kỹ sư đồ họa web kiêm người làm nội dung sinh học. Hãy xây một trang web tương tác trình diễn **tế bào động vật nhân thực** ở dạng 3D, chạy mượt trên điện thoại. Làm việc tự chủ từ đầu đến cuối: tự tra cứu, tự tải tài nguyên, tự kiểm tra bằng ảnh chụp màn hình và tự sửa, rồi mới báo cáo.

## 0. Thông số mặc định (người dùng có thể sửa)

- **Đối tượng:** học sinh THPT (chương "Cấu trúc tế bào", Sinh học 10).
- **Ngôn ngữ giao diện:** tiếng Việt. Có thể kèm thuật ngữ tiếng Anh trong ngoặc, ví dụ "Ti thể (Mitochondria)".
- **Thư mục sản phẩm:** `cell3d/` ở gốc repo.
- **Git:** commit theo từng giai đoạn trên nhánh hiện tại, push khi xong.

## 1. Quyền và nguồn tài nguyên

Bạn **được phép** tra cứu web, đọc tài liệu và tải thư viện, font, texture, model 3D, HDRI miễn phí. Kèm theo các điều kiện sau:

- **Giấy phép:**
  - Chỉ dùng tài nguyên CC0, CC-BY, MIT, Apache hoặc OFL.
  - Không dùng CC-NC, CC-ND, tài nguyên không rõ giấy phép, hay tài nguyên phải đăng nhập hoặc trả phí.
  - Ghi đầy đủ nguồn vào `cell3d/CREDITS.md`, gồm tên, tác giả, URL, giấy phép và việc đã chỉnh sửa gì. Trong giao diện có nút "Nguồn tham khảo" hiện nội dung này.
- **Nguồn gợi ý:**
  - Texture và HDRI: Poly Haven, ambientCG (CC0).
  - Model: NIH 3D, Sketchfab (chỉ bản CC-BY hoặc CC0 cho tải về), Smithsonian 3D (CC0).
  - Font: Google Fonts, chọn font hỗ trợ đủ dấu tiếng Việt như Be Vietnam Pro hoặc Inter.
- **Lưu tài nguyên tại chỗ:** tải mọi thứ vào `cell3d/vendor/` và `cell3d/assets/`. **Không hotlink CDN lúc chạy**, để trang hoạt động cả khi offline. Three.js ghim một phiên bản cụ thể (r17x mới nhất), nạp addon qua importmap trỏ tới file cục bộ.
- **Thư viện được dùng:** three (kèm addons: OrbitControls, CSS2DRenderer, GLTFLoader, DRACOLoader, KTX2Loader, BufferGeometryUtils, RoomEnvironment), có thể thêm GSAP hoặc tween.js cho chuyển động camera, lil-gui cho bảng debug (chỉ bật qua `?debug`). Không dùng framework UI nặng.
- **Ưu tiên dựng bằng code.** Chỉ dùng model tải về khi nó đẹp hơn rõ rệt và vẫn nằm trong ngân sách hiệu năng (mục 6). Model tải về phải nén Draco/Meshopt, tổng dung lượng `assets/` dưới 8 MB.
- **Tham khảo khoa học:** đối chiếu nội dung với OpenStax Biology 2e (chương 4), Alberts *Molecular Biology of the Cell*, hoặc SGK Sinh học 10. Không chép nguyên văn, viết lại bằng lời của bạn.

## 2. Nội dung sinh học

### 2.1 Danh sách bào quan

Mỗi bào quan có tên, màu nhận diện, 1–2 câu chức năng và một "điều thú vị" ngắn.

1. Màng sinh chất (kèm lớp actin vỏ ngay bên dưới)
2. Tế bào chất / bào tương
3. Nhân: màng nhân kép, lỗ nhân, chất nhiễm sắc
4. Hạch nhân (nhân con)
5. Lưới nội chất hạt
6. Lưới nội chất trơn
7. Ribosome: tự do và bám trên lưới nội chất hạt
8. Bộ máy Golgi
9. Túi vận chuyển và túi tiết
10. Ti thể
11. Lysosome
12. Peroxisome
13. Trung thể: hai trung tử vuông góc nhau
14. Bộ xương tế bào: vi ống, sợi trung gian, vi sợi actin

### 2.2 Quan hệ vị trí bắt buộc (kiểm tra lại khi xong)

- Màng ngoài của nhân **nối liền** với lưới nội chất hạt.
- Lưới nội chất trơn nằm xa nhân hơn, có dạng ống phân nhánh và nối tiếp với lưới nội chất hạt.
- Golgi nằm gần nhân và gần trung thể. **Mặt cis quay về phía lưới nội chất, mặt trans quay ra phía màng.**
- Trung thể nằm sát nhân. Vi ống **tỏa ra từ trung thể** về phía màng, còn actin tạo lớp vỏ dưới màng.
- Ti thể phân bố rải rác trong tế bào chất, không chồng vào các bào quan khác.

### 2.3 Số lượng hiển thị

| Thành phần | Số lượng |
|---|---|
| Ti thể | 14–20 |
| Lysosome | 6–10 |
| Peroxisome | 6–10 |
| Lỗ nhân | khoảng 150–250 |
| Ribosome | 3.000–8.000 (instanced) |
| Đĩa Golgi | 5–7 |

### 2.4 Tỉ lệ

Tỉ lệ được **cách điệu** nhưng phải giữ đúng thứ tự lớn nhỏ: tế bào > nhân > ti thể ≈ Golgi > lysosome ≈ peroxisome > túi > ribosome. Trên giao diện ghi chú: "Tỉ lệ đã được phóng đại để dễ quan sát", kèm kích thước thật của từng bào quan trong thẻ thông tin. Ví dụ ti thể dài khoảng 1–2 µm, ribosome khoảng 25–30 nm.

## 3. Dựng hình

### 3.1 Màng tế bào

- Hình cầu hơi dẹt, biến dạng bằng noise.
- Vật liệu trong mờ, có viền fresnel.
- Có một vết cắt mặc định để nhìn được vào trong.

### 3.2 Nhân

- Màng kép gồm hai vỏ cầu sát nhau.
- Lỗ nhân dùng InstancedMesh, phân bố bằng Fibonacci sphere.
- Hạch nhân đặc, màu đậm hơn.
- Có gợi ý chất nhiễm sắc bằng vài đường cong mờ hoặc noise trong shader.

### 3.3 Lưới nội chất

- Lưới nội chất hạt là các tấm cong gấp nếp đồng tâm quanh nhân, có ribosome instanced bám trên bề mặt.
- Lưới nội chất trơn là mạng ống, dựng bằng TubeGeometry theo đường Catmull-Rom. Có thể gộp các ống bằng BufferGeometryUtils.

### 3.4 Golgi

- Chồng đĩa cong dẹt, mép phình ra.
- Túi nhỏ ở hai mặt cis và trans.

### 3.5 Ti thể

- Dạng viên nang.
- Một số ti thể bị cắt lát, để lộ màng trong gấp nếp (cristae) và chất nền.

### 3.6 Trung thể

- Mỗi trung tử gồm 9 bộ ba vi ống xếp vòng.
- Hai trung tử đặt vuông góc nhau.

### 3.7 Bộ xương tế bào

Các sợi dựng theo đường Catmull-Rom, ba loại phân biệt bằng màu và độ dày.

### 3.8 Bề mặt và ánh sáng

- **Bề mặt:** texture vẽ bằng canvas, shader noise, hoặc texture CC0 đã tải. Tối đa 1024 px mỗi chiều.
- **Ánh sáng:**
  - Môi trường: RoomEnvironment hoặc một HDRI nhỏ.
  - HemisphereLight cùng một DirectionalLight.
  - **Không dùng bóng đổ.**
  - Màu sắc tươi, kiểu minh họa giáo khoa, nhưng không chói.

### 3.9 Ngẫu nhiên có seed

Mọi phép ngẫu nhiên dùng **PRNG có seed** (ví dụ mulberry32), để mỗi lần tải ra cùng một bố cục.

## 4. Tương tác và giao diện

- **Điều khiển:**
  - Xoay, zoom, pan bằng chuột và cảm ứng (OrbitControls có damping).
  - Giới hạn khoảng zoom để không đi xuyên ra ngoài vô nghĩa.
- **Chọn bào quan:**
  - Raycast toàn cảnh. Với InstancedMesh, dùng `instanceId` để xác định đúng bào quan.
  - Phân biệt chạm với kéo bằng ngưỡng di chuyển khoảng 6 px.
  - Bào quan được chọn sẽ phát sáng hoặc có viền. Các bào quan khác mờ đi.
  - Camera bay tới bào quan được chọn và hiện thẻ thông tin.
- **Danh sách bào quan:** một panel dạng nút bấm, là cách chọn thứ hai bên cạnh chạm trực tiếp (bắt buộc, vì ribosome quá nhỏ để chạm trúng).
  - Trên điện thoại: bottom sheet.
  - Trên máy tính: sidebar.
- **Thanh trượt cắt lớp:**
  - Dùng `clippingPlanes` cùng `renderer.localClippingEnabled`.
  - Mặt bị cắt phải được tô màu mặt trong, không để lộ chỗ rỗng.
  - Có nút chọn trục cắt.
- **Nhãn:**
  - Có nút bật/tắt.
  - Dùng CSS2DRenderer, có đường chỉ dẫn.
  - Ẩn nhãn khi bị che hoặc ở phía sau.
  - Tránh nhãn chồng nhau trên màn hình dọc.
- **Chế độ tham quan:**
  - Đi lần lượt qua từng bào quan, camera chuyển mượt, hiện thẻ thông tin, mỗi điểm dừng khoảng 6 giây.
  - Có nút tạm dừng, tiếp, trước, sau.
  - Người dùng chạm vào cảnh thì tour tự tạm dừng.
- **Chế độ "Đường đi của protein":** tô sáng lộ trình vận chuyển protein, có chú thích từng bước.
- **Nút khác:** đặt lại camera, toàn màn hình, nguồn tham khảo.
- **Khả năng tiếp cận:**
  - Điều khiển được bằng bàn phím (Tab, Enter, mũi tên trong tour).
  - Có `aria-label` cho các nút.
  - Tương phản chữ đạt chuẩn WCAG AA.
- **Màn hình tải:** có thanh tiến độ khi nạp tài nguyên.

## 5. Chuyển động

- **Màng:** nhấp nhô nhẹ bằng vertex shader. Không tính lại hình học trên CPU mỗi khung hình.
- **Ti thể:** trôi và xoay rất chậm quanh vị trí gốc.
- **Đường vận chuyển protein** chạy lặp liên tục, tách thành từng bước sau:
  1. Lưới nội chất hạt
  2. Túi vận chuyển
  3. Mặt cis Golgi
  4. Đi qua các đĩa Golgi
  5. Mặt trans Golgi
  6. Túi tiết
  7. Hòa màng (xuất bào). Túi phải thực sự hòa vào màng, không biến mất đột ngột.
- **Vi ống:** có thể có xung sáng nhẹ chạy dọc, gợi ý protein motor.
- **Giảm chuyển động:**
  - Tôn trọng `prefers-reduced-motion`: tắt chuyển động trang trí, camera chuyển cảnh ngay thay vì bay.
  - Tạm dừng render khi tab bị ẩn.

## 6. Ngân sách hiệu năng (áp dụng từ đầu, không để cuối)

- **Hình học:**
  - Tổng dưới 300k tam giác.
  - Dưới 100 draw call. Dùng instancing và gộp geometry tĩnh.
- **Kết xuất:**
  - `renderer.setPixelRatio(Math.min(devicePixelRatio, 2))`.
  - Tự hạ xuống 1.5 nếu FPS dưới 40 kéo dài.
- **Mục tiêu tốc độ:**
  - Ít nhất 45 fps trên điện thoại tầm trung.
  - Tải xong và hiện cảnh dưới 3 giây trên 4G.
- **Debug:** khi mở bằng `?debug`, hiện FPS, số tam giác và số draw call (lấy từ `renderer.info`).
- **Dọn dẹp:**
  - Giải phóng geometry và material không dùng.
  - Không tạo object mới trong vòng lặp render.

## 7. Cấu trúc code

```
cell3d/
  index.html
  src/
    main.js            // khởi tạo, vòng lặp render
    data/organelles.js // MẢNG CẤU HÌNH: id, tên, mô tả, điều thú vị, kích thước thật, màu, vị trí, góc camera tour
    builders/*.js      // mỗi bào quan một hàm build(rng) trả về Object3D
    interaction/*.js   // picking, tour, clipping, labels
    ui/*.js, styles.css
  vendor/  assets/  CREDITS.md  README.md
```

Nội dung chữ chỉ được viết trong `organelles.js`, để sửa nội dung không cần đụng vào code dựng hình. Dùng ES modules, không cần bước build. README ghi cách chạy, ví dụ `npx serve cell3d` hoặc `python3 -m http.server`.

## 8. Thứ tự làm

Commit sau mỗi bước, và mỗi bước kết thúc bằng chụp màn hình cùng đọc `renderer.info`.

1. **Khung:**
   - Dựng scene, camera, controls, ánh sáng, màng tế bào.
   - Tạo mảng dữ liệu `organelles.js`.
   - Làm sẵn picking, thẻ thông tin và danh sách bào quan, để từ đây mỗi bào quan làm xong là chạm thử được ngay.
2. Nhân, hạch nhân, lỗ nhân, lưới nội chất hạt và trơn, ribosome.
3. Golgi, ti thể, lysosome, peroxisome, trung thể, bộ xương tế bào.
4. Cắt lớp, nhãn, tham quan, chế độ "Đường đi của protein".
5. Chuyển động.
6. Hoàn thiện giao diện, khả năng tiếp cận, màn hình tải, CREDITS, README.
7. Kiểm tra toàn diện (mục 9) và sửa lỗi.

## 9. Kiểm tra và nghiệm thu

### 9.1 Chụp màn hình

Dùng Playwright với Chromium đã cài sẵn, không chạy `playwright install`. Nếu WebGL không chạy trong chế độ headless, thêm `--use-angle=swiftshader --enable-unsafe-swiftshader`.

Chụp ở các khung hình:
- 390×844 (điện thoại dọc)
- 844×390 (điện thoại ngang)
- 1440×900 (máy tính)

Với mỗi khung hình, chụp các trạng thái:
1. Mặc định
2. Đang cắt lớp 50%
3. Đang chọn ti thể (có thẻ thông tin)
4. Bật nhãn
5. Giữa tour
6. Chế độ "Đường đi của protein"

Lưu ảnh vào `cell3d/screenshots/`. **Tự mở và xem lại từng ảnh**, sửa mọi lỗi nhìn thấy: chữ tràn, nhãn chồng nhau, vật thể xuyên nhau, mặt cắt bị rỗng, màu tối.

### 9.2 Danh sách nghiệm thu

Tất cả phải đạt:
- [ ] Console không có lỗi hay cảnh báo nào trong suốt các kịch bản ở mục 9.1.
- [ ] Mở trực tiếp file `index.html` hoặc qua server tĩnh đều chạy, kể cả khi offline. Nếu `file://` bị chặn module, ghi rõ trong README.
- [ ] Số tam giác, draw call và fps đạt ngân sách ở mục 6. Báo con số đo thực tế.
- [ ] Chọn được cả 14 bào quan, bằng chạm và bằng danh sách.
- [ ] Các quan hệ vị trí ở mục 2.2 đều đúng. Kiểm tra từng ý và ghi kết quả.
- [ ] Toàn bộ nội dung chữ tiếng Việt có dấu đúng, nhất quán thuật ngữ SGK, đúng khoa học.
- [ ] CREDITS.md đầy đủ. Không có tài nguyên nào sai giấy phép.
- [ ] Không có WebGL thì hiện thông báo thân thiện, không để màn hình trắng.

## 10. Báo cáo khi xong

Báo cáo gồm:
- Đường dẫn file và cách chạy.
- Bảng kết quả nghiệm thu, kèm số đo thực tế.
- Danh sách tài nguyên bên ngoài đã dùng.
- 3–4 ảnh chụp tiêu biểu.
- Những điểm còn hạn chế hoặc đã đơn giản hóa, nói thẳng, không che giấu.
- Gợi ý bước tiếp theo.

Nếu gặp quyết định thực sự mơ hồ, chọn phương án hợp lý nhất, ghi lại lý do trong báo cáo và làm tiếp, không dừng lại để hỏi.
