from fastapi import Header, HTTPException, status

from app.db.fake_db import TOKENS, USERS


UNAUTHORIZED = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Authentication credentials were not provided or are invalid.",
)


def get_current_user(authorization: str | None = Header(default=None)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise UNAUTHORIZED

    token = authorization.split(" ", 1)[1].strip()
    user_id = TOKENS.get(token)
    if user_id is None:
        raise UNAUTHORIZED

    for user in USERS:
        if user["id"] == user_id:
            return user

    raise UNAUTHORIZED
