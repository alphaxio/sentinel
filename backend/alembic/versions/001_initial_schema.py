"""Initial schema

Revision ID: 001_initial
Revises: 
Create Date: 2024-01-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001_initial'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Drop existing enum types if they exist (for clean migration)
    # This ensures a fresh start, especially for first-time deployments
    op.execute("DROP TYPE IF EXISTS assettype CASCADE")
    op.execute("DROP TYPE IF EXISTS classificationlevel CASCADE")
    op.execute("DROP TYPE IF EXISTS relationshiptype CASCADE")
    op.execute("DROP TYPE IF EXISTS stridecategory CASCADE")
    op.execute("DROP TYPE IF EXISTS threatstatus CASCADE")
    op.execute("DROP TYPE IF EXISTS scannertype CASCADE")
    op.execute("DROP TYPE IF EXISTS processingstatus CASCADE")
    op.execute("DROP TYPE IF EXISTS findingseverity CASCADE")
    op.execute("DROP TYPE IF EXISTS findingstatus CASCADE")
    op.execute("DROP TYPE IF EXISTS complianceframework CASCADE")
    op.execute("DROP TYPE IF EXISTS policyseverity CASCADE")
    op.execute("DROP TYPE IF EXISTS gatedecision CASCADE")
    op.execute("DROP TYPE IF EXISTS riskacceptancestatus CASCADE")
    
    # Create ENUM types (fresh, no duplicates possible)
    # Note: Using UPPERCASE values to match existing database schema
    op.execute("CREATE TYPE assettype AS ENUM ('APPLICATION', 'MICROSERVICE', 'DATABASE', 'CONTAINER', 'INFRASTRUCTURE', 'SERVER', 'NETWORK', 'CLOUD')")
    op.execute("CREATE TYPE classificationlevel AS ENUM ('PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED')")
    op.execute("CREATE TYPE relationshiptype AS ENUM ('DEPENDS_ON', 'COMMUNICATES_WITH', 'PROCESSES_DATA_FROM')")
    op.execute("CREATE TYPE stridecategory AS ENUM ('SPOOFING', 'TAMPERING', 'REPUDIATION', 'INFO_DISCLOSURE', 'DOS', 'ELEVATION')")
    op.execute("CREATE TYPE threatstatus AS ENUM ('IDENTIFIED', 'ASSESSED', 'VERIFIED', 'EVALUATED', 'PLANNING', 'MITIGATED', 'ACCEPTED', 'MONITORING')")
    op.execute("CREATE TYPE scannertype AS ENUM ('SAST', 'DAST', 'SCA', 'IAC')")
    op.execute("CREATE TYPE processingstatus AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')")
    op.execute("CREATE TYPE findingseverity AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO')")
    op.execute("CREATE TYPE findingstatus AS ENUM ('OPEN', 'IN_PROGRESS', 'REMEDIATED', 'FALSE_POSITIVE', 'ACCEPTED')")
    op.execute("CREATE TYPE complianceframework AS ENUM ('NIST_800_53', 'ISO_27001', 'PCI_DSS', 'HIPAA', 'GDPR')")
    op.execute("CREATE TYPE policyseverity AS ENUM ('INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL')")
    op.execute("CREATE TYPE gatedecision AS ENUM ('PASS', 'WARN', 'BLOCK')")
    op.execute("CREATE TYPE riskacceptancestatus AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED')")

    # Create roles table
    op.create_table(
        'roles',
        sa.Column('role_id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('role_name', sa.String(), nullable=False, unique=True),
        sa.Column('permissions', postgresql.JSONB, nullable=False),
    )

    # Create users table
    op.create_table(
        'users',
        sa.Column('user_id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('email', sa.String(255), nullable=False, unique=True),
        sa.Column('full_name', sa.String(255), nullable=False),
        sa.Column('role_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['role_id'], ['roles.role_id']),
    )
    op.create_index('ix_users_email', 'users', ['email'])

    # Create assets table
    op.create_table(
        'assets',
        sa.Column('asset_id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(255), nullable=False, unique=True),
        sa.Column('type', postgresql.ENUM('APPLICATION', 'MICROSERVICE', 'DATABASE', 'CONTAINER', 'INFRASTRUCTURE', 'SERVER', 'NETWORK', 'CLOUD', name='assettype', create_type=False), nullable=False),
        sa.Column('classification_level', postgresql.ENUM('PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED', name='classificationlevel', create_type=False), nullable=False),
        sa.Column('owner_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('confidentiality_score', sa.Integer(), nullable=False),
        sa.Column('integrity_score', sa.Integer(), nullable=False),
        sa.Column('availability_score', sa.Integer(), nullable=False),
        sa.Column('sensitivity_score', sa.Numeric(5, 2), nullable=False),
        sa.Column('technology_stack', postgresql.ARRAY(sa.String()), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['owner_id'], ['users.user_id']),
    )
    op.create_index('ix_assets_owner_id', 'assets', ['owner_id'])
    op.create_index('ix_assets_sensitivity_score', 'assets', ['sensitivity_score'], postgresql_ops={'sensitivity_score': 'DESC'})

    # Create asset_relationships table
    op.create_table(
        'asset_relationships',
        sa.Column('relationship_id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('source_asset_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('target_asset_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('relationship_type', postgresql.ENUM('DEPENDS_ON', 'COMMUNICATES_WITH', 'PROCESSES_DATA_FROM', name='relationshiptype', create_type=False), nullable=False),
        sa.ForeignKeyConstraint(['source_asset_id'], ['assets.asset_id']),
        sa.ForeignKeyConstraint(['target_asset_id'], ['assets.asset_id']),
    )

    # Create threats table
    op.create_table(
        'threats',
        sa.Column('threat_id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('asset_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('stride_category', postgresql.ENUM('SPOOFING', 'TAMPERING', 'REPUDIATION', 'INFO_DISCLOSURE', 'DOS', 'ELEVATION', name='stridecategory', create_type=False), nullable=True),
        sa.Column('mitre_attack_id', sa.String(), nullable=True),
        sa.Column('likelihood_score', sa.Integer(), nullable=False),
        sa.Column('impact_score', sa.Integer(), nullable=False),
        sa.Column('risk_score', sa.Numeric(5, 2), nullable=False),
        sa.Column('status', postgresql.ENUM('IDENTIFIED', 'ASSESSED', 'VERIFIED', 'EVALUATED', 'PLANNING', 'MITIGATED', 'ACCEPTED', 'MONITORING', name='threatstatus', create_type=False), nullable=False, server_default='IDENTIFIED'),
        sa.Column('auto_generated', sa.Boolean(), server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['asset_id'], ['assets.asset_id']),
    )
    op.create_index('ix_threats_asset_id_status', 'threats', ['asset_id', 'status'])

    # Create threat_state_history table
    op.create_table(
        'threat_state_history',
        sa.Column('history_id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('threat_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('from_state', postgresql.ENUM('IDENTIFIED', 'ASSESSED', 'VERIFIED', 'EVALUATED', 'PLANNING', 'MITIGATED', 'ACCEPTED', 'MONITORING', name='threatstatus', create_type=False), nullable=False),
        sa.Column('to_state', postgresql.ENUM('IDENTIFIED', 'ASSESSED', 'VERIFIED', 'EVALUATED', 'PLANNING', 'MITIGATED', 'ACCEPTED', 'MONITORING', name='threatstatus', create_type=False), nullable=False),
        sa.Column('changed_by', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('changed_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['threat_id'], ['threats.threat_id']),
        sa.ForeignKeyConstraint(['changed_by'], ['users.user_id']),
    )

    # Create scan_results table
    op.create_table(
        'scan_results',
        sa.Column('scan_result_id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('asset_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('scanner_type', postgresql.ENUM('SAST', 'DAST', 'SCA', 'IAC', name='scannertype', create_type=False), nullable=False),
        sa.Column('scanner_name', sa.String(), nullable=False),
        sa.Column('pipeline_run_id', sa.String(), nullable=True),
        sa.Column('raw_data', postgresql.JSONB, nullable=False),
        sa.Column('processing_status', postgresql.ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', name='processingstatus', create_type=False), nullable=False, server_default='PENDING'),
        sa.Column('scan_timestamp', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['asset_id'], ['assets.asset_id']),
    )
    op.create_index('ix_scan_results_scan_timestamp', 'scan_results', ['scan_timestamp'], postgresql_ops={'scan_timestamp': 'DESC'})

    # Create findings table
    op.create_table(
        'findings',
        sa.Column('finding_id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('scan_result_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('asset_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('threat_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('vulnerability_type', sa.String(), nullable=False),
        sa.Column('cve_id', sa.String(), nullable=True),
        sa.Column('severity', postgresql.ENUM('CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO', name='findingseverity', create_type=False), nullable=False),
        sa.Column('location', sa.Text(), nullable=True),
        sa.Column('status', postgresql.ENUM('OPEN', 'IN_PROGRESS', 'REMEDIATED', 'FALSE_POSITIVE', 'ACCEPTED', name='findingstatus', create_type=False), nullable=False, server_default='OPEN'),
        sa.Column('scanner_sources', postgresql.ARRAY(sa.String()), nullable=True),
        sa.Column('first_detected', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('remediated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['scan_result_id'], ['scan_results.scan_result_id']),
        sa.ForeignKeyConstraint(['asset_id'], ['assets.asset_id']),
        sa.ForeignKeyConstraint(['threat_id'], ['threats.threat_id']),
    )
    op.create_index('ix_findings_status', 'findings', ['status'])

    # Create controls table
    op.create_table(
        'controls',
        sa.Column('control_id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('framework', postgresql.ENUM('NIST_800_53', 'ISO_27001', 'PCI_DSS', 'HIPAA', 'GDPR', name='complianceframework', create_type=False), nullable=False),
        sa.Column('control_code', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
    )

    # Create policy_rules table
    op.create_table(
        'policy_rules',
        sa.Column('policy_rule_id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(), nullable=False, unique=True),
        sa.Column('severity', postgresql.ENUM('INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL', name='policyseverity', create_type=False), nullable=False),
        sa.Column('rego_snippet', sa.Text(), nullable=True),
        sa.Column('active', sa.Boolean(), server_default='true'),
        sa.Column('version', sa.Integer(), server_default='1'),
    )

    # Create policy_control_mappings table
    op.create_table(
        'policy_control_mappings',
        sa.Column('mapping_id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('policy_rule_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('control_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.ForeignKeyConstraint(['policy_rule_id'], ['policy_rules.policy_rule_id']),
        sa.ForeignKeyConstraint(['control_id'], ['controls.control_id']),
    )

    # Create policy_violations table
    op.create_table(
        'policy_violations',
        sa.Column('violation_id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('finding_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('policy_rule_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('gate_decision', postgresql.ENUM('PASS', 'WARN', 'BLOCK', name='gatedecision', create_type=False), nullable=False),
        sa.Column('evaluated_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['finding_id'], ['findings.finding_id']),
        sa.ForeignKeyConstraint(['policy_rule_id'], ['policy_rules.policy_rule_id']),
    )

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
        sa.Column('status', postgresql.ENUM('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED', name='riskacceptancestatus', create_type=False), nullable=False, server_default='PENDING'),
        sa.Column('approval_signature_name', sa.String(), nullable=True),
        sa.Column('approval_signature_timestamp', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['threat_id'], ['threats.threat_id']),
        sa.ForeignKeyConstraint(['requested_by'], ['users.user_id']),
        sa.ForeignKeyConstraint(['approved_by'], ['users.user_id']),
    )

    # Create audit_logs table
    op.create_table(
        'audit_logs',
        sa.Column('log_id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('action', sa.String(), nullable=False),
        sa.Column('entity_type', sa.String(), nullable=False),
        sa.Column('entity_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('before_state', postgresql.JSONB, nullable=True),
        sa.Column('after_state', postgresql.JSONB, nullable=True),
        sa.Column('timestamp', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id']),
    )
    op.create_index('ix_audit_logs_timestamp', 'audit_logs', ['timestamp'])


def downgrade() -> None:
    # Drop tables in reverse order
    op.drop_table('audit_logs')
    op.drop_table('risk_acceptances')
    op.drop_table('policy_violations')
    op.drop_table('policy_control_mappings')
    op.drop_table('policy_rules')
    op.drop_table('controls')
    op.drop_table('findings')
    op.drop_table('scan_results')
    op.drop_table('threat_state_history')
    op.drop_table('threats')
    op.drop_table('asset_relationships')
    op.drop_table('assets')
    op.drop_table('users')
    op.drop_table('roles')

    # Drop ENUM types
    op.execute('DROP TYPE IF EXISTS riskacceptancestatus')
    op.execute('DROP TYPE IF EXISTS gatedecision')
    op.execute('DROP TYPE IF EXISTS policyseverity')
    op.execute('DROP TYPE IF EXISTS complianceframework')
    op.execute('DROP TYPE IF EXISTS findingstatus')
    op.execute('DROP TYPE IF EXISTS findingseverity')
    op.execute('DROP TYPE IF EXISTS processingstatus')
    op.execute('DROP TYPE IF EXISTS scannertype')
    op.execute('DROP TYPE IF EXISTS threatstatus')
    op.execute('DROP TYPE IF EXISTS stridecategory')
    op.execute('DROP TYPE IF EXISTS relationshiptype')
    op.execute('DROP TYPE IF EXISTS classificationlevel')
    op.execute('DROP TYPE IF EXISTS assettype')
