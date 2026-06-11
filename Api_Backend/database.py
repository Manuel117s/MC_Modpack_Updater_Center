import os
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv()

client: AsyncIOMotorClient | None = None
db = None


async def connect_db():
    global client, db

    mongo_url = os.getenv("MONGO_URI")
    db_name = os.getenv("DB_NAME")

    if not mongo_url or not db_name:
        raise ValueError("ENVIROMENT ERROR: MONGO_URI and/or DB_NAME are empty or unexisting")
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    print(f"Connected to MongoDB database {db_name}")


async def close_db():
    global client
    if client:
        client.close()
        print("MongoDB connection closed.")


def get_db():
    return db
