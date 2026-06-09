from datetime import datetime

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


class UserResponse(BaseModel):
	model_config = ConfigDict(from_attributes=True)

	id: int
	email: EmailStr
	full_name: str
	created_at: datetime


class AuthResponse(BaseModel):
	user: UserResponse
