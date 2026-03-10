const express = require("express");
const router = express.Router();
const Board = require("../models/Board");
const Task = require("../models/Task");
const { protect } = require("../middleware/auth");

// All routes require auth
router.use(protect);

// @GET /api/boards — get all boards for current user
router.get("/", async (req, res) => {
  try {
    const boards = await Board.find({
      $or: [{ owner: req.user._id }, { members: req.user._id }],
    })
      .populate("owner", "name email avatar")
      .sort({ createdAt: -1 });

    res.json(boards);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @POST /api/boards — create a new board
router.post("/", async (req, res) => {
  try {
    const { title, description, color } = req.body;
    if (!title) return res.status(400).json({ message: "Title is required" });

    const board = await Board.create({
      title,
      description,
      color: color || "#6366f1",
      owner: req.user._id,
    });

    await board.populate("owner", "name email avatar");
    res.status(201).json(board);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @GET /api/boards/:id — get a single board with its tasks
router.get("/:id", async (req, res) => {
  try {
    const board = await Board.findById(req.params.id).populate(
      "owner",
      "name email avatar"
    );

    if (!board) return res.status(404).json({ message: "Board not found" });

    // Check access
    const hasAccess =
      board.owner._id.toString() === req.user._id.toString() ||
      board.members.some((m) => m.toString() === req.user._id.toString());

    if (!hasAccess)
      return res.status(403).json({ message: "Access denied" });

    // Get all tasks for this board
    const tasks = await Task.find({ board: board._id })
      .populate("assignedTo", "name email avatar")
      .populate("createdBy", "name email avatar")
      .sort({ order: 1 });

    res.json({ board, tasks });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @PUT /api/boards/:id — update board
router.put("/:id", async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    if (!board) return res.status(404).json({ message: "Board not found" });

    if (board.owner.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Only the owner can edit this board" });

    const { title, description, color } = req.body;
    if (title) board.title = title;
    if (description !== undefined) board.description = description;
    if (color) board.color = color;

    await board.save();
    res.json(board);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @DELETE /api/boards/:id — delete board and all its tasks
router.delete("/:id", async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    if (!board) return res.status(404).json({ message: "Board not found" });

    if (board.owner.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Only the owner can delete this board" });

    await Task.deleteMany({ board: board._id });
    await board.deleteOne();

    res.json({ message: "Board deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
