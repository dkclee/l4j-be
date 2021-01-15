"use strict";

/** Convenience middleware to handle common auth cases in routes. */

const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");
const { UnauthorizedError } = require("../expressError");


/** Middleware: Authenticate user.
 *
 * If a token was provided, verify it, and, if valid, store the token payload
 * on res.locals (this will include the username and isAdmin field.)
 *
 * It's not an error if no token was provided or if the token is not valid.
 */

function authenticateJWT(req, res, next) {
  try {
    const authHeader = req.headers && req.headers.authorization;
    if (authHeader) {
      const token = authHeader.replace(/^[Bb]earer /, "").trim();
      res.locals.user = jwt.verify(token, SECRET_KEY);
    }
    return next();
  } catch (err) {
    return next();
  }
}

/** Middleware to use when they must be logged in.
 *
 * If not, raises Unauthorized.
 */

function ensureLoggedIn(req, res, next) {
  try {
    if (res.locals.user?.username === undefined) throw new UnauthorizedError();
    return next();
  } catch (err) {
    return next(err);
  }
}

/** Middleware to use when they must be an admin.
 *
 * If not, raises Unauthorized.
 */

function ensureAdmin(req, res, next) {
  // return !undefined if no user is logged in
  // check if both there is a user logged in and if that user is an admin
  if (res.locals.user?.isAdmin !== true) throw new UnauthorizedError();
  return next();
}

/** Middleware to check if the user is an admin
 *  or is request for their routes
 *
 * If not, raises Unauthorized.
 */

function ensureAdminOrSelf(req, res, next) {
  try {
    // return !undefined if no user is logged in
    // check if both there is a user logged in and if that user is an admin
    let isAdmin = res.locals.user?.isAdmin === true;
    let isSelf = (req.params.username === res.locals.user?.username);
    if (!isAdmin && !isSelf) throw new UnauthorizedError();
    return next();
  } catch (err) {
    return next(err);
  }

}


module.exports = {
  authenticateJWT,
  ensureLoggedIn,
  ensureAdmin,
  ensureAdminOrSelf,
};
