import os
from motor.motor_asyncio import AsyncIOMotorClient

client: AsyncIOMotorClient = None
db = None


async def connect_db():
    global client, db
    mongo_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.getenv("DB_NAME", "modpack_manager")]
    print(f"Connected to MongoDB: {mongo_url}")


async def close_db():
    global client
    if client:
        client.close()
        print("MongoDB connection closed.")


def get_db():
    return db
