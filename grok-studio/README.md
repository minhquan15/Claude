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
