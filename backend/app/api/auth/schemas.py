from datetime import date, datetime
import re
from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class RegisterRequest(BaseModel):
	full_name: str = Field(min_length=2, max_length=120)
	email: EmailStr
	password: str = Field(min_length=10, max_length=128)

	@field_validator("password")
	@classmethod
	def validate_password_strength(cls, value: str) -> str:
		if not any(char.isalpha() for char in value):
			raise ValueError("Password must contain a letter")
		if not any(char.isdigit() for char in value):
			raise ValueError("Password must contain a number")
		return value


class LoginRequest(BaseModel):
	email: EmailStr
	password: str


class ChangePasswordRequest(BaseModel):
	current_password: str = Field(min_length=1)
	new_password: str = Field(min_length=10, max_length=128)

	@field_validator("new_password")
	@classmethod
	def validate_new_password(cls, value: str) -> str:
		if not any(char.isalpha() for char in value):
			raise ValueError("Password must contain a letter")
		if not any(char.isdigit() for char in value):
			raise ValueError("Password must contain a number")
		return value


class ProfileUpdateRequest(BaseModel):
	full_name: Optional[str] = Field(default=None, max_length=120)
	phone_number: Optional[str] = Field(default=None, max_length=20)
	avatar_url: Optional[str] = Field(default=None, max_length=500)
	bio: Optional[str] = Field(default=None, max_length=500)
	occupation: Optional[str] = Field(default=None, max_length=100)
	address_line: Optional[str] = Field(default=None, max_length=255)
	city: Optional[str] = Field(default=None, max_length=100)
	state: Optional[str] = Field(default=None, max_length=100)
	pincode: Optional[str] = Field(default=None, max_length=10)
	gender: Optional[str] = Field(default=None, max_length=20)
	date_of_birth: Optional[date] = None
	# Tax attributes
	pan: Optional[str] = Field(default=None, max_length=10)
	aadhaar_last_four: Optional[str] = Field(default=None, max_length=4)
	residency_status: Optional[str] = Field(default=None, max_length=20)

	@field_validator("pan")
	@classmethod
	def validate_pan(cls, value: Optional[str]) -> Optional[str]:
		if value:
			clean = value.strip().upper()
			if not re.match(r"^[A-Z]{5}[0-9]{4}[A-Z]$", clean):
				raise ValueError("PAN must be in standard Indian format (e.g. ABCDE1234F)")
			return clean
		return value

	@field_validator("phone_number")
	@classmethod
	def validate_phone(cls, value: Optional[str]) -> Optional[str]:
		if value:
			clean = re.sub(r"[\s\-\+]", "", value)
			if len(clean) < 10 or not clean.isdigit():
				raise ValueError("Phone number must be at least 10 valid digits")
			return value.strip()
		return value

	@field_validator("pincode")
	@classmethod
	def validate_pincode(cls, value: Optional[str]) -> Optional[str]:
		if value:
			clean = value.strip()
			if len(clean) != 6 or not clean.isdigit():
				raise ValueError("PIN code must be exactly 6 digits")
			return clean
		return value


class DeleteAccountRequest(BaseModel):
	password: str = Field(min_length=1)
	confirmation_text: str = Field(min_length=1)


class ForgotPasswordRequest(BaseModel):
	email: EmailStr


class ResetPasswordRequest(BaseModel):
	token: str = Field(min_length=10)
	new_password: str = Field(min_length=10, max_length=128)

	@field_validator("new_password")
	@classmethod
	def validate_new_password(cls, value: str) -> str:
		if not any(char.isalpha() for char in value):
			raise ValueError("Password must contain a letter")
		if not any(char.isdigit() for char in value):
			raise ValueError("Password must contain a number")
		return value


class UserResponse(BaseModel):
	model_config = ConfigDict(from_attributes=True)

	id: int
	email: EmailStr
	full_name: str
	phone_number: Optional[str] = None
	avatar_url: Optional[str] = None
	bio: Optional[str] = None
	occupation: Optional[str] = None
	address_line: Optional[str] = None
	city: Optional[str] = None
	state: Optional[str] = None
	pincode: Optional[str] = None
	gender: Optional[str] = None
	date_of_birth: Optional[date] = None
	# Aggregated tax profile info
	pan_masked: Optional[str] = None
	aadhaar_masked: Optional[str] = None
	residency_status: Optional[str] = "resident"
	entity_type: Optional[str] = "individual"
	created_at: datetime


class AuthResponse(BaseModel):
	user: UserResponse

