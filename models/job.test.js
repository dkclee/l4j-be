"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
  const newJob = {
    title: "new",
    salary: 500,
    equity: 0.5,
    companyHandle: "c1",
  };

  test("works", async function () {
    let job = await Job.create(newJob);
    expect(job).toEqual({
      title: "new",
      salary: 500,
      equity: "0.5",
      companyHandle: "c1",
      id: expect.any(Number)
    });

    const result = await db.query(
      `SELECT title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE title = 'new'`);
    expect(result.rows).toEqual([
      {
        title: "new",
        salary: 500,
        equity: "0.5",
        companyHandle: "c1",
      },
    ]);
  });

  test("bad request if company handle doesn't exist", async function () {
    const newJobBadData = {
      title: "new",
      salary: 500,
      equity: 0.5,
      companyHandle: "notExist",
    };

    try {
      await Job.create(newJobBadData);
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** findAll */

describe("findAll", function () {
  test("works: no filter", async function () {
    let jobs = await Job.findAll();
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "j1",
        salary: 100,
        equity: "0.1",
        companyHandle: "c1",
      },
      {
        id: expect.any(Number),
        title: "j2",
        salary: 200,
        equity: "0.2",
        companyHandle: "c2",
      },
      {
        id: expect.any(Number),
        title: "j3",
        salary: 300,
        equity: "0.3",
        companyHandle: "c2",
      },
    ]);
  });

  test("works: filter", async function () {
    const filter = {
      title: "3"
    };
    let jobs = await Job.findAll(filter);
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "j3",
        salary: 300,
        equity: "0.3",
        companyHandle: "c2",
      }
    ]);

    const filter2 = {
      minSalary: 200
    };
    jobs = await Job.findAll(filter2);
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "j2",
        salary: 200,
        equity: "0.2",
        companyHandle: "c2",
      },
      {
        id: expect.any(Number),
        title: "j3",
        salary: 300,
        equity: "0.3",
        companyHandle: "c2",
      }
    ]);

    const filter3 = {
      hasEquity: false
    };
    jobs = await Job.findAll(filter3);
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "j1",
        salary: 100,
        equity: "0.1",
        companyHandle: "c1",
      },
      {
        id: expect.any(Number),
        title: "j2",
        salary: 200,
        equity: "0.2",
        companyHandle: "c2",
      },
      {
        id: expect.any(Number),
        title: "j3",
        salary: 300,
        equity: "0.3",
        companyHandle: "c2",
      },
    ]);

    // More complicated filtering
    const filter4 = {
      minSalary: 200,
      hasEquity: true
    };
    jobs = await Job.findAll(filter4);
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "j2",
        salary: 200,
        equity: "0.2",
        companyHandle: "c2",
      },
      {
        id: expect.any(Number),
        title: "j3",
        salary: 300,
        equity: "0.3",
        companyHandle: "c2",
      },
    ]);

    const filter5 = {
      title: "2",
      minSalary: 200,
      hasEquity: true
    };
    jobs = await Job.findAll(filter5);
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "j2",
        salary: 200,
        equity: "0.2",
        companyHandle: "c2",
      }
    ]);
  });
});

/************************************** get */

describe("get", function () {
  test("works", async function () {
    const newJob = {
      title: "new",
      salary: 500,
      equity: 0.5,
      companyHandle: "c1",
    };

    let jobCreated = await Job.create(newJob);
    const id = jobCreated.id;

    let job = await Job.get(id);
    expect(job).toEqual({
      id,
      title: "new",
      salary: 500,
      equity: "0.5",
      companyHandle: "c1",
    });
  });

  test("not found if no such job", async function () {
    try {
      await Job.get(0);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
/************************************** findAllByCompanyHandle */

describe("findAllByCompanyHandle", function () {
  test("works", async function () {
    let jobs = await Job.findAllByCompanyHandle("c1");
    expect(jobs).toEqual(
      [
        {
          id: expect.any(Number),
          title: "j1",
          salary: 100,
          equity: "0.1",
        }
      ]
    );

    let jobs2 = await Job.findAllByCompanyHandle("c2");
    expect(jobs2).toEqual(
      [
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
      ]
    );

    let jobs3 = await Job.findAllByCompanyHandle("c3");
    expect(jobs3).toEqual([]);
  });

  test("not found if no such job", async function () {
    try {
      await Job.findAllByCompanyHandle("Invalid Company Handle");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

// /************************************** update */

describe("update", function () {

  let updateData;
  let id;

  beforeEach(async function () {
    const newJob = {
      title: "newCreated",
      salary: 500,
      equity: 0.5,
      companyHandle: "c1",
    };

    updateData = {
      title: "newUpdate",
    }

    let jobCreated = await Job.create(newJob);
    id = jobCreated.id;

  });

  test("works", async function () {

    let job = await Job.update(id, updateData);
    expect(job).toEqual({
      id,
      title: "newUpdate",
      salary: 500,
      equity: "0.5",
      companyHandle: "c1",
    });

    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE id = ${id}`);
    expect(result.rows).toEqual([{
      id,
      title: "newUpdate",
      salary: 500,
      equity: "0.5",
      companyHandle: "c1",
    }]);
  });

  test("works: null fields", async function () {

    const updateDataSetNulls = {
      title: "newUpdate",
      salary: null,
      equity: null,
    };

    let job = await Job.update(id, updateDataSetNulls);
    expect(job).toEqual({
      id,
      title: "newUpdate",
      salary: null,
      equity: null,
      companyHandle: "c1",
    });

    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle AS "companyHandle"
          FROM jobs
          WHERE id = ${id}`);
    expect(result.rows).toEqual([{
      id,
      title: "newUpdate",
      salary: null,
      equity: null,
      companyHandle: "c1",
    }]);
  });

  test("not found if no such job", async function () {
    try {
      await Job.update(0, updateData);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {

    try {
      await Job.update(id, {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

// /************************************** remove */

describe("remove", function () {

  test("works", async function () {
    const newJob = {
      title: "newCreated",
      salary: 500,
      equity: 0.5,
      companyHandle: "c1",
    };

    const jobCreated = await Job.create(newJob);
    const id = jobCreated.id;

    await Job.remove(id);
    const res = await db.query(
      `SELECT id FROM jobs WHERE id=${id}`);
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such job", async function () {
    try {
      await Job.remove(0);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** _sqlForPartialFilter */


describe("sqlForPartialFilter", function () {
  test("works with valid data", function () {
    const filterBy = { minSalary: 200, hasEquity: true };

    const { whereClauses, values } = Job._sqlForPartialFilter(filterBy);

    expect(whereClauses).toEqual('WHERE salary >= $1 AND equity > 0');
    expect(values).toEqual([200]);

    const filterBy2 = { hasEquity: false };

    const result2 = Job._sqlForPartialFilter(filterBy2);
    const whereClauses2 = result2.whereClauses;
    const values2 = result2.values;

    expect(whereClauses2).toEqual('');
    expect(values2).toEqual([]);

    const filterBy3 = { minSalary: 200, title: '3' };

    const result3 = Job._sqlForPartialFilter(filterBy3);
    const whereClauses3 = result3.whereClauses;
    const values3 = result3.values;

    expect(whereClauses3).toEqual('WHERE title ILIKE $1 AND salary >= $2');
    expect(values3).toEqual(['%3%', 200]);
  });

  test("works even if filterBy is an empty object", function () {
    const filterBy = {};
    const { whereClauses, values } = Job._sqlForPartialFilter(filterBy);

    expect(whereClauses).toEqual('');
    expect(values).toEqual([]);
  });

});
