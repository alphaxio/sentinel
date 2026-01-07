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

# Clean up any existing enum types that might conflict
echo "Cleaning up any existing enum types..."
python3 << 'PYTHON_SCRIPT'
import sys
import os
sys.path.insert(0, '/app')
from app.core.database import engine
from sqlalchemy import text

# List of all enum types used in migrations
ALL_ENUMS = [
    'assettype', 'classificationlevel', 'stridecategory', 'threatstatus',
    'scannertype', 'processingstatus', 'findingseverity', 'findingstatus',
    'complianceframework', 'policyseverity', 'gatedecision', 'riskacceptancestatus',
    'relationshiptype'
]

try:
    with engine.begin() as conn:
        # Check if alembic_version exists
        result = conn.execute(text("""
            SELECT COUNT(*) FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'alembic_version'
        """))
        has_version_table = result.scalar() > 0
        
        # Check which enum types actually exist
        result = conn.execute(text("""
            SELECT typname FROM pg_type 
            WHERE typtype = 'e' 
            AND typname = ANY(ARRAY['assettype', 'classificationlevel', 'stridecategory', 
                'threatstatus', 'scannertype', 'processingstatus', 'findingseverity', 
                'findingstatus', 'complianceframework', 'policyseverity', 'gatedecision', 
                'riskacceptancestatus', 'relationshiptype'])
        """))
        existing_enums = [row[0] for row in result.fetchall()]
        
        # If no alembic_version table, drop all enum types (migration will recreate them)
        if not has_version_table and existing_enums:
            print(f"No alembic_version table found. Found {len(existing_enums)} enum type(s): {existing_enums}")
            print("Dropping them to allow clean migration...")
            for enum_name in existing_enums:
                try:
                    conn.execute(text(f"DROP TYPE IF EXISTS {enum_name} CASCADE"))
                    print(f"  ✓ Dropped {enum_name}")
                except Exception as e:
                    print(f"  ✗ Failed to drop {enum_name}: {e}")
            print("✓ Cleanup complete")
        elif has_version_table:
            print("Alembic version table exists, skipping enum cleanup")
        else:
            print("No enum types found, database is clean")
except Exception as e:
    print(f"⚠ Cleanup error (continuing): {e}")
    import traceback
    traceback.print_exc()
PYTHON_SCRIPT

# Run migrations (exit on error)
set -e
if alembic upgrade head; then
    echo "✓ Migrations completed successfully"
else
    echo "✗ Migration failed!"
    echo "Migration status:"
    alembic current || true
    exit 1
fi
set +e  # Disable exit on error for seeding (we want server to start even if seeding fails)

# Seed initial data (roles and users)
echo ""
echo "=========================================="
echo "Seeding initial data..."
echo "=========================================="
cd /app || cd "$(dirname "$0")" || pwd
if python3 scripts/seed_data.py 2>&1; then
    echo "✓ Seed data created successfully"
else
    echo "⚠ Seed data creation failed (continuing anyway)"
    # Don't exit - continue to start the server
fi

# Start the application (always start, even if seeding failed)
echo ""
echo "=========================================="
echo "Starting FastAPI application..."
echo "=========================================="
echo "Environment check:"
echo "  PORT: ${PORT:-8000}"
echo "  DATABASE_URL: ${DATABASE_URL:0:30}... (length: ${#DATABASE_URL})"
echo "  CORS_ORIGINS: ${CORS_ORIGINS:-not set}"
echo "  JWT_SECRET_KEY: ${JWT_SECRET_KEY:0:10}... (set: $([ -n "$JWT_SECRET_KEY" ] && echo 'yes' || echo 'no'))"
echo ""

# Test database connection before starting
echo "Testing database connection..."
python3 << 'PYTHON_SCRIPT'
import sys
import os
sys.path.insert(0, '/app')
try:
    from app.core.database import engine
    from sqlalchemy import text
    with engine.connect() as conn:
        result = conn.execute(text("SELECT 1"))
        print("✓ Database connection successful")
except Exception as e:
    print(f"✗ Database connection failed: {e}")
    import traceback
    traceback.print_exc()
    # Don't exit - let the server try to start anyway
PYTHON_SCRIPT

echo ""
# Railway always sets PORT, but add safety check
if [ -z "$PORT" ]; then
    echo "ERROR: PORT environment variable is not set!"
    echo "Railway should set this automatically. Using default 8000."
    PORT=8000
fi

echo "Starting server on 0.0.0.0:${PORT}..."
echo "Server will be available at: http://0.0.0.0:${PORT}"
echo "Health check: http://0.0.0.0:${PORT}/health"
set -e  # Re-enable exit on error for server startup

# Use exec to replace shell process with uvicorn
# This ensures Railway can properly manage the process
# Note: Railway sets PORT dynamically, we must use it
echo "Starting uvicorn on port ${PORT}..."
exec uvicorn app.main:app \
    --host 0.0.0.0 \
    --port ${PORT} \
    --workers 1 \
    --log-level info \
    --timeout-keep-alive 30 \
    --access-log

