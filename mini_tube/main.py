from fastapi import FastAPI,Form,UploadFile,HTTPException,Depends,File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy import create_engine, Column, Integer, String, ForeignKey, Text, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship,Session
from werkzeug.security import generate_password_hash, check_password_hash
import os,shutil,datetime,uuid

DATABASE_URL = "sqlite:///database.db"                                            # local SQLite database file named database.db. The sqlite:/// prefix indicates that SQLAlchemy should use the SQLite database engine, and the path following it specifies the location of the database file. In this case, the database file will be created in the same directory as the script if it doesn't already exist.

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})   #a mandatory configuration option for SQLite when used with FastAPI to allow multiple threads to access the database. This is necessary because FastAPI can handle multiple requests concurrently, and without this option, SQLite would raise an error when trying to access the database from different threads.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)       #This creates a session factory that can be used to create new database sessions. The autocommit=False option means that changes to the database will not be automatically committed, allowing for better control over transactions. The autoflush=False option prevents SQLAlchemy from automatically flushing changes to the database before queries, which can help improve performance in certain scenarios. The bind=engine option tells SQLAlchemy to use the previously created engine for database connections.
Base = declarative_base()                                                         #This creates a base class for our database models. All models will inherit from this class, which provides the necessary functionality for SQLAlchemy to map the models to database tables.

UPLOAD_DIR = "./uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)                                            #This line ensures that the directory specified by UPLOAD_DIR exists. If it doesn't exist, it will be created. This is important for storing uploaded video files.

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

Base.metadata.create_all(bind=engine)       #This line creates all the tables in the database based on the models defined above. If the tables already exist, it will not do anything. This is a crucial step to ensure that the database schema is set up correctly before the application starts handling requests.
app = FastAPI()                             #This line initializes a new FastAPI application instance, which will be used to define routes and handle incoming HTTP requests. The app variable is the main entry point for the application, and it will be used to register routes and middleware throughout the code.
                                            # The CORSMiddleware is added to the FastAPI application to allow cross-origin requests from any origin. This is important for enabling the frontend (which may be served from a different domain or port) to communicate with the backend API without running into CORS issues. The allow_origins=["*"] option allows requests from any origin, while allow_methods=["*"] and allow_headers=["*"] allow all HTTP methods and headers in cross-origin requests.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
                                                # The get_db function is a dependency that provides a database session for each request. It creates a new session using the SessionLocal factory, yields it for use in the request, and ensures that the session is closed after the request is completed. This pattern allows for proper management of database connections and ensures that resources are released appropriately.
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
                                               # The get_user_by_token function is a helper function that retrieves a user from the database based on a provided token. In this implementation, the token is simply the username, which is not secure for production use but serves as a simple authentication mechanism for this example. The function queries the User table for a user with a matching username and returns the user object if found, or None if no matching user is found.
def get_user_by_token(token: str, db: Session):
    user = db.query(User).filter(User.username == token).first()
    return user



                                                                                                                        # The register endpoint allows users to create a new account by providing a username, email, and password. It first checks if the username already exists in the database to prevent duplicate accounts. If the username is available, it hashes the password using generate_password_hash for secure storage and creates a new User record in the database. Finally, it commits the transaction and returns a success message. Proper error handling is implemented to ensure that appropriate HTTP responses are returned in case of issues such as duplicate usernames.
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
        
        
        
                                                                                                        # The login endpoint allows users to authenticate by providing their username and password. It retrieves the user from the database based on the provided username and checks if the password matches using the check_password_hash function. If the credentials are valid, it returns a simple access token (in this case, just the username) that can be used for subsequent authenticated requests. If the credentials are invalid, it raises an HTTPException with a 400 status code and an appropriate error message.
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

                                                                                                        # The upload_video endpoint allows users to upload a video file along with its title and description. It first checks if the title and description are provided and if a file is uploaded. Then it validates the user's token to ensure they are authenticated. If all checks pass, it generates a unique filename for the uploaded video, saves the file to the specified upload directory, and creates a new Video record in the database associated with the user. Finally, it returns a success message along with the ID of the newly created video. Proper error handling is implemented to ensure that appropriate HTTP responses are returned in case of issues such as missing fields, invalid tokens, or file upload errors.
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

                                                                                                        # The list_videos endpoint retrieves a list of all videos from the database and returns them in a structured format. It uses the database session to query the Video table and constructs a list of dictionaries containing the video ID, title, description, number of likes, and uploader's username (if available). This allows clients to easily display video information in the frontend. Proper error handling is implemented to ensure that appropriate HTTP responses are returned in case of issues such as database errors.
@app.get("/videos")
def list_videos(db: Session = Depends(get_db)):
    videos = db.query(Video).all()
    return [{"id": v.id, "title": v.title, "description": v.description, "likes": v.likes, "uploader_id": v.user.username if v.user else None} for v in videos]


                                                                                                        # The get_video endpoint retrieves a video file based on the provided video_id. It first checks if the video exists in the database and if the corresponding video file exists on the filesystem. If either the video record or the file is not found, it raises a 404 HTTPException with an appropriate error message. If both checks pass, it returns the video file as a response using FileResponse, specifying the media type as "video/mp4". This allows clients to stream or download the video file directly from the server. Proper error handling ensures that users receive clear feedback when requested resources are not available.
@app.get("/video/{video_id}")
def get_video(video_id: int, db: Session = Depends(get_db)):
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    if not os.path.exists(video.filename):
        raise HTTPException(status_code=404, detail="Video file not found")
    return FileResponse(video.filename, media_type="video/mp4")


                                                                                                        # The like_video endpoint allows users to like or unlike a video. It takes the video_id as a path parameter and the token as form data. It retrieves the user associated with the token and checks if there is already a like record for that user and video. If a like exists, it removes it and decrements the like count; if not, it creates a new like record and increments the like count. The response includes the updated number of likes and whether the video is currently liked by the user. Proper error handling is implemented to ensure that appropriate HTTP responses are returned in case of issues such as invalid tokens or non-existent videos.
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
                                                                                                                                                  # The check_liked endpoint checks if a user has liked a specific video. It takes the video_id as a path parameter and the token as form data. It retrieves the user associated with the token and checks if there is a like record in the database for that user and video. The response indicates whether the user has liked the video or not. If the token is invalid, it returns {"liked": False} to indicate that the user has not liked the video.
@app.post("/liked/{video_id}")
def check_liked(video_id: int, token: str = Form(...), db: Session = Depends(get_db)):
    user = get_user_by_token(token, db)
    if not user:
        return {"liked": False}
    liked=db.query(Like).filter(Like.user_id == user.id, Like.video_id == video_id).first() is not None
    return {"liked": liked}
                                                                                                                                                   # The get_comments endpoint retrieves all comments for a specific video, ordered by timestamp in descending order. It takes the video_id as a path parameter and uses the database session to query the Comment table for comments associated with that video. The response includes the comment ID, the username of the commenter, the content of the comment, and the timestamp formatted as a string. If there are no comments for the video, it will return an empty list. Proper error handling is implemented to ensure that appropriate HTTP responses are returned in case of issues such as non-existent videos or database errors.
@app.get("/comments/{video_id}")
def get_comments(video_id: int, db: Session = Depends(get_db)):
    comments = db.query(Comment).filter(Comment.video_id == video_id).order_by(Comment.timestamp.desc()).all()
    return [{"id": c.id, "user":c.user.username, "content": c.content, "timestamp": c.timestamp.strftime("%Y-%m-%d %H:%M")} for c in comments]    
 
                                                                                                                                                    # The add_comment endpoint allows users to add comments to a specific video. It first checks if the provided token is valid and retrieves the corresponding user. Then it validates that the comment content is not empty and that the video with the given ID exists. If all checks pass, it creates a new Comment object, associates it with the user and video, and saves it to the database. Finally, it returns a success message along with the ID of the newly created comment. Proper error handling is implemented to ensure that appropriate HTTP responses are returned in case of issues such as invalid tokens, empty comments, or non-existent videos.
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

                                                                                                                                          # The delete_video endpoint allows users to delete their own videos. It first checks if the provided token is valid and retrieves the corresponding user. Then it checks if the video with the given ID exists and if the user is authorized to delete it (i.e., they are the uploader). If everything is in order, it attempts to delete the video file from the filesystem and then removes the video record from the database along with any associated likes and comments. Proper error handling is implemented to ensure that appropriate HTTP responses are returned in case of issues such as invalid tokens, unauthorized access, or errors during file deletion or database operations.
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
