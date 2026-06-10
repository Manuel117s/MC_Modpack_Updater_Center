from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime
from bson import ObjectId
from database import get_db
from schemas import NewsCreate, NewsOut
from auth_utils import get_current_user
from typing import List

router = APIRouter()


@router.get("/{modpack_id}/news", response_model=List[NewsOut])
async def list_news(modpack_id: str, user_id: str = Depends(get_current_user)):
    db = get_db()
    await _assert_access(db, modpack_id, user_id)
    posts = await db.news.find(
        {"modpack_id": ObjectId(modpack_id)}
    ).sort("created_at", -1).to_list(length=50)
    return [_news_out(p) for p in posts]


@router.post("/{modpack_id}/news", response_model=NewsOut, status_code=201)
async def create_news(modpack_id: str, body: NewsCreate, user_id: str = Depends(get_current_user)):
    db = get_db()
    await _assert_editor(db, modpack_id, user_id)
    doc = {
        "modpack_id": ObjectId(modpack_id),
        "title":      body.title,
        "body":       body.body,
        "author_id":  ObjectId(user_id),
        "created_at": datetime.utcnow(),
    }
    result = await db.news.insert_one(doc)
    doc["_id"] = result.inserted_id
    return _news_out(doc)


@router.delete("/{modpack_id}/news/{news_id}", status_code=204)
async def delete_news(modpack_id: str, news_id: str, user_id: str = Depends(get_current_user)):
    db = get_db()
    await _assert_editor(db, modpack_id, user_id)
    result = await db.news.delete_one({
        "_id": ObjectId(news_id),
        "modpack_id": ObjectId(modpack_id),
    })
    if result.deleted_count == 0:
        raise HTTPException(404, "News post not found")


# ── Helpers ───────────────────────────────────────────────────────────────────

async def _assert_access(db, modpack_id, user_id):
    m = await db.modpacks.find_one({"_id": ObjectId(modpack_id)})
    if not m:
        raise HTTPException(404, "Modpack not found")
    if m["visibility"] == "public":
        return
    uid = ObjectId(user_id)
    if m["owner_id"] == uid:
        return
    collab = await db.collaborators.find_one({"modpack_id": ObjectId(modpack_id), "user_id": uid})
    if not collab:
        raise HTTPException(403, "Access denied")


async def _assert_editor(db, modpack_id, user_id):
    m = await db.modpacks.find_one({"_id": ObjectId(modpack_id)})
    if not m:
        raise HTTPException(404, "Modpack not found")
    uid = ObjectId(user_id)
    if m["owner_id"] == uid:
        return
    collab = await db.collaborators.find_one({
        "modpack_id": ObjectId(modpack_id),
        "user_id": uid,
        "role": {"$in": ["admin", "editor"]},
    })
    if not collab:
        raise HTTPException(403, "Editor access required")


def _news_out(doc) -> NewsOut:
    return NewsOut(
        id=str(doc["_id"]),
        modpack_id=str(doc["modpack_id"]),
        title=doc["title"],
        body=doc["body"],
        author_id=str(doc["author_id"]),
        created_at=doc["created_at"],
    )
