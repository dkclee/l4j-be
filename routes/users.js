"use strict";

/** Routes for users. */

const jsonschema = require("jsonschema");

const express = require("express");
const { ensureAdmin, ensureAdminOrSelf } = require("../middleware/auth");
const { BadRequestError } = require("../expressError");
const User = require("../models/user");
const { createToken } = require("../helpers/tokens");
const userNewSchema = require("../schemas/userNew.json");
const userUpdateSchema = require("../schemas/userUpdate.json");

const router = express.Router();


/** POST / { user }  => { user, token }
 *
 * Adds a new user. This is not the registration endpoint --- instead, this is
 * only for admin users to add new users. The new user being added can be an
 * admin. When an admin creates a new user, their password is randomly set which
 * the user can change later on. 
 *
 * This returns the newly created user and an authentication token for them:
 *  {user: { username, firstName, lastName, email, isAdmin }, token }
 *
 * Authorization required: admin
 **/

router.post("/", ensureAdmin, async function (req, res, next) {
  const validator = jsonschema.validate(req.body, userNewSchema);
  if (!validator.valid) {
    const errs = validator.errors.map(e => e.stack);
    throw new BadRequestError(errs);
  }

  const user = await User.register(req.body);
  const token = createToken(user);
  return res.status(201).json({ user, token });
});


/** GET / => { users: [ {username, firstName, lastName, email, jobs }, ... ] }
 *          where jobs: [ jobId, jobId, ...]
 * Returns list of all users.
 *
 * Authorization required: admin
 **/

router.get("/", ensureAdmin, async function (req, res, next) {
  const users = await User.findAll();
  return res.json({ users });
});


/** GET /[username] => { user }
 *
 * Returns { username, firstName, lastName, isAdmin, jobs }
 *      where jobs: [ jobId, jobId, ...]
 * Authorization required: admin or self
 **/

router.get("/:username", ensureAdminOrSelf, async function (req, res, next) {
  const user = await User.get(req.params.username);
  return res.json({ user });
});


/** PATCH /[username] { user } => { user }
 *
 * Data can include:
 *   { firstName, lastName, password, email }
 *
 * Returns { username, firstName, lastName, email, isAdmin }
 *
 * Authorization required: admin or self
 **/

router.patch("/:username", ensureAdminOrSelf, async function (req, res, next) {
  const validator = jsonschema.validate(req.body, userUpdateSchema);
  if (!validator.valid) {
    const errs = validator.errors.map(e => e.stack);
    throw new BadRequestError(errs);
  }

  const user = await User.update(req.params.username, req.body);
  return res.json({ user });
});


/** DELETE /[username]  =>  { deleted: username }
 *
 * Authorization required: admin or self
 **/

router.delete("/:username", ensureAdminOrSelf, async function (req, res, next) {
  await User.remove(req.params.username);
  return res.json({ deleted: req.params.username });
});


/** POST /[username]/jobs/[id]  =>  { applied: jobId }
 * 
 * Create a job application for a given username and job id. 
 *
 * Authorization required: admin or self
 **/

router.post("/:username/jobs/:id", 
            ensureAdminOrSelf, 
            async function (req, res, next) {
  await User.applyForJob(req.params.username, req.params.id);
  return res.json({ applied: +req.params.id });
});


/** PATCH /[username]/jobs/[id]  =>  { updated: state }
 * 
 * Update a job application for a given username and job id and state. 
 *
 * Authorization required: admin or self
 **/

router.patch("/:username/jobs/:id", 
            ensureAdminOrSelf, 
            async function (req, res, next) {
  await User.updateAppStatus(req.params.username, req.params.id, req.body.state);
  return res.json({ updated: req.body.state });
});


module.exports = router;
