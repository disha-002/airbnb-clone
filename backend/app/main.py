import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .routers import bookings, host, listings, uploads, wishlist
from .seed import seed_if_empty


@asynccontextmanager
async def lifespan(_: FastAPI):
    seed_if_empty()  # creates tables; fills demo data only when the database is brand new
    yield


app = FastAPI(title="Airbnb Clone API", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    # Comma-separated list, e.g. "https://my-app.vercel.app". Defaults to open for local dev.
    allow_origins=os.getenv("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)
for r in (listings.router, bookings.router, host.router, wishlist.router, uploads.router):
    app.include_router(r, prefix="/api")

app.mount("/uploads", StaticFiles(directory=uploads.UPLOAD_DIR), name="uploads")


@app.get("/health")
def health():
    return {"ok": True}
