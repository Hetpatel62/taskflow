import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar">
      <Link to="/dashboard" className="navbar-logo">⚡ TaskFlow</Link>
      <div className="navbar-user">
        <span className="navbar-name">{user?.name}</span>
        <img
          className="navbar-avatar"
          src={user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.name}`}
          alt={user?.name}
        />
        <button className="btn btn-secondary" onClick={logout} style={{ padding: "8px 16px", fontSize: "13px" }}>
          Logout
        </button>
      </div>
    </nav>
  );
}
