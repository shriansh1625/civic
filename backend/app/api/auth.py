"""
CivicLens AI — Authentication API Routes
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import hash_password, verify_password, verify_password_async, create_access_token, get_current_user
from app.models.user import User, UserPreference
from app.schemas.models import UserRegister, UserLogin, TokenResponse, UserOut, PreferenceCreate, PreferenceOut

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse)
async def register(data: UserRegister, db: AsyncSession = Depends(get_db)):
    """Register a new user."""
    # Check existing
    result = await db.execute(select(User).where(User.email == data.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=data.email,
        hashed_password=hash_password(data.password),
        full_name=data.full_name,
        user_type=data.user_type,
        state=data.state,
        district=data.district,
    )
    db.add(user)
    await db.flush()

    # Create default preferences based on user type
    default_categories = {
        "student": ["education", "technology", "employment"],
        "farmer": ["agriculture", "welfare", "health"],
        "msme": ["business", "technology", "employment"],
        "startup": ["startup", "business", "technology"],
        "ngo": ["welfare", "health", "education"],
        "citizen": ["welfare", "health", "education"],
    }
    for cat in default_categories.get(data.user_type, ["welfare"]):
        pref = UserPreference(user_id=user.id, category=cat)
        db.add(pref)

    await db.flush()

    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(
        access_token=token,
        user={
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "user_type": user.user_type,
            "state": user.state,
            "is_admin": user.is_admin,
        },
    )


@router.post("/login", response_model=TokenResponse)
async def login(data: UserLogin, db: AsyncSession = Depends(get_db)):
    """Login and receive JWT token."""
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()

    if not user or not await verify_password_async(data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(
        access_token=token,
        user={
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "user_type": user.user_type,
            "state": user.state,
            "is_admin": user.is_admin,
        },
    )


@router.get("/me", response_model=UserOut)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current user profile."""
    return current_user


@router.post("/preferences", response_model=PreferenceOut)
async def add_preference(
    data: PreferenceCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Add a user preference."""
    pref = UserPreference(
        user_id=current_user.id,
        category=data.category,
        keywords=data.keywords,
        notify_email=data.notify_email,
        notify_in_app=data.notify_in_app,
    )
    db.add(pref)
    await db.flush()
    await db.refresh(pref)
    return pref


@router.get("/preferences")
async def get_preferences(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get user preferences."""
    result = await db.execute(
        select(UserPreference).where(UserPreference.user_id == current_user.id)
    )
    return result.scalars().all()
