from fastapi import APIRouter, HTTPException, Depends, status
from datetime import datetime
from bson import ObjectId
from database import get_db
from schemas import ModpackCreate, ModpackOut, ModpackUpdate, DashboardModpack
from auth_utils import get_current_user
from typing import List, Optional

router = APIRouter()


def _fmt(doc) -> dict:
    doc["id"] = str(doc.pop("_id"))
    return doc


# ── Dashboard ─────────────────────────────────────────────────────────────────

@router.get("/dashboard", response_model=List[DashboardModpack])
async def dashboard(user_id: str = Depends(get_current_user)):
    """
    Returns all modpacks the current user owns or collaborates on,
    enriched with the latest release version for the dashboard cards.
    """
    db = get_db()
    uid = ObjectId(user_id)

    # Collect modpack_ids from collaborator records
    collab_cursor = db.collaborators.find({"user_id": uid})
    collab_roles = {str(c["modpack_id"]): c["role"] async for c in collab_cursor}

    # Fetch owned + collaborated modpacks in one query
    owned_ids = await db.modpacks.distinct("_id", {"owner_id": uid})
    collab_ids = [ObjectId(mid) for mid in collab_roles]
    all_ids = list(set(owned_ids + collab_ids))

    modpacks = await db.modpacks.find({"_id": {"$in": all_ids}}).to_list(length=200)

    # Bulk-fetch latest releases
    release_ids = [ObjectId(m["latest_release_id"]) for m in modpacks if m.get("latest_release_id")]
    releases = {str(r["_id"]): r async for r in db.releases.find({"_id": {"$in": release_ids}})}

    result = []
    for m in modpacks:
        mid = str(m["_id"])
        rel = releases.get(str(m.get("latest_release_id"))) if m.get("latest_release_id") else None
        role = "owner" if m["owner_id"] == uid else collab_roles.get(mid, "viewer")
        result.append(DashboardModpack(
            id=mid,
            name=m["name"],
            game=m["game"],
            game_version=m["game_version"],
            loader=m["loader"],
            visibility=m["visibility"],
            latest_version=rel["version"] if rel else None,
            latest_released_at=rel["released_at"] if rel else None,
            role=role,
            updated_at=m["updated_at"],
        ))

    result.sort(key=lambda x: x.updated_at, reverse=True)
    return result


# ── CRUD ──────────────────────────────────────────────────────────────────────

@router.post("", response_model=ModpackOut, status_code=201)
async def create_modpack(body: ModpackCreate, user_id: str = Depends(get_current_user)):
    db = get_db()
    now = datetime.utcnow()
    doc = {
        "owner_id":         ObjectId(user_id),
        "name":             body.name,
        "description":      body.description,
        "game":             body.game,
        "game_version":     body.game_version,
        "loader":           body.loader,
        "visibility":       body.visibility,
        "latest_release_id": None,
        "created_at":       now,
        "updated_at":       now,
    }
    result = await db.modpacks.insert_one(doc)
    return _modpack_out(doc, result.inserted_id)


@router.get("/{modpack_id}", response_model=ModpackOut)
async def get_modpack(modpack_id: str, user_id: str = Depends(get_current_user)):
    db = get_db()
    m = await _get_accessible(db, modpack_id, user_id)
    return _modpack_out(m)


@router.patch("/{modpack_id}", response_model=ModpackOut)
async def update_modpack(modpack_id: str, body: ModpackUpdate, user_id: str = Depends(get_current_user)):
    db = get_db()
    await _assert_owner_or_admin(db, modpack_id, user_id)

    updates = {k: v for k, v in body.dict().items() if v is not None}
    updates["updated_at"] = datetime.utcnow()
    m = await db.modpacks.find_one_and_update(
        {"_id": ObjectId(modpack_id)},
        {"$set": updates},
        return_document=True,
    )
    return _modpack_out(m)


@router.delete("/{modpack_id}", status_code=204)
async def delete_modpack(modpack_id: str, user_id: str = Depends(get_current_user)):
    db = get_db()
    m = await db.modpacks.find_one({"_id": ObjectId(modpack_id)})
    if not m:
        raise HTTPException(404, "Modpack not found")
    if str(m["owner_id"]) != user_id:
        raise HTTPException(403, "Only the owner can delete a modpack")
    await db.modpacks.delete_one({"_id": ObjectId(modpack_id)})
    await db.releases.delete_many({"modpack_id": ObjectId(modpack_id)})
    await db.news.delete_many({"modpack_id": ObjectId(modpack_id)})
    await db.collaborators.delete_many({"modpack_id": ObjectId(modpack_id)})


# ── Helpers ───────────────────────────────────────────────────────────────────

async def _get_accessible(db, modpack_id: str, user_id: str):
    m = await db.modpacks.find_one({"_id": ObjectId(modpack_id)})
    if not m:
        raise HTTPException(404, "Modpack not found")
    if m["visibility"] == "public":
        return m
    uid = ObjectId(user_id)
    if m["owner_id"] == uid:
        return m
    collab = await db.collaborators.find_one({"modpack_id": ObjectId(modpack_id), "user_id": uid})
    if not collab:
        raise HTTPException(403, "Access denied")
    return m


async def _assert_owner_or_admin(db, modpack_id: str, user_id: str):
    m = await db.modpacks.find_one({"_id": ObjectId(modpack_id)})
    if not m:
        raise HTTPException(404, "Modpack not found")
    uid = ObjectId(user_id)
    if m["owner_id"] == uid:
        return
    collab = await db.collaborators.find_one({
        "modpack_id": ObjectId(modpack_id), "user_id": uid, "role": "admin"
    })
    if not collab:
        raise HTTPException(403, "Admin or owner access required")


def _modpack_out(doc, inserted_id=None) -> ModpackOut:
    return ModpackOut(
        id=str(inserted_id or doc["_id"]),
        owner_id=str(doc["owner_id"]),
        name=doc["name"],
        description=doc.get("description"),
        game=doc["game"],
        game_version=doc["game_version"],
        loader=doc["loader"],
        visibility=doc["visibility"],
        latest_release_id=str(doc["latest_release_id"]) if doc.get("latest_release_id") else None,
        created_at=doc["created_at"],
        updated_at=doc["updated_at"],
    )
