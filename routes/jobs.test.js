"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

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

// TODO: add an array of ids in _testCommon to minimize the beforeEach functions needed in these tests.
// Also, change variable names of u1Token to adminToken
/************************************** POST /jobs */

describe("POST /jobs", function () {
  const newJob = {
    title: 'new', 
    salary: 1000,
    equity: 0.11,
    companyHandle: 'c1'
  };

  test("ok for users if user is an admin", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      job: {...newJob, equity: "0.11", id: expect.any(Number)}
    });
  });

  test("bad request with missing data", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send({
        title: 'new', 
        salary: 1000,
        companyHandle: 'c1'
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send({
        ...newJob,
        equity: 2,
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("unauthorized if user is not an admin", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send({
        ...newJob,
      })
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });
});

/************************************** GET /jobs */

describe("GET /jobs", function () {
  test("ok for anon", async function () {
    const resp = await request(app).get("/jobs");
    expect(resp.body).toEqual({
      jobs:
        [
          {
            id: expect.any(Number),
            title: 'j1', 
            salary: 100,
            equity: "0.1",
            companyHandle: 'c1'
          },
          {
            id: expect.any(Number),
            title: 'j2', 
            salary: 200,
            equity: "0.2",
            companyHandle: 'c2'
          },
          {
            id: expect.any(Number),
            title: 'j3', 
            salary: 300,
            equity: "0.3",
            companyHandle: 'c2'
          }
        ],
    });
  });

  test("filtering jobs correctly", async function () {
    let resp = await request(app)
      .get("/jobs")
      .query({
        title: "J1", // search term is case insensitive
      });
    expect(resp.body).toEqual({
      jobs:
        [
          {
            id: expect.any(Number),
            title: 'j1', 
            salary: 100,
            equity: "0.1",
            companyHandle: 'c1'
          }
        ],
    });

    // The search term can be anywhere in the title (not only begins with or ends with)
    resp = await request(app)
      .get("/jobs")
      .query({
        title: "1",
      });
    expect(resp.body).toEqual({
      jobs:
        [
          {
            id: expect.any(Number),
            title: 'j1', 
            salary: 100,
            equity: "0.1",
            companyHandle: 'c1'
          }
        ],
    });

    const resp2 = await request(app)
      .get("/jobs")
      .query({
        minSalary: 150,
      });
    expect(resp2.body).toEqual({
      jobs:
        [
          {
            id: expect.any(Number),
            title: 'j2', 
            salary: 200,
            equity: "0.2",
            companyHandle: 'c2'
          },
          {
            id: expect.any(Number),
            title: 'j3', 
            salary: 300,
            equity: "0.3",
            companyHandle: 'c2'
          }
        ]
    });

    const newJob = {
      title: 'new', 
      salary: 10,
      equity: 0,
      companyHandle: 'c1'
    };
  
    // Create a new job with no equity
    const respNewJobNoEquity = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${u1Token}`);

    const resp3 = await request(app)
      .get("/jobs")
      .query({
        hasEquity: true,
      });
    expect(resp3.body).toEqual({
      jobs:
        [
          {
            id: expect.any(Number),
            title: 'j1', 
            salary: 100,
            equity: "0.1",
            companyHandle: 'c1'
          },
          {
            id: expect.any(Number),
            title: 'j2', 
            salary: 200,
            equity: "0.2",
            companyHandle: 'c2'
          },
          {
            id: expect.any(Number),
            title: 'j3', 
            salary: 300,
            equity: "0.3",
            companyHandle: 'c2'
          }
        ]
    });

    const resp4 = await request(app)
      .get("/jobs")
      .query({
        hasEquity: false,
      });
    expect(resp4.body).toEqual({
      jobs:
        [
          {
            id: expect.any(Number),
            title: 'j1', 
            salary: 100,
            equity: "0.1",
            companyHandle: 'c1'
          },
          {
            id: expect.any(Number),
            title: 'j2', 
            salary: 200,
            equity: "0.2",
            companyHandle: 'c2'
          },
          {
            id: expect.any(Number),
            title: 'j3', 
            salary: 300,
            equity: "0.3",
            companyHandle: 'c2'
          },
          {
            id: expect.any(Number),
            title: 'new', 
            salary: 10,
            equity: "0",
            companyHandle: 'c1'
          }
        ]
    });
  });

  test("fails: if other parameters are included other than title, minSalary and hasEquity", async function () {
    const resp = await request(app)
      .get("/jobs")
      .query({
        invalidParameter: 2
      });
    expect(resp.status).toEqual(400);
  });

  test("fails: invalid data types", async function () {
    const resp = await request(app)
      .get("/jobs")
      .query({
        hasEquity: "not an boolean"
      });
    expect(resp.status).toEqual(400);

    const resp2 = await request(app)
      .get("/jobs")
      .query({
        minSalary: "not an integer"
      });
    expect(resp2.status).toEqual(400);

    const resp3 = await request(app)
      .get("/jobs")
      .query({
        title: ''
      });
    expect(resp3.status).toEqual(400);
  });

  test("fails: test next() handler", async function () {
    // there's no normal failure event which will cause this route to fail ---
    // thus making it hard to test that the error-handler works with it. This
    // should cause an error, all right :)
    await db.query("DROP TABLE jobs CASCADE");
    const resp = await request(app)
      .get("/jobs")
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(500);
  });
});

/************************************** GET /jobs/:id */

describe("GET /jobs/:id", function () {

  let id;
  const newJob = {
    title: 'new', 
    salary: 1000,
    equity: 0.11,
    companyHandle: 'c1'
  };

  beforeEach(async function() {
    const resp = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${u1Token}`);

    id = resp.body.job.id;
  });

  test("works for anon", async function () {
    const resp = await request(app).get(`/jobs/${id}`);
    expect(resp.body).toEqual({
      job: {
        ...newJob,
        equity: "0.11",
        id
      },
    });
  });

  test("not found for no such job", async function () {
    const resp = await request(app).get(`/jobs/0`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /jobs/:id */

describe("PATCH /jobs/:id", function () {
  let id;
  const newJob = {
    title: 'newCreated', 
    salary: 1000,
    equity: 0.11,
    companyHandle: 'c1'
  };

  beforeEach(async function() {
    const resp = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${u1Token}`);

    id = resp.body.job.id;
  });

  test("works for users if user is an admin", async function () {
    const resp = await request(app)
      .patch(`/jobs/${id}`)
      .send({
        title: "newUpdated",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      job: {
        id,
        title: 'newUpdated', 
        salary: 1000,
        equity: "0.11",
        companyHandle: 'c1'
      },
    });
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
      .patch(`/jobs/${id}`)
      .send({
        title: "newUpdated",
      });
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for not an admin", async function () {
    const resp = await request(app)
      .patch(`/jobs/${id}`)
      .send({
        title: "newUpdated",
      })
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found for non-existent job", async function () {
    const resp = await request(app)
      .patch(`/jobs/0`)
      .send({
        title: "newUpdated",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request on id change attempt", async function () {
    const resp = await request(app)
      .patch(`/jobs/${id}`)
      .send({
        id: 0,
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request on invalid data", async function () {
    const resp = await request(app)
      .patch(`/jobs/${id}`)
      .send({
        equity: 2,
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** DELETE /jobs/:id */

describe("DELETE /jobs/:id", function () {
  let id;
  const newJob = {
    title: 'newCreated', 
    salary: 1000,
    equity: 0.11,
    companyHandle: 'c1'
  };

  beforeEach(async function() {
    const resp = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${u1Token}`);

    id = resp.body.job.id;
  });

  test("works for users if user is admin", async function () {
    const resp = await request(app)
      .delete(`/jobs/${id}`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({ deleted: id });
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
      .delete(`/jobs/${id}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for non-admin users", async function () {
    const resp = await request(app)
      .delete(`/jobs/${id}`)
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found for no such job", async function () {
    const resp = await request(app)
      .delete(`/jobs/0`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(404);
  });
});
