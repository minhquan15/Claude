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
