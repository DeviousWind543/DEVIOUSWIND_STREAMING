import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Maximize,
  Minimize,
  ChevronLeft,
  ListVideo,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import api from "../api/api"; // Importamos el cliente api

export default function Player() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [movie, setMovie] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [seasons, setSeasons] = useState({});
  const [expandedSeasons, setExpandedSeasons] = useState({});
  const [currentVideo, setCurrentVideo] = useState(null);
  const [currentEpisode, setCurrentEpisode] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [expandedSynopsis, setExpandedSynopsis] = useState(false);
  const [loading, setLoading] = useState(true);

  const [isPlaying, setIsPlaying] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showEpisodes, setShowEpisodes] = useState(false);

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const timerRef = useRef(null);

  // URL base para assets
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

  // DETECTAR FULLSCREEN
  useEffect(() => {
    const handleFS = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFS);
    return () => document.removeEventListener("fullscreenchange", handleFS);
  }, []);

  // CARGAR CONTENIDO
  useEffect(() => {
    loadMovie();
  }, [id]);

  // REGISTRAR VISUALIZACIÓN
  const registerWatch = async () => {
    try {
      const token = localStorage.getItem("token");
      if (token && movie) {
        await api.post(`/api/movies/watch/${id}`, {});
        console.log("✅ Visualización registrada:", movie.title);
      }
    } catch (err) {
      console.error("❌ Error registrando visualización:", err);
    }
  };

  // Registrar visualización cuando se carga la película
  useEffect(() => {
    if (movie && !loading) {
      registerWatch();
    }
  }, [movie, loading]);

  const loadMovie = async () => {
    setLoading(true);
    try {
      console.log("🎬 Cargando movie ID:", id);
      
      // Usamos api en lugar de axios.get
      const res = await api.get(`/api/movies/${id}`);
      console.log("📦 Movie data:", res.data);
      
      setMovie(res.data);

      if (res.data.type === "serie") {
        // Usamos api en lugar de axios.get
        const ep = await api.get(`/api/movies/episodes/${id}`);

        console.log("📺 Episodios recibidos:", ep.data);
        
        setEpisodes(ep.data);

        // Agrupar episodios por temporada
        const groupedSeasons = {};
        
        ep.data.forEach(episode => {
          const seasonNum = episode.season;
          const seasonKey = Number(seasonNum);
          
          if (isNaN(seasonKey)) {
            console.warn("⚠️ Temporada inválida:", episode);
            return;
          }
          
          if (!groupedSeasons[seasonKey]) {
            groupedSeasons[seasonKey] = [];
          }
          
          groupedSeasons[seasonKey].push(episode);
        });

        console.log("📊 Temporadas agrupadas:", groupedSeasons);
        setSeasons(groupedSeasons);

        // Inicializar todas las temporadas como CERRADAS
        const initialExpanded = {};
        Object.keys(groupedSeasons).forEach(season => {
          initialExpanded[season] = false;
        });
        setExpandedSeasons(initialExpanded);

        if (ep.data.length > 0) {
          setCurrentVideo(ep.data[0].videoFile);
          setCurrentEpisode(ep.data[0]);
          setCurrentIndex(0);
        }
      } else {
        setCurrentVideo(res.data.videoFile);
      }
    } catch (err) {
      console.error("❌ Error cargando contenido:", err);
    } finally {
      setLoading(false);
    }
  };

  // CAMBIAR EPISODIO
  const playEpisode = (ep, index) => {
    console.log("▶️ Cambiando a episodio:", ep);
    setCurrentVideo(ep.videoFile);
    setCurrentEpisode(ep);
    setCurrentIndex(index);
    setShowEpisodes(false);

    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.load();
        videoRef.current.play().catch(e => console.log("Error al reproducir:", e));
        setIsPlaying(true);
      }
    }, 200);

    // Registrar visualización del episodio
    registerWatch();
  };

  // AUTOPLAY SIGUIENTE EPISODIO
  const handleEnded = () => {
    if (movie?.type === "serie") {
      const next = currentIndex + 1;
      if (next < episodes.length) {
        console.log("⏭️ Siguiente episodio automático");
        playEpisode(episodes[next], next);
      }
    }
  };

  // TOGGLE TEMPORADA
  const toggleSeason = (seasonNum) => {
    setExpandedSeasons(prev => ({
      ...prev,
      [seasonNum]: !prev[seasonNum]
    }));
  };

  // CONTROLES
  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  };

  const formatTime = (t) => {
    if (!t || isNaN(t)) return "0:00";
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const handleSeek = (e) => {
    if (videoRef.current && duration > 0) {
      const newTime = (e.target.value / 100) * duration;
      videoRef.current.currentTime = newTime;
    }
  };

  if (loading) {
    return <div className="main-intro">Cargando...</div>;
  }

  if (!movie) {
    return <div className="main-intro">Contenido no encontrado</div>;
  }

  return (
    <div
      ref={containerRef}
      className={`player-master ${isFullScreen ? "fs-active" : "cinema-layout"}`}
      onMouseMove={handleMouseMove}
    >
      <div className="video-area">
        <video
          ref={videoRef}
          autoPlay
          className="main-video"
          onClick={togglePlay}
          onEnded={handleEnded}
          onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime || 0)}
          onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
        >
          <source
            src={`${API_BASE_URL}/api/movies/stream/${currentVideo}`}
            type="video/mp4"
          />
        </video>

        <AnimatePresence>
          {showControls && (
            <motion.div
              className="modern-controls"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="nt-header">
                <button className="back-btn" onClick={() => navigate("/")}>
                  <ChevronLeft size={32} />
                </button>
                <div className="nt-title-info">
                  <span className="nt-label">REPRODUCTOR</span>
                  <h3>{movie.title}</h3>
                </div>
              </div>

              <div className="modern-center-controls">
                <button onClick={() => videoRef.current && (videoRef.current.currentTime -= 10)}>
                  <RotateCcw size={48} />
                </button>
                <button onClick={togglePlay}>
                  {isPlaying ? (
                    <Pause size={64} fill="white" />
                  ) : (
                    <Play size={64} fill="white" />
                  )}
                </button>
                <button onClick={() => videoRef.current && (videoRef.current.currentTime += 10)}>
                  <RotateCw size={48} />
                </button>
              </div>

              <div className="modern-bottom-bar">
                <div className="seek-container">
                  <span className="time-display">{formatTime(currentTime)}</span>
                  <input
                    className="modern-slider"
                    type="range"
                    min="0"
                    max="100"
                    value={((currentTime / duration) * 100) || 0}
                    onChange={handleSeek}
                  />
                  <span className="time-display">{formatTime(duration)}</span>
                </div>

                <div className="nt-actions">
                  {movie.type === "serie" && (
                    <button onClick={() => setShowEpisodes(!showEpisodes)}>
                      <ListVideo />
                      EPISODIOS
                    </button>
                  )}
                  <button onClick={toggleFullScreen}>
                    {isFullScreen ? <Minimize /> : <Maximize />}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {!isFullScreen && (
        <aside className="fixed-sidebar">
          <div className="sidebar-content">
            {/* Cabecera con título y badge */}
            <div className="sidebar-header">
              <span className="content-badge">
                {movie.type === "serie" ? "SERIE" : "PELÍCULA"}
              </span>
              <h2 className="sidebar-title">{movie.title}</h2>
            </div>

            {/* SINOPSIS */}
            <div className="synopsis-section">
              <div className="synopsis-header">
                <svg className="synopsis-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                <h3>Sinopsis</h3>
              </div>
              
              <div className={`synopsis-content ${expandedSynopsis ? 'expanded' : ''}`}>
                <p className="synopsis-text">
                  {movie.description || "No hay sinopsis disponible para este contenido."}
                </p>
              </div>
              
              {movie.description && movie.description.length > 150 && (
                <button 
                  className="read-more-btn"
                  onClick={() => setExpandedSynopsis(!expandedSynopsis)}
                  aria-expanded={expandedSynopsis}
                >
                  {expandedSynopsis ? 'Leer menos' : 'Leer más'}
                  <ChevronDown size={16} />
                </button>
              )}
            </div>

            {/* Información del episodio actual (para series) */}
            {movie.type === "serie" && currentEpisode && (
              <div className="current-episode-info">
                <h4>Reproduciendo ahora</h4>
                <p className="current-episode-title">
                  Temporada {currentEpisode.season} • Episodio {currentEpisode.episode_number}
                </p>
                <p className="current-episode-subtitle">{currentEpisode.title}</p>
              </div>
            )}

            {/* Acciones rápidas */}
            <div className="quick-actions">
              {movie.type === "serie" && (
                <button 
                  className="quick-action-btn episodes-btn"
                  onClick={() => setShowEpisodes(true)}
                >
                  <ListVideo size={18} />
                  Ver Episodios
                </button>
              )}
            </div>

            {/* Información adicional */}
            <div className="additional-info">
              <div className="info-chip">
                <span className="chip-label">Calidad</span>
                <span className="chip-value">HD</span>
              </div>
              <div className="info-chip">
                <span className="chip-label">Audio</span>
                <span className="chip-value">Español</span>
              </div>
              <div className="info-chip">
                <span className="chip-label">Año</span>
                <span className="chip-value">2024</span>
              </div>
            </div>
          </div>
        </aside>
      )}

      <AnimatePresence>
        {showEpisodes && (
          <motion.div
            className="episodes-panel"
            initial={{ x: 400 }}
            animate={{ x: 0 }}
            exit={{ x: 400 }}
            transition={{ type: "tween" }}
          >
            <div className="episodes-header">
              <h3>Temporadas y Episodios</h3>
              <button className="close-episodes" onClick={() => setShowEpisodes(false)}>
                ✕
              </button>
            </div>

            {Object.keys(seasons).length === 0 ? (
              <p>No hay episodios disponibles</p>
            ) : (
              Object.keys(seasons)
                .sort((a, b) => Number(a) - Number(b))
                .map(seasonNum => {
                  const seasonEpisodes = seasons[seasonNum];
                  
                  return (
                    <div key={seasonNum} className="season-block">
                      <button 
                        className="season-title-btn" 
                        onClick={() => toggleSeason(seasonNum)}
                      >
                        <span>Temporada {seasonNum}</span>
                        <span className="season-badge">{seasonEpisodes.length} episodios</span>
                        <span className="season-toggle">
                          {expandedSeasons[seasonNum] ? 
                            <ChevronDown size={20} /> : 
                            <ChevronRight size={20} />
                          }
                        </span>
                      </button>

                      <AnimatePresence initial={false}>
                        {expandedSeasons[seasonNum] && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            style={{ overflow: "hidden" }}
                          >
                            {seasonEpisodes
                              .sort((a, b) => a.episode_number - b.episode_number)
                              .map((ep) => {
                                const globalIndex = episodes.findIndex(e => e.id === ep.id);
                                const isCurrentEpisode = currentIndex === globalIndex;
                                
                                return (
                                  <div
                                    key={ep.id}
                                    className={`episode-item ${isCurrentEpisode ? "active" : ""}`}
                                    onClick={() => playEpisode(ep, globalIndex)}
                                  >
                                    <div className="episode-info">
                                      <b>Episodio {ep.episode_number}</b>
                                      <p>{ep.title}</p>
                                    </div>
                                    {ep.duration && (
                                      <span className="episode-duration">{ep.duration} min</span>
                                    )}
                                    {isCurrentEpisode && (
                                      <span className="now-playing">REPRODUCIENDO</span>
                                    )}
                                  </div>
                                );
                              })}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}