"""social pages and publish_as

LinkedIn-bedrijfspagina's per koppeling, en per post op welke pagina hij komt.

Revision ID: c8d41e6f2b97
Revises: 7b3e5d2a9c41
Create Date: 2026-10-26 02:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c8d41e6f2b97'
down_revision: Union[str, Sequence[str], None] = '7b3e5d2a9c41'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'social_pages',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('social_account_id', sa.Integer(), nullable=False),
        sa.Column('external_id', sa.String(length=200), nullable=False),
        sa.Column('name', sa.String(length=300), nullable=False),
        sa.Column('avatar_url', sa.String(length=1000), nullable=True),
        sa.Column('is_default', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.ForeignKeyConstraint(['social_account_id'], ['social_accounts.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('social_account_id', 'external_id', name='uq_social_pages_account_external'),
    )
    op.create_index(op.f('ix_social_pages_social_account_id'), 'social_pages', ['social_account_id'], unique=False)
    with op.batch_alter_table('posts') as batch_op:
        batch_op.add_column(sa.Column('publish_as', sa.String(length=200), nullable=True))
    # Net als de andere tabellen: niet bereikbaar via de Supabase REST API
    if op.get_bind().dialect.name == 'postgresql':
        op.execute('ALTER TABLE social_pages ENABLE ROW LEVEL SECURITY')


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table('posts') as batch_op:
        batch_op.drop_column('publish_as')
    op.drop_index(op.f('ix_social_pages_social_account_id'), table_name='social_pages')
    op.drop_table('social_pages')
