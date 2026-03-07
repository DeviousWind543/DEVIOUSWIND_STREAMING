import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/api"; // <-- YA lo tienes importado

export default function Home() {
  const [movies, setMovies] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [recent, setRecent] = useState([]);
  const [search, setSearch] = useState("");
  const [user, setUser] = useState(null);
  const [isEntering, setIsEntering] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [updateTrigger, setUpdateTrigger] = useState(0);
  
  const navigate = useNavigate();
  const isAuthenticated = !!localStorage.getItem("token");

  // Obtener URL base para imágenes
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

  // Función para obtener el usuario de localStorage
  const getUserFromStorage = () => {
    const name = localStorage.getItem("userName");
    const role = localStorage.getItem("userRole");
    if (name) {
      console.log("Usuario obtenido de localStorage:", { name, role });
      return { name, role };
    }
    return null;
  };

  // Efecto principal que se ejecuta al montar y cuando cambia updateTrigger
  useEffect(() => {
    console.log("🔄 Efecto principal ejecutado, updateTrigger:", updateTrigger);
    
    // Cargar todas las películas - USANDO api
    api.get("/api/movies")
      .then(res => {
        setMovies(res.data);
        setFiltered(res.data);
      })
      .catch(err => console.error("Error al cargar películas:", err));

    // Cargar historial real (si está autenticado) - USANDO api (el token se añade automáticamente)
    if (isAuthenticated) {
      api.get("/api/movies/recent")
        .then(res => {
          console.log("Historial real:", res.data);
          setRecent(res.data);
        })
        .catch(err => console.log("Error cargando historial:", err));
    }

    // Actualizar usuario desde localStorage
    const storedUser = getUserFromStorage();
    setUser(storedUser);

    const timer = setTimeout(() => setIsEntering(false), 2500);
    return () => clearTimeout(timer);
  }, [isAuthenticated, updateTrigger]);

  // Efecto para escuchar eventos personalizados y de storage
  useEffect(() => {
    console.log("🔄 Configurando listeners de eventos");

    // Manejador para evento personalizado
    const handleCustomEvent = (event) => {
      console.log("🎯 Evento personalizado recibido:", event.detail);
      const storedUser = getUserFromStorage();
      setUser(storedUser);
      setUpdateTrigger(prev => prev + 1);
    };

    // Manejador para evento storage
    const handleStorageChange = (e) => {
      console.log("📦 Evento storage detectado:", e.key, e.newValue);
      if (e.key === 'userName' || e.key === 'userRole' || e.key === 'userUpdated') {
        const storedUser = getUserFromStorage();
        setUser(storedUser);
        setUpdateTrigger(prev => prev + 1);
      }
    };

    // Agregar listeners
    window.addEventListener('userUpdated', handleCustomEvent);
    window.addEventListener('storage', handleStorageChange);

    // Cleanup
    return () => {
      console.log("🧹 Limpiando listeners");
      window.removeEventListener('userUpdated', handleCustomEvent);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []); // <-- Eliminada la dependencia de user y el intervalo

  useEffect(() => {
    setFiltered(movies.filter(m => m.title.toLowerCase().includes(search.toLowerCase())));
  }, [search, movies]);

  const handleAccess = (id) => {
    if (!isAuthenticated) {
      setShowModal(true);
    } else {
      navigate(`/player/${id}`);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.reload();
  };

  const scrollCarousel = (direction) => {
    const container = document.querySelector('.recent-carousel');
    if (container) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const formatRelativeDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  return (
    <AnimatePresence mode="wait">
      {isEntering ? (
        <motion.div key="loader" className="main-intro" exit={{ opacity: 0 }}>
          <motion.h1 
            initial={{ opacity: 0, letterSpacing: "0px" }} 
            animate={{ opacity: 1, letterSpacing: "25px" }} 
            transition={{ duration: 1.5 }}
          >
            DEVIOUSWIND
          </motion.h1>
          <motion.div 
            className="scan-line" 
            initial={{ width: 0 }} 
            animate={{ width: "200px" }} 
            transition={{ delay: 0.5 }} 
          />
        </motion.div>
      ) : (
        <motion.div key="content" className="devious-v3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <nav className="main-nav">
            <h1 className="logo" onClick={() => navigate("/")}>DEVIOUSWIND</h1>
            <div className="search-container">
              <input 
                className="search-input" 
                type="text" 
                placeholder="BUSCAR ARCHIVO..." 
                onChange={(e) => setSearch(e.target.value)} 
                value={search}
              />
            </div>
            
            <div className="nav-right">
              {user ? (
                <div className="user-profile">
                  <span style={{ marginRight: '15px' }}>{user.name?.toUpperCase()}</span>
                  {user.role === 'admin' && (
                    <button onClick={() => navigate("/admin")} className="admin-btn">ADMIN</button>
                  )}
                  <button onClick={handleLogout} className="exit-btn">EXIT</button>
                </div>
              ) : (
                <div className="guest-nav">
                  <Link to="/login" className="login-link">SIGN IN</Link>
                  <Link to="/register" className="premium-access-btn">
                    <span className="btn-text">GET ACCESS</span>
                    <span className="btn-icon">→</span>
                  </Link>
                </div>
              )}
            </div>
          </nav>

          <main className="content-body">
            
            {/* Carrusel de Historial Real */}
            {isAuthenticated && recent.length > 0 && (
              <section className="recent-section">
                <div className="recent-header">
                  <div className="recent-title-container">
                    <span className="recent-glow"></span>
                    <h2 className="recent-title">CONTINUAR VIENDO</h2>
                    <span className="recent-count">{recent.length} títulos</span>
                  </div>
                  <div className="recent-nav">
                    <button 
                      className="recent-nav-btn prev-btn" 
                      onClick={() => scrollCarousel('left')}
                      aria-label="Anterior"
                    >
                      ←
                    </button>
                    <button 
                      className="recent-nav-btn next-btn" 
                      onClick={() => scrollCarousel('right')}
                      aria-label="Siguiente"
                    >
                      →
                    </button>
                  </div>
                </div>
                
                <div className="recent-carousel-container">
                  <div className="recent-carousel">
                    {recent.map((movie, index) => (
                      <motion.div 
                        key={`recent-${movie.id}`} 
                        className="recent-item"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ y: -8 }}
                        onClick={() => navigate(`/player/${movie.id}`)}
                      >
                        <div className="recent-poster">
                          <img 
                            src={`${API_BASE_URL}/storage/posters/${movie.poster}`} 
                            alt={movie.title} 
                            loading="lazy"
                          />
                          <div className="recent-poster-overlay">
                            <div className="recent-play-icon">▶</div>
                          </div>
                          <div className="recent-poster-number">#{index + 1}</div>
                        </div>
                        <div className="recent-info">
                          <h4 className="recent-item-title">{movie.title}</h4>
                          <div className="recent-meta">
                            <span className="recent-type">{movie.type === 'pelicula' ? 'Película' : 'Serie'}</span>
                            <span className="recent-dot">•</span>
                            <span className="recent-quality">HD</span>
                          </div>
                          {movie.last_watched && (
                            <span className="recent-date">
                              {formatRelativeDate(movie.last_watched)}
                            </span>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  <div className="recent-gradient right"></div>
                  <div className="recent-gradient left"></div>
                </div>
              </section>
            )}

            {/* Título de biblioteca */}
            <h2 className="section-title" style={{ marginTop: recent.length > 0 ? '20px' : '40px' }}>
              EXPLORAR CATÁLOGO
            </h2>
            
            {/* Grid de películas */}
            <div className="compact-grid">
              {filtered.length > 0 ? (
                filtered.map((movie) => (
                  <motion.div 
                    key={movie.id} 
                    className="mini-poster-card" 
                    whileHover={{ y: -10 }} 
                    onClick={() => handleAccess(movie.id)}
                  >
                    <div className="img-holder">
                      <img 
                        src={`${API_BASE_URL}/storage/posters/${movie.poster}`} 
                        alt={movie.title}
                        loading="lazy"
                      />
                      {movie.duration && (
                        <span className="duration-tag">{movie.duration} min</span>
                      )}
                    </div>
                    <h3>{movie.title}</h3>
                  </motion.div>
                ))
              ) : (
                <div className="empty-search">
                  <p>No se encontraron resultados para "{search}"</p>
                </div>
              )}
            </div>
          </main>
        </motion.div>
      )}

      {/* Modal de acceso restringido */}
        {showModal && (
          <motion.div 
            className="modal-overlay" 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={() => setShowModal(false)}
          >
            <motion.div 
              className="glass-card modal-content"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 style={{ fontFamily: 'Cinzel', color: 'var(--neon)', marginBottom: '20px' }}>
                ACCESO RESTRINGIDO
              </h2>
              <p style={{ color: 'var(--gray-light)', marginBottom: '30px' }}>
                Inicia sesión para desbloquear todo el contenido.
              </p>
              <div className="modal-actions">
                <button onClick={() => navigate('/login')} className="main-submit">
                  INICIAR SESIÓN
                </button>
                <button onClick={() => setShowModal(false)} className="cancel-x">
                  CANCELAR
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
    </AnimatePresence>
  );
}