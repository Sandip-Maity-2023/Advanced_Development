# MiniTube

MiniTube is a small video-sharing application with a FastAPI backend and a
React/Vite frontend. Users can create accounts, upload videos, browse and
search the catalogue, watch videos, like them, comment, and delete videos they
uploaded.

## Features

- Username and password registration.
- Password hashing with Werkzeug.
- Login with a lightweight username token stored in browser local storage.
- Video upload with title, description, and local file storage.
- Video catalogue and title/description search.
- Browser video playback.
- Per-user likes with like-count tracking.
- Video comments with timestamps and usernames.
- Upload-owner deletion.
- SQLite persistence through SQLAlchemy.
- Bootstrap-based React interface.

## Technology

- Python 3.10+
- FastAPI
- Uvicorn
- SQLAlchemy
- SQLite
- Werkzeug
- React 19
- Vite
- Bootstrap 5

## Project structure

```text
mini_tube/
├── main.py                 # FastAPI app, models, and API endpoints
├── database.db             # Local SQLite database (created/used at runtime)
├── uploads/                # Uploaded video files
├── frontend/
│   ├── src/
│   │   ├── App.jsx         # Main UI and API interaction
│   │   ├── App.css
│   │   └── index.css
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## Requirements

- Python 3.10 or newer
- Node.js 18 or newer
- npm

## Installation

Create and activate a backend virtual environment:

```powershell
cd E:\Advanced_Development\mini_tube
python -m venv .env
.\.env\Scripts\Activate.ps1
python -m pip install fastapi uvicorn sqlalchemy werkzeug python-multipart
```

`python-multipart` is required by FastAPI for form and file uploads. If the
existing environment already contains the dependencies, the installation step
can be skipped.

Install the frontend dependencies:

```powershell
cd frontend
npm install
```

## Running locally

Start the backend from the project root:

```powershell
cd E:\Advanced_Development\mini_tube
.\.env\Scripts\python.exe -m uvicorn main:app --reload --port 8000
```

The API is available at `http://127.0.0.1:8000`. Interactive API
documentation is available at `/docs`.

Start the frontend in a second terminal:

```powershell
cd E:\Advanced_Development\mini_tube\frontend
npm run dev
```

Open the Vite URL, normally `http://localhost:5173`. The frontend currently
uses `http://localhost:8000` as its API base URL; change `API_BASE` in
`frontend/src/App.jsx` when deploying the backend elsewhere.

## API reference

The backend exposes the following endpoints:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/register` | Create a user using form fields |
| `POST` | `/login` | Authenticate and return an access token |
| `POST` | `/upload` | Upload a video for the logged-in user |
| `GET` | `/videos` | List videos and uploader information |
| `GET` | `/video/{video_id}` | Stream/download a video file |
| `POST` | `/like/{video_id}` | Toggle a like for the current user |
| `POST` | `/liked/{video_id}` | Check whether the current user liked a video |
| `GET` | `/comments/{video_id}` | List comments for a video |
| `POST` | `/comment/{video_id}` | Add a comment |
| `DELETE` | `/video/{video_id}` | Delete a video owned by the current user |

Registration, login, upload, likes, comments, and deletion use multipart form
fields. The current token is the username returned by `/login`; it is not a
signed JWT and should be replaced with a proper authentication scheme before
production use.

## Database and uploads

SQLAlchemy creates these tables when `main.py` starts:

- `users` — account details and password hashes.
- `videos` — title, description, filename, owner, and like count.
- `likes` — user/video like relationships.
- `comments` — comment text, author, video, and timestamp.

Video files are stored in `uploads/`, while SQLite stores their metadata. Keep
both the database and upload directory when backing up the application.

## Available scripts

### Backend

```powershell
python -m uvicorn main:app --reload
```

### Frontend

| Command | Description |
| --- | --- |
| `npm run dev` | Start Vite development server |
| `npm run build` | Build the production frontend |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview the production build |

## Production considerations

- Replace the username-as-token approach with JWT or secure server sessions.
- Restrict CORS instead of allowing every origin.
- Validate file type, size, and content before saving uploads.
- Store videos in object storage and serve them through a media/CDN layer.
- Add migrations and a production database instead of creating tables at import.
- Add authorization checks and rate limits around uploads, comments, and likes.
