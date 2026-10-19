from alembic import command
from alembic.config import Config


def test_migrations_match_models(tmp_path):
    """Migraties draaien op een lege database en komen overeen met de modellen."""
    cfg = Config("alembic.ini")
    cfg.set_main_option("sqlalchemy.url", f"sqlite:///{tmp_path / 'test.db'}")
    command.upgrade(cfg, "head")
    command.check(cfg)  # faalt als modellen en migraties uit elkaar lopen
    command.downgrade(cfg, "base")
