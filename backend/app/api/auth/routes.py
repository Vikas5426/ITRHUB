from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth.schemas import (
	AuthResponse,
	ChangePasswordRequest,
	DeleteAccountRequest,
	ForgotPasswordRequest,
	LoginRequest,
	ProfileUpdateRequest,
	RegisterRequest,
	ResetPasswordRequest,
	UserResponse,
)
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


async def build_user_response(user: User, db: AsyncSession) -> UserResponse:
	primary_profile = await db.scalar(
		select(TaxpayerProfile)
		.where(TaxpayerProfile.owner_id == user.id)
		.order_by(TaxpayerProfile.is_primary.desc(), TaxpayerProfile.created_at)
	)
	pan_masked = None
	aadhaar_masked = None
	residency = "resident"
	entity = "individual"

	if primary_profile:
		if primary_profile.full_pan:
			pan_masked = f"{primary_profile.full_pan[:2]}XXXXX{primary_profile.full_pan[-3:]}"
		elif primary_profile.pan_last_four:
			pan_masked = f"XXXXXX{primary_profile.pan_last_four}"
		if primary_profile.aadhaar_last_four:
			aadhaar_masked = f"XXXX-XXXX-{primary_profile.aadhaar_last_four}"
		residency = primary_profile.residency_status or "resident"
		entity = primary_profile.entity_type or "individual"

	return UserResponse(
		id=user.id,
		email=user.email,
		full_name=user.full_name,
		phone_number=user.phone_number,
		avatar_url=user.avatar_url,
		bio=user.bio,
		occupation=user.occupation,
		address_line=user.address_line,
		city=user.city,
		state=user.state,
		pincode=user.pincode,
		gender=user.gender,
		date_of_birth=user.date_of_birth,
		pan_masked=pan_masked,
		aadhaar_masked=aadhaar_masked,
		residency_status=residency,
		entity_type=entity,
		created_at=user.created_at,
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
	user_res = await build_user_response(user, db)
	return {"user": user_res}


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
	user_res = await build_user_response(user, db)
	return {"user": user_res}


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(response: Response):
	settings = get_settings()
	response.delete_cookie(settings.auth_cookie_name, path="/")


@router.get("/me", response_model=UserResponse)
async def me(
	current_user: User = Depends(get_current_user),
	db: AsyncSession = Depends(get_db),
):
	return await build_user_response(current_user, db)


@router.put("/profile", response_model=UserResponse)
async def update_profile(
	payload: ProfileUpdateRequest,
	current_user: User = Depends(get_current_user),
	db: AsyncSession = Depends(get_db),
):
	"""Update user personal and tax profile in one atomic operation."""
	if payload.full_name is not None:
		current_user.full_name = payload.full_name.strip()
	if payload.phone_number is not None:
		current_user.phone_number = payload.phone_number.strip()
	if payload.avatar_url is not None:
		current_user.avatar_url = payload.avatar_url.strip()
	if payload.bio is not None:
		current_user.bio = payload.bio.strip()
	if payload.occupation is not None:
		current_user.occupation = payload.occupation.strip()
	if payload.address_line is not None:
		current_user.address_line = payload.address_line.strip()
	if payload.city is not None:
		current_user.city = payload.city.strip()
	if payload.state is not None:
		current_user.state = payload.state.strip()
	if payload.pincode is not None:
		current_user.pincode = payload.pincode.strip()
	if payload.gender is not None:
		current_user.gender = payload.gender.strip()
	if payload.date_of_birth is not None:
		current_user.date_of_birth = payload.date_of_birth

	# Also update or synchronize Primary Taxpayer Profile
	primary_profile = await db.scalar(
		select(TaxpayerProfile)
		.where(TaxpayerProfile.owner_id == current_user.id)
		.order_by(TaxpayerProfile.is_primary.desc(), TaxpayerProfile.created_at)
	)
	if not primary_profile:
		primary_profile = TaxpayerProfile(
			owner_id=current_user.id,
			display_name=current_user.full_name,
			entity_type="individual",
			relationship="self",
			is_primary=True,
		)
		db.add(primary_profile)
		await db.flush()

	if payload.full_name is not None:
		primary_profile.display_name = current_user.full_name
	if payload.pan is not None:
		primary_profile.full_pan = payload.pan.strip().upper()
		primary_profile.pan_last_four = payload.pan.strip().upper()[-4:]
	if payload.aadhaar_last_four is not None:
		primary_profile.aadhaar_last_four = payload.aadhaar_last_four.strip()
	if payload.residency_status is not None:
		primary_profile.residency_status = payload.residency_status.strip().lower()
	if payload.date_of_birth is not None:
		primary_profile.date_of_birth = payload.date_of_birth

	await db.commit()
	await db.refresh(current_user)
	return await build_user_response(current_user, db)


@router.post("/change-password", status_code=status.HTTP_200_OK)
async def change_password(
	payload: ChangePasswordRequest,
	current_user: User = Depends(get_current_user),
	db: AsyncSession = Depends(get_db),
):
	"""Securely verify current password and apply hashed new password."""
	if not verify_password(payload.current_password, current_user.password_hash):
		raise HTTPException(status_code=400, detail="Current password does not match.")

	current_user.password_hash = hash_password(payload.new_password)
	await db.commit()
	return {"status": "success", "message": "Password updated successfully."}


@router.post("/delete-account", status_code=status.HTTP_200_OK)
async def delete_account(
	payload: DeleteAccountRequest,
	response: Response,
	current_user: User = Depends(get_current_user),
	db: AsyncSession = Depends(get_db),
):
	"""Permanently delete user account and cascading entities upon password validation."""
	if not verify_password(payload.password, current_user.password_hash):
		raise HTTPException(status_code=400, detail="Invalid password verification.")

	if payload.confirmation_text.strip().upper() != "DELETE":
		raise HTTPException(status_code=400, detail="Confirmation text must be 'DELETE'.")

	await db.delete(current_user)
	await db.commit()

	settings = get_settings()
	response.delete_cookie(settings.auth_cookie_name, path="/")
	return {"status": "success", "message": "Account successfully deleted."}

