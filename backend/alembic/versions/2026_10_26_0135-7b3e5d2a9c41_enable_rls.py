"""enable row level security

Supabase zet tabellen in het public-schema open via de REST API (met de publieke key).
RLS aan zonder policies sluit die toegang af; de backend logt in als eigenaar van de
tabellen en heeft daar geen last van. Alleen voor Postgres; SQLite kent geen RLS.

Revision ID: 7b3e5d2a9c41
Revises: 4f2a9c1d7e3b
Create Date: 2026-10-26 01:35:00.000000

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = '7b3e5d2a9c41'
down_revision: Union[str, Sequence[str], None] = '4f2a9c1d7e3b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

TABLES = ['alembic_version', 'brands', 'generation_runs', 'posts', 'post_versions', 'social_accounts', 'post_media']


def upgrade() -> None:
    """Upgrade schema."""
    if op.get_bind().dialect.name != 'postgresql':
        return
    for table in TABLES:
        op.execute(f'ALTER TABLE {table} ENABLE ROW LEVEL SECURITY')


def downgrade() -> None:
    """Downgrade schema."""
    if op.get_bind().dialect.name != 'postgresql':
        return
    for table in TABLES:
        op.execute(f'ALTER TABLE {table} DISABLE ROW LEVEL SECURITY')
