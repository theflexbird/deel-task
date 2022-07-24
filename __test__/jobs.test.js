const app = require("../src/app");
const request = require("supertest");

describe("GET /jobs/unpaid", () => {
  it("should return 401 when profile header is not set", async () => {
    return request(app).get("/jobs/unpaid").expect(401);
  });

  it("should return empty array for profile with id equal 3", async () => {
    return request(app)
      .get("/jobs/unpaid")
      .set({ profile_id: 3 })
      .expect(200).expect([]);
  });

  it("should return array with one job for profile with id equal 5", async () => {
    const { body } = await request(app).get("/jobs/unpaid").set({ profile_id: 5 }).expect(200);

    expect(body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 1,
          description: "work",
          price: 200,
          paid: null,
          paymentDate: null,
          ContractId: 1
        })
      ])
    );
  });
});