from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime


class UserRegister(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    postal_code: Optional[str] = None
    address_line: Optional[str] = None
    educations: Optional[List[Dict[str, Any]]] = None
    experiences: Optional[List[Dict[str, Any]]] = None
    skills: Optional[List[str]] = None
    has_disability: Optional[str] = None
    gender: Optional[str] = None
    setup_completed: Optional[bool] = None
    
    # Job Preferences
    desired_roles: Optional[List[str]] = None
    preferred_job_types: Optional[List[str]] = None
    preferred_location: Optional[str] = None
    open_to_remote: Optional[bool] = None
    needs_visa: Optional[bool] = None


class UserOut(BaseModel):
    id: int
    email: str
    full_name: Optional[str]
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    is_active: bool
    created_at: datetime
    
    # Personal Info
    phone: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    postal_code: Optional[str] = None
    address_line: Optional[str] = None

    # Setup Wizard Data
    educations: Optional[List[Dict[str, Any]]] = None
    experiences: Optional[List[Dict[str, Any]]] = None
    skills: Optional[List[str]] = None

    # Equal Employment
    has_disability: Optional[str] = None
    gender: Optional[str] = None

    # Onboarding state
    setup_completed: Optional[bool] = False
    has_cv: bool = False

    # Job Preferences
    desired_roles: Optional[List[str]] = None
    preferred_job_types: Optional[List[str]] = None
    preferred_location: Optional[str] = None
    open_to_remote: Optional[bool] = True
    needs_visa: Optional[bool] = False

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
