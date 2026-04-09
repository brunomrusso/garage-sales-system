import os
from sqlalchemy import text
from app.db.database import engine

def run_migration_file(filename: str):
    """Execute a single migration file"""
    migration_file = os.path.join(os.path.dirname(__file__), filename)
    
    if not os.path.exists(migration_file):
        print(f"⚠️  Migration file not found: {migration_file}")
        return False
    
    try:
        with open(migration_file, 'r') as f:
            sql_script = f.read()
        
        with engine.connect() as connection:
            # Split the script into individual statements
            statements = [stmt.strip() for stmt in sql_script.split(';') if stmt.strip()]
            
            for statement in statements:
                print(f"  Executing: {statement[:60]}...")
                connection.execute(text(statement))
            
            connection.commit()
            print(f"✅ {filename} executed successfully!")
            return True
    
    except Exception as e:
        print(f"❌ Error executing {filename}: {str(e)}")
        return False

def run_migrations():
    """Execute all pending migrations"""
    print("🔄 Running database migrations...")
    
    migrations = [
        'migrate_add_role_ativo.sql',
        'migrate_add_permissions.sql'
    ]
    
    for migration in migrations:
        run_migration_file(migration)
    
    print("✅ All migrations completed!")

if __name__ == "__main__":
    run_migrations()
