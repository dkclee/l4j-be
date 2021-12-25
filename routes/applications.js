"use strict";

/** Routes for users. */

const jsonschema = require("jsonschema");

const express = require("express");
const { ensureAdmin, ensureAdminOrSelf, ensureLoggedIn } = require("../middleware/auth");
const { BadRequestError } = require("../expressError");
const Application = require("../models/application");
const { createToken } = require("../helpers/tokens");
const userAppsSchema = require("../schemas/userApps.json");

const router = express.Router();


/** GET /[username] => { applications }
 * 
 * 
 * Returns list of all user's applications.
 *
 * Authorization required: self
 **/

router.get("/", ensureAdminOrSelf, async function (req, res) {
  const {username} = res.locals.user;
  console.log(res.locals.user);
  const validator = jsonschema.validate({username}, userAppsSchema);
  if (!validator.valid) {
    const errs = validator.errors.map(e => e.stack);
    throw new BadRequestError(errs);
  }

  const apps = await Application.getForUsername(username);
  return res.json({ apps });
});


module.exports = router;
