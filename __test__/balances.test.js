const app = require("../src/app");
const request = require("supertest");
const { seed } = require("../scripts/seedDb");
const { Profile } = require("../src/model");

describe("POST /balances/deposit/:userId", () => { 
  afterEach(async () => {
    await seed();
  });

  it("should return 401 when profile header is not set", async () => {
    return request(app).post("/balances/deposit/2").expect(401);
  });

  it("should return 401 when profile header is different than :userId", async () => {
    return request(app)
      .post("/balances/deposit/2")
      .set({ profile_id: 3 })
      .expect(401);
  });

  it("should return 400 if payload is not set", async () => {
    return request(app)
      .post("/balances/deposit/2")
      .set({ profile_id: 2 })
      .expect(400);
  });

  it("should return 400 if payload is incorrect(negative amount)", async () => {
    return request(app)
      .post("/balances/deposit/2")
      .set({ profile_id: 2 })
      .send({
        deposit: -100
      })
      .expect(400);
  });

  it("should return 400 if payload is incorrect(no deposit field)", async () => {
    return request(app)
      .post("/balances/deposit/2")
      .set({ profile_id: 2 })
      .send({
        nodeposit: 100
      })
      .expect(400);
  });

  it("should return 400 if payload(deposit) is bigger than 25% of max jobs", async () => {
    return request(app)
      .post("/balances/deposit/2")
      .set({ profile_id: 2 })
      .send({
        deposit: 200
      })
      .expect(403);
  });

  it("should return 200 if payload(deposit) is less than 25% of max jobs", async () => {
    const client = await Profile.findOne({
      where: {
        id: 2
      }
    });

    const { body } = await request(app)
      .post("/balances/deposit/2")
      .set({ profile_id: 2 })
      .send({
        deposit: 100
      })
      .expect(200);
    
    expect(body.balance).toEqual(client.balance + 100);
  });
});