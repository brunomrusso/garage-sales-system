import os
from sqlalchemy import text
from app.db.database import engine

def run_migrations():
    """Execute pending migrations"""
    migration_file = os.path.join(os.path.dirname(__file__), 'migrate_add_role_ativo.sql')
    
    if not os.path.exists(migration_file):
        print(f"Migration file not found: {migration_file}")
        return
    
    try:
        with open(migration_file, 'r') as f:
            sql_script = f.read()
        
        with engine.connect() as connection:
            # Split the script into individual statements
            statements = [stmt.strip() for stmt in sql_script.split(';') if stmt.strip()]
            
            for statement in statements:
                print(f"Executing: {statement[:50]}...")
                connection.execute(text(statement))
            
            connection.commit()
            print("✅ All migrations executed successfully!")
    
    except Exception as e:
        print(f"❌ Error executing migrations: {str(e)}")
        raise

if __name__ == "__main__":
    run_migrations()
