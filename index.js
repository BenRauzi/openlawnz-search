const express = require('express');
const Pool = require('pg').Pool;

const app = express();
const DB_HOST = process.env.DB_HOST || 'localhost'
const DB_PORT = process.env.DB_PORT || 5000
const DB_NAME = process.env.DB_NAME || 'cases'
const DB_USER = process.env.DB_USER || 'root'
const DB_PASS = process.env.DB_PASS
const SCHEMA = process.env.SCHEMA || 'cases'
const PORT = process.env.PORT || 8085

// search parameter constants
const maxSearchLength = 160
const maxPageSize = 50
const defaultPageSize = 20;


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
    } else {
        var end = rawEnd;
    }

    if (rawSearch.length > maxSearchLength) {
        var search =  rawSearch.substring(0,maxSearchLength);
    } else {
        var search = rawSearch;
    }

    var results = getCases(start,end,search);
    
    return res.send(results);
});

function getCases(start,end,search) {
    return { total: 999999, results: [ { caseName: "hello", citation: "citation", date: "1/1/1982" } ] };
}

app.listen(PORT, () => { `Running on port ${PORT}` });
