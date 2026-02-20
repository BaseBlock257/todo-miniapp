import express from "express";
import bodyParser from "body-parser";
import pkg from "pg";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const { Pool } = pkg;

/* =========================
   PostgreSQL (Render Ready)
========================= */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

/* Test DB connection on startup */
pool.connect()
  .then(() => console.log("✅ Postgres connected"))
  .catch((err) => {
    console.error("❌ Postgres connection error:", err);
    process.exit(1);
  });

/* =========================
   Express Config
========================= */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

/* =========================
   Health Route
========================= */
app.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM todos ORDER BY id DESC");
    res.render("index", { todos: result.rows });
  } catch (err) {
    console.error(err);
    res.send("DB error");
  }
});

/* =========================
   GET todos (API for frontend)
========================= */
app.get("/api/todos", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM todos ORDER BY id DESC");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch todos" });
  }
});

/* =========================
   ADD todo
========================= */
app.post("/add", async (req, res) => {
  const { task } = req.body;

  if (!task || task.trim() === "") {
    return res.redirect("/");
  }

  try {
    await pool.query("INSERT INTO todos (task) VALUES ($1)", [task]);
    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.send("Error adding todo");
  }
});

/* API version (Telegram frontend uses this) */
app.post("/api/todos", async (req, res) => {
  const { task } = req.body;

  if (!task || task.trim() === "") {
    return res.status(400).json({ error: "Task required" });
  }

  try {
    const result = await pool.query(
      "INSERT INTO todos (task) VALUES ($1) RETURNING *",
      [task]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add todo" });
  }
});

/* =========================
   DELETE todo
========================= */
app.post("/delete/:id", async (req, res) => {
  const id = req.params.id;

  try {
    await pool.query("DELETE FROM todos WHERE id = $1", [id]);
    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.send("Error deleting todo");
  }
});

/* API delete */
app.delete("/api/todos/:id", async (req, res) => {
  const id = req.params.id;

  try {
    await pool.query("DELETE FROM todos WHERE id = $1", [id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete todo" });
  }
});

/* =========================
   START SERVER
========================= */
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
