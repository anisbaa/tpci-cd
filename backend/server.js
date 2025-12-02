const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// PostgreSQL connection with retry logic
const createPool = () => {
  const config = process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: false, // Required for Render's self-signed certificates
        },
      }
    : {
        user: process.env.DB_USER || "postgres",
        host: process.env.DB_HOST || "db",
        database: process.env.DB_NAME || "mydb",
        password: process.env.DB_PASSWORD || "password",
        port: process.env.DB_PORT || 5432,
      };
  return new Pool(config);
};

let pool = createPool();

// Middleware
app.use(cors({
  origin: [
    'http://localhost:8080',
    'http://127.0.0.1:8080',
    'https://anisbaa.github.io' // Allow GitHub Pages
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json());

// Initialize database table with retry
async function initDatabase() {
  let retries = 5;
  while (retries > 0) {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS messages (
          id SERIAL PRIMARY KEY,
          content TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Insert sample data
      await pool.query(`
        INSERT INTO messages (content) VALUES 
        ('Welcome to our Docker PostgreSQL app!'),
        ('This is a sample message from the database'),
        ('You can add your own messages too!')
        ON CONFLICT DO NOTHING
      `);
      
      console.log("Database initialized successfully");
      return;
    } catch (err) {
      console.error(`Database initialization error (${retries} retries left):`, err.message);
      retries -= 1;
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds before retry
    }
  }
  throw new Error("Failed to initialize database after multiple retries");
}

// Routes (keep your existing routes here...)
app.get("/api", (req, res) => {
  res.json({
    message: "Hello from Backend with PostgreSQL!",
    timestamp: new Date().toISOString(),
    client: req.get('Origin') || 'unknown',
    success: true
  });
});

// Get all messages
app.get("/api/messages", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM messages ORDER BY created_at DESC");
    res.json({
      success: true,
      data: result.rows
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// Add new message
app.post("/api/messages", async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({
        success: false,
        error: "Content is required"
      });
    }

    const result = await pool.query(
      "INSERT INTO messages (content) VALUES ($1) RETURNING *",
      [content]
    );

    res.json({
      success: true,
      data: result.rows[0],
      message: "Message added successfully"
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// Health check
app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({
      success: true,
      database: "connected",
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      database: "disconnected",
      error: err.message
    });
  }
});

// Start server
app.listen(PORT, async () => {
  console.log(`Backend starting on port ${PORT}...`);
  try {
    await initDatabase();
    console.log("Backend running successfully!");
    console.log("PostgreSQL database connected and initialized");
  } catch (err) {
    console.error("Failed to start backend:", err.message);
    process.exit(1);
  }
});