import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  Upload, 
  Trash2, 
  Home, 
  Film, 
  Edit, 
  Plus, 
  X,
  Image,
  Video,
  ChevronDown,
  ChevronUp,
  Save,
  Users,
  Mail,
  Key,
  UserCog,
  Search,
  Eye,
  EyeOff
} from "lucide-react";
import api from "../api/api"; // Importamos el cliente api

export default function Admin() {
  const navigate = useNavigate();

  // URL base para assets
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

  // Estados para contenido
  const [movies, setMovies] = useState([]);
  const [filteredMovies, setFilteredMovies] = useState([]);
  const [movieSearch, setMovieSearch] = useState("");
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "pelicula"
  });

  const [poster, setPoster] = useState(null);
  const [preview, setPreview] = useState(null);
  const [video, setVideo] = useState(null);
  const [existingVideo, setExistingVideo] = useState(null);

  const [seasons, setSeasons] = useState([]);
  const [expandedSeasons, setExpandedSeasons] = useState({});

  // Estados para usuarios
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [userSearch, setUserSearch] = useState("");
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showPasswords, setShowPasswords] = useState({});
  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "user"
  });

  const [message, setMessage] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("contenido"); // "contenido" o "usuarios"

  const token = localStorage.getItem("token");
  const currentUserId = localStorage.getItem("userId");

  useEffect(() => {
    const role = localStorage.getItem("userRole");

    if (!token || role !== "admin") {
      navigate("/login");
    } else {
      fetchMovies();
      fetchUsers();
    }
  }, []);

  // Filtro de películas
  useEffect(() => {
    if (movieSearch.trim() === "") {
      setFilteredMovies(movies);
    } else {
      const filtered = movies.filter(movie => 
        movie.title.toLowerCase().includes(movieSearch.toLowerCase()) ||
        movie.type.toLowerCase().includes(movieSearch.toLowerCase())
      );
      setFilteredMovies(filtered);
    }
  }, [movieSearch, movies]);

  // Filtro de usuarios
  useEffect(() => {
    if (userSearch.trim() === "") {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user => 
        user.name.toLowerCase().includes(userSearch.toLowerCase()) ||
        user.email.toLowerCase().includes(userSearch.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [userSearch, users]);

  // =======================
  // FUNCIONES PARA CONTENIDO
  // =======================

  const fetchMovies = async () => {
    try {
      const res = await api.get("/api/movies");
      setMovies(res.data);
      setFilteredMovies(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handlePoster = (e) => {
    const file = e.target.files[0];
    setPoster(file);

    if (file) {
      setPreview(URL.createObjectURL(file));
    }
  };

  // =======================
  // TEMPORADAS
  // =======================

  const addSeason = () => {
    const newSeasonNumber = seasons.length + 1;
    setSeasons([
      ...seasons,
      {
        season: newSeasonNumber,
        episodes: []
      }
    ]);
    
    setExpandedSeasons({
      ...expandedSeasons,
      [newSeasonNumber]: true
    });
  };

  const toggleSeason = (seasonNum) => {
    setExpandedSeasons({
      ...expandedSeasons,
      [seasonNum]: !expandedSeasons[seasonNum]
    });
  };

  const removeSeason = (seasonIndex) => {
    if (!window.confirm("¿Eliminar esta temporada y todos sus episodios?")) return;
    
    const newSeasons = seasons.filter((_, index) => index !== seasonIndex);
    const reorderedSeasons = newSeasons.map((season, index) => ({
      ...season,
      season: index + 1
    }));
    setSeasons(reorderedSeasons);
  };

  const addEpisode = (seasonIndex) => {
    const newSeasons = [...seasons];
    const episodeNumber = newSeasons[seasonIndex].episodes.length + 1;
    
    newSeasons[seasonIndex].episodes.push({
      title: "",
      video: null,
      existingVideo: null,
      episode_number: episodeNumber
    });
    setSeasons(newSeasons);
  };

  const removeEpisode = (seasonIndex, episodeIndex) => {
    if (!window.confirm("¿Eliminar este episodio?")) return;
    
    const newSeasons = [...seasons];
    newSeasons[seasonIndex].episodes = newSeasons[seasonIndex].episodes.filter(
      (_, index) => index !== episodeIndex
    );
    newSeasons[seasonIndex].episodes = newSeasons[seasonIndex].episodes.map((ep, index) => ({
      ...ep,
      episode_number: index + 1
    }));
    setSeasons(newSeasons);
  };

  const handleEpisodeChange = (seasonIndex, episodeIndex, field, value) => {
    const newSeasons = [...seasons];
    newSeasons[seasonIndex].episodes[episodeIndex][field] = value;
    setSeasons(newSeasons);
  };

  // =======================
  // CARGAR DATOS PARA EDICIÓN DE CONTENIDO
  // =======================

  const editMovie = async (id) => {
    try {
      const res = await api.get(`/api/admin/movie/${id}/edit`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const movieData = res.data;

      setEditingId(id);
      setForm({
        title: movieData.title,
        description: movieData.description,
        type: movieData.type
      });

      if (movieData.poster) {
        setPreview(`${API_BASE_URL}/storage/posters/${movieData.poster}`);
      }

      if (movieData.type === "pelicula" && movieData.videoFile) {
        setExistingVideo({
          name: movieData.videoFile,
          url: `${API_BASE_URL}/api/movies/stream/${movieData.videoFile}`
        });
      }

      if (movieData.type === "serie" && movieData.episodes) {
        const seasonsMap = {};
        movieData.episodes.forEach(episode => {
          if (!seasonsMap[episode.season]) {
            seasonsMap[episode.season] = {
              season: episode.season,
              episodes: []
            };
          }
          seasonsMap[episode.season].episodes.push({
            title: episode.title,
            episode_number: episode.episode_number,
            video: null,
            existingVideo: {
              name: episode.videoFile,
              url: `${API_BASE_URL}/api/movies/stream/${episode.videoFile}`
            }
          });
        });

        const seasonsArray = Object.values(seasonsMap).sort((a, b) => a.season - b.season);
        setSeasons(seasonsArray);

        const expanded = {};
        seasonsArray.forEach(s => expanded[s.season] = true);
        setExpandedSeasons(expanded);
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error(err);
      setMessage({ text: "Error al cargar el contenido", type: "error" });
    }
  };

  // =======================
  // SUBIR / ACTUALIZAR CONTENIDO
  // =======================

  const validateForm = () => {
    if (!form.title.trim()) {
      setMessage({ text: "El título es obligatorio", type: "error" });
      return false;
    }
    if (!form.description.trim()) {
      setMessage({ text: "La descripción es obligatoria", type: "error" });
      return false;
    }
    if (!poster && !editingId) {
      setMessage({ text: "Debes subir un poster", type: "error" });
      return false;
    }

    if (form.type === "pelicula") {
      if (!video && !existingVideo && !editingId) {
        setMessage({ text: "Debes subir un video para la película", type: "error" });
        return false;
      }
    }

    if (form.type === "serie") {
      if (seasons.length === 0) {
        setMessage({ text: "Debes agregar al menos una temporada", type: "error" });
        return false;
      }

      for (let season of seasons) {
        if (season.episodes.length === 0) {
          setMessage({ text: `La temporada ${season.season} debe tener al menos un episodio`, type: "error" });
          return false;
        }

        for (let episode of season.episodes) {
          if (!episode.title?.trim()) {
            setMessage({ text: "Todos los episodios deben tener título", type: "error" });
            return false;
          }
          if (!episode.video && !episode.existingVideo && !editingId) {
            setMessage({ text: "Todos los episodios deben tener video", type: "error" });
            return false;
          }
        }
      }
    }

    return true;
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setMessage({ text: "", type: "" });

    const formData = new FormData();

    formData.append("title", form.title.trim());
    formData.append("description", form.description.trim());
    formData.append("type", form.type);

    if (poster) {
      formData.append("poster", poster);
    }

    if (form.type === "pelicula") {
      if (video) {
        formData.append("video", video);
      }
    }

    if (form.type === "serie") {
      const episodeTitles = [];
      const episodeSeasons = [];
      const episodeNumbers = [];
      const existingEpisodes = [];
      
      seasons.forEach((season) => {
        season.episodes.forEach((ep, index) => {
          if (ep.video) {
            episodeTitles.push(ep.title);
            episodeSeasons.push(season.season);
            episodeNumbers.push(index + 1);
            formData.append("episodeVideos", ep.video);
          } else if (ep.existingVideo) {
            existingEpisodes.push({
              title: ep.title,
              season: season.season,
              episode_number: index + 1,
              videoFile: ep.existingVideo.name
            });
          }
        });
      });
      
      formData.append("episodeTitles", JSON.stringify(episodeTitles));
      formData.append("episodeSeasons", JSON.stringify(episodeSeasons));
      formData.append("episodeNumbers", JSON.stringify(episodeNumbers));
      formData.append("existingEpisodes", JSON.stringify(existingEpisodes));
    }

    try {
      let response;
      
      if (editingId) {
        response = await api.put(
          `/api/admin/movie/${editingId}`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          }
        );
        setMessage({ text: "Contenido actualizado correctamente", type: "success" });
      } else {
        response = await api.post(
          "/api/admin/upload",
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          }
        );
        setMessage({ text: "Contenido publicado correctamente", type: "success" });
      }

      console.log("Respuesta del servidor:", response.data);
      resetForm();
      fetchMovies();

      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    } catch (err) {
      console.error("Error completo:", err);
      console.error("Respuesta del servidor:", err.response?.data);
      setMessage({ 
        text: err.response?.data?.error || "Error al subir el contenido", 
        type: "error" 
      });
    }

    setLoading(false);
  };

  // =======================
  // FUNCIONES PARA USUARIOS
  // =======================

  const fetchUsers = async () => {
    try {
      const res = await api.get("/api/users", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(res.data);
      setFilteredUsers(res.data);
    } catch (err) {
      console.error("Error al cargar usuarios:", err);
    }
  };

  const handleUserChange = (e) => {
    setUserForm({
      ...userForm,
      [e.target.name]: e.target.value
    });
  };

  const resetUserForm = () => {
    setEditingUser(null);
    setUserForm({
      name: "",
      email: "",
      password: "",
      role: "user"
    });
  };

  const openUserModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setUserForm({
        name: user.name,
        email: user.email,
        password: "",
        role: user.role
      });
    } else {
      resetUserForm();
    }
    setShowUserModal(true);
  };

  const validateUserForm = () => {
    if (!userForm.name.trim()) {
      setMessage({ text: "El nombre es obligatorio", type: "error" });
      return false;
    }
    if (!userForm.email.trim()) {
      setMessage({ text: "El email es obligatorio", type: "error" });
      return false;
    }
    if (!userForm.email.includes("@")) {
      setMessage({ text: "Email inválido", type: "error" });
      return false;
    }
    if (!editingUser && !userForm.password) {
      setMessage({ text: "La contraseña es obligatoria para nuevos usuarios", type: "error" });
      return false;
    }
    if (!userForm.role) {
      setMessage({ text: "El rol es obligatorio", type: "error" });
      return false;
    }
    return true;
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();

    if (!validateUserForm()) return;

    setLoading(true);
    setMessage({ text: "", type: "" });

    try {
      if (editingUser) {
        const response = await api.put(
          `/api/users/${editingUser.id}`,
          userForm,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        
        setMessage({ text: "Usuario actualizado correctamente", type: "success" });
        
        // Si el usuario actualizado es el que está logueado actualmente
        if (editingUser.id.toString() === currentUserId) {
          // Actualizar localStorage
          localStorage.setItem("userName", response.data.user.name);
          localStorage.setItem("userRole", response.data.user.role);
          
          // FORZAR ACTUALIZACIÓN INMEDIATA - Guardar timestamp para forzar re-render
          localStorage.setItem("userUpdated", Date.now().toString());
          
          // Disparar evento personalizado (más confiable que solo storage)
          const event = new CustomEvent('userUpdated', { 
            detail: response.data.user 
          });
          window.dispatchEvent(event);
          
          // También disparar un evento de storage manual
          const storageEvent = new StorageEvent('storage', {
            key: 'userName',
            newValue: response.data.user.name,
            oldValue: localStorage.getItem('userName'),
            storageArea: localStorage,
            url: window.location.href
          });
          window.dispatchEvent(storageEvent);
        }
      } else {
        await api.post(
          "/api/users",
          userForm,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        setMessage({ text: "Usuario creado correctamente", type: "success" });
      }

      setShowUserModal(false);
      resetUserForm();
      fetchUsers();
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    } catch (err) {
      console.error(err);
      setMessage({ 
        text: err.response?.data?.error || "Error al guardar usuario", 
        type: "error" 
      });
    }

    setLoading(false);
  };

  const deleteUser = async (id, name) => {
    if (!window.confirm(`¿Estás seguro de eliminar al usuario "${name}"?`)) return;

    try {
      await api.delete(`/api/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchUsers();
      setMessage({ text: "Usuario eliminado correctamente", type: "success" });
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    } catch (err) {
      console.error(err);
      setMessage({ text: err.response?.data?.error || "Error al eliminar usuario", type: "error" });
    }
  };

  const togglePasswordVisibility = (userId) => {
    setShowPasswords(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  // =======================
  // ELIMINAR CONTENIDO
  // =======================

  const deleteMovie = async (id) => {
    if (!window.confirm("¿Estás seguro de eliminar este contenido?")) return;

    try {
      await api.delete(
        `/api/admin/movie/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      fetchMovies();
      setMessage({ text: "Contenido eliminado correctamente", type: "success" });
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    } catch (err) {
      console.error(err);
      setMessage({ text: "Error al eliminar", type: "error" });
    }
  };

  // =======================
  // RESET FORMULARIO CONTENIDO
  // =======================

  const resetForm = () => {
    setEditingId(null);
    setForm({
      title: "",
      description: "",
      type: "pelicula"
    });
    setPoster(null);
    setPreview(null);
    setVideo(null);
    setExistingVideo(null);
    setSeasons([]);
    setExpandedSeasons({});
  };

  // =======================
  // UI
  // =======================

  return (
    <div className="admin-master">
      <header className="admin-nav-top">
        <div className="logo-section">
          <h1>DEVIOUSWIND<span>STUDIO</span></h1>
        </div>
        <Link to="/" className="back-home-btn">
          <Home size={18} />
          VOLVER AL INICIO
        </Link>
      </header>

      {/* Tabs de navegación */}
      <div className="admin-tabs">
        <button 
          className={`tab-btn ${activeTab === "contenido" ? "active" : ""}`}
          onClick={() => setActiveTab("contenido")}
        >
          <Film size={18} />
          GESTIÓN DE CONTENIDO
        </button>
        <button 
          className={`tab-btn ${activeTab === "usuarios" ? "active" : ""}`}
          onClick={() => setActiveTab("usuarios")}
        >
          <Users size={18} />
          GESTIÓN DE USUARIOS
        </button>
      </div>

      <main className="admin-content">
        {activeTab === "contenido" ? (
          /* =======================
             SECCIÓN DE CONTENIDO
          ======================= */
          <div className="admin-grid">
            {/* FORM SECTION */}
            <section className="admin-card">
              <div className="card-header">
                {editingId ? <Save size={18} className="accent-icon" /> : <Upload size={18} className="accent-icon" />}
                <h3>{editingId ? "EDITAR CONTENIDO" : "PUBLICAR NUEVO"}</h3>
              </div>

              {editingId && (
                <button onClick={resetForm} className="cancel-edit-btn">
                  <X size={16} /> Cancelar edición
                </button>
              )}

              <form onSubmit={handleUpload} className="modern-form" encType="multipart/form-data">
                <div className="input-group">
                  <label>TIPO DE CONTENIDO</label>
                  <select 
                    name="type" 
                    value={form.type} 
                    onChange={handleChange}
                    className="modern-select"
                  >
                    <option value="pelicula">🎬 Película</option>
                    <option value="serie">📺 Serie</option>
                  </select>
                </div>

                <div className="input-group">
                  <label>TÍTULO</label>
                  <input
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    placeholder="Ej: Stranger Things"
                    required
                  />
                </div>

                <div className="input-group">
                  <label>DESCRIPCIÓN</label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Sinopsis del contenido..."
                    rows="4"
                    required
                  />
                </div>

                <div className="file-grid">
                  <div className="file-box">
                    <Image size={24} className="file-icon" />
                    <div>Poster</div>
                    <label className="custom-file-btn">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePoster}
                        hidden
                      />
                      {editingId ? "Cambiar poster" : "Seleccionar"}
                    </label>
                    {preview && <img src={preview} className="mini-prev" alt="preview" />}
                  </div>

                  {form.type === "pelicula" && (
                    <div className="file-box">
                      <Video size={24} className="file-icon" />
                      <div>Video</div>
                      <label className="custom-file-btn">
                        <input
                          type="file"
                          accept="video/mp4"
                          onChange={(e) => {
                            setVideo(e.target.files[0]);
                            setExistingVideo(null);
                          }}
                          hidden
                        />
                        {editingId ? "Cambiar video" : "Seleccionar"}
                      </label>
                      {video && <span className="file-name">{video.name}</span>}
                      {existingVideo && !video && (
                        <span className="file-name existing">
                          ✓ {existingVideo.name}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* SERIES SECTION */}
                {form.type === "serie" && (
                  <div className="series-container">
                    <button type="button" className="add-season-btn" onClick={addSeason}>
                      <Plus size={16} />
                      AGREGAR TEMPORADA
                    </button>

                    {seasons.map((season, sIndex) => (
                      <div key={sIndex} className="season-box">
                        <div className="season-header">
                          <div className="season-title" onClick={() => toggleSeason(season.season)}>
                            {expandedSeasons[season.season] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            <h4>Temporada {season.season}</h4>
                          </div>
                          <button
                            type="button"
                            className="remove-season-btn"
                            onClick={() => removeSeason(sIndex)}
                          >
                            <X size={16} />
                          </button>
                        </div>

                        {expandedSeasons[season.season] && (
                          <>
                            <button
                              type="button"
                              className="add-episode-btn"
                              onClick={() => addEpisode(sIndex)}
                            >
                              <Plus size={14} />
                              Agregar Episodio
                            </button>

                            {season.episodes.map((ep, eIndex) => (
                              <div key={eIndex} className="episode-box">
                                <div className="episode-header">
                                  <span className="episode-number">Episodio {eIndex + 1}</span>
                                  <button
                                    type="button"
                                    className="remove-episode-btn"
                                    onClick={() => removeEpisode(sIndex, eIndex)}
                                  >
                                    <X size={14} />
                                  </button>
                                </div>

                                <div className="input-group">
                                  <input
                                    placeholder="Título del episodio"
                                    value={ep.title}
                                    onChange={(e) => handleEpisodeChange(sIndex, eIndex, "title", e.target.value)}
                                    required
                                  />
                                </div>

                                <div className="file-input">
                                  <label className="custom-file-btn small">
                                    <input
                                      type="file"
                                      accept="video/mp4"
                                      onChange={(e) => {
                                        handleEpisodeChange(sIndex, eIndex, "video", e.target.files[0]);
                                        handleEpisodeChange(sIndex, eIndex, "existingVideo", null);
                                      }}
                                      hidden
                                    />
                                    {ep.video ? 'Cambiar video' : (ep.existingVideo ? 'Cambiar video' : 'Subir video')}
                                  </label>
                                  {ep.video && (
                                    <span className="file-name">{ep.video.name}</span>
                                  )}
                                  {ep.existingVideo && !ep.video && (
                                    <span className="file-name existing">
                                      ✓ {ep.existingVideo.name}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </>
                        )}
                      </div>
                    ))}

                    {seasons.length > 0 && (
                      <div className="series-summary">
                        <Film size={16} />
                        <span>
                          {seasons.length} {seasons.length === 1 ? 'temporada' : 'temporadas'} ·{' '}
                          {seasons.reduce((acc, s) => acc + s.episodes.length, 0)} episodios
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <button className="publish-btn" disabled={loading}>
                  {loading ? "PROCESANDO..." : (editingId ? "ACTUALIZAR" : "PUBLICAR")}
                </button>

                {message.text && (
                  <div className={`status-msg ${message.type}`}>
                    {message.text}
                  </div>
                )}
              </form>
            </section>

            {/* LIST SECTION - CONTENIDO CON BÚSQUEDA */}
            <section className="admin-card">
              <div className="card-header">
                <Film size={18} className="accent-icon" />
                <h3>CONTENIDO ({filteredMovies.length})</h3>
              </div>

              {/* Barra de búsqueda para contenido */}
              <div className="users-toolbar" style={{ marginBottom: '20px' }}>
                <div className="users-search">
                  <Search size={16} className="search-icon" />
                  <input
                    type="text"
                    placeholder="Buscar por título o tipo..."
                    value={movieSearch}
                    onChange={(e) => setMovieSearch(e.target.value)}
                    className="users-search-input"
                  />
                </div>
              </div>

              <div className="movie-list-scroll">
                {filteredMovies.length > 0 ? (
                  filteredMovies.map(m => (
                    <div key={m.id} className="admin-movie-item">
                      <img
                        src={`${API_BASE_URL}/storage/posters/${m.poster}`}
                        alt={m.title}
                      />

                      <div className="m-info">
                        <h4>{m.title}</h4>
                        <span className={`type-badge ${m.type}`}>
                          {m.type === "pelicula" ? "🎬 Película" : "📺 Serie"}
                        </span>
                      </div>

                      <div className="admin-actions">
                        <button onClick={() => editMovie(m.id)} className="edit-btn">
                          <Edit size={18} />
                        </button>
                        <button onClick={() => deleteMovie(m.id)} className="delete-btn">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    <Film size={40} />
                    <p>{movieSearch ? `No se encontró "${movieSearch}"` : "No hay contenido disponible"}</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        ) : (
          /* =======================
             SECCIÓN DE USUARIOS CON CONTRASEÑAS VISIBLES
          ======================= */
          <div className="users-section">
            <section className="admin-card users-card">
              <div className="card-header">
                <Users size={18} className="accent-icon" />
                <h3>GESTIÓN DE USUARIOS ({filteredUsers.length})</h3>
              </div>

              {/* Barra de búsqueda y botón añadir */}
              <div className="users-toolbar">
                <div className="users-search">
                  <Search size={16} className="search-icon" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre o email..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="users-search-input"
                  />
                </div>
                <button onClick={() => openUserModal()} className="add-user-btn">
                  <Plus size={16} />
                  NUEVO USUARIO
                </button>
              </div>

              {/* Lista de usuarios con contraseñas */}
              <div className="users-list">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map(user => (
                    <div key={user.id} className="user-item">
                      <div className="user-avatar">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="user-info">
                        <h4>{user.name}</h4>
                        <p className="user-email">{user.email}</p>
                        <div className="user-password-row">
                          <span className="user-password-label">Contraseña:</span>
                          <span className="user-password-value">
                            {showPasswords[user.id] ? user.password || '••••••••' : '••••••••'}
                          </span>
                          <button 
                            className="toggle-password-btn"
                            onClick={() => togglePasswordVisibility(user.id)}
                            title={showPasswords[user.id] ? "Ocultar contraseña" : "Mostrar contraseña"}
                          >
                            {showPasswords[user.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                        <span className={`user-role-badge ${user.role}`}>
                          {user.role === 'admin' ? '👑 ADMIN' : '👤 USER'}
                        </span>
                      </div>
                      <div className="user-actions">
                        <button onClick={() => openUserModal(user)} className="edit-user-btn">
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => deleteUser(user.id, user.name)} 
                          className="delete-user-btn"
                          disabled={user.id.toString() === currentUserId}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    <Users size={40} />
                    <p>{userSearch ? `No se encontró "${userSearch}"` : "No hay usuarios disponibles"}</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
      </main>

      {/* Modal de Usuario */}
      {showUserModal && (
        <div className="modal-overlay" onClick={() => setShowUserModal(false)}>
          <div 
            className="glass-card user-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>{editingUser ? "EDITAR USUARIO" : "NUEVO USUARIO"}</h2>
            
            <form onSubmit={handleUserSubmit} className="user-form">
              <div className="input-group">
                <label>
                  <UserCog size={16} />
                  NOMBRE
                </label>
                <input
                  type="text"
                  name="name"
                  value={userForm.name}
                  onChange={handleUserChange}
                  placeholder="Nombre completo"
                  required
                />
              </div>

              <div className="input-group">
                <label>
                  <Mail size={16} />
                  EMAIL
                </label>
                <input
                  type="email"
                  name="email"
                  value={userForm.email}
                  onChange={handleUserChange}
                  placeholder="usuario@email.com"
                  required
                />
              </div>

              <div className="input-group">
                <label>
                  <Key size={16} />
                  CONTRASEÑA {editingUser && "(dejar vacío para no cambiar)"}
                </label>
                <input
                  type="password"
                  name="password"
                  value={userForm.password}
                  onChange={handleUserChange}
                  placeholder={editingUser ? "Nueva contraseña" : "Contraseña"}
                  required={!editingUser}
                />
              </div>

              <div className="input-group">
                <label>ROL</label>
                <select
                  name="role"
                  value={userForm.role}
                  onChange={handleUserChange}
                  className="modern-select"
                >
                  <option value="user">👤 Usuario</option>
                  <option value="admin">👑 Administrador</option>
                </select>
              </div>

              <div className="modal-actions">
                <button type="submit" className="main-submit" disabled={loading}>
                  {loading ? "PROCESANDO..." : (editingUser ? "ACTUALIZAR" : "CREAR")}
                </button>
                <button type="button" onClick={() => setShowUserModal(false)} className="cancel-x">
                  CANCELAR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}