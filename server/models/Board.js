const mongoose = require("mongoose");

const boardSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Board title is required"],
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    color: {
      type: String,
      default: "#6366f1",
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    columns: [
      {
        _id: { type: String, required: true },
        title: { type: String, required: true },
        order: { type: Number, required: true },
      },
    ],
  },
  { timestamps: true }
);

// Default columns when a board is created
boardSchema.pre("save", function (next) {
  if (this.isNew && this.columns.length === 0) {
    this.columns = [
      { _id: "todo", title: "To Do", order: 0 },
      { _id: "inprogress", title: "In Progress", order: 1 },
      { _id: "done", title: "Done", order: 2 },
    ];
  }
  next();
});

module.exports = mongoose.model("Board", boardSchema);
