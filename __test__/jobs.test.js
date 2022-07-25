const app = require("../src/app");
const request = require("supertest");
const { seed } = require("../scripts/seedDb");
const { Job, Profile } = require("../src/model");

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

describe("POST /jobs/:job_id/pay", () => {
  afterEach(async () => {
    await seed();
  });

  it("should return 401 when profile header is not set", async () => {
    return request(app).post("/jobs/1/pay").expect(401);
  });

  it("should return 404 when client is trying to pay for not his job", async () => {
    return request(app).post("/jobs/1/pay").set({ profile_id: 2 }).expect(404);
  });

  //balance is too small

  it("should return 403 when the client is trying to pay but does not have enough on the balance.", async () => {
    return request(app).post("/jobs/5/pay").set({ profile_id: 4 }).expect(403);
  });

  it("should return 200 when the client is trying to pay for the job and have all required resources", async () => {
    const clientBefore = await Profile.findOne({
      where: {
        id: 1
      }
    });

    const contractorBefore = await Profile.findOne({
      where: {
        id: 5
      }
    });

    const job = await Job.findOne({
      where: {
        id: 1
      }
    });

    const { body } = await request(app)
      .post("/jobs/1/pay")
      .set({ profile_id: 1 })
      .expect(200);

    const clientAfter = await Profile.findOne({
      where: {
        id: 1
      }
    });

    const contractorAfter = await Profile.findOne({
      where: {
        id: 5
      }
    });

    expect(body.id).toEqual(1);
    expect(job.paid).toEqual(null);
    expect(body.paid).toEqual(true);
    expect(contractorBefore.balance + body.price).toEqual(
      contractorAfter.balance
    );
    expect(clientBefore.balance).toEqual(clientAfter.balance + body.price);
  });
});