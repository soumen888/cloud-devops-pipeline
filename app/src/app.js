const express = require('express');
const { Pool } = require('pg');

const app = express();
app.use(express.json());

// Database connection pool configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/devops_db',
  connectionTimeoutMillis: 2000,
});

// Fallback in-memory store if database is unreachable (for local testing without db)
let inMemoryTasks = [
  { id: 1, title: 'Learn Docker containerization', completed: true },
  { id: 2, title: 'Set up GitHub Actions CI/CD', completed: false },
  { id: 3, title: 'Write Terraform for AWS infrastructure', completed: false },
  { id: 4, title: 'Deploy on Kubernetes', completed: false },
];

let dbInitialized = false;

async function initDb() {
  try {
    const client = await pool.connect();
    await client.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        completed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Seed initial data if empty
    const countRes = await client.query('SELECT COUNT(*) FROM tasks');
    if (parseInt(countRes.rows[0].count, 10) === 0) {
      await client.query(`
        INSERT INTO tasks (title, completed) VALUES
        ('Learn Docker containerization', true),
        ('Set up GitHub Actions CI/CD', false),
        ('Write Terraform for AWS infrastructure', false),
        ('Deploy on Kubernetes', false);
      `);
    }
    client.release();
    dbInitialized = true;
    console.log('✅ Connected to PostgreSQL database');
  } catch (err) {
    console.warn('⚠️ Database connection failed, falling back to in-memory store:', err.message);
    dbInitialized = false;
  }
}

// Initialize DB on startup
initDb();

// 1. Root route
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    app: 'Cloud-Native DevOps API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    database_connected: dbInitialized,
    timestamp: new Date().toISOString()
  });
});

// 2. Health check endpoint (Kubernetes probes / AWS ALB)
app.get('/healthz', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// 3. Metrics endpoint (Prometheus format)
app.get('/metrics', (req, res) => {
  const memUsage = process.memoryUsage();
  const uptime = process.uptime();
  res.setHeader('Content-Type', 'text/plain');
  res.send(
`# HELP app_uptime_seconds Application uptime in seconds
# TYPE app_uptime_seconds gauge
app_uptime_seconds ${uptime}

# HELP app_memory_heap_used_bytes Process heap memory used
# TYPE app_memory_heap_used_bytes gauge
app_memory_heap_used_bytes ${memUsage.heapUsed}

# HELP app_database_connected Status of database connection (1 = true, 0 = false)
# TYPE app_database_connected gauge
app_database_connected ${dbInitialized ? 1 : 0}
`
  );
});

// 4. API Routes: Tasks
app.get('/api/tasks', async (req, res) => {
  if (dbInitialized) {
    try {
      const result = await pool.query('SELECT * FROM tasks ORDER BY id ASC');
      return res.json({ source: 'database', tasks: result.rows });
    } catch (err) {
      console.error('Error querying database:', err);
    }
  }
  return res.json({ source: 'in-memory', tasks: inMemoryTasks });
});

app.post('/api/tasks', async (req, res) => {
  const { title } = req.body;
  if (!title || typeof title !== 'string') {
    return res.status(400).json({ error: 'Title is required' });
  }

  if (dbInitialized) {
    try {
      const result = await pool.query(
        'INSERT INTO tasks (title, completed) VALUES ($1, $2) RETURNING *',
        [title, false]
      );
      return res.status(201).json({ source: 'database', task: result.rows[0] });
    } catch (err) {
      console.error('Error inserting into database:', err);
    }
  }

  const newTask = {
    id: inMemoryTasks.length + 1,
    title,
    completed: false
  };
  inMemoryTasks.push(newTask);
  return res.status(201).json({ source: 'in-memory', task: newTask });
});

module.exports = { app, pool };

