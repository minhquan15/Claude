# Grok Studio

Giao diện web chạy trên máy bạn để tạo ảnh và video bằng xAI (Grok) API. Không cần cài thêm thư viện, chỉ cần Python 3.

## Chạy

```bash
cd grok-studio
cp .env.example .env      # rồi mở .env, dán XAI_API_KEY của bạn
python3 server.py
```

Mở http://127.0.0.1:8000. File tạo ra được lưu trong `outputs/`.

## Dùng

- **Ảnh**: nhập prompt, bấm Tạo. Chọn ảnh tham chiếu để sửa ảnh (`/v1/images/edits`).
- **Video**: nhập prompt, tuỳ chọn ảnh → video, bấm Tạo. App sẽ chờ và tự tải về khi xong.
- Tên model sửa được trong mục "Model" nếu xAI đổi tên.

Nếu API báo lỗi về `aspect_ratio` / `resolution` / `n`, để các ô đó ở "Mặc định" và xem docs.x.ai để biết tên trường hiện tại.

## Đưa lên Render (dùng từ điện thoại)

1. Vào render.com, đăng nhập bằng GitHub, chọn **New → Blueprint**, chọn repo này và nhánh có file `render.yaml`.
2. Render sẽ hỏi hai giá trị bí mật: `XAI_API_KEY` (key xAI) và `APP_PASSWORD` (mật khẩu bạn tự đặt để vào app). Nhập trực tiếp ở đó, đừng đưa vào repo.
3. Khi deploy xong, mở link `https://<tên>.onrender.com`. Trình duyệt sẽ hỏi đăng nhập: tên người dùng để trống hoặc gõ gì cũng được, mật khẩu là `APP_PASSWORD`.

Lưu ý gói miễn phí: dịch vụ ngủ sau ~15 phút không dùng (lần mở đầu chờ ~1 phút), và ổ đĩa không giữ lại. File trong `outputs/` mất khi dịch vụ khởi động lại, nên hãy bấm "Tải về" ngay sau khi tạo.
Khi `HOST` không phải localhost, server từ chối chạy nếu chưa đặt `APP_PASSWORD`.

## Kéo dài video

Mỗi video có hai nút:

- **Kéo dài (rẻ)**: server lấy khung hình cuối, tạo đoạn mới bằng `grok-imagine-video-1.5-lite` (~$0.02/giây, mặc định 480p), rồi dùng ffmpeg ghép vào video gốc. Rẻ hơn khoảng 2,5 lần và không bị giới hạn 15 giây, nhưng chỗ nối có thể hơi khựng.
- **Kéo dài (mượt)**: cách có sẵn của xAI, mô tả dưới đây.

Với **Kéo dài (mượt)**: nhập điều xảy ra tiếp theo và thời lượng phần thêm (2–10s), rồi bấm Tạo. App gửi video gốc tới `POST /v1/videos/extensions` (model `grok-imagine-video`). Kết quả là một video mới gồm cả đoạn gốc lẫn đoạn nối thêm. Bạn có thể kéo dài tiếp video đó.

Giới hạn của xAI: video gốc phải là .mp4 dài 2–15s, và kết quả giữ tỉ lệ khung hình của video gốc, tối đa 720p. Vì vậy video đã kéo dài quá 15s thì không kéo dài tiếp được.

## Bộ đếm chi phí

Ảnh và video của xAI tính tiền theo số ảnh và số giây, không theo token. App ước tính chi phí theo giá niêm yết trên docs.x.ai/docs/models (bảng `IMAGE_PRICE` và `VIDEO_PRICE_PER_SEC` trong server). Mỗi kết quả hiện chi phí ước tính, còn tổng cộng dồn hiện ở đầu trang. Tổng được lưu trong trình duyệt nên không mất khi Render xoá ổ đĩa; bấm "Đặt lại" để đưa về 0.

Đây chỉ là ước tính ở giá cơ bản: độ phân giải cao có thể đắt hơn, và model không có trong bảng giá sẽ hiện `?`. Số tiền thật xem trong console xAI.
