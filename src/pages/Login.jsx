import { useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/api";

export default function Login() {
  const [data, setData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      const res = await api.post("/api/auth/login", data);
      
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("userName", res.data.user.name);
      localStorage.setItem("userRole", res.data.user.role);
      localStorage.setItem("userId", res.data.user.id);
      
      // Disparar evento para actualizar la UI
      window.dispatchEvent(new CustomEvent('userUpdated', { 
        detail: res.data.user 
      }));
      
      navigate("/");
    } catch (error) {
      console.error("Error de login:", error);
      const errorMessage = error.response?.data?.message || "Error al iniciar sesión";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <motion.div 
        className="auth-card" 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="auth-title">ACCESO</h1>
        
        {error && (
          <div className="error-message" style={{ 
            color: '#ff4444', 
            marginBottom: '20px', 
            padding: '10px', 
            background: 'rgba(255, 68, 68, 0.1)', 
            borderRadius: '8px' 
          }}>
            {error}
          </div>
        )}
        
        <form onSubmit={handleLogin}>
          <div className="field-group">
            <input 
              type="email" 
              placeholder="EMAIL" 
              value={data.email}
              required
              onChange={e => setData({...data, email: e.target.value})} 
              className="input-field"
              disabled={loading}
            />
          </div>
          <div className="field-group">
            <input 
              type="password" 
              placeholder="CONTRASEÑA" 
              value={data.password}
              required
              onChange={e => setData({...data, password: e.target.value})} 
              className="input-field"
              disabled={loading}
            />
          </div>
          <button 
            type="submit" 
            className="auth-btn" 
            disabled={loading}
          >
            {loading ? "PROCESANDO..." : "INICIAR SESIÓN"}
          </button>
        </form>

        <div className="auth-link">
          ¿NO TIENES CUENTA? <Link to="/register">REGISTRARSE</Link>
        </div>
      </motion.div>
    </div>
  );
}