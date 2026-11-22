FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# psycopg2-binary đã bundle sẵn libpq => KHÔNG cần apt-get libpq-dev / gcc
# (bỏ được ~200MB và giảm bề mặt tấn công).
COPY requirements.txt .
RUN pip install -r requirements.txt

# Chỉ copy code chạy production (tests/, .git, .idea, *.db... không vào image)
COPY app ./app

# Không chạy bằng root
RUN useradd --system --uid 10001 --no-create-home appuser
USER appuser

EXPOSE 8000

# /api/v1/test là route nhẹ, không đụng database
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD python -c "import os,urllib.request; urllib.request.urlopen('http://127.0.0.1:%s/api/v1/test' % os.environ.get('PORT','8000'), timeout=4)"

# Render inject biến PORT; chạy local/compose thì mặc định 8000.
CMD ["sh", "-c", "exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]