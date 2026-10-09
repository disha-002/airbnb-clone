"""Run: python seed.py  (drops and recreates the database with demo data)."""
from app.seed import reset_and_seed

if __name__ == "__main__":
    print("Seeded", reset_and_seed(), "listings")
