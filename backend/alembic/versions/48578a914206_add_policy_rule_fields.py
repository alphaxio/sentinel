"""add_policy_rule_fields

Revision ID: 48578a914206
Revises: 8dd26eb47e14
Create Date: 2026-01-04 09:20:45.482862

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '48578a914206'
down_revision = '8dd26eb47e14'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add description, last_evaluated, created_at, and updated_at columns to policy_rules table
    op.execute("""
        DO $$ 
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'policy_rules' 
                AND column_name = 'description'
            ) THEN
                ALTER TABLE policy_rules 
                ADD COLUMN description TEXT;
            END IF;
            
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'policy_rules' 
                AND column_name = 'last_evaluated'
            ) THEN
                ALTER TABLE policy_rules 
                ADD COLUMN last_evaluated TIMESTAMP WITH TIME ZONE;
            END IF;
            
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'policy_rules' 
                AND column_name = 'created_at'
            ) THEN
                ALTER TABLE policy_rules 
                ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT now();
            END IF;
            
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'policy_rules' 
                AND column_name = 'updated_at'
            ) THEN
                ALTER TABLE policy_rules 
                ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();
            END IF;
        END $$;
    """)


def downgrade() -> None:
    # Remove the added columns
    op.execute("""
        DO $$ 
        BEGIN
            IF EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'policy_rules' 
                AND column_name = 'description'
            ) THEN
                ALTER TABLE policy_rules DROP COLUMN description;
            END IF;
            
            IF EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'policy_rules' 
                AND column_name = 'last_evaluated'
            ) THEN
                ALTER TABLE policy_rules DROP COLUMN last_evaluated;
            END IF;
            
            IF EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'policy_rules' 
                AND column_name = 'created_at'
            ) THEN
                ALTER TABLE policy_rules DROP COLUMN created_at;
            END IF;
            
            IF EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'policy_rules' 
                AND column_name = 'updated_at'
            ) THEN
                ALTER TABLE policy_rules DROP COLUMN updated_at;
            END IF;
        END $$;
    """)



