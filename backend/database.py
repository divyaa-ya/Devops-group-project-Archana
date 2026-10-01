import os
from pymongo import MongoClient
from dotenv import load_dotenv

# Load variables from .env
load_dotenv()

# Get MongoDB connection string
MONGODB_URI = os.getenv("MONGODB_URI")

if not MONGODB_URI:
    raise RuntimeError("MONGODB_URI is not set in the .env file")

# Connect to MongoDB Atlas
client = MongoClient(MONGODB_URI)

# Select database
db = client["crop_health_db"]

# Select collection
plant_scans_collection = db["plant_scans"]


def test_database_connection():
    """Test whether MongoDB Atlas is reachable."""
    try:
        client.admin.command("ping")
        return True
    except Exception as e:
        print(f"MongoDB connection failed: {e}")
        return False