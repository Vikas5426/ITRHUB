from fastapi import Depends, Header, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.user import User


async def get_current_user(
	request: Request,
	db: AsyncSession = Depends(get_db),
	authorization: str | None = Header(default=None),
) -> User:
	settings = get_settings()
	token = request.cookies.get(settings.auth_cookie_name)
	if authorization and authorization.lower().startswith("bearer "):
		token = authorization[7:].strip()
	user_id = decode_access_token(token) if token else None
	user = await db.get(User, user_id) if user_id else None
	if not user or not user.is_active:
		raise HTTPException(
			status_code=status.HTTP_401_UNAUTHORIZED,
			detail="Authentication required",
		)
	return user
