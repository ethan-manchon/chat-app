import request from 'supertest';
import app from '../app.js';

describe('Test des routes HTTP', () => {
  test('GET / doit renvoyer 200 et du HTML', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('text/html');
    expect(res.text).toMatch(/<!DOCTYPE html>/); // présence du HTML
  });
  test('POST /login avec identifiants valides doit renvoyer 200 et success true', async () => {
    const res = await request(app)
      .post('/login')
      .send({ pseudo: 'ethan', password: 'ethan' })
      .set('Accept', 'application/json');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.pseudo).toBe('ethan');
  });
  test('POST /login avec identifiants invalides doit renvoyer 401 et success false', async () => {
    const res = await request(app)
      .post('/login')
      .send({ pseudo: 'invalid', password: 'invalid' })
      .set('Accept', 'application/json');
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });
  test('POST /login sans données doit renvoyer 400 et success false', async () => {
    const res = await request(app)
      .post('/login')
      .set('Accept', 'application/json');
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });
  test('GET /me sans session doit renvoyer 401 et pseudo null', async () => {
    const res = await request(app).get('/me');
    expect(res.statusCode).toBe(401);
    expect(res.body.pseudo).toBe(null);
  });
  test('GET /me avec session doit renvoyer 200 et le pseudo', async () => {
    const agent = request.agent(app);
    // Connexion
    await agent
      .post('/login')
      .send({ pseudo: 'ethan', password: 'ethan' })
      .set('Accept', 'application/json');
    // Vérification de la session
    const res = await agent.get('/me');
    expect(res.statusCode).toBe(200);
    expect(res.body.pseudo).toBe('ethan');
  });
  test('GET /logout doit détruire la session et rediriger', async () => {
    const agent = request.agent(app);
    // Connexion
    await agent
      .post('/login')
      .send({ pseudo: 'ethan', password: 'ethan' })
      .set('Accept', 'application/json');
    // Déconnexion
    const res = await agent.get('/logout');
    expect(res.statusCode).toBe(302); // redirection
    // Vérification que la session est détruite
    const meRes = await agent.get('/me');
    expect(meRes.statusCode).toBe(401);
    expect(meRes.body.pseudo).toBe(null);
  });
}); 
