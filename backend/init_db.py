import logging
from sqlalchemy import text
from database import engine, Base
import models

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("init_db")

def migrate_and_sync():
    logger.info("Synchronizing database schema...")
    
    # 1. Create all newly defined tables
    Base.metadata.create_all(bind=engine)
    logger.info("Base metadata created.")

    # 2. Add columns to interactions if not already present (non-destructive)
    with engine.connect() as conn:
        alter_statements = [
            "ALTER TABLE interactions ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;",
            "ALTER TABLE interactions ADD COLUMN IF NOT EXISTS hcp_id INTEGER REFERENCES hcps(id) ON DELETE SET NULL;",
            "ALTER TABLE interactions ADD COLUMN IF NOT EXISTS hco_id INTEGER REFERENCES hcos(id) ON DELETE SET NULL;",
            "ALTER TABLE interactions ADD COLUMN IF NOT EXISTS product_id INTEGER REFERENCES products(id) ON DELETE SET NULL;",
            "ALTER TABLE interactions ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Completed';",
            "ALTER TABLE interactions ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;",
            "ALTER TABLE interactions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;",
            # Indexes for high performance
            "CREATE INDEX IF NOT EXISTS idx_interactions_visit_date ON interactions(\"visitDate\");",
            "CREATE INDEX IF NOT EXISTS idx_interactions_doctor ON interactions(doctor);",
            "CREATE INDEX IF NOT EXISTS idx_interactions_product ON interactions(product);"
        ]
        for stmt in alter_statements:
            try:
                conn.execute(text(stmt))
            except Exception as e:
                logger.warning("Migration statement warning: %s -> %s", stmt, e)
        conn.commit()
    logger.info("Database schema synchronization complete.")

if __name__ == "__main__":
    migrate_and_sync()
