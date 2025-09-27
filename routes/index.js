var express = require("express");
var router = express.Router();
const Todo = require("../model/Todo");

/* GET home page - display all todos */
router.get("/", async function (req, res, next) {
  try {
    const todos = await Todo.find().sort({ createdAt: -1 });
    res.render("index", { title: "Todo List", todos: todos });
  } catch (error) {
    console.error("Error fetching todos:", error);
    res.render("index", { title: "Todo List", todos: [] });
  }
});

/* POST - Create a new todo */
router.post("/todos", async function (req, res, next) {
  try {
    const { title, description } = req.body;
    const todo = new Todo({ title, description });
    await todo.save();

    if (req.xhr || req.headers.accept.indexOf("json") > -1) {
      res.json({ success: true, todo: todo });
    } else {
      res.redirect("/");
    }
  } catch (error) {
    console.error("Error creating todo:", error);
    if (req.xhr || req.headers.accept.indexOf("json") > -1) {
      res.status(500).json({ success: false, error: error.message });
    } else {
      res.redirect("/");
    }
  }
});

/* PUT - Update a todo */
router.put("/todos/:id", async function (req, res, next) {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const todo = await Todo.findByIdAndUpdate(id, updateData, { new: true });
    if (!todo) {
      return res.status(404).json({ success: false, error: "Todo not found" });
    }

    res.json({ success: true, todo: todo });
  } catch (error) {
    console.error("Error updating todo:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/* DELETE - Delete a todo */
router.delete("/todos/:id", async function (req, res, next) {
  try {
    const { id } = req.params;
    const todo = await Todo.findByIdAndDelete(id);

    if (!todo) {
      return res.status(404).json({ success: false, error: "Todo not found" });
    }

    res.json({ success: true, message: "Todo deleted successfully" });
  } catch (error) {
    console.error("Error deleting todo:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/* PATCH - Toggle todo completion status */
router.patch("/todos/:id/toggle", async function (req, res, next) {
  try {
    const { id } = req.params;
    const todo = await Todo.findById(id);

    if (!todo) {
      return res.status(404).json({ success: false, error: "Todo not found" });
    }

    todo.completed = !todo.completed;
    await todo.save();

    res.json({ success: true, todo: todo });
  } catch (error) {
    console.error("Error toggling todo:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
