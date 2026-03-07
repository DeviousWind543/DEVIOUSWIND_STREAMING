import React from 'react';
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

/**
 * MovieCard Component
 * Refactorizado para usar variables de entorno (Vite)
 * Soporta cambios dinámicos de URL de Backend (Local/Cloudflare)
 */
export default function MovieCard({ movie }) {
  const navigate = useNavigate();

  // Obtenemos la URL del backend desde el entorno. 
  // Fallback al puerto 4000 si la variable no existe.
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

  // Formateo de duración: segundos a formato MM:SS
  const formatDuration = (s) => {
    if (!s) return "0:00";
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec < 10 ? '0' : ''}${sec}`;
  };

  // Construcción limpia de la URL de la imagen
  const posterUrl = `${API_BASE_URL}/storage/posters/${movie.poster}`;

  return (
    <motion.div 
      className="poster-card"
      onClick={() => navigate(`/player/${movie.id}`)}
      // Animación suave de escala al pasar el mouse
      whileHover={{ 
        scale: 1.05,
        transition: { duration: 0.2 } 
      }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="poster-image-container">
        <img 
          src={posterUrl} 
          alt={movie.title} 
          onError={(e) => {
            // Fallback en caso de que la imagen no cargue
            e.target.src = 'https://via.placeholder.com/500x750?text=Sin+Poster';
          }}
        />
        
        {/* Badge de duración superpuesto */}
        {movie.duration && (
          <span className="duration-tag">{formatDuration(movie.duration)}</span>
        )}
      </div>

      <div className="poster-info">
        <h3>{movie.title?.toUpperCase() || 'SIN TÍTULO'}</h3>
      </div>
    </motion.div>
  );
}