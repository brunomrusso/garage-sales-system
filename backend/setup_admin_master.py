#!/usr/bin/env python3
"""
Script para converter um admin para admin_master
Execute: python setup_admin_master.py
"""

import os
import sys

# Adicionar o diretório backend ao path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.db.database import SessionLocal
from app.models.models import Cliente, AdminPermission
from app.core.permissions import initialize_admin_permissions

def main():
    db = SessionLocal()
    
    try:
        print("=" * 60)
        print("CONVERTER ADMIN PARA ADMIN MASTER")
        print("=" * 60)
        
        # Listar todos os admins
        admins = db.query(Cliente).filter(
            Cliente.role.in_(['admin', 'admin_master'])
        ).all()
        
        if not admins:
            print("❌ Nenhum admin encontrado no sistema")
            return False
        
        print("\n📋 Admins encontrados:\n")
        for i, admin in enumerate(admins, 1):
            role_display = "🔐 Admin Master" if admin.role == 'admin_master' else "👤 Admin"
            print(f"{i}. {role_display} - {admin.nome} ({admin.email})")
        
        print("\n" + "=" * 60)
        choice = input("\nDigite o número do admin para converter (ou 'q' para sair): ").strip()
        
        if choice.lower() == 'q':
            print("Cancelado.")
            return False
        
        try:
            idx = int(choice) - 1
            if idx < 0 or idx >= len(admins):
                print("❌ Opção inválida")
                return False
        except ValueError:
            print("❌ Entrada inválida")
            return False
        
        admin = admins[idx]
        
        print(f"\n🔄 Convertendo {admin.nome} para Admin Master...")
        
        # Converter para admin_master
        admin.role = 'admin_master'
        admin.ativo = True
        db.commit()
        db.refresh(admin)
        
        # Remover permissões antigas
        existing_perms = db.query(AdminPermission).filter(
            AdminPermission.admin_id == admin.id
        ).first()
        
        if existing_perms:
            db.delete(existing_perms)
            db.commit()
        
        # Inicializar permissões com acesso total
        initialize_admin_permissions(db, admin.id, is_master=True)
        
        print("\n" + "=" * 60)
        print("✅ SUCESSO!")
        print("=" * 60)
        print(f"Nome: {admin.nome}")
        print(f"Email: {admin.email}")
        print(f"Role: {admin.role}")
        print(f"Ativo: {'Sim' if admin.ativo else 'Não'}")
        print("\n🎉 Agora você é Admin Master com todas as permissões!")
        print("=" * 60)
        
        return True
    
    except Exception as e:
        print(f"\n❌ Erro: {str(e)}")
        import traceback
        traceback.print_exc()
        return False
    
    finally:
        db.close()

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
