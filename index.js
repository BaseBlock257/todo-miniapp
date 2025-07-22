import express from "express";
import cors from 'cors';
import bodyParser from "body-parser";
import pg from "pg";
//for render locally 
import dotenv from "dotenv";
dotenv.config();


const app = express();
const port = 3000;

// const db=new pg.Client({
//   user:"postgres",
//   host:"localhost",
//   database:"permalist",
//   password:"postgres",
//   port:5432,
// });
// db.connect();
const db = new pg.Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: { rejectUnauthorized: false }, // Needed for Render
});
db.connect();

app.use(cors({ origin: 'https://baseblock257.github.io' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json()); // For parsing JSON request bodies (for POST/PUT from frontend)
app.use(express.static("public"));

let items = [
  { id: 1, title: "Buy milk" },
  { id: 2, title: "Finish homework" },
];


app.get("/",async (req, res) => {
  try{
    const result=await db.query("SELECT * FROM items ORDER BY id ASC");
    items=result.rows;
    res.render("index.ejs", {
      listTitle: "Today",
      listItems: items,
    });
  }catch(err){
    console.log(err);
  }
});

app.post("/add", async (req, res) => {
  const item = req.body.newItem;
  try{
    await db.query("INSERT INTO items (title) VALUES ($1)",[item]);
    res.redirect("/");
  }catch(err){
    console.log(err);
  }
});

app.post("/edit", async(req, res) => {
  const item=req.body.updatedItemTitle;
  const id=req.body.updatedItemId;
  try{
    await db.query("UPDATE items SET title = ($1) WHERE id=($2)",[item,id]);
    res.redirect("/");
  }
  catch(err){
    console.log(err);
  }
});

app.post("/delete", async (req, res) => {
  const id=req.body.deleteItemId;
  try{
    await db.query("DELETE FROM items WHERE id=($1)",[id]);
    res.redirect("/");
  }
  catch(err){
    console.log(err);
  }
});
// for mini app
// ✅ GET all todos as JSON (for Telegram Mini App)
app.get("/items", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM items ORDER BY id ASC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch todos." });
  }
});

// ✅ POST a new todo (from static frontend)
app.post("/items", async (req, res) => {
  const { title } = req.body;
  try {
    const result = await db.query("INSERT INTO items (title) VALUES ($1) RETURNING *", [title]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to add todo." });
  }
});

// ✅ PUT to update a todo
app.put("/items/:id", async (req, res) => {
  const id = req.params.id;
  const { title } = req.body;
  try {
    await db.query("UPDATE items SET title = $1 WHERE id = $2", [title, id]);
    res.status(200).json({ message: "Todo updated." });
  } catch (err) {
    res.status(500).json({ error: "Failed to update todo." });
  }
});

// ✅ DELETE a todo
app.delete("/items/:id", async (req, res) => {
  const id = req.params.id;
  try {
    await db.query("DELETE FROM items WHERE id = $1", [id]);
    res.status(200).json({ message: "Todo deleted." });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete todo." });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
