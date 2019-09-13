const express = require('express');
const Pool = require('pg').Pool;

const app = express();
const DB_HOST = process.env.DB_HOST || 'localhost'
const DB_PORT = process.env.DB_PORT || 5432
const DB_NAME = process.env.DB_NAME || 'cases'
const DB_USER = process.env.DB_USER || 'postgres'
const DB_PASS = process.env.DB_PASS
const SCHEMA = process.env.SCHEMA || 'cases'
const PORT = process.env.PORT || 8085

// search parameter constants
const maxSearchLength = 160
const maxPageSize = 5
const defaultPageSize = 2;

const pool = new Pool({
    user: DB_USER,
    host: DB_HOST,
    database: DB_NAME,
    password: DB_PASS,
    port: DB_PORT
});

function logInternalError(err,res) {
    console.error(err);
    res.status(500).send('Internal server error');
}

app.use(function(err, req, res, next) {
    logInternalError(err,res);
})

app.get('/cases', (req, res) => {
    var rawStart = parseInt(req.query.start)
    var rawEnd = parseInt(req.query.end);
    var rawSearch = req.query.search

    if (typeof(rawSearch) == "undefined") {
        return res.send({
            total: 0,
            results: []
        });
    }

    if (isNaN(rawStart)) {
        var start = 0;
    } else {
        var start = rawStart;
    }

    if (isNaN(rawEnd)) {
        var end = start+defaultPageSize;
    } else if (rawEnd > start+maxPageSize) {
        var end = start+maxPageSize;
    } else if (rawEnd < start) {
        var end = 0;
    } else {
        var end = rawEnd;
    }

    if (rawSearch.length > maxSearchLength) {
        var search =  rawSearch.substring(0,maxSearchLength);
    } else {
        var search = rawSearch;
    }

    pool.query(
        'SELECT * FROM cases.cases.get_search_results($1,$2,$3)',
        [search,start,end],
        (error,results) => {
            
            if (error) {
                return logInternalError(error,res);
            }

            var rows = results.rows;

            if(typeof(rows) == "undefined" || rows.length==0)
                return res.status(200).send({ total: 0, results: []});
            
            return res.status(200).send({
                total: rows[0].total_matches,
                results: rows.map((row) => {
                    return {
                        caseId: row.case_id,
                        caseName: row.case_name,
                        citation: row.citation,
                        date: row.date
                    };
                })
            });
        });
});

app.listen(PORT, () => { `Running on port ${PORT}` });
