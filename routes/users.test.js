const request = require("supertest");

const db = require("../db.js");
const app = require("../app");
const User = require("../models/user");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  u2Token,
  testJobIds,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/** ************************************ POST /users */

describe("POST /users", () => {
  test("works for admins: create non-admin", async () => {
    const resp = await request(app)
      .post("/users")
      .send({
        username: "u-new",
        firstName: "First-new",
        lastName: "Last-newL",
        // password: "password-new",
        email: "new@email.com",
        isAdmin: false,
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      user: {
        username: "u-new",
        firstName: "First-new",
        lastName: "Last-newL",
        email: "new@email.com",
        isAdmin: false,
      },
      token: expect.any(String),
    });
  });

  test("works for admins: create admin", async () => {
    const resp = await request(app)
      .post("/users")
      .send({
        username: "u-new",
        firstName: "First-new",
        lastName: "Last-newL",
        // password: "password-new",
        email: "new@email.com",
        isAdmin: true,
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      user: {
        username: "u-new",
        firstName: "First-new",
        lastName: "Last-newL",
        email: "new@email.com",
        isAdmin: true,
      },
      token: expect.any(String),
    });
  });

  test("unauth for anon", async () => {
    const resp = await request(app).post("/users").send({
      username: "u-new",
      firstName: "First-new",
      lastName: "Last-newL",
      password: "password-new",
      email: "new@email.com",
      isAdmin: true,
    });
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for non-admin", async () => {
    const resp = await request(app)
      .post("/users")
      .send({
        username: "u-new",
        firstName: "First-new",
        lastName: "Last-newL",
        // password: "password-new",
        email: "new@email.com",
        isAdmin: true,
      })
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("bad request if missing data", async () => {
    const resp = await request(app)
      .post("/users")
      .send({
        username: "u-new",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request if invalid data", async () => {
    const resp = await request(app)
      .post("/users")
      .send({
        username: "u-new",
        firstName: "First-new",
        lastName: "Last-newL",
        // password: "password-new",
        email: "not-an-email",
        isAdmin: true,
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/** ************************************ GET /users */

describe("GET /users", () => {
  test("works for admins", async () => {
    const resp = await request(app)
      .get("/users")
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      users: [
        {
          username: "u1",
          firstName: "U1F",
          lastName: "U1L",
          email: "user1@user.com",
          isAdmin: true,
          jobs: [testJobIds[0], testJobIds[1]],
        },
        {
          username: "u2",
          firstName: "U2F",
          lastName: "U2L",
          email: "user2@user.com",
          isAdmin: false,
          jobs: [],
        },
        {
          username: "u3",
          firstName: "U3F",
          lastName: "U3L",
          email: "user3@user.com",
          isAdmin: false,
          jobs: [],
        },
      ],
    });
  });

  test("unauth for anon", async () => {
    const resp = await request(app).get("/users");
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for non-admins", async () => {
    const resp = await request(app)
      .get("/users")
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("fails: test next() handler", async () => {
    // there's no normal failure event which will cause this route to fail ---
    // thus making it hard to test that the error-handler works with it. This
    // should cause an error, all right :)
    await db.query("DROP TABLE users CASCADE");
    const resp = await request(app)
      .get("/users")
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(500);
  });
});

/** ************************************ GET /users/:username */

describe("GET /users/:username", () => {
  test("works for admins", async () => {
    const resp = await request(app)
      .get(`/users/u1`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      user: {
        username: "u1",
        firstName: "U1F",
        lastName: "U1L",
        email: "user1@user.com",
        isAdmin: true,
        jobs: [testJobIds[0], testJobIds[1]],
      },
    });
  });

  test("works for admins for someone else", async () => {
    const resp = await request(app)
      .get(`/users/u2`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      user: {
        username: "u2",
        firstName: "U2F",
        lastName: "U2L",
        email: "user2@user.com",
        isAdmin: false,
        jobs: [],
      },
    });
  });

  test("works for yourself", async () => {
    const resp = await request(app)
      .get(`/users/u2`)
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.body).toEqual({
      user: {
        username: "u2",
        firstName: "U2F",
        lastName: "U2L",
        email: "user2@user.com",
        isAdmin: false,
        jobs: [],
      },
    });
  });

  test("unauth for anon", async () => {
    const resp = await request(app).get(`/users/u1`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for non-admins going to another user's info", async () => {
    const resp = await request(app)
      .get(`/users/u1`)
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found if user not found", async () => {
    const resp = await request(app)
      .get(`/users/nope`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(404);
  });
});

/** ************************************ PATCH /users/:username */

describe("PATCH /users/:username", () => {
  test("works for admin", async () => {
    const resp = await request(app)
      .patch(`/users/u1`)
      .send({
        firstName: "New",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      user: {
        username: "u1",
        firstName: "New",
        lastName: "U1L",
        email: "user1@user.com",
        isAdmin: true,
      },
    });
  });

  test("works for admin for a different user", async () => {
    const resp = await request(app)
      .patch(`/users/u2`)
      .send({
        firstName: "New",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      user: {
        username: "u2",
        firstName: "New",
        lastName: "U2L",
        email: "user2@user.com",
        isAdmin: false,
      },
    });
  });

  test("works for non-admin user on themselves", async () => {
    const resp = await request(app)
      .patch(`/users/u2`)
      .send({
        firstName: "New",
      })
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.body).toEqual({
      user: {
        username: "u2",
        firstName: "New",
        lastName: "U2L",
        email: "user2@user.com",
        isAdmin: false,
      },
    });
  });

  test("unauth for anon", async () => {
    const resp = await request(app).patch(`/users/u1`).send({
      firstName: "New",
    });
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for non-admins on a different user", async () => {
    const resp = await request(app)
      .patch(`/users/u1`)
      .send({
        firstName: "New",
      })
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found if no such user", async () => {
    const resp = await request(app)
      .patch(`/users/nope`)
      .send({
        firstName: "Nope",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request if invalid data", async () => {
    const resp = await request(app)
      .patch(`/users/u1`)
      .send({
        firstName: 42,
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("works: set new password", async () => {
    const resp = await request(app)
      .patch(`/users/u1`)
      .send({
        password: "new-password",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      user: {
        username: "u1",
        firstName: "U1F",
        lastName: "U1L",
        email: "user1@user.com",
        isAdmin: true,
      },
    });
    const isSuccessful = await User.authenticate("u1", "new-password");
    expect(isSuccessful).toBeTruthy();
  });
});

/** ************************************ DELETE /users/:username */

describe("DELETE /users/:username", () => {
  test("works for admins", async () => {
    const resp = await request(app)
      .delete(`/users/u1`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({ deleted: "u1" });
  });

  test("works for admins for different user", async () => {
    const resp = await request(app)
      .delete(`/users/u2`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({ deleted: "u2" });
  });

  test("works for non-admins for themselves", async () => {
    const resp = await request(app)
      .delete(`/users/u2`)
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.body).toEqual({ deleted: "u2" });
  });

  test("unauth for anon", async () => {
    const resp = await request(app).delete(`/users/u1`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for non-admins on other users", async () => {
    const resp = await request(app)
      .delete(`/users/u1`)
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found if user missing", async () => {
    const resp = await request(app)
      .delete(`/users/nope`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(404);
  });
});

/** ************************************ POST /users/:username/jobs/:id */

describe("POST /users/:username/jobs/:id", () => {
  test("works for admins", async () => {
    const resp = await request(app)
      .post(`/users/u1/jobs/${testJobIds[2]}`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({ applied: testJobIds[2] });
  });

  test("works for admins for different user", async () => {
    const resp = await request(app)
      .post(`/users/u2/jobs/${testJobIds[0]}`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({ applied: testJobIds[0] });
  });

  test("works for non-admins for themselves", async () => {
    const resp = await request(app)
      .post(`/users/u2/jobs/${testJobIds[0]}`)
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.body).toEqual({ applied: testJobIds[0] });
  });

  test("unauth for anon", async () => {
    const resp = await request(app).post(`/users/u2/jobs/${testJobIds[0]}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for non-admins on other users", async () => {
    const resp = await request(app)
      .post(`/users/u3/jobs/${testJobIds[0]}`)
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found if user missing", async () => {
    const resp = await request(app)
      .post(`/users/noUser/jobs/${testJobIds[0]}`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("not found if job missing", async () => {
    const resp = await request(app)
      .post(`/users/u3/jobs/0`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request if application already exists", async () => {
    const resp = await request(app)
      .post(`/users/u1/jobs/${testJobIds[0]}`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/** ************************************ PATCH /users/:username/jobs/:id */

describe("PATCH /users/:username/jobs/:id", () => {
  test("works for admins", async () => {
    const resp = await request(app)
      .patch(`/users/u1/jobs/${testJobIds[0]}`)
      .send({
        state: "accepted",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({ updated: "accepted" });
  });

  test("works for admins for different user", async () => {
    await request(app)
      .post(`/users/u2/jobs/${testJobIds[0]}`)
      .set("authorization", `Bearer ${u1Token}`);

    const resp = await request(app)
      .patch(`/users/u2/jobs/${testJobIds[0]}`)
      .send({
        state: "accepted",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({ updated: "accepted" });
  });

  test("works for non-admins for themselves", async () => {
    await request(app)
      .post(`/users/u2/jobs/${testJobIds[0]}`)
      .set("authorization", `Bearer ${u1Token}`);

    const resp = await request(app)
      .patch(`/users/u2/jobs/${testJobIds[0]}`)
      .send({
        state: "accepted",
      })
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.body).toEqual({ updated: "accepted" });
  });

  test("unauth for anon", async () => {
    const resp = await request(app)
      .patch(`/users/u2/jobs/${testJobIds[0]}`)
      .send({
        state: "accepted",
      });
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for non-admins on other users", async () => {
    const resp = await request(app)
      .patch(`/users/u3/jobs/${testJobIds[0]}`)
      .send({
        state: "accepted",
      })
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found if user missing", async () => {
    const resp = await request(app)
      .patch(`/users/noUser/jobs/${testJobIds[0]}`)
      .send({
        state: "accepted",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("not found if job missing", async () => {
    const resp = await request(app)
      .patch(`/users/u3/jobs/0`)
      .send({
        state: "accepted",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("not found if application does not exist", async () => {
    const resp = await request(app)
      .patch(`/users/u2/jobs/${testJobIds[0]}`)
      .send({
        state: "accepted",
      })
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request if state is invalid", async () => {
    const resp = await request(app)
      .patch(`/users/u1/jobs/${testJobIds[0]}`)
      .send({
        state: "nope",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});
