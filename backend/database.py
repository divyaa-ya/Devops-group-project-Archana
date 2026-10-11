
import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")

client = None
db = None
plant_scans_collection = None

if MONGODB_URI:
    try:
        client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=3000)
        db = client["crop_health_db"]
        plant_scans_collection = db["plant_scans"]
    except Exception as e:
        print(f"MongoDB setup notice: {e}")


def test_database_connection():
    if client is None:
        return False

    try:
        client.admin.command("ping")
        return True
    except Exception as e:
        print(f"MongoDB connection failed: {e}")
        return False
