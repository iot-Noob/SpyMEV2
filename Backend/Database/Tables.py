import os
from sqlalchemy import Column, String, DateTime, ForeignKey, func, create_engine, Integer
from sqlalchemy.orm import relationship, declarative_base, sessionmaker
from dotenv import load_dotenv

load_dotenv()

db_path = os.getenv("DB_PATH")

if not db_path:
    raise ValueError('❌ Error: "DB_PATH" missing or invalid in .env')

# If using SQLite, make sure the folder exists
if db_path.startswith("sqlite:///"):
    db_file = db_path.replace("sqlite:///", "", 1)
    db_folder = os.path.dirname(db_file)
    if db_folder:
        os.makedirs(db_folder, exist_ok=True)

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    # Auto-increment integer ID
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)

    username = Column(String, unique=True, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    rtc_sessions = relationship(
        "RtcSession",
        back_populates="user",
        cascade="all, delete-orphan"
    )


class RtcSession(Base):
    __tablename__ = "rtc_sessions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)

    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    user = relationship("User", back_populates="rtc_sessions")


# ------------------ DB INIT ------------------
engine = create_engine(db_path, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

def init_table():
    try:
        print("✅ Database init success")
        Base.metadata.create_all(engine)
    except Exception as e:
        raise ValueError(f"❌ Error occurred while initializing tables: {e}")
