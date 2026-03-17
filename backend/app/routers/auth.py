"""Auth API - register, login, JWT."""
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from jose import jwt
from passlib.context import CryptContext

from app.config import settings
from app.database import get_db
from app.models import User

router = APIRouter(prefix="/api/v1", tags=["auth"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer(auto_error=False)


class RegisterInput(BaseModel):
    email: EmailStr
    password: str
    name: str | None = None
    is_partner: bool = False


class LoginInput(BaseModel):
    email: EmailStr
    password: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


def create_token(user_id: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=settings.jwt_expire_minutes)
    payload = {"sub": user_id, "exp": expire}
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


async def get_current_user(
    creds: HTTPAuthorizationCredentials | None = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> User | None:
    if not creds:
        return None
    try:
        payload = jwt.decode(
            creds.credentials, settings.jwt_secret, algorithms=[settings.jwt_algorithm]
        )
        user_id = payload.get("sub")
        if not user_id:
            return None
        user = (
            await db.execute(select(User).where(User.id == user_id))
        ).scalar_one_or_none()
        return user
    except Exception:
        return None


@router.post("/auth/register", response_model=TokenOut)
async def register(body: RegisterInput, db: AsyncSession = Depends(get_db)):
    existing = (await db.execute(select(User).where(User.email == body.email))).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        email=body.email,
        password_hash=pwd_context.hash(body.password),
        name=body.name,
        is_partner=body.is_partner,
    )
    db.add(user)
    await db.flush()
    token = create_token(str(user.id))
    return TokenOut(
        access_token=token,
        user={"id": str(user.id), "email": user.email, "name": user.name, "is_partner": user.is_partner},
    )


@router.post("/auth/login", response_model=TokenOut)
async def login(body: LoginInput, db: AsyncSession = Depends(get_db)):
    user = (await db.execute(select(User).where(User.email == body.email))).scalar_one_or_none()
    if not user or not pwd_context.verify(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_token(str(user.id))
    return TokenOut(
        access_token=token,
        user={"id": str(user.id), "email": user.email, "name": user.name, "is_partner": getattr(user, "is_partner", False)},
    )


@router.get("/auth/me")
async def me(user: User | None = Depends(get_current_user)):
    if not user:
        return {"user": None}
    is_partner = getattr(user, "is_partner", False)
    return {"user": {"id": str(user.id), "email": user.email, "name": user.name, "is_partner": is_partner}}
