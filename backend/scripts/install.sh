#!/bin/bash
# Backend Installation Script

echo "Installing Sentinel IRM Backend..."

cd "$(dirname "$0")/.."

# Check Python version
python_version=$(python3 --version 2>&1 | awk '{print $2}')
echo "Python version: $python_version"

# Create virtual environment
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "Upgrading pip..."
pip install --upgrade pip

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

echo ""
echo "Installation complete!"
echo ""
echo "Next steps:"
echo "1. Start database: docker compose up -d"
echo "2. Run migrations: alembic upgrade head"
echo "3. Start server: uvicorn app.main:app --reload"
echo ""

