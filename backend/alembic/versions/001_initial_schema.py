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
    # Create ENUM types (only if they don't exist)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE assettype AS ENUM ('Application', 'Microservice', 'Database', 'Container', 'Infrastructure', 'Server', 'Network', 'Cloud');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE classificationlevel AS ENUM ('Public', 'Internal', 'Confidential', 'Restricted');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE relationshiptype AS ENUM ('depends_on', 'communicates_with', 'processes_data_from');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE stridecategory AS ENUM ('Spoofing', 'Tampering', 'Repudiation', 'Info_Disclosure', 'DoS', 'Elevation');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE threatstatus AS ENUM ('Identified', 'Assessed', 'Verified', 'Evaluated', 'Planning', 'Mitigated', 'Accepted', 'Monitoring');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE scannertype AS ENUM ('SAST', 'DAST', 'SCA', 'IaC');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE processingstatus AS ENUM ('Pending', 'Processing', 'Completed', 'Failed');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE findingseverity AS ENUM ('Critical', 'High', 'Medium', 'Low', 'Info');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE findingstatus AS ENUM ('Open', 'In_Progress', 'Remediated', 'False_Positive', 'Accepted');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE complianceframework AS ENUM ('NIST_800_53', 'ISO_27001', 'PCI_DSS', 'HIPAA', 'GDPR');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE policyseverity AS ENUM ('Info', 'Low', 'Medium', 'High', 'Critical');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE gatedecision AS ENUM ('Pass', 'Warn', 'Block');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE riskacceptancestatus AS ENUM ('Pending', 'Approved', 'Rejected', 'Expired');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)

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
        sa.Column('type', sa.Enum('Application', 'Microservice', 'Database', 'Container', 'Infrastructure', 'Server', 'Network', 'Cloud', name='assettype', create_type=False), nullable=False),
        sa.Column('classification_level', sa.Enum('Public', 'Internal', 'Confidential', 'Restricted', name='classificationlevel', create_type=False), nullable=False),
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
        sa.Column('relationship_type', sa.Enum('depends_on', 'communicates_with', 'processes_data_from', name='relationshiptype', create_type=False), nullable=False),
        sa.ForeignKeyConstraint(['source_asset_id'], ['assets.asset_id']),
        sa.ForeignKeyConstraint(['target_asset_id'], ['assets.asset_id']),
    )

    # Create threats table
    op.create_table(
        'threats',
        sa.Column('threat_id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('asset_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('stride_category', sa.Enum('Spoofing', 'Tampering', 'Repudiation', 'Info_Disclosure', 'DoS', 'Elevation', name='stridecategory', create_type=False), nullable=True),
        sa.Column('mitre_attack_id', sa.String(), nullable=True),
        sa.Column('likelihood_score', sa.Integer(), nullable=False),
        sa.Column('impact_score', sa.Integer(), nullable=False),
        sa.Column('risk_score', sa.Numeric(5, 2), nullable=False),
        sa.Column('status', sa.Enum('Identified', 'Assessed', 'Verified', 'Evaluated', 'Planning', 'Mitigated', 'Accepted', 'Monitoring', name='threatstatus', create_type=False), nullable=False, server_default='Identified'),
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
        sa.Column('from_state', sa.Enum('Identified', 'Assessed', 'Verified', 'Evaluated', 'Planning', 'Mitigated', 'Accepted', 'Monitoring', name='threatstatus', create_type=False), nullable=False),
        sa.Column('to_state', sa.Enum('Identified', 'Assessed', 'Verified', 'Evaluated', 'Planning', 'Mitigated', 'Accepted', 'Monitoring', name='threatstatus', create_type=False), nullable=False),
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
        sa.Column('scanner_type', sa.Enum('SAST', 'DAST', 'SCA', 'IaC', name='scannertype', create_type=False), nullable=False),
        sa.Column('scanner_name', sa.String(), nullable=False),
        sa.Column('pipeline_run_id', sa.String(), nullable=True),
        sa.Column('raw_data', postgresql.JSONB, nullable=False),
        sa.Column('processing_status', sa.Enum('Pending', 'Processing', 'Completed', 'Failed', name='processingstatus', create_type=False), nullable=False, server_default='Pending'),
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
        sa.Column('severity', sa.Enum('Critical', 'High', 'Medium', 'Low', 'Info', name='findingseverity', create_type=False), nullable=False),
        sa.Column('location', sa.Text(), nullable=True),
        sa.Column('status', sa.Enum('Open', 'In_Progress', 'Remediated', 'False_Positive', 'Accepted', name='findingstatus', create_type=False), nullable=False, server_default='Open'),
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
        sa.Column('framework', sa.Enum('NIST_800_53', 'ISO_27001', 'PCI_DSS', 'HIPAA', 'GDPR', name='complianceframework', create_type=False), nullable=False),
        sa.Column('control_code', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
    )

    # Create policy_rules table
    op.create_table(
        'policy_rules',
        sa.Column('policy_rule_id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(), nullable=False, unique=True),
        sa.Column('severity', sa.Enum('Info', 'Low', 'Medium', 'High', 'Critical', name='policyseverity', create_type=False), nullable=False),
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
        sa.Column('gate_decision', sa.Enum('Pass', 'Warn', 'Block', name='gatedecision', create_type=False), nullable=False),
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
        sa.Column('status', sa.Enum('Pending', 'Approved', 'Rejected', 'Expired', name='riskacceptancestatus', create_type=False), nullable=False, server_default='Pending'),
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
