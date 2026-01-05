#!/bin/bash
# Don't use set -e initially, we want to see all errors
set -x  # Enable debug mode to see all commands

echo "=========================================="
echo "Starting Railway deployment..."
echo "=========================================="
echo "Current directory: $(pwd)"
echo "Files in current directory:"
ls -la

# Check environment variables
echo ""
echo "Checking environment variables..."
echo "PORT: ${PORT:-8000}"
if [ -z "$DATABASE_URL" ]; then
    echo "ERROR: DATABASE_URL is not set!"
    exit 1
else
    echo "DATABASE_URL is set (length: ${#DATABASE_URL})"
    # Show first and last 20 chars for debugging (don't show full password)
    echo "DATABASE_URL preview: ${DATABASE_URL:0:30}...${DATABASE_URL: -20}"
fi

# Check if alembic is available
echo ""
echo "Checking Alembic..."
which alembic || echo "WARNING: alembic not found in PATH"
alembic --version || echo "WARNING: alembic version check failed"

# Run database migrations
echo ""
echo "=========================================="
echo "Running database migrations..."
echo "=========================================="
set -e  # Now enable exit on error for migrations
if alembic upgrade head; then
    echo "✓ Migrations completed successfully"
else
    echo "✗ Migration failed!"
    echo "Attempting to show migration status..."
    alembic current || true
    alembic history || true
    exit 1
fi

# Start the application
echo ""
echo "=========================================="
echo "Starting FastAPI application..."
echo "=========================================="
echo "Listening on 0.0.0.0:${PORT:-8000}"
exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}

