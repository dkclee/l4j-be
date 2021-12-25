"use strict";
const { BadRequestError, NotFoundError } = require("../expressError");
const db = require("../db");

/** Related functions for applications. */

class Application {
  static async getForUsername(username) {
    const userExists = await db.query(`
      SELECT username
          FROM users
          WHERE username=$1`,
    [username]);
    if (userExists.rows[0] === undefined) {
      throw new BadRequestError(`User does not exist: ${username}`);
    }
    const appRes = await db.query(`
      SELECT title
            , salary
            , equity
            , id
            , handle AS companyHandle
            , companies.name AS companyName
        FROM applications
          JOIN jobs ON jobs.id = job_id
          JOIN companies ON company_handle = companies.handle
        WHERE username = $1`,
      [username]);
    
    const app = appRes.rows;
    return app;
  }
}


module.exports = Application;
