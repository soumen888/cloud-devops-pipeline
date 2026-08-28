const { app, pool } = require('./app');

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`🚀 DevOps Server running on port ${PORT}`);
  console.log(`📡 Health check ready at http://localhost:${PORT}/healthz`);
  console.log(`📊 Metrics ready at http://localhost:${PORT}/metrics`);
});

// Graceful Shutdown for Docker & Kubernetes (SIGINT and SIGTERM)
function shutdown(signal) {
  console.log(`\n🛑 Received ${signal}, starting graceful shutdown...`);
  server.close(async () => {
    console.log('HTTP server closed.');
    try {
      await pool.end();
      console.log('Database pool connections closed.');
    } catch (err) {
      console.error('Error closing database pool:', err);
    }
    process.exit(0);
  });

  // Force shutdown after 10 seconds if hanging
  setTimeout(() => {
    console.error('Forced shutdown after timeout.');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

