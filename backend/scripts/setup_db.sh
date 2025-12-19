#!/bin/bash
# Database Setup Script

echo "Setting up Sentinel IRM Database..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "ERROR: Docker is not running. Please start Docker Desktop first."
    exit 1
fi

# Start database services
echo "Starting database services..."
cd "$(dirname "$0")/../.."
docker compose up -d postgres redis rabbitmq opa

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
sleep 5

# Check if database is accessible
until docker compose exec -T postgres pg_isready -U sentinel_user > /dev/null 2>&1; do
    echo "   Waiting for PostgreSQL..."
    sleep 2
done

echo "Database services are running!"
echo ""
echo "Next steps:"
echo "1. Create virtual environment: python -m venv venv"
echo "2. Activate it: source venv/bin/activate"
echo "3. Install dependencies: pip install -r requirements.txt"
echo "4. Run migrations: alembic upgrade head"
echo ""

