const express = require("express");
const router = express.Router();
const Task = require("../models/Task");
const Board = require("../models/Board");
const { protect } = require("../middleware/auth");

router.use(protect);

// Helper: verify user has access to the board
async function getBoardAccess(boardId, userId) {
  const board = await Board.findById(boardId);
  if (!board) return null;
  const hasAccess =
    board.owner.toString() === userId.toString() ||
    board.members.some((m) => m.toString() === userId.toString());
  return hasAccess ? board : null;
}

// @POST /api/tasks — create task
router.post("/", async (req, res) => {
  try {
    const { title, description, status, priority, dueDate, boardId, tags } = req.body;

    if (!title || !boardId)
      return res.status(400).json({ message: "Title and boardId are required" });

    const board = await getBoardAccess(boardId, req.user._id);
    if (!board) return res.status(403).json({ message: "Access denied" });

    // Get the max order for that column
    const maxOrderTask = await Task.findOne({ board: boardId, status: status || "todo" })
      .sort({ order: -1 });
    const order = maxOrderTask ? maxOrderTask.order + 1 : 0;

    const task = await Task.create({
      title,
      description,
      status: status || "todo",
      priority: priority || "medium",
      dueDate,
      order,
      board: boardId,
      createdBy: req.user._id,
      tags: tags || [],
    });

    await task.populate("createdBy", "name email avatar");
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @PUT /api/tasks/:id — update task (including drag-and-drop status change)
router.put("/:id", async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const board = await getBoardAccess(task.board, req.user._id);
    if (!board) return res.status(403).json({ message: "Access denied" });

    const { title, description, status, priority, dueDate, order, assignedTo, tags } = req.body;

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (status !== undefined) task.status = status;
    if (priority !== undefined) task.priority = priority;
    if (dueDate !== undefined) task.dueDate = dueDate;
    if (order !== undefined) task.order = order;
    if (assignedTo !== undefined) task.assignedTo = assignedTo || null;
    if (tags !== undefined) task.tags = tags;

    await task.save();
    await task.populate("assignedTo", "name email avatar");
    await task.populate("createdBy", "name email avatar");

    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @PUT /api/tasks/reorder — bulk update task orders after drag-and-drop
router.put("/bulk/reorder", async (req, res) => {
  try {
    const { tasks } = req.body; // [{ _id, status, order }]
    if (!Array.isArray(tasks))
      return res.status(400).json({ message: "tasks array required" });

    const bulkOps = tasks.map((t) => ({
      updateOne: {
        filter: { _id: t._id },
        update: { status: t.status, order: t.order },
      },
    }));

    await Task.bulkWrite(bulkOps);
    res.json({ message: "Reordered successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @DELETE /api/tasks/:id — delete task
router.delete("/:id", async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const board = await getBoardAccess(task.board, req.user._id);
    if (!board) return res.status(403).json({ message: "Access denied" });

    await task.deleteOne();
    res.json({ message: "Task deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
