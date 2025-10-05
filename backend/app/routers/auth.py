from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
from typing import Optional
import secrets
import hashlib
import jwt

from ..db import get_db
from ..models import User
from ..config import settings
from ..email_service import send_verification_email, send_password_reset_email

router = APIRouter(prefix="/api/auth", tags=["auth"])

# JWT settings
SECRET_KEY = settings.secret_key if hasattr(settings, 'secret_key') else "your-secret-key-change-this"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 43200  # 30 days

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# Schemas
class UserRegister(BaseModel):
    email: EmailStr
    password: str

class UserVerify(BaseModel):
    pocket_option_id: str

class UserLogin(BaseModel):
    email: str
    password: str

class ChangePassword(BaseModel):
    old_password: str
    new_password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class UserResponse(BaseModel):
    id: int
    email: str
    pocket_option_id: Optional[str]
    balance: float
    is_verified: bool
    has_min_deposit: bool
    created_at: datetime

# Helper functions
def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return hash_password(plain_password) == hashed_password

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except jwt.JWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

# Routes
@router.post("/register", response_model=dict)
async def register(user_data: UserRegister, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Регистрация нового пользователя"""
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create verification token
    verification_token = secrets.token_urlsafe(32)
    
    # Create new user
    new_user = User(
        email=user_data.email,
        password_hash=hash_password(user_data.password),
        verification_token=verification_token,
        is_verified=False
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # TODO: Send verification email
    # background_tasks.add_task(send_verification_email, user_data.email, verification_token)
    
    # Send verification email
    email_sent = await send_verification_email(user_data.email, verification_token)
    
    return {
        "message": "User registered successfully. Please check your email for verification link.",
        "email_sent": email_sent,
        "verification_token": verification_token  # For demo purposes
    }

@router.post("/verify-email/{token}")
async def verify_email(token: str, db: Session = Depends(get_db)):
    """Подтверждение email"""
    user = db.query(User).filter(User.verification_token == token).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid verification token")
    
    user.is_verified = True
    user.verification_token = None
    db.commit()
    
    return {"message": "Email verified successfully. Please register on Pocket Option."}

@router.post("/verify-pocket-option", response_model=dict)
async def verify_pocket_option(data: UserVerify, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Проверка Pocket Option ID"""
    if not current_user.is_verified:
        raise HTTPException(status_code=400, detail="Please verify your email first")
    
    # Check if Pocket Option ID already exists
    existing = db.query(User).filter(User.pocket_option_id == data.pocket_option_id).first()
    if existing and existing.id != current_user.id:
        raise HTTPException(status_code=400, detail="This Pocket Option ID is already registered")
    
    current_user.pocket_option_id = data.pocket_option_id
    db.commit()
    
    return {
        "message": "Pocket Option ID saved. Please deposit minimum $200 to access signals.",
        "needs_deposit": True,
        "min_deposit": 200
    }

@router.post("/check-balance", response_model=dict)
async def check_balance(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Проверка баланса (симуляция)"""
    if not current_user.pocket_option_id:
        raise HTTPException(status_code=400, detail="Please register your Pocket Option ID first")
    
    # TODO: Integrate with Pocket Option API to check real balance
    # For now, simulate balance check
    import random
    simulated_balance = random.choice([0, 150, 250, 500])
    
    current_user.balance = simulated_balance
    current_user.has_min_deposit = simulated_balance >= 200
    db.commit()
    
    return {
        "balance": simulated_balance,
        "has_min_deposit": simulated_balance >= 200,
        "min_required": 200
    }

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Вход в систему"""
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(status_code=400, detail="User account is deactivated")
    
    user.last_login = datetime.utcnow()
    db.commit()
    
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Получить информацию о текущем пользователе"""
    return current_user

@router.post("/change-password")
async def change_password(
    data: ChangePassword,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Изменить пароль"""
    if not verify_password(data.old_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect old password")
    
    current_user.password_hash = hash_password(data.new_password)
    db.commit()
    
    return {"message": "Password changed successfully"}

@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user)):
    """Выход из системы"""
    # In a real app, you'd invalidate the token here
    return {"message": "Logged out successfully"}

@router.get("/can-access-signals")
async def can_access_signals(current_user: User = Depends(get_current_user)):
    """Проверка доступа к сигналам"""
    can_access = (
        current_user.is_verified and
        current_user.pocket_option_id is not None and
        current_user.has_min_deposit
    )
    
    return {
        "can_access": can_access,
        "is_verified": current_user.is_verified,
        "has_pocket_option_id": current_user.pocket_option_id is not None,
        "has_min_deposit": current_user.has_min_deposit,
        "balance": current_user.balance
    }

