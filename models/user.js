"use strict";

const db = require("../db");
const bcrypt = require("bcrypt");
const { sqlForPartialUpdate } = require("../helpers/sql");
const {
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
} = require("../expressError");

const { BCRYPT_WORK_FACTOR } = require("../config.js");
const STATES = new Set(['interested', 'applied', 'accepted', 'rejected']);

const generator = require("generate-password");

/** Related functions for users. */

class User {
  /** authenticate user with username, password.
   *
   * Returns { username, first_name, last_name, email, is_admin }
   *
   * Throws UnauthorizedError is user not found or wrong password.
   **/

  static async authenticate(username, password) {
    // try to find the user first
    const result = await db.query(
      `SELECT username,
                  password,
                  first_name AS "firstName",
                  last_name AS "lastName",
                  email,
                  is_admin AS "isAdmin"
           FROM users
           WHERE username = $1`,
      [username],
    );

    const user = result.rows[0];

    if (user) {
      // compare hashed password to a new hash from password
      const isValid = await bcrypt.compare(password, user.password);
      if (isValid === true) {
        delete user.password;
        return user;
      }
    }

    throw new UnauthorizedError("Invalid username/password");
  }

  /** Register user with data.
   *
   * Returns { username, firstName, lastName, email, isAdmin }
   *
   * Throws BadRequestError on duplicates.
   **/

  static async register(
    { username, password, firstName, lastName, email, isAdmin }) {
    const duplicateCheck = await db.query(
      `SELECT username
           FROM users
           WHERE username = $1`,
      [username],
    );

    if (duplicateCheck.rows[0]) {
      throw new BadRequestError(`Duplicate username: ${username}`);
    }

    password = password || User._generateRandomPassword(10);

    const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);

    const result = await db.query(
      `INSERT INTO users
           (username,
            password,
            first_name,
            last_name,
            email,
            is_admin)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING username, first_name AS "firstName", last_name AS "lastName", email, is_admin AS "isAdmin"`,
      [
        username,
        hashedPassword,
        firstName,
        lastName,
        email,
        isAdmin,
      ],
    );

    const user = result.rows[0];

    return user;
  }

  /** Find all users.
   *
   * Returns [{ username, first_name, last_name, email, is_admin, jobs }, ...]
   *  where jobs: [ jobId, jobId, ... ]
   **/

  static async findAll() {
    const userResult = await db.query(
      `SELECT username,
              first_name AS "firstName",
              last_name AS "lastName",
              email,
              is_admin AS "isAdmin"
           FROM users
           ORDER BY username`,
    );

    let users = userResult.rows;

    const usersJobsResult = await db.query(
      `SELECT username,
              job_id AS "jobId"
           FROM applications
           ORDER BY username`,
    );

    // [{username, jobId}, ...]
    let userJobInfos = usersJobsResult.rows;
    
    //  {"u1": [j1, j2]}
    let usernameToJobs = {};


    for (let userJobInfo of userJobInfos) {
      let {username, jobId} = userJobInfo;

      if (usernameToJobs[username] === undefined) {
        usernameToJobs[username] = [jobId];
      } else {
        usernameToJobs[username].push(jobId);
      }
    }

    for(let user of users) {
      user.jobs = usernameToJobs[user.username] || [];
    }

    return users;
  }

  /** Given a username, return data about user.
   *
   * Returns { username, first_name, last_name, is_admin, jobs }
   *   where jobs is [ jobId, jobId, ...]
   *
   * Throws NotFoundError if user not found.
   **/

  static async get(username) {
    const userRes = await db.query(
      `SELECT username,
              first_name AS "firstName",
              last_name AS "lastName",
              email,
              is_admin AS "isAdmin"
           FROM users
           WHERE username = $1`,
      [username],
    );

    const user = userRes.rows[0];

    if (!user) throw new NotFoundError(`No user: ${username}`);

    const jobRes = await db.query(
      `SELECT job_id AS "jobId"
           FROM applications
           WHERE username = $1`,
           [username]);

    user.jobs = jobRes.rows.map(j => j.jobId);

    return user;
  }

  /** Update user data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain
   * all the fields; this only changes provided ones.
   *
   * Data can include:
   *   { firstName, lastName, password, email, isAdmin }
   *
   * Returns { username, firstName, lastName, email, isAdmin }
   *
   * Throws NotFoundError if not found.
   *
   * WARNING: this function can set a new password or make a user an admin.
   * Callers of this function must be certain they have validated inputs to this
   * or a serious security risks are opened.
   */

  static async update(username, data) {
    if (data.password) {
      data.password = await bcrypt.hash(data.password, BCRYPT_WORK_FACTOR);
    }

    const { setCols, values } = sqlForPartialUpdate(
      data,
      {
        firstName: "first_name",
        lastName: "last_name",
        isAdmin: "is_admin",
      });
    const usernameVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE users 
                      SET ${setCols} 
                      WHERE username = ${usernameVarIdx} 
                      RETURNING username,
                                first_name AS "firstName",
                                last_name AS "lastName",
                                email,
                                is_admin AS "isAdmin"`;
    const result = await db.query(querySql, [...values, username]);
    const user = result.rows[0];

    if (!user) throw new NotFoundError(`No user: ${username}`);

    delete user.password;
    return user;
  }

  /** Delete given user from database; returns undefined. */

  static async remove(username) {
    let result = await db.query(
      `DELETE
           FROM users
           WHERE username = $1
           RETURNING username`,
      [username],
    );
    const user = result.rows[0];

    if (!user) throw new NotFoundError(`No user: ${username}`);
  }

  /** Given a username and jobId, add a job application
   * 
   * Throws NotFoundError if username or jobId is not found.
  */

  static async applyForJob(username, jobId) {
    // check if job exists
    const jobRes = await db.query(
      `SELECT id
           FROM jobs
           WHERE id = $1`,
      [jobId]);
    const job = jobRes.rows[0];
    if (!job) throw new NotFoundError(`No job: ${jobId}`);

    // check if user exists
    const userRes = await db.query(
      `SELECT username
           FROM users
           WHERE username = $1`,
      [username],
    );
    const user = userRes.rows[0];
    if (!user) throw new NotFoundError(`No user: ${username}`);

    // check if a user already applied to this job
    const appRes = await db.query(
      `SELECT username, job_id AS "jobId"
          FROM applications 
          WHERE username=$1 AND job_id = $2`,
      [username, jobId]);
    const application = appRes.rows[0];
    if (application) throw new BadRequestError(
      `User: ${username} Already applied to job${jobId}`);

    // create new job application
    await db.query(`
      INSERT INTO applications (username, job_id, state)
      VALUES ($1, $2, 'applied')`, [username, jobId]);
  }

  
  /** Given a username and jobId and status, update status for
   * job application.
   * 
   * Throws NotFoundError if username, jobId, or app is not found.
   * Throw bad request error if state is invalid
  */

 static async updateAppStatus(username, jobId, state) {
  // check if job exists
  const jobRes = await db.query(
    `SELECT id
         FROM jobs
         WHERE id = $1`,
    [jobId]);
  const job = jobRes.rows[0];
  if (!job) throw new NotFoundError(`No job: ${jobId}`);

  // check if user exists
  const userRes = await db.query(
    `SELECT username
         FROM users
         WHERE username = $1`,
    [username],
  );
  const user = userRes.rows[0];
  if (!user) throw new NotFoundError(`No user: ${username}`);

  // check if application exists
  const appRes = await db.query(
    `SELECT username, job_id AS "jobId"
        FROM applications 
        WHERE username=$1 AND job_id = $2`,
    [username, jobId]);
  const application = appRes.rows[0];
  if (!application) throw new NotFoundError(`
    No application: ${username}, ${jobId}`);

  // check if state is valid
  if (STATES.has(state) === false) throw new BadRequestError(`
    Invalid state: ${state}`);

  // update job application
  await db.query(`
    UPDATE applications 
    SET state=$1
    WHERE username=$2 AND job_id=$3`, [state, username, jobId ]);
}
  /** Generates a password of length made up of letters and numbers*/
  static _generateRandomPassword(length=10){
    // Generate a random password
    return generator.generate({
      length,
      numbers: true
    });
  }
}


module.exports = User;


// Using try and catch with parsing the error object
// "INSERT INTO applications (username, job_id) SELECT username, job_id FROM"