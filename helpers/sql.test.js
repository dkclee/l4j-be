"use strict";

const { sqlForPartialUpdate } = require("./sql");

/* Test for sqlForPartialUpdate */

describe("sqlForPartialUpdate", function () {
  test("works with valid data", function () {
    const dataToUpdate = {firstName: "test", age: 3};
    const jsToSql = {firstName: "first_name"};

    const { setCols, values } = sqlForPartialUpdate(dataToUpdate, jsToSql); 

    expect(setCols).toEqual('"first_name"=$1, "age"=$2');
    expect(values).toEqual(["test", 3]);
    
  });


  
});