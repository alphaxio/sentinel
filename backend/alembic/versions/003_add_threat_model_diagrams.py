"""Add threat model diagrams table

Revision ID: 003
Revises: 002
Create Date: 2024-01-01 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '003_add_threat_model_diagrams'
down_revision = '002_add_user_auth_fields'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create threat_model_diagrams table
    op.create_table(
        'threat_model_diagrams',
        sa.Column('diagram_id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('threat_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('canvas_data', postgresql.JSONB(), nullable=False),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['threat_id'], ['threats.threat_id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['created_by'], ['users.user_id'], ondelete='CASCADE'),
    )
    op.create_index('ix_threat_model_diagrams_threat_id', 'threat_model_diagrams', ['threat_id'])
    op.create_index('ix_threat_model_diagrams_created_by', 'threat_model_diagrams', ['created_by'])


def downgrade() -> None:
    op.drop_index('ix_threat_model_diagrams_created_by', table_name='threat_model_diagrams')
    op.drop_index('ix_threat_model_diagrams_threat_id', table_name='threat_model_diagrams')
    op.drop_table('threat_model_diagrams')

