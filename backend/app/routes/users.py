"""User routes — profile, user dashboard, list & manage users (admin)."""
from fastapi import APIRouter, Depends, HTTPException
from app.database.connection import get_connection, dict_row, dict_rows
from app.utils.auth import get_current_user, require_admin

router = APIRouter(tags=["users"])


@router.get("/profile")
def get_profile(user: dict = Depends(get_current_user)):
    return user


@router.get("/dashboard")
def get_user_dashboard(user: dict = Depends(get_current_user)):
    """Personal workspace dashboard for standard users (no security admin data)."""
    conn = get_connection()
    user_id = user["id"]

    # User's own records
    my_records_rows = conn.execute(
        """SELECT r.*, u.name as owner_name 
           FROM records r JOIN users u ON r.owner_id = u.id 
           WHERE r.owner_id = ? 
           ORDER BY r.created_at DESC""",
        (user_id,),
    ).fetchall()
    my_records = dict_rows(my_records_rows)

    # User's comments
    comments_count = conn.execute(
        "SELECT COUNT(*) FROM comments WHERE user_id = ?",
        (user_id,),
    ).fetchone()[0]

    # User's recent comments with record titles
    recent_comments = conn.execute(
        """SELECT c.*, r.title as record_title 
           FROM comments c JOIN records r ON c.record_id = r.id 
           WHERE c.user_id = ? 
           ORDER BY c.created_at DESC LIMIT 5""",
        (user_id,),
    ).fetchall()

    conn.close()

    # User activity feed
    activity = []
    for r in my_records[:4]:
        activity.append({
            "type": "record_created",
            "title": f"Created record: {r['title']}",
            "timestamp": r["created_at"],
            "category": r["category"],
            "is_private": bool(r["is_private"]),
            "record_id": r["id"],
        })
    for c in dict_rows(recent_comments):
        activity.append({
            "type": "comment_posted",
            "title": f"Commented on: {c.get('record_title', 'Record')}",
            "timestamp": c["created_at"],
            "content": c["content"],
            "record_id": c["record_id"],
        })

    # Sort activity by timestamp desc
    activity.sort(key=lambda x: x.get("timestamp", ""), reverse=True)

    notifications = [
        {
            "id": 1,
            "type": "info",
            "title": "Tenant Data Isolation Active",
            "message": "Your private records are cryptographically and logically isolated from other organization accounts.",
        },
        {
            "id": 2,
            "type": "success",
            "title": "Zero-Trust Access Control",
            "message": "Direct object reference verification is monitored on all document requests.",
        },
    ]

    return {
        "profile": user,
        "my_records": my_records,
        "my_records_count": len(my_records),
        "my_comments_count": comments_count,
        "my_activity": activity[:8],
        "notifications": notifications,
    }


@router.get("")
def list_users(admin: dict = Depends(require_admin)):
    conn = get_connection()
    rows = conn.execute("SELECT id, email, name, role, created_at FROM users ORDER BY id ASC").fetchall()
    conn.close()
    return dict_rows(rows)


@router.delete("/{user_id}")
def delete_user(user_id: int, admin: dict = Depends(require_admin)):
    if admin["id"] == user_id:
        raise HTTPException(status_code=400, detail="Administrators cannot delete their own account.")

    conn = get_connection()
    user_row = conn.execute("SELECT id, name FROM users WHERE id = ?", (user_id,)).fetchone()
    if user_row is None:
        conn.close()
        raise HTTPException(status_code=404, detail="User not found.")

    # Delete comments, records and user
    conn.execute("DELETE FROM comments WHERE user_id = ?", (user_id,))
    conn.execute("DELETE FROM records WHERE owner_id = ?", (user_id,))
    conn.execute("DELETE FROM users WHERE id = ?", (user_id,))
    conn.commit()
    conn.close()

    return {"message": f"User #{user_id} and associated records removed successfully."}
