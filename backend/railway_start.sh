#!/bin/bash
set -e

echo "=========================================="
echo "Starting Railway deployment..."
echo "=========================================="

# Check environment variables
echo "Checking environment variables..."
echo "PORT: ${PORT:-8000}"
if [ -z "$DATABASE_URL" ]; then
    echo "ERROR: DATABASE_URL is not set!"
    exit 1
else
    echo "DATABASE_URL is set (length: ${#DATABASE_URL})"
fi

# Run database migrations
echo ""
echo "Running database migrations..."
if alembic upgrade head; then
    echo "✓ Migrations completed successfully"
else
    echo "✗ Migration failed, but continuing..."
    # Don't exit on migration failure - app might still work
fi

# Start the application
echo ""
echo "Starting FastAPI application..."
echo "Listening on 0.0.0.0:${PORT:-8000}"
exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}

