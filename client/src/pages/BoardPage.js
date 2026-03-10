import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import axios from "axios";
import toast from "react-hot-toast";
import { format, isPast } from "date-fns";

// ── Task Modal ──────────────────────────────────────────────
function TaskModal({ task, boardId, columns, onClose, onSaved, onDeleted }) {
  const isEdit = !!task;
  const [form, setForm] = useState(
    task
      ? { ...task, dueDate: task.dueDate ? task.dueDate.slice(0, 10) : "", tags: task.tags.join(", ") }
      : { title: "", description: "", status: columns[0]?._id || "todo", priority: "medium", dueDate: "", tags: "" }
  );
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const payload = {
      ...form,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      boardId,
    };
    try {
      if (isEdit) {
        const { data } = await axios.put(`/api/tasks/${task._id}`, payload);
        toast.success("Task updated");
        onSaved(data);
      } else {
        const { data } = await axios.post("/api/tasks", payload);
        toast.success("Task created");
        onSaved(data);
      }
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save task");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this task?")) return;
    try {
      await axios.delete(`/api/tasks/${task._id}`);
      toast.success("Task deleted");
      onDeleted(task._id);
      onClose();
    } catch {
      toast.error("Failed to delete task");
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2>{isEdit ? "Edit Task" : "New Task"}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Title</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="What needs to be done?" required />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Add more details..." rows={3} style={{ resize: "vertical" }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="form-group">
              <label>Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {columns.map((col) => (
                  <option key={col._id} value={col._id}>{col.title}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Priority</label>
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Due Date</label>
            <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Tags (comma separated)</label>
            <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })}
              placeholder="design, frontend, bug" />
          </div>
          <div className="modal-actions">
            {isEdit && (
              <button type="button" className="btn btn-danger" onClick={handleDelete} style={{ marginRight: "auto" }}>
                Delete
              </button>
            )}
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Saving..." : isEdit ? "Save Changes" : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Task Card ──────────────────────────────────────────────
function TaskCard({ task, index, columns, onEdit }) {
  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== "done";

  return (
    <Draggable draggableId={task._id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`task-card ${snapshot.isDragging ? "dragging" : ""}`}
          onClick={() => onEdit(task)}
        >
          <div className="task-card-title">{task.title}</div>
          {task.description && <div className="task-card-desc">{task.description.slice(0, 80)}{task.description.length > 80 ? "..." : ""}</div>}
          <div className="task-card-footer">
            <div className="task-tags">
              {task.tags?.slice(0, 2).map((tag) => (
                <span key={tag} className="tag">{tag}</span>
              ))}
            </div>
            <span className={`priority-badge priority-${task.priority}`}>{task.priority}</span>
          </div>
          {task.dueDate && (
            <div className={`due-date ${isOverdue ? "overdue" : ""}`} style={{ marginTop: 8 }}>
              {isOverdue ? "⚠️ " : "📅 "}{format(new Date(task.dueDate), "MMM d")}
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
}

// ── Column ──────────────────────────────────────────────────
function Column({ column, tasks, onAddTask, onEditTask }) {
  return (
    <div className="column">
      <div className="column-header">
        <span className="column-title">{column.title}</span>
        <span className="column-count">{tasks.length}</span>
      </div>
      <Droppable droppableId={column._id}>
        {(provided, snapshot) => (
          <div
            className="column-tasks"
            ref={provided.innerRef}
            {...provided.droppableProps}
            style={{ background: snapshot.isDraggingOver ? "rgba(99,102,241,0.05)" : undefined }}
          >
            {tasks.map((task, index) => (
              <TaskCard key={task._id} task={task} index={index} onEdit={onEditTask} />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
      <button className="add-task-btn" onClick={() => onAddTask(column._id)}>
        + Add Task
      </button>
    </div>
  );
}

// ── Board Page ──────────────────────────────────────────────
export default function BoardPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [board, setBoard] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | { type: 'new', status } | { type: 'edit', task }

  useEffect(() => {
    fetchBoard();
  }, [id]);

  const fetchBoard = async () => {
    try {
      const { data } = await axios.get(`/api/boards/${id}`);
      setBoard(data.board);
      setTasks(data.tasks);
    } catch {
      toast.error("Failed to load board");
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  // Group tasks by column
  const tasksByColumn = (columnId) =>
    tasks.filter((t) => t.status === columnId).sort((a, b) => a.order - b.order);

  const handleDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const newTasks = [...tasks];
    const taskIdx = newTasks.findIndex((t) => t._id === draggableId);
    const task = { ...newTasks[taskIdx], status: destination.droppableId };

    // Remove from old position, insert at new
    newTasks.splice(taskIdx, 1);
    const destTasks = newTasks.filter((t) => t.status === destination.droppableId);
    destTasks.splice(destination.index, 0, task);

    // Recalculate orders for affected column
    const otherTasks = newTasks.filter((t) => t.status !== destination.droppableId);
    const reordered = destTasks.map((t, i) => ({ ...t, order: i }));
    setTasks([...otherTasks, ...reordered]);

    // Persist to server
    try {
      await axios.put("/api/tasks/bulk/reorder", {
        tasks: reordered.map((t) => ({ _id: t._id, status: t.status, order: t.order })),
      });
    } catch {
      toast.error("Failed to save order");
      fetchBoard(); // revert
    }
  };

  const handleTaskSaved = (savedTask) => {
    setTasks((prev) => {
      const exists = prev.find((t) => t._id === savedTask._id);
      return exists ? prev.map((t) => (t._id === savedTask._id ? savedTask : t)) : [...prev, savedTask];
    });
  };

  const handleTaskDeleted = (taskId) => {
    setTasks((prev) => prev.filter((t) => t._id !== taskId));
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div className="board-page">
      <div className="board-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button className="btn btn-secondary" onClick={() => navigate("/dashboard")}
              style={{ padding: "6px 12px", fontSize: 13 }}>
              ← Back
            </button>
            <h1>{board.title}</h1>
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: board.color }} />
          </div>
          {board.description && <p className="board-description">{board.description}</p>}
        </div>
        <div style={{ fontSize: 13, color: "var(--text2)" }}>
          {tasks.length} task{tasks.length !== 1 ? "s" : ""}
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="columns-container">
          {board.columns
            .sort((a, b) => a.order - b.order)
            .map((col) => (
              <Column
                key={col._id}
                column={col}
                tasks={tasksByColumn(col._id)}
                onAddTask={(status) => setModal({ type: "new", status })}
                onEditTask={(task) => setModal({ type: "edit", task })}
              />
            ))}
        </div>
      </DragDropContext>

      {modal && (
        <TaskModal
          task={modal.type === "edit" ? modal.task : null}
          boardId={id}
          columns={board.columns}
          onClose={() => setModal(null)}
          onSaved={handleTaskSaved}
          onDeleted={handleTaskDeleted}
        />
      )}
    </div>
  );
}
