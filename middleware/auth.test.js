const jwt = require("jsonwebtoken");
const { UnauthorizedError } = require("../expressError");
const {
  authenticateJWT,
  ensureLoggedIn,
  ensureAdmin,
  ensureAdminOrSelf,
} = require("./auth");

const { SECRET_KEY } = require("../config");

const testJwt = jwt.sign({ username: "test", isAdmin: false }, SECRET_KEY);
const badJwt = jwt.sign({ username: "test", isAdmin: false }, "wrong");

/** ************************************ authenticateJWT */

describe("authenticateJWT", () => {
  test("works: via header", () => {
    expect.assertions(2);
    const req = { headers: { authorization: `Bearer ${testJwt}` } };
    const res = { locals: {} };
    const next = function (err) {
      expect(err).toBeFalsy();
    };
    authenticateJWT(req, res, next);
    expect(res.locals).toEqual({
      user: {
        iat: expect.any(Number),
        username: "test",
        isAdmin: false,
      },
    });
  });

  test("works: no header", () => {
    expect.assertions(2);
    const req = {};
    const res = { locals: {} };
    const next = function (err) {
      expect(err).toBeFalsy();
    };
    authenticateJWT(req, res, next);
    expect(res.locals).toEqual({});
  });

  test("works: invalid token", () => {
    expect.assertions(2);
    const req = { headers: { authorization: `Bearer ${badJwt}` } };
    const res = { locals: {} };
    const next = function (err) {
      expect(err).toBeFalsy();
    };
    authenticateJWT(req, res, next);
    expect(res.locals).toEqual({});
  });
});

/** ************************************ ensureLoggedIn */

describe("ensureLoggedIn", () => {
  test("works", () => {
    expect.assertions(1);
    const req = {};
    const res = { locals: { user: { username: "test", isAdmin: false } } };
    const next = function (err) {
      expect(err).toBeFalsy();
    };
    ensureLoggedIn(req, res, next);
  });

  test("unauth if no login", () => {
    expect.assertions(1);
    const req = {};
    const res = { locals: {} };
    const next = function (err) {
      expect(err instanceof UnauthorizedError).toBeTruthy();
    };
    ensureLoggedIn(req, res, next);
  });
});

/** ************************************ ensureAdmin */
// NOTE: in this function, we did a different type of testing since we removed the try/catch statement from the ensureAdmin.
describe("ensureAdmin", () => {
  test("works", () => {
    expect.assertions(1);
    const req = {};
    const res = { locals: { user: { username: "test", isAdmin: true } } };
    const next = function (err) {
      expect(err).toBeFalsy();
    };
    ensureAdmin(req, res, next);
  });

  test("unauth if no login", () => {
    const req = {};
    const res = { locals: {} };
    expect(() => {
      ensureAdmin(req, res);
    }).toThrow(UnauthorizedError);
  });

  test("unauth if not admin", () => {
    const req = {};
    const res = { locals: { user: { username: "test", isAdmin: false } } };
    expect(() => {
      ensureAdmin(req, res);
    }).toThrow(UnauthorizedError);
  });
});

/** ************************************ ensureAdminOrSelf */

describe("ensureAdminOrSelf", () => {
  test("works if user is admin and is self", () => {
    expect.assertions(1);
    const req = {
      params: {
        username: "test",
      },
    };
    const res = { locals: { user: { username: "test", isAdmin: true } } };
    const next = function (err) {
      expect(err).toBeFalsy();
    };
    ensureAdminOrSelf(req, res, next);
  });

  test("works if user is admin but not self", () => {
    expect.assertions(1);
    const req = {
      params: {
        username: "notTest",
      },
    };
    const res = { locals: { user: { username: "test", isAdmin: true } } };
    const next = function (err) {
      expect(err).toBeFalsy();
    };
    ensureAdminOrSelf(req, res, next);
  });

  test("works if non-admin user is self", () => {
    expect.assertions(1);
    const req = {
      params: {
        username: "test",
      },
    };
    const res = { locals: { user: { username: "test", isAdmin: false } } };
    const next = function (err) {
      expect(err).toBeFalsy();
    };
    ensureAdminOrSelf(req, res, next);
  });

  test("unauth if not an admin and not self", () => {
    expect.assertions(1);
    const req = {
      params: {
        username: "notTest",
      },
    };
    const res = { locals: { user: { username: "test", isAdmin: false } } };
    const next = function (err) {
      expect(err instanceof UnauthorizedError).toBeTruthy();
    };
    ensureAdminOrSelf(req, res, next);
  });

  test("unauth if no login", () => {
    expect.assertions(1);
    const req = {
      params: {
        username: "notTest",
      },
    };
    const res = { locals: {} };
    const next = function (err) {
      expect(err instanceof UnauthorizedError).toBeTruthy();
    };
    ensureAdminOrSelf(req, res, next);
  });
});
