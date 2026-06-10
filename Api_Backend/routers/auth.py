from fastapi import APIRouter, HTTPException, status
from datetime import datetime
from bson import ObjectId
from database import get_db
from schemas import UserCreate, UserOut, LoginRequest, TokenResponse, HandshakeRequest, HandshakeResponse
from auth_utils import hash_password, verify_password, create_access_token

router = APIRouter()


@router.post("/register", response_model=UserOut, status_code=201)
async def register(body: UserCreate):
    db = get_db()
    if await db.users.find_one({"email": body.email}):
        raise HTTPException(status_code=400, detail="Email already registered")

    now = datetime.utcnow()
    doc = {
        "username":      body.username,
        "email":         body.email,
        "password_hash": hash_password(body.password),
        "avatar_url":    body.avatar_url,
        "created_at":    now,
        "updated_at":    now,
    }
    result = await db.users.insert_one(doc)
    return UserOut(
        id=str(result.inserted_id),
        username=doc["username"],
        email=doc["email"],
        avatar_url=doc["avatar_url"],
        created_at=doc["created_at"],
    )


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest):
    db = get_db()
    user = await db.users.find_one({"email": body.email})
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token(str(user["_id"]))
    return TokenResponse(access_token=token)

@router.post("/handshake", response_model=HandshakeResponse)
async def process_handshake(data: HandshakeRequest):
    print(f"Recived from react: {data.message}")

    return HandshakeResponse(
        status="OK",
        reply="Handshake succesfull!"
    )