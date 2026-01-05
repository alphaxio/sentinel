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
    # res = op.get_bind().execute(text("SELECT 1 FROM pg_type WHERE typname = 'riskacceptancestatus'"))
    # if not res.first():
    #     risk_status = sa.Enum('Pending', 'Approved', 'Rejected', 'Expired', name='riskacceptancestatus')
    #     risk_status.create(op.get_bind())
    op.execute(text("DROP TYPE IF EXISTS riskacceptancestatus CASCADE"))
    
    # 2. Create the enum type manually
    risk_status = sa.Enum('Pending', 'Approved', 'Rejected', 'Expired', name='riskacceptancestatus')
    risk_status.create(op.get_bind())
    # Create risk_acceptances table
    op.create_table(
        'risk_acceptances',
        sa.Column('acceptance_id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('threat_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('requested_by', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('approved_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('justification', sa.Text(), nullable=False),
        sa.Column('acceptance_period_days', sa.Integer(), nullable=False),
        sa.Column('expiration_date', sa.Date(), nullable=False),
        sa.Column('status', sa.Enum('Pending', 'Approved', 'Rejected', 'Expired', name='riskacceptancestatus', create_type=False), nullable=False, server_default='Pending'),
        sa.Column('approval_signature_name', sa.String(), nullable=True),
        sa.Column('approval_signature_timestamp', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['threat_id'], ['threats.threat_id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['requested_by'], ['users.user_id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['approved_by'], ['users.user_id'], ondelete='SET NULL'),
    )
    
    # Create indexes
    op.create_index('ix_risk_acceptances_threat_id', 'risk_acceptances', ['threat_id'])
    op.create_index('ix_risk_acceptances_requested_by', 'risk_acceptances', ['requested_by'])
    op.create_index('ix_risk_acceptances_status', 'risk_acceptances', ['status'])
    op.create_index('ix_risk_acceptances_expiration_date', 'risk_acceptances', ['expiration_date'])


def downgrade() -> None:
    # Drop indexes
    op.drop_index('ix_risk_acceptances_expiration_date', table_name='risk_acceptances')
    op.drop_index('ix_risk_acceptances_status', table_name='risk_acceptances')
    op.drop_index('ix_risk_acceptances_requested_by', table_name='risk_acceptances')
    op.drop_index('ix_risk_acceptances_threat_id', table_name='risk_acceptances')
    
    # Drop table
    op.drop_table('risk_acceptances')
    
    # Drop enum type
    sa.Enum(name='riskacceptancestatus').drop(op.get_bind(), checkfirst=True)
