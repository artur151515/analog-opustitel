"""Initial migration for activity logs

Revision ID: 002_activity_logs
Revises: 001_initial_migration
Create Date: 2025-01-03 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '002_activity_logs'
down_revision = '001_initial_migration'
branch_labels = None
depends_on = None


def upgrade():
    # Create activity_logs table
    op.create_table(
        'activity_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('action_type', sa.String(length=50), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('ip_address', sa.String(length=45), nullable=True),
        sa.Column('user_agent', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create index for better performance
    op.create_index(op.f('ix_activity_logs_id'), 'activity_logs', ['id'], unique=False)
    op.create_index(op.f('ix_activity_logs_user_id'), 'activity_logs', ['user_id'], unique=False)
    op.create_index(op.f('ix_activity_logs_action_type'), 'activity_logs', ['action_type'], unique=False)
    op.create_index(op.f('ix_activity_logs_created_at'), 'activity_logs', ['created_at'], unique=False)


def downgrade():
    # Drop activity_logs table
    op.drop_table('activity_logs')