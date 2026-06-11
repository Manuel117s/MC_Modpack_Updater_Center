from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Literal
from datetime import datetime


# ── Shared ──────────────────────────────────────────────────────────────────

class PyObjectId(str):
    """Coerces MongoDB ObjectIds to strings for JSON serialisation."""
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        from bson import ObjectId
        if not ObjectId.is_valid(str(v)):
            raise ValueError("Invalid ObjectId")
        return str(v)


# ── Users ────────────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=32)
    email: EmailStr
    password: str = Field(..., min_length=8)
    avatar_url: Optional[str] = None


class UserOut(BaseModel):
    id: str
    username: str
    email: str
    avatar_url: Optional[str]
    created_at: datetime


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ── Modpacks ─────────────────────────────────────────────────────────────────

class ModpackCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    game: str
    game_version: str
    loader: str  # e.g. Forge, Fabric, NeoForge, Quilt
    visibility: Literal["public", "private"] = "private"


class ModpackUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    game: Optional[str] = None
    game_version: Optional[str] = None
    loader: Optional[str] = None
    visibility: Optional[Literal["public", "private"]] = None


class ModpackOut(BaseModel):
    id: str
    owner_id: str
    name: str
    description: Optional[str]
    game: str
    game_version: str
    loader: str
    visibility: str
    latest_release_id: Optional[str]
    created_at: datetime
    updated_at: datetime


# ── Releases ─────────────────────────────────────────────────────────────────

class ReleaseCreate(BaseModel):
    version: str = Field(..., min_length=1, max_length=32)
    changelog: str
    download_url: Optional[str] = None
    status: Literal["draft", "published", "yanked"] = "published"


class ReleaseUpdate(BaseModel):
    changelog: Optional[str] = None
    download_url: Optional[str] = None
    status: Optional[Literal["draft", "published", "yanked"]] = None


class ReleaseOut(BaseModel):
    id: str
    modpack_id: str
    version: str
    changelog: str
    download_url: Optional[str]
    status: str
    released_at: datetime
    created_by: str


# ── News ─────────────────────────────────────────────────────────────────────

class NewsCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    body: str


class NewsUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    body: Optional[str] = None


class NewsOut(BaseModel):
    id: str
    modpack_id: str
    title: str
    body: str
    author_id: str
    created_at: datetime
    updated_at: Optional[datetime] = None


# ── Collaborators ─────────────────────────────────────────────────────────────

class CollaboratorAdd(BaseModel):
    user_id: str
    role: Literal["admin", "editor", "viewer"] = "editor"


class CollaboratorOut(BaseModel):
    id: str
    modpack_id: str
    user_id: str
    role: str
    joined_at: datetime


# ── Dashboard ─────────────────────────────────────────────────────────────────

class DashboardModpack(BaseModel):
    """Lightweight modpack card shown on the dashboard."""
    id: str
    name: str
    game: str
    game_version: str
    loader: str
    visibility: str
    latest_version: Optional[str]     # version string, e.g. "1.4.2"
    latest_released_at: Optional[datetime]
    role: str                          # "owner" | "admin" | "editor" | "viewer"
    updated_at: datetime

# ── Frondend connection ────────────────────────────────────────────────────────

class HandshakeRequest(BaseModel):
    message: str

class HandshakeResponse(BaseModel):
    status: str
    reply: str