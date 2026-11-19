/**
 * Migration 1: Create session table for connect-pg-simple
 * Stores authenticated user sessions persistently in PostgreSQL.
 */
exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS "session" (
      "sid" varchar NOT NULL COLLATE "default",
      "sess" json NOT NULL,
      "expire" timestamp(6) NOT NULL,
      CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE
    );
    CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");
  `);
};

exports.down = (pgm) => {
  pgm.sql(`DROP TABLE IF EXISTS "session" CASCADE;`);
};
