from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.auth import routes as auth
from app.api.endpoints import chat, deadlines, portfolio, tax_calculator, workspace
from app.core.config import get_settings
from app.core.database import Base, get_engine
import app.models  # noqa: F401


@asynccontextmanager
async def lifespan(_: FastAPI):
	settings = get_settings()
	if settings.auto_create_tables:
		async with get_engine().begin() as connection:
			await connection.run_sync(Base.metadata.create_all)
	yield


settings = get_settings()
app = FastAPI(title=settings.app_name, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(workspace.router, prefix="/api/workspace", tags=["workspace"])
app.include_router(portfolio.router, prefix="/api/portfolio", tags=["portfolio"])
app.include_router(deadlines.router, prefix="/api/deadlines", tags=["deadlines"])
app.include_router(chat.router, prefix="/api", tags=["chat"])
app.include_router(tax_calculator.router, prefix="/api/tax", tags=["tax"])

@app.get("/")
def root():
    return {"status": "ok"}
