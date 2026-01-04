"""
Seed test findings for development
"""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.database import SessionLocal
from app.models.asset import Asset
from app.models.finding import Finding, FindingSeverity, FindingStatus
from app.models.user import User

# Sample findings data
TEST_FINDINGS = [
    {
        "vulnerability_type": "SQL Injection in User Authentication",
        "severity": FindingSeverity.CRITICAL,
        "location": "/api/auth/login",
        "cve_id": "CVE-2024-1234",
        "scanner_sources": ["SonarQube", "OWASP ZAP"],
        "status": FindingStatus.OPEN,
    },
    {
        "vulnerability_type": "Cross-Site Scripting (XSS) in Search",
        "severity": FindingSeverity.HIGH,
        "location": "/api/search",
        "cve_id": "CVE-2024-5678",
        "scanner_sources": ["OWASP ZAP"],
        "status": FindingStatus.OPEN,
    },
    {
        "vulnerability_type": "Insecure Direct Object Reference",
        "severity": FindingSeverity.MEDIUM,
        "location": "/api/users/{id}",
        "cve_id": None,
        "scanner_sources": ["Snyk"],
        "status": FindingStatus.IN_PROGRESS,
    },
    {
        "vulnerability_type": "Missing Security Headers",
        "severity": FindingSeverity.LOW,
        "location": "/*",
        "cve_id": None,
        "scanner_sources": ["Terraform"],
        "status": FindingStatus.OPEN,
    },
    {
        "vulnerability_type": "Weak Password Policy",
        "severity": FindingSeverity.MEDIUM,
        "location": "/api/auth/register",
        "cve_id": None,
        "scanner_sources": ["Manual"],
        "status": FindingStatus.OPEN,
    },
    {
        "vulnerability_type": "Sensitive Data Exposure in Logs",
        "severity": FindingSeverity.HIGH,
        "location": "/api/payments",
        "cve_id": "CVE-2024-9012",
        "scanner_sources": ["SonarQube"],
        "status": FindingStatus.OPEN,
    },
    {
        "vulnerability_type": "Outdated Dependency: express@4.15.0",
        "severity": FindingSeverity.CRITICAL,
        "location": "package.json",
        "cve_id": "CVE-2024-3456",
        "scanner_sources": ["Snyk"],
        "status": FindingStatus.OPEN,
    },
    {
        "vulnerability_type": "Missing Rate Limiting",
        "severity": FindingSeverity.MEDIUM,
        "location": "/api/public",
        "cve_id": None,
        "scanner_sources": ["Manual"],
        "status": FindingStatus.ACCEPTED,
    },
]


def seed_findings(db):
    """Create test findings for existing assets"""
    print("Creating test findings...")
    
    # Get all assets
    assets = db.query(Asset).all()
    
    if not assets:
        print("  ✗ No assets found! Please create an asset first.")
        print("  You can create one at http://localhost:8080/assets")
        return
    
    print(f"  Found {len(assets)} asset(s)")
    
    # Create findings for each asset
    findings_created = 0
    for asset in assets:
        print(f"\n  Creating findings for asset: {asset.name}")
        
        # Create 2-3 findings per asset
        findings_to_create = TEST_FINDINGS[:3] if len(TEST_FINDINGS) >= 3 else TEST_FINDINGS
        
        for finding_data in findings_to_create:
            finding = Finding(
                asset_id=asset.asset_id,
                vulnerability_type=finding_data["vulnerability_type"],
                severity=finding_data["severity"],
                location=finding_data["location"],
                cve_id=finding_data["cve_id"],
                scanner_sources=finding_data["scanner_sources"],
                status=finding_data["status"],
            )
            db.add(finding)
            findings_created += 1
            print(f"    ✓ Created: {finding_data['vulnerability_type']} ({finding_data['severity'].value})")
    
    db.commit()
    print(f"\n✅ Created {findings_created} test findings!")
    print(f"   View them at: http://localhost:8080/findings")


def main():
    """Main seed function"""
    print("=" * 50)
    print("Seeding Test Findings")
    print("=" * 50)
    print()
    
    db = SessionLocal()
    
    try:
        seed_findings(db)
        print()
        print("=" * 50)
        print("✅ Test findings created successfully!")
        print("=" * 50)
        
    except Exception as e:
        print(f"✗ Error seeding findings: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()


