import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/api"; // Importamos el cliente api

export default function Register() {
  const [data, setData] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      // Usamos api en lugar de axios.post
      await api.post("/api/auth/register", data);
      setSuccess(true);
    } catch (error) {
      console.error("Error:", error);
      setError(error.response?.data?.message || "Error al registrar");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-wrapper">
        <motion.div 
          className="auth-card" 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <h1 className="auth-title">¡REVISÁ TU EMAIL!</h1>
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ 
              fontSize: '4rem', 
              color: 'var(--neon)',
              marginBottom: '20px'
            }}>
              ✉️
            </div>
            <p style={{ color: 'white', marginBottom: '20px' }}>
              Te enviamos un email de verificación a:<br/>
              <strong style={{ color: 'var(--neon)' }}>{data.email}</strong>
            </p>
            <p style={{ color: '#aaa', fontSize: '0.9rem' }}>
              Hacé clic en el enlace que te enviamos para activar tu cuenta.
            </p>
            <button 
              onClick={() => navigate("/login")} 
              className="auth-btn"
              style={{ marginTop: '20px' }}
            >
              IR A INICIAR SESIÓN
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="auth-wrapper">
      <motion.div 
        className="auth-card" 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="auth-title">REGISTRO</h1>
        
        {error && (
          <div style={{ 
            color: '#ff4444', 
            marginBottom: '20px', 
            padding: '10px', 
            background: 'rgba(255, 68, 68, 0.1)', 
            borderRadius: '8px'
          }}>
            {error}
          </div>
        )}
        
        <form onSubmit={handleRegister}>
          <div className="field-group">
            <input 
              placeholder="NOMBRE" 
              value={data.name}
              required
              onChange={e => setData({...data, name: e.target.value})} 
              className="input-field"
            />
          </div>
          <div className="field-group">
            <input 
              type="email" 
              placeholder="EMAIL" 
              value={data.email}
              required
              onChange={e => setData({...data, email: e.target.value})} 
              className="input-field"
            />
          </div>
          <div className="field-group">
            <input 
              type="password" 
              placeholder="CONTRASEÑA" 
              value={data.password}
              required
              minLength={6}
              onChange={e => setData({...data, password: e.target.value})} 
              className="input-field"
            />
          </div>
          <button 
            type="submit" 
            className="auth-btn" 
            disabled={loading}
          >
            {loading ? "PROCESANDO..." : "REGISTRARSE"}
          </button>
        </form>

        <div className="auth-link">
          ¿YA TENÉS CUENTA? <Link to="/login">INICIAR SESIÓN</Link>
        </div>
      </motion.div>
    </div>
  );
}