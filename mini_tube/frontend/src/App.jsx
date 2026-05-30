import React,{useState,useEffect} from 'react'
import "bootstrap/dist/css/bootstrap.min.css";

const API_URL = "http://localhost:8000";


function App() {

  const [page,setPage] = useState("home");
  const [user,setUser] = useState(null);
  const [videos,setVideos] = useState([]);
  const [selectedVideo,setSelectedVideo] = useState(null);
  const [form,setForm] = useState({username:"",email:"",password:""});
  const [upload,setUpload] = useState({title:"",description:"",file:null});
  const [query,setQuery] = useState("");
  const [comments,setComments] = useState([]);
  const [commentText,setCommentText] = useState("");
  const [likedVideos,setLikedVideos] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if(token) setUser({token,username:token});
    fetchVideos();
  },[]);

  const fetchVideos = async (q="") => {
    const res = await fetch(`${API_BASE}/videos`);
    const data = await res.json();
    if(!q.trim()){
      setVideos(data);
    }else{
      const filtered = data.filter(v => v.title.toLowerCase().includes(q.toLowerCase()) || (v.description.toLowerCase().includes(q.toLowerCase())));
      setVideos(filtered);
    }
  };


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
    setUser({token: data.token, username: form.username});
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
      const likeRes = await fetch(`${API_BASE}/liked/${video.id}`, {
        method: "POST",
        body: new URLSearchParams({token:user.token}),
      });
      const likedData = await likedRes.json();
      setLikedVideos(likedData.liked ? [...prev, video.id] : prev);
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
  

    setLikedVideos(prev => ({...prev,[video.id]:data.liked}));
    setVideos((prev)=> prev.map(v => v.id === video.id ? {...v, liked: data.likes} : v));

    if(selectedVideo && selectedVideo.id === video.id){
      setSelectedVideo(prev => ({...prev, likes: data.likes}));
      // Update the selected video's like status
    }   
  };
    
   
  //comment on video
  const handleDeleteVideo = async () => {
    if(!window.confirm("Are you sure you want to delete this video?")) return;
    const formData = new FormData();
    formData.append("token", user.token);

    const res = await fetch(`${API_BASE}/delete/${selectedVideo.id}`, {
      method: "POST",
      body: formData
    });
    const data = await res.json();
    alert(data.message || "Video deleted");
    setPage("home");
    fetchVideos();
  };



    return (

      <div className="container py-4">
        <nav className="navbar navbar-expand-lg navbar-light bg-light mb-4">
          <div className="container-fluid">
            <a className="navbar-brand" href="#" onClick={() => setPage("home")}>MiniTube</a>
            <div className="collapse navbar-collapse">
              <h1 className="mb-4">MiniTube</h1>
              {user ? (<span className="navbar-text">Welcome, {user.username}!</span>) : null}
            </div>
            
          </div>
        </nav>
      </div>
    )
    {
      if(prev.includes(video.id)){
        return prev.filter(id => id !== video.id);
      } else {
        return [...prev, video.viseo.details || alertn];
      }
  return (
    <div>App</div>
  )
}

export default App