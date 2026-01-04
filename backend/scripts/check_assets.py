"""
Check existing assets in database
"""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.database import SessionLocal
from app.models.asset import Asset

db = SessionLocal()
try:
    assets = db.query(Asset).all()
    print(f'Found {len(assets)} asset(s) in database:\n')
    for asset in assets:
        print(f'  Asset ID: {asset.asset_id}')
        print(f'  Name: {asset.name}')
        print(f'  Type: {asset.type}')
        print(f'  Classification: {asset.classification_level}')
        print(f'  CIA Scores: C={asset.confidentiality_score}, I={asset.integrity_score}, A={asset.availability_score}')
        print(f'  Sensitivity Score: {asset.sensitivity_score}')
        print()
finally:
    db.close()


