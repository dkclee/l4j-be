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

/************************************** GET /jobs/:id */

describe("GET /applications/:username", function () {

  test("works for an existing user", async function () {
    const resp = await request(app)
      .get(`/applications/u1`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      apps: [
        {
          title: 'j1', 
          salary: 100,
          equity: "0.1",
          id: expect.any(Number),
        },
        {
          title: 'j2', 
          salary: 200,
          equity: "0.2",
          id: expect.any(Number),
        }
      ]
    });
  });

  test("test for a non-existing user", async function () {
    const resp = await request(app).get(`/applicaitons/0`)
      .set("authorization", `Bearer ${u1Token}`);;
    expect(resp.body).toEqual({
      "error": {
          "message": "User does not exist: 0",
          "status": 400
      }
    });
  });

  test("test for passing max length of username", async function () {
    const resp = await request(app).get(`/applicaitons/01231378132987312789123789123789`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      "error": {
        "message": [
            "instance.username does not meet maximum length of 25"
        ],
        "status": 400
      }
    });
  });

  test("test for requesting jobs apps for u2 as u1", async function () {
    const resp = await request(app).get(`/applicaitons/01231378132987312789123789123789`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      "error": {
        "message": [
            "instance.username does not meet maximum length of 25"
        ],
        "status": 400
      }
    });
  });
});

