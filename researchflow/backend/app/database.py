from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.config import settings
from app.models.research import ResearchSession, Report

# Global variables
client = None
database = None


async def connect_to_mongo():
    """Connect to MongoDB and initialize Beanie"""
    global client, database

    client = AsyncIOMotorClient(settings.MONGODB_URL)
    database = client[settings.DATABASE_NAME]

    # Initialize Beanie with document models
    await init_beanie(database=database, document_models=[ResearchSession, Report])

    print(f"✅ Connected to MongoDB: {settings.DATABASE_NAME}")


async def close_mongo_connection():
    """Close MongoDB connection"""
    global client

    if client:
        client.close()
        print("MongoDB connection closed")


def get_database():
    """Get the database instance"""
    return database
