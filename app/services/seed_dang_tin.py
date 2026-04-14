from sqlmodel import Session, select
from app.models.dang_tin import DangTin
from app.models.user import User, UserRole

SAMPLE_DANG_TIN = [
    {
        "hang_xe": "Toyota", "dong_xe": "Camry 2.0E SX", "nam_san_xuat": 2019,
        "so_km": 45000, "gia_mong_muon": 850, "khu_vuc": "TP.HCM",
        "mo_ta": "Xe còn mới 95%, nội thất sạch sẽ, ghế da nguyên bản. Máy êm, chưa tai nạn ngập nước. Đã lên full option: camera 360, cảm biến lùi, màn hình android 10 inch. Xe chính chủ một đời, có đầy đủ hồ sơ gốc.",
        "ho_ten": "Nguyễn Văn Minh", "so_dien_thoai": "0901234567"
    },
    {
        "hang_xe": "Honda", "dong_xe": "CRV-L 2024", "nam_san_xuat": 2024,
        "so_km": 8000, "gia_mong_muon": 1050, "khu_vuc": "Hà Nội",
        "mo_ta": "Xe mới đi 8000km, còn bảo hành chính hãng. Màu trắng ngọc trai, nội thất nâu sang trọng. Full option nhà máy: cửa sổ trời panorama, ghế điện nhớ vị trí, đèn LED matrix. Lý do bán: gia đình cần đổi xe 7 chỗ.",
        "ho_ten": "Trần Thị Lan", "so_dien_thoai": "0912345678"
    },
    {
        "hang_xe": "Mazda", "dong_xe": "CX-5 2.0 Premium", "nam_san_xuat": 2021,
        "so_km": 30000, "gia_mong_muon": 750, "khu_vuc": "Đà Nẵng",
        "mo_ta": "Xe gia đình sử dụng kỹ, bảo dưỡng định kỳ tại đại lý Mazda. Màu đỏ pha lê đặc trưng, ngoại thất không trầy xước. Nội thất da bò nguyên bản, chưa bọc lại. Có camera hành trình, phim cách nhiệt toàn xe. Giá có thể thương lượng.",
        "ho_ten": "Lê Quang Hùng", "so_dien_thoai": "0923456789"
    },
    {
        "hang_xe": "Ford", "dong_xe": "Everest Titanium 2.0L", "nam_san_xuat": 2023,
        "so_km": 18000, "gia_mong_muon": 950, "khu_vuc": "TP.HCM",
        "mo_ta": "SUV 7 chỗ máy dầu mạnh mẽ, tiết kiệm nhiên liệu. Xe công ty thanh lý, bảo dưỡng theo đúng lịch. Trang bị đầy đủ: màn hình 12 inch, hệ thống ADAS, cảm biến đỗ xe toàn vòng. Xe không phục vụ dịch vụ, còn nguyên vẹn như mới.",
        "ho_ten": "Phạm Đức Thành", "so_dien_thoai": "0934567890"
    },
    {
        "hang_xe": "BMW", "dong_xe": "320i Sport Line 2022", "nam_san_xuat": 2022,
        "so_km": 28000, "gia_mong_muon": 1380, "khu_vuc": "Hà Nội",
        "mo_ta": "BMW chính hãng Thaco, còn bảo hành đến 2025. Màu đen sapphire metallic, mâm 18 inch M Sport. Xe đã lên thêm: ghế sưởi, kính chỉnh điện toàn phần, hệ thống âm thanh Harman Kardon. Không đâm đụng, không ngập nước, đi làm cuối tuần là chính.",
        "ho_ten": "Vũ Hoàng Nam", "so_dien_thoai": "0945678901"
    },
    {
        "hang_xe": "Vinfast", "dong_xe": "VF8 Plus 2023", "nam_san_xuat": 2023,
        "so_km": 15000, "gia_mong_muon": 850, "khu_vuc": "TP.HCM",
        "mo_ta": "Xe điện VF8 Plus full option, pin thuê giá tốt. Màu xanh navy sang trọng, nội thất trắng sạch sẽ. Trang bị: màn hình 15.6 inch, lái tự động cấp 2, camera 360. Sạc nhanh DC 150kW, mỗi lần sạc đi được 400km. Chuyển nhượng hợp đồng pin thuê.",
        "ho_ten": "Đỗ Thị Hương", "so_dien_thoai": "0956789012"
    },
]


def seed_dang_tin(session: Session):
    existing = session.exec(select(DangTin)).first()
    if existing:
        return

    # Lấy user admin thay vì hardcode id=8
    admin = session.exec(select(User).where(User.role == UserRole.admin)).first()
    if not admin:
        print("⚠️ Không có user admin nào, bỏ qua seed dang_tin")
        return

    for item in SAMPLE_DANG_TIN:
        tin = DangTin(user_id=admin.id, **item)
        session.add(tin)
    session.commit()
    print(f"✅ Đã seed {len(SAMPLE_DANG_TIN)} tin bán xe mẫu")