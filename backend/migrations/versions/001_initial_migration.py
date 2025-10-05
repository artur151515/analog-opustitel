"""Initial migration

Revision ID: 001
Revises: 
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create symbols table
    op.create_table('symbols',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=20), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_symbols_id'), 'symbols', ['id'], unique=False)
    op.create_index(op.f('ix_symbols_name'), 'symbols', ['name'], unique=False)
    op.create_unique_constraint('symbols_name_key', 'symbols', ['name'])

    # Create signals table
    op.create_table('signals',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('symbol_id', sa.Integer(), nullable=False),
        sa.Column('tf', sa.String(length=10), nullable=False),
        sa.Column('ts', sa.DateTime(timezone=True), nullable=False),
        sa.Column('direction', sa.String(length=10), nullable=False),
        sa.Column('enter_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('expire_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['symbol_id'], ['symbols.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.CheckConstraint("direction IN ('UP', 'DOWN')", name='check_direction'),
        sa.UniqueConstraint('symbol_id', 'tf', 'ts', name='unique_signal')
    )
    op.create_index(op.f('ix_signals_id'), 'signals', ['id'], unique=False)

    # Create verdicts table
    op.create_table('verdicts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('signal_id', sa.Integer(), nullable=False),
        sa.Column('result', sa.String(length=10), nullable=False),
        sa.Column('settled_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['signal_id'], ['signals.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.CheckConstraint("result IN ('WIN', 'LOSS', 'SKIP')", name='check_result')
    )
    op.create_index(op.f('ix_verdicts_id'), 'verdicts', ['id'], unique=False)

    # Create stats_rolling table
    op.create_table('stats_rolling',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('symbol_id', sa.Integer(), nullable=False),
        sa.Column('tf', sa.String(length=10), nullable=False),
        sa.Column('window', sa.Integer(), nullable=False),
        sa.Column('winrate', sa.Float(), nullable=False),
        sa.Column('total_signals', sa.Integer(), nullable=False),
        sa.Column('wins', sa.Integer(), nullable=False),
        sa.Column('losses', sa.Integer(), nullable=False),
        sa.Column('skips', sa.Integer(), nullable=False),
        sa.Column('break_even_rate', sa.Float(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['symbol_id'], ['symbols.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('symbol_id', 'tf', 'window', name='unique_stats')
    )
    op.create_index(op.f('ix_stats_rolling_id'), 'stats_rolling', ['id'], unique=False)


def downgrade() -> None:
    op.drop_table('stats_rolling')
    op.drop_table('verdicts')
    op.drop_table('signals')
    op.drop_table('symbols')
