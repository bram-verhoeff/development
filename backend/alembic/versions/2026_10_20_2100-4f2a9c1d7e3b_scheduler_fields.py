"""scheduler fields

Revision ID: 4f2a9c1d7e3b
Revises: cb21130f0d89
Create Date: 2026-10-20 21:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

import app.database  # noqa: F401  (eigen kolomtypes zoals UTCDateTime)


# revision identifiers, used by Alembic.
revision: str = '4f2a9c1d7e3b'
down_revision: Union[str, Sequence[str], None] = 'cb21130f0d89'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    with op.batch_alter_table('posts') as batch_op:
        batch_op.add_column(sa.Column('publish_attempts', sa.Integer(), nullable=False, server_default='0'))
        batch_op.add_column(sa.Column('next_attempt_at', app.database.UTCDateTime(timezone=True), nullable=True))
        batch_op.add_column(sa.Column('publishing_started_at', app.database.UTCDateTime(timezone=True), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table('posts') as batch_op:
        batch_op.drop_column('publishing_started_at')
        batch_op.drop_column('next_attempt_at')
        batch_op.drop_column('publish_attempts')
