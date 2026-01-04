"""add_created_updated_to_risk_acceptances

Revision ID: 8dd26eb47e14
Revises: 539e8c9d8f68
Create Date: 2026-01-04 06:35:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '8dd26eb47e14'
down_revision = '539e8c9d8f68'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add created_at and updated_at columns if they don't exist
    op.execute("""
        DO $$ 
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'risk_acceptances' 
                AND column_name = 'created_at'
            ) THEN
                ALTER TABLE risk_acceptances 
                ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT now();
            END IF;
            
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'risk_acceptances' 
                AND column_name = 'updated_at'
            ) THEN
                ALTER TABLE risk_acceptances 
                ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();
            END IF;
        END $$;
    """)


def downgrade() -> None:
    # Remove created_at and updated_at columns
    op.execute("""
        DO $$ 
        BEGIN
            IF EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'risk_acceptances' 
                AND column_name = 'created_at'
            ) THEN
                ALTER TABLE risk_acceptances DROP COLUMN created_at;
            END IF;
            
            IF EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'risk_acceptances' 
                AND column_name = 'updated_at'
            ) THEN
                ALTER TABLE risk_acceptances DROP COLUMN updated_at;
            END IF;
        END $$;
    """)
