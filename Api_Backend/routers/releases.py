from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime
from bson import ObjectId
from database import get_db
from schemas import ReleaseCreate, ReleaseOut, ReleaseUpdate
from auth_utils import get_current_user
from typing import List

router = APIRouter()


@router.get("/{modpack_id}/releases", response_model=List[ReleaseOut])
async def list_releases(modpack_id: str, user_id: str = Depends(get_current_user)):
    db = get_db()
    await _assert_access(db, modpack_id, user_id)
    releases = await db.releases.find(
        {"modpack_id": ObjectId(modpack_id)}
    ).sort("released_at", -1).to_list(length=100)
    return [_release_out(r) for r in releases]


@router.post("/{modpack_id}/releases", response_model=ReleaseOut, status_code=201)
async def create_release(modpack_id: str, body: ReleaseCreate, user_id: str = Depends(get_current_user)):
    """Issue a new version. Updates modpack.latest_release_id automatically."""
    db = get_db()
    await _assert_editor(db, modpack_id, user_id)

    # Check version doesn't already exist for this modpack
    existing = await db.releases.find_one({
        "modpack_id": ObjectId(modpack_id),
        "version": body.version,
    })
    if existing:
        raise HTTPException(400, f"Version '{body.version}' already exists for this modpack")

    now = datetime.utcnow()
    doc = {
        "modpack_id":   ObjectId(modpack_id),
        "version":      body.version,
        "changelog":    body.changelog,
        "download_url": body.download_url,
        "status":       body.status,
        "released_at":  now,
        "created_by":   ObjectId(user_id),
    }
    result = await db.releases.insert_one(doc)

    # Update modpack's latest_release_id and updated_at
    if body.status == "published":
        await db.modpacks.update_one(
            {"_id": ObjectId(modpack_id)},
            {"$set": {
                "latest_release_id": result.inserted_id,
                "updated_at": now,
            }},
        )

    doc["_id"] = result.inserted_id
    return _release_out(doc)


@router.get("/{modpack_id}/releases/{release_id}", response_model=ReleaseOut)
async def get_release(modpack_id: str, release_id: str, user_id: str = Depends(get_current_user)):
    db = get_db()
    await _assert_access(db, modpack_id, user_id)
    r = await db.releases.find_one({
        "_id": ObjectId(release_id),
        "modpack_id": ObjectId(modpack_id),
    })
    if not r:
        raise HTTPException(404, "Release not found")
    return _release_out(r)


@router.patch("/{modpack_id}/releases/{release_id}", response_model=ReleaseOut)
async def update_release(
    modpack_id: str, release_id: str, body: ReleaseUpdate,
    user_id: str = Depends(get_current_user)
):
    db = get_db()
    await _assert_editor(db, modpack_id, user_id)

    updates = {k: v for k, v in body.dict().items() if v is not None}
    if not updates:
        raise HTTPException(400, "Nothing to update")

    r = await db.releases.find_one_and_update(
        {"_id": ObjectId(release_id), "modpack_id": ObjectId(modpack_id)},
        {"$set": updates},
        return_document=True,
    )
    if not r:
        raise HTTPException(404, "Release not found")

    # If this release was yanked or unpublished, and it's the latest, clear latest_release_id
    if updates.get("status") in ("draft", "yanked"):
        modpack = await db.modpacks.find_one({"_id": ObjectId(modpack_id)})
        if modpack and str(modpack.get("latest_release_id")) == release_id:
            # Find the next most recent published release
            next_release = await db.releases.find_one(
                {"modpack_id": ObjectId(modpack_id), "status": "published", "_id": {"$ne": ObjectId(release_id)}},
                sort=[("released_at", -1)]
            )
            await db.modpacks.update_one(
                {"_id": ObjectId(modpack_id)},
                {"$set": {"latest_release_id": next_release["_id"] if next_release else None}},
            )

    return _release_out(r)


# ── Helpers ───────────────────────────────────────────────────────────────────

async def _assert_access(db, modpack_id: str, user_id: str):
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


async def _assert_editor(db, modpack_id: str, user_id: str):
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


def _release_out(doc) -> ReleaseOut:
    return ReleaseOut(
        id=str(doc["_id"]),
        modpack_id=str(doc["modpack_id"]),
        version=doc["version"],
        changelog=doc["changelog"],
        download_url=doc.get("download_url"),
        status=doc["status"],
        released_at=doc["released_at"],
        created_by=str(doc["created_by"]),
    )
