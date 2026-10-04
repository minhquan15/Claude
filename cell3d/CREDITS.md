# Nguồn tham khảo và ghi công

Toàn bộ hình học 3D (màng, nhân, lưới nội chất, Golgi, ti thể, v.v.) được **dựng bằng mã** trong `src/builders/`.
Không có model 3D, texture hay HDRI nào được tải về. Các tài nguyên bên ngoài duy nhất là thư viện và font dưới đây,
đều được lưu tại chỗ (`vendor/`) nên trang chạy được khi offline.

## Thư viện

- **three.js r186** (phiên bản 0.186.1). Tác giả: các tác giả three.js. Giấy phép: MIT. URL: https://threejs.org · https://github.com/mrdoob/three.js. Đã chỉnh sửa: không (chép nguyên `build/three.module.js` và `build/three.core.js`). Thư mục: `vendor/three/`.
- **Các addon của three.js** (cùng gói, cùng giấy phép MIT, không chỉnh sửa): `OrbitControls`, `CSS2DRenderer`, `BufferGeometryUtils`, `RoomEnvironment` (ánh sáng môi trường dựng bằng mã, không dùng ảnh HDRI). Thư mục: `vendor/three/addons/`.

## Font

- **Be Vietnam Pro** (các độ đậm 400, 600, 700; bộ ký tự latin, latin-ext, vietnamese). Tác giả: The Be Vietnam Pro Project Authors. Giấy phép: SIL Open Font License 1.1 (OFL). URL: https://github.com/bettergui/BeVietnamPro · https://fonts.google.com/specimen/Be+Vietnam+Pro. Lấy từ gói npm `@fontsource/be-vietnam-pro` 5.3.0 (tệp woff2). Đã chỉnh sửa: không. Thư mục: `vendor/fonts/` (kèm `OFL.txt`).

## Tài liệu khoa học tham khảo (không chép nguyên văn)

Nội dung chữ trong `src/data/organelles.js` do chúng tôi tự viết lại bằng lời của mình, đối chiếu với:

- OpenStax, *Biology 2e*, chương 4 "Cell Structure" (CC BY 4.0). https://openstax.org/books/biology-2e/pages/4-introduction
- Alberts và cộng sự, *Molecular Biology of the Cell* (chỉ để tham khảo kích thước và số liệu).
- Sách giáo khoa Sinh học 10, phần "Cấu trúc của tế bào" (chỉ để thống nhất thuật ngữ tiếng Việt).

## Tài nguyên không dùng

- Không dùng tài nguyên CC-NC, CC-ND, không rõ giấy phép, hoặc cần đăng nhập/trả phí.
- Không có model Sketchfab, NIH 3D, Smithsonian 3D, Poly Haven hay ambientCG nào trong bản này.
