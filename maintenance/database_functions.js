const knex = require('knex');

const DB_HOST = process.env.DB_HOST || 'localhost'
const DB_PORT = process.env.DB_PORT || 5432
const DB_NAME = process.env.DB_NAME || 'cases'
const DB_USER = process.env.DB_USER || 'postgres'
const DB_PASS = process.env.DB_PASS
const PORT = process.env.PORT || 8085

function getDbPool() {
    return knex({
        client: 'pg',
        connection: {
            user: DB_USER,
            host: DB_HOST,
            database: DB_NAME,
            password: DB_PASS,
            port: DB_PORT
        }
    });
}

module.exports.getDbPool = getDbPool
