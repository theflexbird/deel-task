const app = require("../src/app");
const request = require("supertest");

describe("GET /contracts", () => {
  it("should return 401 when profile header is not set", async () => {
    return request(app).get("/contracts").expect(401);
  });
  it("should return empty array for profile with id equal 5", async () => {
    return request(app).get("/contracts").set({ profile_id: 5 }).expect([]);
  });
  it("should return two contracts for clinet profile with id equal 2", async () => {
    const { body } = await request(app)
      .get("/contracts")
      .set({ profile_id: 2 })
      .expect(200);

    expect(body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 3,
          terms: "bla bla bla",
          status: "in_progress",
          ContractorId: 6,
          ClientId: 2
        }),
        expect.objectContaining({
          id: 4,
          terms: "bla bla bla",
          status: "in_progress",
          ContractorId: 7,
          ClientId: 2
        })
      ])
    );
  });

  it("should return three contracts for contractor profile with id equal 7", async () => {
    const { body } = await request(app)
      .get("/contracts")
      .set({ profile_id: 7 })
      .expect(200);

    expect(body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 4,
          terms: "bla bla bla",
          status: "in_progress",
          ContractorId: 7,
          ClientId: 2
        }),
        expect.objectContaining({
          id: 6,
          terms: "bla bla bla",
          status: "in_progress",
          ContractorId: 7,
          ClientId: 3
        }),
        expect.objectContaining({
          id: 7,
          terms: "bla bla bla",
          status: "in_progress",
          ContractorId: 7,
          ClientId: 4
        })
      ])
    );
  });
});

describe("GET /contracts/:id", () => {
  it("should return 401 when profile header is not set", async () => {
    return request(app).get("/contracts/2").expect(401);
  });
  it("should return empty array for profile with id equal 5", async () => {
    return request(app).get("/contracts/2").set({ profile_id: 5 }).expect(404);
  });
  it("should return contract for contractor profile with id equal 5", async () => {
    const { body } = await request(app)
      .get("/contracts/1")
      .set({ profile_id: 5 })
      .expect(200);

    expect(body).toEqual(
      expect.objectContaining({
        id: 1,
        terms: "bla bla bla",
        status: "terminated",
        ContractorId: 5,
        ClientId: 1
      })
    );
  });
  it("should return contract for client profile with id equal 2", async () => {
    const { body } = await request(app)
      .get("/contracts/3")
      .set({ profile_id: 2 })
      .expect(200);

    expect(body).toEqual(
      expect.objectContaining({
        id: 3,
        terms: "bla bla bla",
        status: "in_progress",
        ContractorId: 6,
        ClientId: 2
      })
    );
  });
});
