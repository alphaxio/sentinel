"""add_risk_acceptances_table

Revision ID: 539e8c9d8f68
Revises: 003_add_threat_model_diagrams
Create Date: 2026-01-04 06:31:05.169006

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy import text

# revision identifiers, used by Alembic.
revision = '539e8c9d8f68'
down_revision = '003_add_threat_model_diagrams'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Note: riskacceptancestatus enum type is already created in 001_initial_schema
    # Use postgresql.ENUM with create_type=False to prevent SQLAlchemy from trying to create it
    
    # Check if table already exists (it might be created in 001_initial_schema)
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    table_exists = 'risk_acceptances' in inspector.get_table_names()
    
    if not table_exists:
        # Create risk_acceptances table (if it doesn't exist from initial schema)
        op.create_table(
            'risk_acceptances',
            sa.Column('acceptance_id', postgresql.UUID(as_uuid=True), primary_key=True),
            sa.Column('threat_id', postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column('requested_by', postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column('approved_by', postgresql.UUID(as_uuid=True), nullable=True),
            sa.Column('justification', sa.Text(), nullable=False),
            sa.Column('acceptance_period_days', sa.Integer(), nullable=False),
            sa.Column('expiration_date', sa.Date(), nullable=False),
        sa.Column(
            'status',
            postgresql.ENUM('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED', name='riskacceptancestatus', create_type=False),
            nullable=False,
            server_default='PENDING'
        ),
            sa.Column('approval_signature_name', sa.String(), nullable=True),
            sa.Column('approval_signature_timestamp', sa.DateTime(timezone=True), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
            sa.ForeignKeyConstraint(['threat_id'], ['threats.threat_id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['requested_by'], ['users.user_id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['approved_by'], ['users.user_id'], ondelete='SET NULL'),
        )
    
    # Create indexes (create them even if table already exists, as initial schema doesn't create them)
    existing_indexes = []
    if table_exists:
        try:
            existing_indexes = [idx['name'] for idx in inspector.get_indexes('risk_acceptances')]
        except Exception:
            pass  # If we can't get indexes, just try to create them
    
    # Create indexes if they don't exist
    index_definitions = [
        ('ix_risk_acceptances_threat_id', ['threat_id']),
        ('ix_risk_acceptances_requested_by', ['requested_by']),
        ('ix_risk_acceptances_status', ['status']),
        ('ix_risk_acceptances_expiration_date', ['expiration_date']),
    ]
    
    for index_name, columns in index_definitions:
        if index_name not in existing_indexes:
            try:
                op.create_index(index_name, 'risk_acceptances', columns)
            except Exception:
                pass  # Index might already exist, skip


def downgrade() -> None:
    # Drop indexes
    op.drop_index('ix_risk_acceptances_expiration_date', table_name='risk_acceptances')
    op.drop_index('ix_risk_acceptances_status', table_name='risk_acceptances')
    op.drop_index('ix_risk_acceptances_requested_by', table_name='risk_acceptances')
    op.drop_index('ix_risk_acceptances_threat_id', table_name='risk_acceptances')
    
    # Drop table
    op.drop_table('risk_acceptances')
    
    # Note: Don't drop enum type here - it's created in 001_initial_schema and should be dropped there
