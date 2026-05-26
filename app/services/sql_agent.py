from openai import OpenAI
from sqlalchemy import text
from app.core.database import engine
from app.core.config import settings

client = OpenAI(
    api_key=settings.GROQ_API_KEY,
    base_url="https://api.groq.com/openai/v1"
)

DB_SCHEMA = """
Các bảng trong database AutoMart (PostgreSQL):

TABLE cars (
  id INTEGER PRIMARY KEY,
  hang VARCHAR,        -- tên hãng: Toyota, Honda, BMW, Mercedes-Benz, Ford, Kia, Hyundai, Mazda, VinFast
  dong VARCHAR,         -- tên đầy đủ của xe, bao gồm cả phiên bản và thông số
                        -- ví dụ: "VF5 2025 Plus 39000km", "Camry 2.0E 2019", "Civic 1.8 AT"
                        -- LUÔN dùng ILIKE '%keyword%' khi tìm kiếm cột này
  nam INTEGER,         -- năm sản xuất
  gia INTEGER,         -- giá VNĐ (ví dụ: 500000000 = 500 triệu)
  km INTEGER,          -- số km đã đi
  loai VARCHAR,        -- loại xe
  anh VARCHAR,         -- URL ảnh đại diện
  created_at TIMESTAMP
)

TABLE car_images (
  id INTEGER PRIMARY KEY,
  car_id INTEGER REFERENCES cars(id),
  url VARCHAR,
  is_main BOOLEAN,
  created_at TIMESTAMP
)

TABLE dangtins (
  id INTEGER PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  hang_xe VARCHAR,
  dong_xe VARCHAR,
  nam_san_xuat INTEGER,
  so_km INTEGER,
  gia_mong_muon INTEGER,
  khu_vuc VARCHAR,
  mo_ta TEXT,
  ho_ten VARCHAR,
  so_dien_thoai VARCHAR,
  created_at TIMESTAMP
)

TABLE users (
  id INTEGER PRIMARY KEY,
  ho_ten VARCHAR,
  email VARCHAR,
  so_dien_thoai VARCHAR,
  password_hash VARCHAR,
  role VARCHAR,        -- 'user', 'staff', 'admin'
  avatar_url VARCHAR,
  avatar_public_id VARCHAR,
  created_at TIMESTAMP
)

TABLE lai_thu (
  id INTEGER PRIMARY KEY,
  ho_ten VARCHAR,
  so_dien_thoai VARCHAR,
  hang_xe VARCHAR,
  showroom VARCHAR,
  ngay_lai_thu VARCHAR,
  khung_gio VARCHAR,
  anh_cccd VARCHAR,
  anh_gplx VARCHAR,
  trang_thai VARCHAR,
  ly_do_tu_choi VARCHAR,
  created_at TIMESTAMP
)

TABLE lien_he (
  id INTEGER PRIMARY KEY,
  ho_ten TEXT,
  so_dien_thoai TEXT,
  email TEXT,
  noi_dung TEXT,
  da_doc BOOLEAN,
  created_at TIMESTAMP
)

TABLE uu_dai (
  id INTEGER PRIMARY KEY,
  xe_id INTEGER REFERENCES cars(id),
  phan_tram_giam DOUBLE PRECISION,  -- % giảm giá (ví dụ: 10.0 = giảm 10%)
  ngay_bat_dau DATE,
  ngay_ket_thuc DATE,
  mo_ta VARCHAR
)
"""

SYSTEM_GENERATE_SQL = f"""Bạn là SQL expert cho hệ thống AutoMart.
- Cột `dong` chứa tên đầy đủ xe kèm phiên bản, LUÔN dùng ILIKE '%value%' (có dấu % hai đầu)
- Ví dụ đúng: WHERE dong ILIKE '%VF5%'
- Ví dụ sai:  WHERE dong = 'VF5' hoặc WHERE dong ILIKE 'VF5'
- Ưu tiên dùng SELECT * thay vì SELECT COUNT(*), để trả về danh sách xe chi tiết\n
- Chỉ dùng COUNT khi câu hỏi hỏi rõ ràng 'có bao nhiêu' hoặc 'tổng số'\n"
- Khi dùng COUNT, luôn chỉ dùng điều kiện cần thiết nhất, KHÔNG thêm điều kiện thừa\n
Schema database:
{DB_SCHEMA}

QUY TẮC BẮT BUỘC:
- Chỉ trả về câu SQL thuần túy, KHÔNG giải thích, KHÔNG markdown, KHÔNG backtick
- Chỉ dùng SELECT (tuyệt đối không INSERT/UPDATE/DELETE/DROP)
- Luôn có LIMIT tối đa 50 dòng
- Chỉ dùng đúng các cột có trong schema, KHÔNG tự thêm cột khác
- Tên hãng (Toyota, Kia, Honda, VinFast...) chỉ có trong cột `hang`, KHÔNG có trong cột `dong`
- Tên model (Morning, Vios, Camry, VF5...) chỉ có trong cột `dong`
- Khi tìm 'Kia Morning' → WHERE hang ILIKE '%Kia%' AND dong ILIKE '%Morning%'
- KHÔNG gộp cả hãng lẫn model vào 1 điều kiện ILIKE trên cột dong
- Cột `dong` chứa tên đầy đủ kèm phiên bản, ví dụ: 'Morning Van 2016 Xanh Nhạt', 'VF5 2025 Plus'
- Khi tìm theo model, dùng từ khóa chính: Morning, VF5, Camry... với ILIKE '%keyword%'
- Người dùng hay viết không dấu: 'kia morning' = Kia Morning, 'vf5' = VF5
- Câu hỏi dạng 'có...không', 'shop có...ko', 'còn...không' đều là hỏi xe trong DB
- Nếu câu hỏi không liên quan database: SELECT 'KHONG_LIEN_QUAN' AS result
- Dùng ILIKE thay vì = khi so sánh chuỗi
- Giá đơn vị VNĐ (500 triệu = 500000000)
"""

SYSTEM_SUMMARIZE = """Bạn là trợ lý tư vấn của AutoMart - chợ xe hơi trực tuyến Việt Nam.
Dựa trên dữ liệu được cung cấp, hãy trả lời câu hỏi bằng tiếng Việt tự nhiên, ngắn gọn và hữu ích.
Nếu dữ liệu rỗng, hãy nói thẳng là không tìm thấy kết quả phù hợp.
Không bịa thêm thông tin ngoài dữ liệu được cung cấp.
Khi liệt kê xe, LUÔN kèm link xem chi tiết dạng /xe/ID ở cuối mỗi xe."""


def run_sql_agent(question: str) -> dict:
    # Bước 1: Sinh SQL
    sql_resp = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": SYSTEM_GENERATE_SQL},
            {"role": "user", "content": question},
        ],
        temperature=0,
        max_tokens=512,
    )
    sql_query = sql_resp.choices[0].message.content.strip()

    # Trường hợp câu hỏi không liên quan DB
    if "KHONG_LIEN_QUAN" in sql_query:
        return {
            "sql": sql_query,
            "data": [],
            "row_count": 0,
            "answer": "Câu hỏi này không liên quan đến dữ liệu trong hệ thống. Bạn có thể hỏi về xe, giá, ưu đãi, hoặc thống kê người dùng.",
        }

    # Bước 2: Thực thi SQL
    try:
        with engine.connect() as conn:
            result = conn.execute(text(sql_query))
            rows = result.fetchall()
            columns = list(result.keys())
            data = [dict(zip(columns, row)) for row in rows]
    except Exception as e:
        return {
            "sql": sql_query,
            "data": [],
            "row_count": 0,
            "answer": f"Lỗi khi thực thi query: {e}",
            "error": str(e),
        }

    # Bước 3: Tóm tắt kết quả
    summary_resp = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": SYSTEM_SUMMARIZE},
            {
                "role": "user",
                "content": f"Câu hỏi: {question}\n\nDữ liệu từ database:\n{data}",
            },
        ],
        max_tokens=512,
    )

    return {
        "sql": sql_query,
        "data": data,
        "row_count": len(data),
        "answer": summary_resp.choices[0].message.content,
    }