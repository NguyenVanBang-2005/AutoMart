import cloudinary
import cloudinary.uploader
from fastapi import UploadFile, HTTPException
from app.core.config import settings

# Cấu hình Cloudinary từ settings
cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET,
)

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_SIZE_MB = 5


async def upload_image(file: UploadFile, folder: str = "automart") -> dict:
    """
    Upload ảnh lên Cloudinary.
    Trả về {"url": ..., "public_id": ...}
    """
    # Validate type
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Chỉ chấp nhận ảnh JPG, PNG hoặc WebP."
        )

    # Đọc file và validate size
    content = await file.read()
    if len(content) > MAX_SIZE_MB * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail=f"Ảnh không được vượt quá {MAX_SIZE_MB}MB."
        )

    try:
        result = cloudinary.uploader.upload(
            content,
            folder=folder,
            resource_type="image",
        )
        return {
            "url": result["secure_url"],
            "public_id": result["public_id"],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi upload ảnh: {str(e)}")


async def delete_image(public_id: str) -> None:
    """
    Xóa ảnh khỏi Cloudinary theo public_id.
    Không raise lỗi nếu ảnh không tồn tại.
    """
    try:
        cloudinary.uploader.destroy(public_id)
    except Exception:
        pass  # Bỏ qua nếu ảnh đã bị xóa hoặc không tồn tại