"""Add user authentication fields

Revision ID: 002_add_user_auth_fields
Revises: 001_initial
Create Date: 2024-01-16 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '002_add_user_auth_fields'
down_revision = '001_initial'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """
    Add password_hash and oauth2_sub columns to users table.
    This migration is idempotent and safe to run in production.
    """
    # Check if password_hash column exists before adding
    op.execute("""
        DO $$ 
        BEGIN
            IF NOT EXISTS (
                SELECT 1 
                FROM information_schema.columns 
                WHERE table_name = 'users' 
                AND column_name = 'password_hash'
            ) THEN
                ALTER TABLE users 
                ADD COLUMN password_hash VARCHAR(255) NULL;
            END IF;
        END $$;
    """)
    
    # Check if oauth2_sub column exists before adding
    op.execute("""
        DO $$ 
        BEGIN
            IF NOT EXISTS (
                SELECT 1 
                FROM information_schema.columns 
                WHERE table_name = 'users' 
                AND column_name = 'oauth2_sub'
            ) THEN
                ALTER TABLE users 
                ADD COLUMN oauth2_sub VARCHAR(255) NULL;
            END IF;
        END $$;
    """)
    
    # Create unique index on oauth2_sub if it doesn't exist
    # First check if index exists
    op.execute("""
        DO $$ 
        BEGIN
            IF NOT EXISTS (
                SELECT 1 
                FROM pg_indexes 
                WHERE tablename = 'users' 
                AND indexname = 'ix_users_oauth2_sub'
            ) THEN
                CREATE UNIQUE INDEX ix_users_oauth2_sub 
                ON users (oauth2_sub) 
                WHERE oauth2_sub IS NOT NULL;
            END IF;
        END $$;
    """)
    
    # Add comment to columns for documentation
    op.execute("""
        COMMENT ON COLUMN users.password_hash IS 'Hashed password for email/password authentication. NULL for OAuth2-only users.';
        COMMENT ON COLUMN users.oauth2_sub IS 'OAuth2 subject identifier (sub claim). Unique identifier from OAuth2 provider.';
    """)


def downgrade() -> None:
    """
    Remove password_hash and oauth2_sub columns from users table.
    WARNING: This will delete data in these columns.
    """
    # Drop index first
    op.execute("""
        DROP INDEX IF EXISTS ix_users_oauth2_sub;
    """)
    
    # Drop columns
    op.execute("""
        ALTER TABLE users DROP COLUMN IF EXISTS oauth2_sub;
        ALTER TABLE users DROP COLUMN IF EXISTS password_hash;
    """)

