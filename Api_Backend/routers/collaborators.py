from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime
from bson import ObjectId
from database import get_db
from schemas import CollaboratorAdd, CollaboratorOut
from auth_utils import get_current_user
from typing import List

router = APIRouter()


@router.get("/{modpack_id}/collaborators", response_model=List[CollaboratorOut])
async def list_collaborators(modpack_id: str, user_id: str = Depends(get_current_user)):
    db = get_db()
    await _assert_access(db, modpack_id, user_id)
    collabs = await db.collaborators.find(
        {"modpack_id": ObjectId(modpack_id)}
    ).to_list(length=200)
    return [_collab_out(c) for c in collabs]


@router.post("/{modpack_id}/collaborators", response_model=CollaboratorOut, status_code=201)
async def add_collaborator(modpack_id: str, body: CollaboratorAdd, user_id: str = Depends(get_current_user)):
    db = get_db()
    await _assert_owner_or_admin(db, modpack_id, user_id)

    target_uid = ObjectId(body.user_id)

    # Can't add yourself or the owner
    m = await db.modpacks.find_one({"_id": ObjectId(modpack_id)})
    if m["owner_id"] == target_uid:
        raise HTTPException(400, "Owner is already a member")

    existing = await db.collaborators.find_one({
        "modpack_id": ObjectId(modpack_id), "user_id": target_uid
    })
    if existing:
        raise HTTPException(400, "User is already a collaborator")

    # Verify target user exists
    target_user = await db.users.find_one({"_id": target_uid})
    if not target_user:
        raise HTTPException(404, "Target user not found")

    doc = {
        "modpack_id": ObjectId(modpack_id),
        "user_id":    target_uid,
        "role":       body.role,
        "joined_at":  datetime.utcnow(),
    }
    result = await db.collaborators.insert_one(doc)
    doc["_id"] = result.inserted_id
    return _collab_out(doc)


@router.patch("/{modpack_id}/collaborators/{collab_user_id}", response_model=CollaboratorOut)
async def update_collaborator_role(
    modpack_id: str, collab_user_id: str, role: str,
    user_id: str = Depends(get_current_user)
):
    db = get_db()
    await _assert_owner_or_admin(db, modpack_id, user_id)
    c = await db.collaborators.find_one_and_update(
        {"modpack_id": ObjectId(modpack_id), "user_id": ObjectId(collab_user_id)},
        {"$set": {"role": role}},
        return_document=True,
    )
    if not c:
        raise HTTPException(404, "Collaborator not found")
    return _collab_out(c)


@router.delete("/{modpack_id}/collaborators/{collab_user_id}", status_code=204)
async def remove_collaborator(
    modpack_id: str, collab_user_id: str,
    user_id: str = Depends(get_current_user)
):
    db = get_db()
    await _assert_owner_or_admin(db, modpack_id, user_id)
    result = await db.collaborators.delete_one({
        "modpack_id": ObjectId(modpack_id),
        "user_id":    ObjectId(collab_user_id),
    })
    if result.deleted_count == 0:
        raise HTTPException(404, "Collaborator not found")


# ── Helpers ───────────────────────────────────────────────────────────────────

async def _assert_access(db, modpack_id, user_id):
    m = await db.modpacks.find_one({"_id": ObjectId(modpack_id)})
    if not m:
        raise HTTPException(404, "Modpack not found")
    uid = ObjectId(user_id)
    if m["owner_id"] == uid:
        return
    collab = await db.collaborators.find_one({"modpack_id": ObjectId(modpack_id), "user_id": uid})
    if not collab:
        raise HTTPException(403, "Access denied")


async def _assert_owner_or_admin(db, modpack_id, user_id):
    m = await db.modpacks.find_one({"_id": ObjectId(modpack_id)})
    if not m:
        raise HTTPException(404, "Modpack not found")
    uid = ObjectId(user_id)
    if m["owner_id"] == uid:
        return
    collab = await db.collaborators.find_one({
        "modpack_id": ObjectId(modpack_id),
        "user_id": uid,
        "role": "admin",
    })
    if not collab:
        raise HTTPException(403, "Owner or admin access required")


def _collab_out(doc) -> CollaboratorOut:
    return CollaboratorOut(
        id=str(doc["_id"]),
        modpack_id=str(doc["modpack_id"]),
        user_id=str(doc["user_id"]),
        role=doc["role"],
        joined_at=doc["joined_at"],
    )
