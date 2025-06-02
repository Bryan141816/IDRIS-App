from sqlalchemy.orm import Session
from models import User
from auth import hash_password, verify_password

# Generic CRUD functions

def get_by_id(db: Session, model, id):
    return db.query(model).filter(model.id == id).first()

def get_all(db: Session, model, skip: int = 0, limit: int = 100):
    return db.query(model).offset(skip).limit(limit).all()

def create(db: Session, model, obj_in: dict):
    obj = model(**obj_in)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

def update(db: Session, model, id, obj_in: dict):
    db_obj = get_by_id(db, model, id)
    if not db_obj:
        return None
    for key, value in obj_in.items():
        setattr(db_obj, key, value)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def delete(db: Session, model, id):
    obj = get_by_id(db, model, id)
    if not obj:
        return None
    db.delete(obj)
    db.commit()
    return obj

# User-specific functions

def get_user_by_username(db: Session, username: str):
    return db.query(User).filter(User.username == username).first()

def create_user(db: Session, username: str, password: str, roles: list[str] = None):
    hashed = hash_password(password)
    user_data = {
        "username": username,
        "hashed_password": hashed,
        "roles": roles or []
    }
    user = User(**user_data)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def authenticate_user(db: Session, username: str, password: str):
    user = get_user_by_username(db, username)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user

def assign_roles(db: Session, user: User, role_names: list[str]):
    # Directly replace the user's roles with the provided list
    user.roles = role_names
    db.commit()
    db.refresh(user)
    return user
