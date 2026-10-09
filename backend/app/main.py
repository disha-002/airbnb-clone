from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import Base, engine
from fastapi.staticfiles import StaticFiles
from .routers import bookings, host, listings, uploads, wishlist

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Airbnb Clone API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten to the deployed frontend URL in production
    allow_methods=["*"],
    allow_headers=["*"],
)
for r in (listings.router, bookings.router, host.router, wishlist.router, uploads.router):
    app.include_router(r, prefix="/api")


app.mount("/uploads", StaticFiles(directory=uploads.UPLOAD_DIR), name="uploads")


@app.get("/health")
def health():
    return {"ok": True}
