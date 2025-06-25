FROM python:3.13.1-slim

WORKDIR /app

RUN  pip install --upgrade pip
RUN apt-get update && apt-get install -y \
    gcc \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY . .


RUN chmod +x init.sh

CMD ["/app/init.sh"]
