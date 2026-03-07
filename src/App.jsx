import { HashRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Player from "./pages/Player";
import "./index.css";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Admin from "./pages/Admin";

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/player/:id" element={<Player />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </HashRouter>
  );
}

export default App;