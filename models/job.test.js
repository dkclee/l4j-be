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

  // test("works: filter", async function () {
  //   const filter = {
  //     name: "c1"
  //   };
  //   let companies = await Company.findAll(filter);
  //   expect(companies).toEqual([
  //     {
  //       handle: "c1",
  //       name: "C1",
  //       description: "Desc1",
  //       numEmployees: 1,
  //       logoUrl: "http://c1.img",
  //     }
  //   ]);

  //   const filter2 = {
  //     minEmployees: 3
  //   };
  //   companies = await Company.findAll(filter2);
  //   expect(companies).toEqual([
  //     {
  //       handle: "c3",
  //       name: "C3",
  //       description: "Desc3",
  //       numEmployees: 3,
  //       logoUrl: "http://c3.img",
  //     }
  //   ]);

  //   const filter3 = {
  //     maxEmployees: 2
  //   };
  //   companies = await Company.findAll(filter3);
  //   expect(companies).toEqual([
  //     {
  //       handle: "c1",
  //       name: "C1",
  //       description: "Desc1",
  //       numEmployees: 1,
  //       logoUrl: "http://c1.img",
  //     },
  //     {
  //       handle: "c2",
  //       name: "C2",
  //       description: "Desc2",
  //       numEmployees: 2,
  //       logoUrl: "http://c2.img",
  //     }
  //   ]);

  //   // More complicated filtering
  //   const filter4 = {
  //     minEmployees: 2,
  //     maxEmployees: 3
  //   };
  //   companies = await Company.findAll(filter4);
  //   expect(companies).toEqual([
  //     {
  //       handle: "c2",
  //       name: "C2",
  //       description: "Desc2",
  //       numEmployees: 2,
  //       logoUrl: "http://c2.img",
  //     },
  //     {
  //       handle: "c3",
  //       name: "C3",
  //       description: "Desc3",
  //       numEmployees: 3,
  //       logoUrl: "http://c3.img",
  //     }
  //   ]);
  // });
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

// /************************************** _sqlForPartialFilter */


// describe("sqlForPartialFilter", function () {
//   test("works with valid data", function () {
//     const filterBy = { minEmployees: 3, name: "searchBy" };

//     const { whereClauses, values } = Company._sqlForPartialFilter(filterBy);

//     expect(whereClauses).toEqual('WHERE num_employees >= $1 AND name ILIKE $2');
//     expect(values).toEqual([3, '%searchBy%']);

//     const filterBy2 = { minEmployees: 1, maxEmployees: 5, name: "searchTerm" };

//     const result = Company._sqlForPartialFilter(filterBy2);
//     const whereClauses2 = result.whereClauses;
//     const values2 = result.values;

//     expect(whereClauses2).toEqual('WHERE num_employees >= $1 AND num_employees <= $2 AND name ILIKE $3');
//     expect(values2).toEqual([1, 5, '%searchTerm%']);
//   });

//   test("works even if filterBy is an empty object", function () {
//     const filterBy = {};

//     const { whereClauses, values } = Company._sqlForPartialFilter(filterBy);

//     expect(whereClauses).toEqual('');
//     expect(values).toEqual([]);
//   });

//   test("fails: minEmployees must be smaller than maxEmployees", function () {
//     const filter = {
//       minEmployees: 2,
//       maxEmployees: 1
//     };

//     try {
//       const { whereClauses, values } = Company._sqlForPartialFilter(filter);
//       fail();
//     } catch (err) {
//       expect(err instanceof BadRequestError).toBeTruthy();
//     }
//   });

// });
