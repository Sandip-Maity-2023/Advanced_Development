import {useState,useEffect,useCallback} from 'react'
import "bootstrap/dist/css/bootstrap.min.css";

const API_BASE = "http://localhost:8000";


function App() {

  const [page,setPage] = useState("home");
  const [user,setUser] = useState(() => {
    const token = localStorage.getItem("token");
    return token ? {token, username: token} : null;
  });
  const [videos,setVideos] = useState([]);
  const [selectedVideo,setSelectedVideo] = useState(null);
  const [form,setForm] = useState({username:"",email:"",password:""});
  const [upload,setUpload] = useState({title:"",description:"",file:null});
  const [query,setQuery] = useState("");
  const [comments,setComments] = useState([]);
  const [commentText,setCommentText] = useState("");
  const [likedVideos,setLikedVideos] = useState({});

  const fetchVideos = useCallback(async (q="") => {
    const res = await fetch(`${API_BASE}/videos`);
    const data = await res.json();
    if(!q.trim()){
      setVideos(data);
    }else{
      const filtered = data.filter(v => v.title.toLowerCase().includes(q.toLowerCase()) || (v.description.toLowerCase().includes(q.toLowerCase())));
      setVideos(filtered);
    }
  },[]);

  useEffect(() => {
    // Fetching initial server data on mount is intentional for this app shell.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchVideos();
  },[fetchVideos]);


  //register
  const handleRegister = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("username",form.username);
    formData.append("email",form.email);
    formData.append("password",form.password);
    const res = await fetch(`${API_BASE}/register`,{
      method:"POST",
      body:formData
    });

    const data = await res.json();
    if(!res.ok){
      alert(data.detail || "Registration failed");
    } else {
      alert(data.message);
      setPage("login");
    }
  };


  //login
  const handleLogin = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("username",form.username);
    formData.append("password",form.password);
    const res = await fetch(`${API_BASE}/login`,{
      method:"POST",
      body:formData
    });

    const data = await res.json();
    if(!res.ok) return alert(data.detail || "Login failed");

    localStorage.setItem("token", data.access_token);
    setUser({token: data.access_token, username: form.username});
    setPage("home");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setLikedVideos({});
    setPage("home");
  };


  //upload a video
  const handleUpload = async (e) => {
    e.preventDefault();
    if(!upload.title.trim() || !upload.description.trim() || !upload.file) return alert("Please fill all fields and select a file");

    const formData = new FormData();
    formData.append("title", upload.title);
    formData.append("description", upload.description);
    formData.append("file", upload.file);
    formData.append("token", user.token);

    const res = await fetch(`${API_BASE}/upload`, {
      method: "POST",
      body: formData
    });

    const data = await res.json();
    if(!res.ok) return alert(data.detail || "Upload failed");
    else {
      alert("Video uploaded successfully");
      fetchVideos();
      setPage("home");
    }
  };

  //watch video
  const handleWatch = async (video) => {
    setSelectedVideo(video);
    setPage("watch");

    const res = await fetch(`${API_BASE}/comments/${video.id}`);
    const data = await res.json();
    setComments(data);

    if(user){
      const likedRes = await fetch(`${API_BASE}/liked/${video.id}`, {
        method: "POST",
        body: new URLSearchParams({token:user.token}),
      });
      const likedData = await likedRes.json();
      setLikedVideos(prev => ({...prev, [video.id]: likedData.liked}));
    }
  }; 


  //like video
  const handleLike = async (video) => {
    if(!user) return alert("Please login to like videos");
    const formData = new FormData();
    formData.append("token", user.token);
    const res = await fetch(`${API_BASE}/like/${video.id}`, {
      method: "POST",
      body: formData
    });

    const data = await res.json();
    if(!res.ok) return alert(data.detail || "Like failed");

    setLikedVideos(prev => ({...prev,[video.id]:data.liked}));
    setVideos((prev)=> prev.map(v => v.id === video.id ? {...v, likes: data.likes} : v));

    if(selectedVideo && selectedVideo.id === video.id){
      setSelectedVideo(prev => ({...prev, likes: data.likes}));
      // Update the selected video's like status
    }   
  };
    
   //comment video
   const handleAddComment=async()=>{
    if(!commentText.trim()) return;
    const formData = new FormData();
    formData.append("content", commentText);
    formData.append("token", user.token);

    await fetch(`${API_BASE}/comment/${selectedVideo.id}`, {
      method: "POST",
      body: formData
    });
    setCommentText("");
    handleWatch(selectedVideo); // Refresh comments
   }

   //delete video
   const handleDeleteVideo = async () => {
    if(!window.confirm("Are you sure you want to delete this video?")) return;
    const formData = new FormData();
    formData.append("token", user.token);

    const res = await fetch(`${API_BASE}/video/${selectedVideo.id}`, {
      method: "DELETE",
      body: formData
    });

    const data = await res.json();
    if(!res.ok) return alert(data.detail || "Video delete failed");
    alert(data.message || "Video deleted");
    setSelectedVideo(null);
    setPage("home");
    fetchVideos();
  };

    return (

      <div className="container py-4">
        <nav className="navbar navbar-expand-lg navbar-light bg-light mb-4">
          <div className="container-fluid">
            <a className="navbar-brand" href="#" onClick={() => setPage("home")}>MiniTube</a>
            <div className="d-flex">
              {user ? (
                <>
                  <span className="me-2">{user.username}</span>
                  <button className="btn btn-outline-danger" onClick={handleLogout}>Logout</button>
                </>
              ) : (
                <>
                  <button className="btn btn-outline-primary me-2" onClick={() => setPage("login")}>Login</button>
                  <button className="btn btn-outline-secondary" onClick={() => setPage("register")}>Register</button>
                </>
              )}  
            </div>
          </div>
        </nav>

        {/* home page */}
          {page === "home" && (
            <>
            <div className="d-flex mb-3">
              <input className="form-control me-2" type="search" placeholder="Search videos..." value={query} onChange={(e) => setQuery(e.target.value)} />
              <button className="btn btn-outline-success" onClick={() => fetchVideos(query)}>Search</button>
              {user && <button className="btn btn-success" onClick={() => setPage("upload")}>Upload</button>}
            </div>

            <div className="row">
              {videos.map((v) => (
                <div key={v.id} className="col-md-4 mb-4">
                  <div className="card h-100" onClick={() => handleWatch(v)}>
                    <video src={`${API_BASE}/video/${v.id}`} muted style={{height:"200px",objectFit:"cover"}} />

                <div className="card-body">
                  <h5 className="card-title">{v.title}</h5>
                  <p className="card-text">{v.description?.slice(0,80)}</p>
                  <small>Love{v.likes}</small>
                </div>
              </div>
            </div>
              ))}
              </div>
          </>
        )}

        {/* register page */}
        {page === "register" && (
          <div className="card p-4 mx-auto" style={{maxWidth:"400px"}}>
            <h3>Register</h3>
            <input className="form-control mb-2" type="text" placeholder="Username" value={form.username} onChange={(e) => setForm({...form, username: e.target.value})} />
            <input className="form-control mb-2" type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} />
            <input className="form-control mb-2" type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({...form, password: e.target.value})} />
            <button className="btn btn-primary w-100" onClick={handleRegister}>Register</button>
          </div>
        )}


        {/* login page */}
        {page === "login" && (
          <div className="card p-4 mx-auto" style={{maxWidth:"400px"}}>
            <h3>Login</h3>
            <input className="form-control mb-2" type="text" placeholder="Username" value={form.username} onChange={(e) => setForm({...form, username: e.target.value})} />
            <input className="form-control mb-2" type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({...form, password: e.target.value})} />
            <button className="btn btn-primary w-100" onClick={handleLogin}>Login</button>
          </div>
        )}

        {/* upload page */}
        {page === "upload" && (
          <div className="card p-4 mx-auto" style={{maxWidth:"600px"}}>
            <h3>Upload Video</h3>
            <form onSubmit={handleUpload}>
              <input className="form-control mb-2" type="text" placeholder="Title" value={upload.title} onChange={(e) => setUpload({...upload, title: e.target.value})} />
              <textarea className="form-control mb-2" placeholder="Description" value={upload.description} onChange={(e) => setUpload({...upload, description: e.target.value})} />
              <input className="form-control mb-2" type="file" onChange={(e) => setUpload({...upload, file: e.target.files[0]})} />
              <button className="btn btn-success w-100" type="submit">Upload</button>
            </form>
          </div>
        )}

        {/* watch page */}
        {page === "watch" && selectedVideo && (
          <div>
            <button className="btn btn-secondary mb-3" onClick={() => setPage("home")}>Back</button>
            <h3>{selectedVideo.title}</h3>
            <video src={`${API_BASE}/video/${selectedVideo.id}`} controls style={{width:"100%",maxHeight:500}} />
            <p>{selectedVideo.description}</p>

            {/* like button */}
            <div className="mb-3">
              <button className="btn me-2" style={{backgroundColor: likedVideos[selectedVideo.id] ? "pink" : "white", transition:"background-color 0.3s ease",
              }}
              onClick={() => handleLike(selectedVideo)}>
                Like</button>
                <span>{selectedVideo.likes} likes</span>
              </div>

              {/* delete button for owner */}
              {user && selectedVideo.uploader_id === user.username && (
                <button className="btn btn-danger mb-3" onClick={handleDeleteVideo}>Delete Video</button>
              )}

              {/* comments section */}
              <div className="mb-3">
                <h5>comments</h5>
                {comments.map(c => (
                  <p key={c.id}><strong>{c.user}:</strong> {c.timestamp}):{c.content}</p>
                ))}
                {user && (
                  <div className="d-flex">
                    <input className="form-control me-2" type="text" placeholder="Add a comment..." value={commentText} onChange={(e) => setCommentText(e.target.value)} />
                    <button className="btn btn-primary" onClick={handleAddComment}>Comment</button>
                  </div>
                )}
              </div>
            </div>
        )}
        </div>
    );
  }

export default App;
