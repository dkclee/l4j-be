"use strict";

const { sqlForPartialUpdate } = require("./sql");
const { BadRequestError } = require("../expressError");

/* Test for sqlForPartialUpdate */

describe("sqlForPartialUpdate", function () {
  test("works with valid data", function () {
    const dataToUpdate = { firstName: "test", age: 3 };
    const jsToSql = { firstName: "first_name" };

    const { setCols, values } = sqlForPartialUpdate(dataToUpdate, jsToSql);

    expect(setCols).toEqual('"first_name"=$1, "age"=$2');
    expect(values).toEqual(["test", 3]);
  });

  test("works even if jsToSql is empty", function () {
    const dataToUpdate = { last_name: "test2", age: 15 };
    const jsToSql = {};

    const { setCols, values } = sqlForPartialUpdate(dataToUpdate, jsToSql);

    expect(setCols).toEqual('"last_name"=$1, "age"=$2');
    expect(values).toEqual(["test2", 15]);
  });

  test("BadRequestError if dataToUpdate is empty", function () {
    const dataToUpdate = {};
    const jsToSql = { firstName: "first_name" };

    try {
      const { setCols, values } = sqlForPartialUpdate(dataToUpdate, jsToSql);
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });

});

