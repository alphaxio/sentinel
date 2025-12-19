#!/bin/bash
# Complete Backend Setup Script

set -e

echo "Sentinel IRM Backend Setup"
echo "=============================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "ERROR: Docker is not installed."
    echo ""
    echo "You have two options:"
    echo "1. Install Docker Desktop (recommended):"
    echo "   Visit: https://www.docker.com/products/docker-desktop"
    echo "   Then run this script again."
    echo ""
    echo "2. Use setup without Docker (requires local services):"
    echo "   Run: ./scripts/setup_no_docker.sh"
    echo "   See: INSTALL_DOCKER.md for local installation instructions"
    echo ""
    exit 1
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "ERROR: Docker is not running. Please start Docker Desktop first."
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

# Step 3: Start Docker services
echo ""
echo "Step 3: Starting Docker services..."
docker compose up -d postgres redis rabbitmq opa

# Wait for PostgreSQL
echo "Waiting for PostgreSQL to be ready..."
for i in {1..30}; do
    if docker compose exec -T postgres pg_isready -U sentinel_user > /dev/null 2>&1; then
        echo "PostgreSQL is ready"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "ERROR: PostgreSQL failed to start"
        exit 1
    fi
    sleep 1
done

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

