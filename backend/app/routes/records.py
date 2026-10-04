"""Record & comment routes — with intentionally VULNERABLE and SECURE code paths."""
import html
from fastapi import APIRouter, Depends, HTTPException, Query
from app.schemas.schemas import RecordCreate, RecordUpdate, CommentCreate
from app.database.connection import get_connection, dict_row, dict_rows
from app.utils.auth import get_current_user

router = APIRouter(tags=["records"])


# ══════════════════════════════════════════════════════════
#  Helper — check current vulnerability state
# ══════════════════════════════════════════════════════════

def _is_vuln_fixed(vuln_id: str) -> bool:
    conn = get_connection()
    row = conn.execute("SELECT is_fixed FROM vulnerability_state WHERE id = ?", (vuln_id,)).fetchone()
    conn.close()
    if row is None:
        return True  # default safe
    return bool(row["is_fixed"])


# ══════════════════════════════════════════════════════════
#  RECORDS
# ══════════════════════════════════════════════════════════

@router.get("")
def list_records(
    search: str = Query(default="", max_length=200),
    user: dict = Depends(get_current_user),
):
    conn = get_connection()
    is_admin = user.get("role") == "admin"

    if search:
        if _is_vuln_fixed("sql-injection"):
            # ── SECURE: parameterized query ───────────────
            if is_admin:
                rows = conn.execute(
                    """SELECT r.*, u.name as owner_name
                       FROM records r JOIN users u ON r.owner_id = u.id
                       WHERE (r.title LIKE ? OR r.content LIKE ?)
                       ORDER BY r.created_at DESC""",
                    (f"%{search}%", f"%{search}%"),
                ).fetchall()
            else:
                rows = conn.execute(
                    """SELECT r.*, u.name as owner_name
                       FROM records r JOIN users u ON r.owner_id = u.id
                       WHERE (r.is_private = 0 OR r.owner_id = ?)
                         AND (r.title LIKE ? OR r.content LIKE ?)
                       ORDER BY r.created_at DESC""",
                    (user["id"], f"%{search}%", f"%{search}%"),
                ).fetchall()
        else:
            # ── VULNERABLE: string concatenation ─────────
            # Vulnerable to ' OR '1'='1 -- dumps records regardless of owner/privacy
            where_clause = ""
            if not is_admin:
                where_clause = f"(r.is_private = 0 OR r.owner_id = {user['id']}) AND "
            
            query = (
                f"SELECT r.*, u.name as owner_name "
                f"FROM records r JOIN users u ON r.owner_id = u.id "
                f"WHERE {where_clause}(r.title LIKE '%{search}%' OR r.content LIKE '%{search}%') "
                f"ORDER BY r.created_at DESC"
            )
            try:
                rows = conn.execute(query).fetchall()
            except Exception:
                conn.close()
                raise HTTPException(status_code=500, detail="Database error during search.")
    else:
        if is_admin:
            # Admin sees all records across all users
            rows = conn.execute(
                """SELECT r.*, u.name as owner_name
                   FROM records r JOIN users u ON r.owner_id = u.id
                   ORDER BY r.created_at DESC"""
            ).fetchall()
        else:
            # Normal users only see their own records and shared public records
            rows = conn.execute(
                """SELECT r.*, u.name as owner_name
                   FROM records r JOIN users u ON r.owner_id = u.id
                   WHERE r.is_private = 0 OR r.owner_id = ?
                   ORDER BY r.created_at DESC""",
                (user["id"],),
            ).fetchall()

    conn.close()
    return dict_rows(rows)


@router.get("/{record_id}")
def get_record(record_id: int, user: dict = Depends(get_current_user)):
    conn = get_connection()
    row = conn.execute(
        "SELECT r.*, u.name as owner_name FROM records r JOIN users u ON r.owner_id = u.id WHERE r.id = ?",
        (record_id,),
    ).fetchone()
    conn.close()

    if row is None:
        raise HTTPException(status_code=404, detail="Record not found.")

    record = dict_row(row)
    is_admin = user.get("role") == "admin"

    # IDOR / Broken Access Control Check:
    # Admin can access all records.
    # Normal users must own the record if it is private.
    if _is_vuln_fixed("idor"):
        # ── SECURE: strict backend ownership check ────────
        if not is_admin and record["owner_id"] != user["id"] and record["is_private"]:
            raise HTTPException(
                status_code=403,
                detail=f"Access denied — Record #{record_id} is a private record owned by another user. Server-side ownership verification enforced."
            )
    else:
        # ── VULNERABLE: missing authorization check ───────
        # In vulnerable mode, any authenticated user can read any other user's record!
        pass

    return record


@router.post("")
def create_record(req: RecordCreate, user: dict = Depends(get_current_user)):
    conn = get_connection()
    cur = conn.execute(
        "INSERT INTO records (owner_id, title, content, category, is_private) VALUES (?, ?, ?, ?, ?)",
        (user["id"], req.title, req.content, req.category, int(req.is_private)),
    )
    conn.commit()
    row = conn.execute(
        "SELECT r.*, u.name as owner_name FROM records r JOIN users u ON r.owner_id = u.id WHERE r.id = ?",
        (cur.lastrowid,),
    ).fetchone()
    conn.close()
    return dict_row(row)


@router.put("/{record_id}")
def update_record(record_id: int, req: RecordUpdate, user: dict = Depends(get_current_user)):
    conn = get_connection()
    row = conn.execute("SELECT * FROM records WHERE id = ?", (record_id,)).fetchone()
    if row is None:
        conn.close()
        raise HTTPException(status_code=404, detail="Record not found.")

    record = dict_row(row)
    is_admin = user.get("role") == "admin"

    # Authorization: only record owner or admin can edit
    if not is_admin and record["owner_id"] != user["id"]:
        conn.close()
        raise HTTPException(
            status_code=403,
            detail="Access denied — You can only edit your own records."
        )

    title = req.title if req.title is not None else record["title"]
    content = req.content if req.content is not None else record["content"]
    category = req.category if req.category is not None else record["category"]
    is_private = int(req.is_private) if req.is_private is not None else record["is_private"]

    conn.execute(
        "UPDATE records SET title = ?, content = ?, category = ?, is_private = ? WHERE id = ?",
        (title, content, category, is_private, record_id),
    )
    conn.commit()

    updated = conn.execute(
        "SELECT r.*, u.name as owner_name FROM records r JOIN users u ON r.owner_id = u.id WHERE r.id = ?",
        (record_id,),
    ).fetchone()
    conn.close()
    return dict_row(updated)


@router.delete("/{record_id}")
def delete_record(record_id: int, user: dict = Depends(get_current_user)):
    conn = get_connection()
    row = conn.execute("SELECT * FROM records WHERE id = ?", (record_id,)).fetchone()
    if row is None:
        conn.close()
        raise HTTPException(status_code=404, detail="Record not found.")

    record = dict_row(row)
    is_admin = user.get("role") == "admin"

    # Protected system policy record check
    if record_id in [1, 2] and not is_admin:
        conn.close()
        raise HTTPException(
            status_code=403,
            detail="Access denied — Protected company policy records cannot be deleted by standard users."
        )

    # Authorization: only record owner or admin can delete
    if not is_admin and record["owner_id"] != user["id"]:
        conn.close()
        raise HTTPException(
            status_code=403,
            detail="Access denied — You can only delete your own records."
        )

    # Delete comments and record
    conn.execute("DELETE FROM comments WHERE record_id = ?", (record_id,))
    conn.execute("DELETE FROM records WHERE id = ?", (record_id,))
    conn.commit()
    conn.close()
    return {"message": f"Record #{record_id} deleted successfully."}


# ══════════════════════════════════════════════════════════
#  COMMENTS
# ══════════════════════════════════════════════════════════

@router.get("/{record_id}/comments")
def list_comments(record_id: int, user: dict = Depends(get_current_user)):
    conn = get_connection()
    # Check record access
    rec_row = conn.execute("SELECT * FROM records WHERE id = ?", (record_id,)).fetchone()
    if rec_row is None:
        conn.close()
        raise HTTPException(status_code=404, detail="Record not found.")

    rec = dict_row(rec_row)
    is_admin = user.get("role") == "admin"

    # If IDOR is fixed, reject unauthorized comment reading on private records
    if _is_vuln_fixed("idor") and not is_admin and rec["is_private"] and rec["owner_id"] != user["id"]:
        conn.close()
        raise HTTPException(status_code=403, detail="Access denied to private record comments.")

    rows = conn.execute(
        """SELECT c.*, u.name as user_name
           FROM comments c JOIN users u ON c.user_id = u.id
           WHERE c.record_id = ?
           ORDER BY c.created_at ASC""",
        (record_id,),
    ).fetchall()
    conn.close()

    comments = dict_rows(rows)

    if _is_vuln_fixed("xss"):
        # ── SECURE: HTML-encode content before sending ────
        for c in comments:
            c["content"] = html.escape(c["content"])
    # else: VULNERABLE — raw content (may contain script tags)

    return comments


@router.post("/{record_id}/comments")
def add_comment(record_id: int, req: CommentCreate, user: dict = Depends(get_current_user)):
    conn = get_connection()
    # Verify record exists
    rec_row = conn.execute("SELECT * FROM records WHERE id = ?", (record_id,)).fetchone()
    if rec_row is None:
        conn.close()
        raise HTTPException(status_code=404, detail="Record not found.")

    rec = dict_row(rec_row)
    is_admin = user.get("role") == "admin"

    # In secure mode, check private record access
    if _is_vuln_fixed("idor") and not is_admin and rec["is_private"] and rec["owner_id"] != user["id"]:
        conn.close()
        raise HTTPException(status_code=403, detail="Access denied — cannot comment on another user's private record.")

    content = req.content
    if _is_vuln_fixed("xss"):
        # Sanitize on write as well
        content = html.escape(content)

    cur = conn.execute(
        "INSERT INTO comments (record_id, user_id, content) VALUES (?, ?, ?)",
        (record_id, user["id"], content),
    )
    conn.commit()
    row = conn.execute(
        "SELECT c.*, u.name as user_name FROM comments c JOIN users u ON c.user_id = u.id WHERE c.id = ?",
        (cur.lastrowid,),
    ).fetchone()
    conn.close()
    return dict_row(row)
