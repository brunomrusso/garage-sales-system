#!/usr/bin/env python3
"""
Script para converter um admin para admin_master
Uso: python convert_to_admin_master.py <email>
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app.db.database import SessionLocal
from app.models.models import Cliente, AdminPermission
from app.core.permissions import initialize_admin_permissions

def convert_to_admin_master(email: str):
    db = SessionLocal()
    try:
        # Encontrar o cliente pelo email
        cliente = db.query(Cliente).filter(Cliente.email == email).first()
        
        if not cliente:
            print(f"❌ Erro: Cliente com email '{email}' não encontrado")
            return False
        
        # Converter para admin_master
        cliente.role = 'admin_master'
        cliente.ativo = True
        db.commit()
        db.refresh(cliente)
        
        # Inicializar permissões com acesso total
        existing_perms = db.query(AdminPermission).filter(
            AdminPermission.admin_id == cliente.id
        ).first()
        
        if existing_perms:
            db.delete(existing_perms)
            db.commit()
        
        initialize_admin_permissions(db, cliente.id, is_master=True)
        
        print(f"✅ Sucesso! {cliente.nome} ({email}) agora é Admin Master")
        print(f"   ID: {cliente.id}")
        print(f"   Role: {cliente.role}")
        print(f"   Ativo: {cliente.ativo}")
        return True
    
    except Exception as e:
        print(f"❌ Erro: {str(e)}")
        return False
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python convert_to_admin_master.py <email>")
        print("Exemplo: python convert_to_admin_master.py admin@garagesales.com")
        sys.exit(1)
    
    email = sys.argv[1]
    success = convert_to_admin_master(email)
    sys.exit(0 if success else 1)
