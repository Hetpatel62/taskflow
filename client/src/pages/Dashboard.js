import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

const COLORS = ["#6366f1","#8b5cf6","#ec4899","#ef4444","#f59e0b","#10b981","#06b6d4","#3b82f6"];

function BoardModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ title: "", description: "", color: "#6366f1" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await axios.post("/api/boards", form);
      toast.success("Board created!");
      onCreated(data);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create board");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2>Create New Board</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Board Title</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Website Redesign" required />
          </div>
          <div className="form-group">
            <label>Description (optional)</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="What's this board for?" rows={3}
              style={{ resize: "vertical" }} />
          </div>
          <div className="form-group">
            <label>Color</label>
            <div className="color-picker">
              {COLORS.map((c) => (
                <div key={c} className={`color-dot ${form.color === c ? "selected" : ""}`}
                  style={{ background: c }} onClick={() => setForm({ ...form, color: c })} />
              ))}
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Creating..." : "Create Board"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchBoards();
  }, []);

  const fetchBoards = async () => {
    try {
      const { data } = await axios.get("/api/boards");
      setBoards(data);
    } catch {
      toast.error("Failed to load boards");
    } finally {
      setLoading(false);
    }
  };

  const deleteBoard = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm("Delete this board and all its tasks?")) return;
    try {
      await axios.delete(`/api/boards/${id}`);
      setBoards(boards.filter((b) => b._id !== id));
      toast.success("Board deleted");
    } catch {
      toast.error("Failed to delete board");
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>My Boards</h1>
          <p>Welcome back, {user?.name} 👋</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + New Board
        </button>
      </div>

      {boards.length === 0 ? (
        <div className="empty-state">
          <div className="empty-emoji">📋</div>
          <h2>No boards yet</h2>
          <p>Create your first board to start organizing your tasks</p>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            Create your first board
          </button>
        </div>
      ) : (
        <div className="boards-grid">
          {boards.map((board) => (
            <div key={board._id} className="board-card"
              style={{ "--card-color": board.color }}
              onClick={() => navigate(`/board/${board._id}`)}>
              <h3>{board.title}</h3>
              {board.description && <p>{board.description}</p>}
              <div className="board-card-meta">
                <span className="board-task-count">
                  {new Date(board.createdAt).toLocaleDateString()}
                </span>
                <div className="board-actions">
                  <div className="icon-btn" onClick={(e) => deleteBoard(e, board._id)} title="Delete">
                    🗑️
                  </div>
                </div>
              </div>
            </div>
          ))}
          <div className="new-board-card" onClick={() => setShowModal(true)}>
            <span style={{ fontSize: 20 }}>+</span> New Board
          </div>
        </div>
      )}

      {showModal && (
        <BoardModal
          onClose={() => setShowModal(false)}
          onCreated={(board) => setBoards([board, ...boards])}
        />
      )}
    </div>
  );
}
