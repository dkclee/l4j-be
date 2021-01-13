"use strict";

const { sqlForPartialUpdate, sqlForPartialFilter } = require("./sql");
const { BadRequestError } = require("../expressError");

/* Test for sqlForPartialUpdate */

describe("sqlForPartialUpdate", function () {
  test("works with valid data", function () {
    const dataToUpdate = {firstName: "test", age: 3};
    const jsToSql = {firstName: "first_name"};

    const { setCols, values } = sqlForPartialUpdate(dataToUpdate, jsToSql); 

    expect(setCols).toEqual('"first_name"=$1, "age"=$2');
    expect(values).toEqual(["test", 3]);
  });

  test("works even if jsToSql is empty", function () {
    const dataToUpdate = {last_name: "test2", age: 15};
    const jsToSql = {};

    const { setCols, values } = sqlForPartialUpdate(dataToUpdate, jsToSql); 

    expect(setCols).toEqual('"last_name"=$1, "age"=$2');
    expect(values).toEqual(["test2", 15]);
  });

  test("BadRequestError if dataToUpdate is empty", function () {
    const dataToUpdate = {};
    const jsToSql = {firstName: "first_name"};

    try {
      const { setCols, values } = sqlForPartialUpdate(dataToUpdate, jsToSql); 
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
  
});

describe("sqlForPartialFilter", function () {
  test("works with valid data", function () {
    const filterBy = {minEmployees: 3, name:"searchBy"};

    const { whereCols, values } = sqlForPartialFilter(filterBy); 

    expect(whereCols).toEqual('WHERE num_employees >= $1 AND name ILIKE $2');
    expect(values).toEqual([3, '%searchBy%']);

    const filterBy2 = {minEmployees: 1, maxEmployees:5, name:"searchTerm"};

    const result = sqlForPartialFilter(filterBy2); 
    const whereCols2 = result.whereCols;
    const values2 = result.values;

    expect(whereCols2).toEqual('WHERE num_employees >= $1 AND num_employees <= $2 AND name ILIKE $3');
    expect(values2).toEqual([1, 5, '%searchTerm%']);
  });

  test("works even if filterBy is an empty object", function () {
    const filterBy = {};

    const { whereCols, values } = sqlForPartialFilter(filterBy); 

    expect(whereCols).toEqual('');
    expect(values).toEqual([]);
  });

});