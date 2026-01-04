"""
Seed initial data: Roles and Test User
"""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.database import SessionLocal
from app.models.user import Role, User
from app.services.auth_service import get_password_hash

# Default permissions for each role
ROLE_PERMISSIONS = {
    "Admin": [
        "assets:read", "assets:write",
        "threats:read", "threats:write",
        "policies:read", "policies:write",
        "findings:read", "findings:write",
        "compliance:read", "compliance:write",
        "reports:read", "reports:write",
        "risk_acceptances:read", "risk_acceptances:write", "risk_acceptances:approve"
    ],
    "Security_Architect": [
        "assets:read", "assets:write",
        "threats:read", "threats:write",
        "policies:read", "policies:write",
        "findings:read", "findings:write",
        "reports:read", "reports:write"
    ],
    "Compliance_Officer": [
        "assets:read",
        "threats:read",
        "policies:read", "policies:write",
        "compliance:read", "compliance:write",
        "reports:read", "reports:write"
    ],
    "Developer": [
        "assets:read",
        "findings:read", "findings:write",
        "threats:read"
    ],
    "Executive": [
        "assets:read",
        "threats:read",
        "findings:read",
        "compliance:read",
        "reports:read",
        "risk_acceptances:read", "risk_acceptances:write"
    ]
}


def seed_roles(db):
    """Create default roles"""
    print("Creating roles...")
    
    for role_name, permissions in ROLE_PERMISSIONS.items():
        existing_role = db.query(Role).filter(Role.role_name == role_name).first()
        
        if existing_role:
            print(f"  ✓ Role '{role_name}' already exists")
            # Update permissions
            existing_role.permissions = permissions
        else:
            role = Role(role_name=role_name, permissions=permissions)
            db.add(role)
            print(f"  ✓ Created role '{role_name}'")
    
    db.commit()
    print("Roles created successfully!\n")


def seed_test_user(db):
    """Create a test user"""
    print("Creating test user...")
    
    # Get Security_Architect role
    role = db.query(Role).filter(Role.role_name == "Security_Architect").first()
    
    if not role:
        print("  ✗ Error: Security_Architect role not found!")
        return
    
    # Check if test user exists
    test_user = db.query(User).filter(User.email == "admin@sentinel.local").first()
    
    if test_user:
        print("  ✓ Test user already exists")
        # Update password
        test_user.password_hash = get_password_hash("admin123")
        db.commit()
        print("  ✓ Updated test user password")
    else:
        # Create test user
        test_user = User(
            email="admin@sentinel.local",
            full_name="Admin User",
            password_hash=get_password_hash("admin123"),
            role_id=role.role_id
        )
        db.add(test_user)
        db.commit()
        print("  ✓ Created test user")
    
    print(f"  Email: admin@sentinel.local")
    print(f"  Password: admin123")
    print("Test user created successfully!\n")


def seed_admin_user(db):
    """Create Alpha XIO admin user"""
    print("Creating Alpha XIO admin user...")
    
    # Get Admin role
    admin_role = db.query(Role).filter(Role.role_name == "Admin").first()
    
    if not admin_role:
        print("  ✗ Error: Admin role not found!")
        return
    
    # Check if Alpha XIO user exists
    alpha_user = db.query(User).filter(User.email == "alphaxio47@gmail.com").first()
    
    if alpha_user:
        print("  ✓ Alpha XIO user already exists")
        # Update password and role
        alpha_user.password_hash = get_password_hash("@Password1")
        alpha_user.role_id = admin_role.role_id
        alpha_user.full_name = "Alpha XIO"
        db.commit()
        print("  ✓ Updated Alpha XIO user")
    else:
        # Create Alpha XIO user
        alpha_user = User(
            email="alphaxio47@gmail.com",
            full_name="Alpha XIO",
            password_hash=get_password_hash("@Password1"),
            role_id=admin_role.role_id
        )
        db.add(alpha_user)
        db.commit()
        print("  ✓ Created Alpha XIO user")
    
    print(f"  Email: alphaxio47@gmail.com")
    print(f"  Password: @Password1")
    print(f"  Role: Admin (Full Access)")
    print("Alpha XIO admin user created successfully!\n")


def main():
    """Main seed function"""
    print("=" * 50)
    print("Seeding Sentinel IRM Database")
    print("=" * 50)
    print()
    
    db = SessionLocal()
    
    try:
        seed_roles(db)
        seed_test_user(db)
        seed_admin_user(db)
        
        print("=" * 50)
        print("✅ Seed data created successfully!")
        print("=" * 50)
        print()
        print("You can now login with:")
        print("  Email: admin@sentinel.local")
        print("  Password: admin123")
        print()
        print("Or as Admin:")
        print("  Email: alphaxio47@gmail.com")
        print("  Password: @Password1")
        
    except Exception as e:
        print(f"✗ Error seeding data: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()



