const request = require("supertest");

const db = require("../db");
const app = require("../app");

// TODO: change name of tokens to adminToken and userToken

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  u2Token,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/** ************************************ POST /companies */

describe("POST /companies", () => {
  const newCompany = {
    handle: "new",
    name: "New",
    logoUrl: "http://new.img",
    description: "DescNew",
    numEmployees: 10,
  };

  test("ok for users if user is an admin", async () => {
    const resp = await request(app)
      .post("/companies")
      .send(newCompany)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      company: newCompany,
    });
  });

  test("bad request with missing data", async () => {
    const resp = await request(app)
      .post("/companies")
      .send({
        handle: "new",
        numEmployees: 10,
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data", async () => {
    const resp = await request(app)
      .post("/companies")
      .send({
        ...newCompany,
        logoUrl: "not-a-url",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("unauthorized if user is not an admin", async () => {
    const resp = await request(app)
      .post("/companies")
      .send({
        ...newCompany,
      })
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });
});

/** ************************************ GET /companies */

describe("GET /companies", () => {
  test("ok for anon", async () => {
    const resp = await request(app).get("/companies");
    expect(resp.body).toEqual({
      companies: [
        {
          handle: "c1",
          name: "C1",
          description: "Desc1",
          numEmployees: 1,
          logoUrl: "http://c1.img",
        },
        {
          handle: "c2",
          name: "C2",
          description: "Desc2",
          numEmployees: 2,
          logoUrl: "http://c2.img",
        },
        {
          handle: "c3",
          name: "C3",
          description: "Desc3",
          numEmployees: 3,
          logoUrl: "http://c3.img",
        },
      ],
    });
  });

  test("filtering companies correctly", async () => {
    let resp = await request(app).get("/companies").query({
      name: "c1",
    });
    expect(resp.body).toEqual({
      companies: [
        {
          handle: "c1",
          name: "C1",
          description: "Desc1",
          numEmployees: 1,
          logoUrl: "http://c1.img",
        },
      ],
    });

    // The search term can be anywhere in the name (not only begins with or ends with)
    resp = await request(app).get("/companies").query({
      name: "1",
    });
    expect(resp.body).toEqual({
      companies: [
        {
          handle: "c1",
          name: "C1",
          description: "Desc1",
          numEmployees: 1,
          logoUrl: "http://c1.img",
        },
      ],
    });

    const resp2 = await request(app).get("/companies").query({
      minEmployees: 2,
    });
    expect(resp2.body).toEqual({
      companies: [
        {
          handle: "c2",
          name: "C2",
          description: "Desc2",
          numEmployees: 2,
          logoUrl: "http://c2.img",
        },
        {
          handle: "c3",
          name: "C3",
          description: "Desc3",
          numEmployees: 3,
          logoUrl: "http://c3.img",
        },
      ],
    });

    const resp3 = await request(app).get("/companies").query({
      maxEmployees: 2,
    });
    expect(resp3.body).toEqual({
      companies: [
        {
          handle: "c1",
          name: "C1",
          description: "Desc1",
          numEmployees: 1,
          logoUrl: "http://c1.img",
        },
        {
          handle: "c2",
          name: "C2",
          description: "Desc2",
          numEmployees: 2,
          logoUrl: "http://c2.img",
        },
      ],
    });
  });

  test("fails: minEmployees must be smaller than maxEmployees", async () => {
    const resp = await request(app).get("/companies").query({
      minEmployees: 2,
      maxEmployees: 1,
    });
    expect(resp.status).toEqual(400);
  });

  test("fails: if other parameters are included other than name, minEmployees and maxEmployees", async () => {
    const resp = await request(app).get("/companies").query({
      invalidParameter: 2,
    });
    expect(resp.status).toEqual(400);
  });

  test("fails: invalid data types", async () => {
    const resp2 = await request(app).get("/companies").query({
      minEmployees: "not an integer",
    });
    expect(resp2.status).toEqual(400);
  });

  test("fails: test next() handler", async () => {
    // there's no normal failure event which will cause this route to fail ---
    // thus making it hard to test that the error-handler works with it. This
    // should cause an error, all right :)
    await db.query("DROP TABLE companies CASCADE");
    const resp = await request(app)
      .get("/companies")
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(500);
  });
});

/** ************************************ GET /companies/:handle */

describe("GET /companies/:handle", () => {
  test("works for anon", async () => {
    const resp = await request(app).get(`/companies/c1`);
    expect(resp.body).toEqual({
      company: {
        handle: "c1",
        name: "C1",
        description: "Desc1",
        numEmployees: 1,
        logoUrl: "http://c1.img",
        jobs: [
          {
            id: expect.any(Number),
            title: "j1",
            salary: 100,
            equity: "0.1",
          },
        ],
      },
    });

    const resp2 = await request(app).get(`/companies/c2`);
    expect(resp2.body).toEqual({
      company: {
        handle: "c2",
        name: "C2",
        description: "Desc2",
        numEmployees: 2,
        logoUrl: "http://c2.img",
        jobs: [
          {
            id: expect.any(Number),
            title: "j2",
            salary: 200,
            equity: "0.2",
          },
          {
            id: expect.any(Number),
            title: "j3",
            salary: 300,
            equity: "0.3",
          },
        ],
      },
    });
  });

  test("works for anon: company w/o jobs", async () => {
    const resp = await request(app).get(`/companies/c3`);
    expect(resp.body).toEqual({
      company: {
        handle: "c3",
        name: "C3",
        description: "Desc3",
        numEmployees: 3,
        logoUrl: "http://c3.img",
        jobs: [],
      },
    });
  });

  test("not found for no such company", async () => {
    const resp = await request(app).get(`/companies/nope`);
    expect(resp.statusCode).toEqual(404);
  });
});

/** ************************************ PATCH /companies/:handle */

describe("PATCH /companies/:handle", () => {
  test("works for users if user is an admin", async () => {
    const resp = await request(app)
      .patch(`/companies/c1`)
      .send({
        name: "C1-new",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      company: {
        handle: "c1",
        name: "C1-new",
        description: "Desc1",
        numEmployees: 1,
        logoUrl: "http://c1.img",
      },
    });
  });

  test("unauth for anon", async () => {
    const resp = await request(app).patch(`/companies/c1`).send({
      name: "C1-new",
    });
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for not an admin", async () => {
    const resp = await request(app)
      .patch(`/companies/c1`)
      .send({
        name: "C1-new",
      })
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found on no such company", async () => {
    const resp = await request(app)
      .patch(`/companies/nope`)
      .send({
        name: "new nope",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request on handle change attempt", async () => {
    const resp = await request(app)
      .patch(`/companies/c1`)
      .send({
        handle: "c1-new",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request on invalid data", async () => {
    const resp = await request(app)
      .patch(`/companies/c1`)
      .send({
        logoUrl: "not-a-url",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/** ************************************ DELETE /companies/:handle */

describe("DELETE /companies/:handle", () => {
  test("works for users if user is admin", async () => {
    const resp = await request(app)
      .delete(`/companies/c1`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({ deleted: "c1" });
  });

  test("unauth for anon", async () => {
    const resp = await request(app).delete(`/companies/c1`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for non-admin users", async () => {
    const resp = await request(app)
      .delete(`/companies/c1`)
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found for no such company", async () => {
    const resp = await request(app)
      .delete(`/companies/nope`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(404);
  });
});
