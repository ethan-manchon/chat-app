import request from "supertest";
import app from "../app.js";

describe("Persistance de la connexion", () => {
  let agent;

  beforeEach(() => {
    agent = request.agent(app);
  });

  test("Connexion et persistance de session", async () => {
    // Connexion
    const loginRes = await agent
      .post("/login")
      .send({ pseudo: "ethan", password: "ethan" })
      .set("Accept", "application/json");
    expect(loginRes.statusCode).toBe(200);
    expect(loginRes.body.success).toBe(true);
    // Vérification de la session
    const meRes = await agent.get("/me");
    expect(meRes.statusCode).toBe(200);
    expect(meRes.body.pseudo).toBe("ethan");
    // Déconnexion
    const logoutRes = await agent.get("/logout");
    expect(logoutRes.statusCode).toBe(302); // redirection
    // Vérification que la session est détruite
    const meResAfter = await agent.get("/me");
    expect(meResAfter.statusCode).toBe(401);
    expect(meResAfter.body.pseudo).toBe(null);
  });
});
