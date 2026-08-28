const request = require('supertest');
const { app, pool } = require('../src/app');

afterAll(async () => {
  await pool.end();
});

describe('DevOps API Tests', () => {
  it('GET / should return online status', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('online');
    expect(res.body.app).toBe('Cloud-Native DevOps API');
  });

  it('GET /healthz should return healthy status (for K8s probes)', async () => {
    const res = await request(app).get('/healthz');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body).toHaveProperty('uptime');
  });

  it('GET /metrics should return Prometheus metrics format', async () => {
    const res = await request(app).get('/metrics');
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain('app_uptime_seconds');
    expect(res.text).toContain('app_memory_heap_used_bytes');
  });

  it('GET /api/tasks should return list of tasks', async () => {
    const res = await request(app).get('/api/tasks');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.tasks)).toBe(true);
    expect(res.body.tasks.length).toBeGreaterThan(0);
  });

  it('POST /api/tasks should create a new task', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ title: 'Test new task' });
    expect(res.statusCode).toBe(201);
    expect(res.body.task.title).toBe('Test new task');
  });

  it('POST /api/tasks without title should return 400 Bad Request', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({});
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('Title is required');
  });
});

