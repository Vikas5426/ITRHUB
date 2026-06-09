from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth.schemas import AuthResponse, LoginRequest, RegisterRequest, UserResponse
from app.core.config import get_settings
from app.core.database import get_db
from app.core.security import create_access_token, hash_password, verify_password
from app.dependencies.auth import get_current_user
from app.models.user import TaxpayerProfile, User


router = APIRouter()


def set_auth_cookie(response: Response, token: str) -> None:
	settings = get_settings()
	response.set_cookie(
		key=settings.auth_cookie_name,
		value=token,
		max_age=settings.access_token_expire_minutes * 60,
		httponly=True,
		secure=settings.secure_cookies,
		samesite="lax",
		path="/",
	)


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(
	payload: RegisterRequest,
	response: Response,
	db: AsyncSession = Depends(get_db),
):
	email = payload.email.lower()
	existing = await db.scalar(select(User).where(User.email == email))
	if existing:
		raise HTTPException(status_code=409, detail="An account already exists for this email")

	user = User(
		email=email,
		full_name=payload.full_name.strip(),
		password_hash=hash_password(payload.password),
	)
	db.add(user)
	await db.flush()
	db.add(
		TaxpayerProfile(
			owner_id=user.id,
			display_name=user.full_name,
			entity_type="individual",
			relationship="self",
			is_primary=True,
		)
	)
	await db.commit()
	await db.refresh(user)
	set_auth_cookie(response, create_access_token(user.id))
	return {"user": user}


@router.post("/login", response_model=AuthResponse)
async def login(
	payload: LoginRequest,
	response: Response,
	db: AsyncSession = Depends(get_db),
):
	user = await db.scalar(select(User).where(User.email == payload.email.lower()))
	if not user or not verify_password(payload.password, user.password_hash):
		raise HTTPException(status_code=401, detail="Invalid email or password")
	set_auth_cookie(response, create_access_token(user.id))
	return {"user": user}


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(response: Response):
	settings = get_settings()
	response.delete_cookie(settings.auth_cookie_name, path="/")


@router.get("/me", response_model=UserResponse)
async def me(current_user: User = Depends(get_current_user)):
	return current_user
