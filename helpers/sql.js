"use strict";

const { BadRequestError } = require("../expressError");

/** Translate data to update into SQL Format. 
 * Takes in:
 *  dataToUpdate: JS object with key-value pairs to update in database
 *  jsToSql: JS object with JS name as key and SQL column name as value
 *    Only includes names that are different.  
 * 
 * Returns:
 *  setCols: string of column names equal to SQL parameter 
 *    '"first_name"=$1, "age"=$2'
 *  values: list of values to update for the columns given in setCols
 * 
 * Throws a BadRequest error if no data given.
*/

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}


/** Translate data to filter into SQL Format. 
 * Takes in:
 *  filterBy: JS object with key-value pairs to filter in database
 * 
 * Returns:
 *  whereCols: string that contains the where clause of the SQL query 
 *             if filterBy has minEmployees, maxEmployees or name
 *             - empty string if the keys above are not present
 *  values: array of values to search by in the SQL query
 *          - empty array if keys are not present
 *  
 *  Example: 
 * { 
 *    whereCols: "WHERE num_employees >= $1 AND name ILIKE $2",
 *    values: [4, '%searchTerm%']
 * }
 * 
*/

function sqlForPartialFilter(filterBy) {
  if (filterBy === undefined || Object.keys(filterBy).length === 0) {
    return {
      whereCols: '',
      values: [],
    }
  }

  const whereCols = [];
  const values = [];

  if (filterBy.minEmployees) {
    whereCols.push(`num_employees >= $${whereCols.length + 1}`);
    values.push(filterBy.minEmployees);
  }

  if (filterBy.maxEmployees) {
    whereCols.push(`num_employees <= $${whereCols.length + 1}`);
    values.push(filterBy.maxEmployees);
  }

  if (filterBy.name) {
    whereCols.push(`name ILIKE $${whereCols.length + 1}`);
    values.push(`%${filterBy.name}%`);
  }

  return {
    whereCols: 'WHERE ' + whereCols.join(" AND "),
    values,
  };
}

module.exports = { sqlForPartialUpdate, sqlForPartialFilter };
