FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Make startup script executable
RUN chmod +x railway_start.sh

# Verify script is executable and in place
RUN ls -la railway_start.sh || echo "WARNING: railway_start.sh not found"

# Expose port - Railway sets $PORT dynamically (usually 8080)
# We expose 8080 as that's what Railway typically uses
EXPOSE 8080

# Default command - use bash to ensure proper execution
CMD ["/bin/bash", "./railway_start.sh"]



