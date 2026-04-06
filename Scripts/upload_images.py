import cloudinary
import cloudinary.uploader
import os, sys, re
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings
from app.core.database import get_session
from app.services.car_service import add_car_image
from sqlmodel import select
from app.models.cars import Car, CarImage

cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET,
)

IMAGES_FOLDER = r"C:\Users\nc\Downloads\Cars\Cars"
SUPPORTED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}

BRAND_MAP = {
    "Toyota":  "Toyota",
    "Honda":   "Honda",
    "BMW":     "BMW",
    "Benz":    "Benz",
    "Ford":    "Ford",
    "Kia":     "Kia",
    "Hyundai": "Hyundai",
    "Madaz":   "Mazda",
    "Vinfast": "Vinfast",
}

def is_main_image(filename: str) -> bool:
    name = os.path.splitext(filename)[0]
    return not re.search(r'\s*-\s*\d+$', name)

def normalize(text: str) -> str:
    """Chuẩn hóa chuỗi để so khớp: lowercase, bỏ ký tự đặc biệt"""
    text = text.lower()
    text = re.sub(r'[^a-z0-9\s]', '', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def find_matching_car(cars: list[Car], base_name: str) -> Car | None:
    """Tìm xe trong DB khớp nhất với tên file ảnh"""
    base_norm = normalize(base_name)
    best_car = None
    best_score = 0

    for car in cars:
        dong_norm = normalize(car.dong)
        # Đếm số từ khớp nhau
        base_words = set(base_norm.split())
        dong_words = set(dong_norm.split())
        score = len(base_words & dong_words)

        if score > best_score:
            best_score = score
            best_car = car

    # Chỉ chấp nhận nếu khớp ít nhất 1 từ
    return best_car if best_score >= 1 else None

def run():
    session = next(get_session())

    # Xóa car_images cũ để tránh trùng
    session.exec(select(CarImage)).all()
    old_images = session.exec(select(CarImage)).all()
    for img in old_images:
        session.delete(img)
    session.commit()
    print("🗑️  Đã xóa ảnh cũ trong DB")

    for brand_folder, brand_name in BRAND_MAP.items():
        brand_path = os.path.join(IMAGES_FOLDER, brand_folder)
        if not os.path.isdir(brand_path):
            print(f"⚠️  Không tìm thấy folder: {brand_folder}")
            continue

        print(f"\n📁 {brand_folder} → DB: {brand_name}")

        image_files = sorted([
            f for f in os.listdir(brand_path)
            if os.path.splitext(f)[1].lower() in SUPPORTED_EXTENSIONS
        ])

        # Group ảnh theo tên gốc (bỏ ' - 2' ở cuối)
        groups: dict[str, list] = {}
        for f in image_files:
            name = os.path.splitext(f)[0]
            base = re.sub(r'\s*-\s*\d+$', '', name).strip()
            groups.setdefault(base, []).append(f)

        # Lấy danh sách xe của hãng trong DB
        cars = session.exec(select(Car).where(Car.hang == brand_name)).all()

        for base_name, files in groups.items():
            car = find_matching_car(cars, base_name)
            if not car:
                print(f"  ⚠️  Không tìm thấy xe khớp với: {base_name}")
                continue

            print(f"  🚗 {car.hang} {car.dong} ← {base_name}")

            # Sắp xếp: ảnh chính trước, ảnh phụ sau
            files_sorted = sorted(files, key=lambda f: (0 if is_main_image(f) else 1))

            for i, image_file in enumerate(files_sorted):
                image_path = os.path.join(brand_path, image_file)
                name_without_ext = os.path.splitext(image_file)[0]

                result = cloudinary.uploader.upload(
                    image_path,
                    folder=f"automart/cars/{brand_folder.lower()}",
                    public_id=name_without_ext,
                    overwrite=True,
                    resource_type="image",
                )
                url = result["secure_url"]
                is_main = (i == 0)
                add_car_image(session, car.id, url, is_main=is_main)
                print(f"    {'⭐' if is_main else '  '} {image_file}")

    print("\n✅ Done!")

if __name__ == "__main__":
    run()