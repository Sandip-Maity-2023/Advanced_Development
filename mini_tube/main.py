from fastapi import FastAPI,Form,UploadFile,HTTPException,Depends,File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy import create_engine, Column, Integer, String, ForeignKey, Text, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship,Session
from werkzeug.security import generate_password_hash, check_password_hash
import os,shutil,datetime,uuid

DATABASE_URL = "sqlite:///database.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

UPLOAD_DIR = "./uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String)
    password=Column(String)

class Video(Base):
    __tablename__ = "videos"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    description = Column(Text)
    filename = Column(String)
    likes = Column(Integer, default=0)
    user_id = Column(Integer, ForeignKey("users.id"))
    user = relationship("User")

class Like(Base):
    __tablename__ = "likes"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    video_id = Column(Integer, ForeignKey("videos.id"))

class Comment(Base):
    __tablename__ = "comments"
    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    user_id = Column(Integer, ForeignKey("users.id"))
    video_id = Column(Integer, ForeignKey("videos.id"))
    user = relationship("User")

Base.metadata.create_all(bind=engine)
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_user_by_token(token: str, db: Session):
    user = db.query(User).filter(User.username == token).first()
    return user

@app.post("/register")
def register(
    username: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db)
):
    if db.query(User).filter(User.username == username).first():
        raise HTTPException(status_code=400, detail="Username already exists")
    hashed_pw = generate_password_hash(password)
    user = User(username=username, email=email, password=hashed_pw)
    db.add(user)
    db.commit()
    return {"message": "User registered successfully"}

@app.post("/login")
def login(
    username: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.username == username).first()
    if not user or not check_password_hash(user.password, password):
        raise HTTPException(status_code=400, detail="Invalid credentials")
    return {"access_token": user.username, "token_type": "bearer"}


@app.post("/upload")
def upload_video(
    title: str = Form(...),
    description: str = Form(...),
    file: UploadFile = File(...),
    token: str = Form(...),
    db: Session = Depends(get_db)
):
    if not title.strip() or not description.strip():
        raise HTTPException(status_code=400, detail="Title and description are required")
    if not file:
        raise HTTPException(status_code=400, detail="No file Uploaded")
    
    user = get_user_by_token(token, db)
    if not user:
        raise HTTPException(status_code=400, detail="Invalid token")
    
    filename = f"{uuid.uuid4().hex}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    
    video = Video(title=title, description=description, filename=file_path, user_id=user.id)
    db.add(video)
    db.commit()
    db.refresh(video)
    
    return {"message": "Video uploaded successfully", "video_id": video.id}


@app.get("/videos")
def list_videos(db: Session = Depends(get_db)):
    videos = db.query(Video).all()
    return [{"id": v.id, "title": v.title, "description": v.description, "likes": v.likes, "uploader_id": v.user.username if v.user else None} for v in videos]

@app.get("/video/{video_id}")
def get_video(video_id: int, db: Session = Depends(get_db)):
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    if not os.path.exists(video.filename):
        raise HTTPException(status_code=404, detail="Video file not found")
    return FileResponse(video.filename, media_type="video/mp4")

@app.post("/like/{video_id}")
def like_video(video_id: int, token: str = Form(...), db: Session = Depends(get_db)):
    user = get_user_by_token(token, db)
    if not user:
        raise HTTPException(status_code=400, detail="Invalid token")

    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    existing_like = db.query(Like).filter(Like.user_id == user.id, Like.video_id == video.id).first()
    if existing_like:
        db.delete(existing_like)
        video.likes = max((video.likes or 0) - 1, 0)
        liked = False
    else:
        db.add(Like(user_id=user.id, video_id=video.id))
        video.likes = (video.likes or 0) + 1
        liked = True

    db.commit()
    return {"likes": video.likes, "liked": liked}

@app.post("/liked/{video_id}")
def check_liked(video_id: int, token: str = Form(...), db: Session = Depends(get_db)):
    user = get_user_by_token(token, db)
    if not user:
        return {"liked": False}
    liked=db.query(Like).filter(Like.user_id == user.id, Like.video_id == video_id).first() is not None
    return {"liked": liked}

@app.get("/comments/{video_id}")
def get_comments(video_id: int, db: Session = Depends(get_db)):
    comments = db.query(Comment).filter(Comment.video_id == video_id).order_by(Comment.timestamp.desc()).all()
    return [{"id": c.id, "user":c.user.username, "content": c.content, "timestamp": c.timestamp.strftime("%Y-%m-%d %H:%M")} for c in comments]    

@app.post("/comment/{video_id}")
def add_comment(video_id: int, content: str = Form(...), token: str = Form(...), db: Session = Depends(get_db)):

    user = get_user_by_token(token, db)
    if not user:
        raise HTTPException(status_code=400, detail="Invalid token")
    if not content.strip():
        raise HTTPException(status_code=400, detail="Comment cannot be empty")
    if not db.query(Video).filter(Video.id == video_id).first():
        raise HTTPException(status_code=404, detail="Video not found")
    
    comment = Comment(content=content, user_id=user.id, video_id=video_id)
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return {"message": "Comment added successfully", "comment_id": comment.id}


@app.delete("/video/{video_id}")
def delete_video(video_id: int, token: str = Form(...), db: Session = Depends(get_db)):
    user = get_user_by_token(token, db)
    if not user:
        raise HTTPException(status_code=400, detail="Invalid token")

    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    
    if video.user_id != user.id:
        raise HTTPException(status_code=400, detail="Not authorized to delete this video")

    try:
        os.remove(video.filename)
    except FileNotFoundError:
        pass
    except OSError:
        raise HTTPException(status_code=500, detail="Error occurred while deleting video file")

    try:
        db.query(Like).filter(Like.video_id == video.id).delete()
        db.query(Comment).filter(Comment.video_id == video.id).delete()
        db.delete(video)
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Error occurred while deleting video")
    return {"message": "Video deleted successfully"}
