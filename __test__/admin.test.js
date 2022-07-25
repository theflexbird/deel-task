const app = require("../src/app");
const request = require("supertest");

describe("GET /admin/best-profession", () => {
  it("should return 400 start date and end date are not provided", async () => {
    return request(app).get("/admin/best-profession").expect(400);
  });
  it("should return 400 start date is not provided", async () => {
    return request(app)
      .get("/admin/best-profession?end=2020-08-17")
      .expect(400);
  });
  it("should return 400 end date is not provided", async () => {
    return request(app)
      .get("/admin/best-profession?start=2020-08-10")
      .expect(400);
  });

  it("should return 200 and result if start date and end date are provided", async () => {
    return request(app)
      .get("/admin/best-profession?start=2020-08-10&end=2020-08-17")
      .expect(200)
      .expect({
        profession: "Programmer",
        amount: 2683
      });
  });
});

describe("GET /admin/best-clients", () => {
  it("should return 400 start date and end date are not provided", async () => {
    return request(app).get("/admin/best-clients").expect(400);
  });
  it("should return 400 start date is not provided", async () => {
    return request(app).get("/admin/best-clients?end=2020-08-17").expect(400);
  });
  it("should return 400 end date is not provided", async () => {
    return request(app).get("/admin/best-clients?start=2020-08-10").expect(400);
  });

  it("should return 200 and two items in result if start date and end date are provided", async () => {
    return request(app)
      .get("/admin/best-clients?start=2020-08-10&end=2020-08-17")
      .expect(200)
      .expect([
        {
          id: 4,
          fullName: "Ash Kethcum",
          paid: 2020
        },
        {
          id: 2,
          fullName: "Mr Robot",
          paid: 442
        }
      ]);
  });

  it("should return 200 and one items in result if start date and end date are provided", async () => {
    return request(app)
      .get("/admin/best-clients?start=2020-08-10&end=2020-08-17&limit=1")
      .expect(200)
      .expect([
        {
          id: 4,
          fullName: "Ash Kethcum",
          paid: 2020
        }
      ]);
  });
});