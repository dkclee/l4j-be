\echo 'Delete and recreate l4j db?'
\prompt 'Return for yes or control-C to cancel > ' foo

DROP DATABASE l4j;
CREATE DATABASE l4j;
\connect l4j

\i l4j-schema.sql
\i l4j-seed.sql

\echo 'Delete and recreate l4j_test db?'
\prompt 'Return for yes or control-C to cancel > ' foo

DROP DATABASE l4j_test;
CREATE DATABASE l4j_test;
\connect l4j_test

\i l4j-schema.sql
