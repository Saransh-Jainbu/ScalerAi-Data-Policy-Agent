FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Download spaCy model (English, small is fine for now)
RUN python -m spacy download en_core_web_sm

# Copy application code
COPY . .

# Run the service
CMD ["python", "main.py"]
