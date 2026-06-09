import base64
import hashlib
from datetime import datetime, timedelta, timezone

import bcrypt
from cryptography.fernet import Fernet, InvalidToken
from jose import JWTError, jwt

from app.core.config import get_settings


ALGORITHM = "HS256"


def hash_password(password: str) -> str:
	return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
	try:
		return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
	except ValueError:
		return False


def create_access_token(user_id: int) -> str:
	settings = get_settings()
	expires_at = datetime.now(timezone.utc) + timedelta(
		minutes=settings.access_token_expire_minutes
	)
	return jwt.encode(
		{"sub": str(user_id), "exp": expires_at, "type": "access"},
		settings.secret_key,
		algorithm=ALGORITHM,
	)


def decode_access_token(token: str) -> int | None:
	try:
		payload = jwt.decode(
			token,
			get_settings().secret_key,
			algorithms=[ALGORITHM],
		)
		if payload.get("type") != "access":
			return None
		return int(payload["sub"])
	except (JWTError, KeyError, TypeError, ValueError):
		return None


def _document_cipher() -> Fernet:
	settings = get_settings()
	source = settings.document_encryption_key or settings.secret_key
	key = base64.urlsafe_b64encode(hashlib.sha256(source.encode("utf-8")).digest())
	return Fernet(key)


def encrypt_document(content: bytes) -> bytes:
	return _document_cipher().encrypt(content)


def decrypt_document(content: bytes) -> bytes:
	try:
		return _document_cipher().decrypt(content)
	except InvalidToken as exc:
		raise ValueError("Document could not be decrypted") from exc
