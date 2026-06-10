from fastapi import FastAPI
from contextlib import asynccontextmanager
from database import connect_db, close_db
from routers import auth, modpacks, releases, news, collaborators


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    yield
    await close_db()


app = FastAPI(
    title="Modpack Manager API",
    description="API for managing modpack updates across games",
    version="1.0.0",
    lifespan=lifespan,
)

app.include_router(auth.router,          prefix="/auth",          tags=["Auth"])
app.include_router(modpacks.router,      prefix="/modpacks",      tags=["Modpacks"])
app.include_router(releases.router,      prefix="/modpacks",      tags=["Releases"])
app.include_router(news.router,          prefix="/modpacks",      tags=["News"])
app.include_router(collaborators.router, prefix="/modpacks",      tags=["Collaborators"])
