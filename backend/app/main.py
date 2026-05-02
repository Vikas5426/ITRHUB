from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import portfolio, deadlines, chat

app = FastAPI(title="ITRHUB")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(portfolio.router, prefix="/api/portfolio", tags=["portfolio"])
app.include_router(deadlines.router, prefix="/api/deadlines", tags=["deadlines"])
app.include_router(chat.router, prefix="/api", tags=["chat"])

@app.get("/")
def root():
    return {"status": "ok"}
