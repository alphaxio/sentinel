#!/bin/bash
# Backend Setup Script (Without Docker)
# This script sets up the backend assuming PostgreSQL, Redis, RabbitMQ, and OPA are running locally

set -e

echo "Sentinel IRM Backend Setup (No Docker)"
echo "======================================="
echo ""
echo "This script assumes you have PostgreSQL, Redis, RabbitMQ, and OPA running locally."
echo "If you don't have these services, please:"
echo "1. Install Docker Desktop: https://www.docker.com/products/docker-desktop"
echo "2. Then run: ./scripts/setup.sh"
echo ""
read -p "Continue anyway? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

cd "$(dirname "$0")/.."

# Step 1: Create virtual environment
echo "Step 1: Creating virtual environment..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo "Virtual environment created"
else
    echo "Virtual environment already exists"
fi

# Step 2: Activate and install dependencies
echo ""
echo "Step 2: Installing Python dependencies..."
source venv/bin/activate
pip install --upgrade pip > /dev/null 2>&1
pip install -r requirements.txt
echo "Dependencies installed"

# Step 3: Check database connection
echo ""
echo "Step 3: Checking database connection..."
if command -v psql &> /dev/null; then
    echo "PostgreSQL client found. Testing connection..."
    if PGPASSWORD=sentinel_pass psql -h localhost -U sentinel_user -d sentinel_db -c "SELECT 1;" > /dev/null 2>&1; then
        echo "Database connection successful"
    else
        echo "WARNING: Could not connect to database."
        echo "Please ensure PostgreSQL is running and accessible."
        echo "You can create the database with:"
        echo "  createdb -U postgres sentinel_db"
        echo "  createuser -U postgres sentinel_user"
        echo "  psql -U postgres -c \"ALTER USER sentinel_user WITH PASSWORD 'sentinel_pass';\""
        echo "  psql -U postgres -c \"GRANT ALL PRIVILEGES ON DATABASE sentinel_db TO sentinel_user;\""
        exit 1
    fi
else
    echo "WARNING: psql not found. Skipping database connection test."
    echo "Please ensure PostgreSQL is running and accessible."
fi

# Step 4: Run migrations
echo ""
echo "Step 4: Running database migrations..."
alembic upgrade head
echo "Database migrations completed"

echo ""
echo "Setup complete!"
echo ""
echo "Next steps:"
echo "1. Activate virtual environment: source venv/bin/activate"
echo "2. Start backend server: uvicorn app.main:app --reload"
echo "3. API docs will be available at: http://localhost:8000/docs"
echo ""



