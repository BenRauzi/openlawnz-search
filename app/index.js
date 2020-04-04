const express = require('express')
const cors = require('cors')
const sf = require('./searchFunctions.js')

const app = express();
const PORT = process.env.OPENLAW_SEARCH_PORT || 8085

// search parameter constants
const maxSearchLength = 160
const maxPageSize = 50
const defaultPageSize = 20;

function logInternalError(err,res) {
    console.error(err);
    res.status(500).send({error:'Internal server error'});
}

function getSearchString(req) {
    var rawSearch = req.query.search

    if (!rawSearch)
        rawSearch = "";

    if (rawSearch.length > maxSearchLength) {
        return rawSearch.substring(0,maxSearchLength);
    } else {
        return rawSearch;
    }
}

function getPaginationFromQuery(req) {
    var rawStart = parseInt(req.query.start)
    var rawEnd = parseInt(req.query.end);

    var pagination = {}

    if (isNaN(rawStart)) {
        pagination.start = 0;
    } else {
        pagination.start = rawStart;
    }
    
    if (isNaN(rawEnd)) {
        pagination.end = pagination.start+defaultPageSize;
    } else if (rawEnd > pagination.start+maxPageSize) {
        pagination.end = pagination.start+maxPageSize;
    } else if (rawEnd < pagination.start) {
        pagination.end = 0;
    } else {
        pagination.end = rawEnd;
    }

    return pagination
}

function handleSearchQuery(resultsPromise, next, res)
{
    resultsPromise
	.then(results => {
	    res
		.status(200)
		.send(results)
	})
	.catch(error => {
	    next(error)
	})
}

app.use(cors());

app.use(function(err, req, res, next) {
    logInternalError(err,res);
})

app.get('/legislation/acts', (req, res, next) => {
    handleSearchQuery(
	sf.searchActs(getPaginationFromQuery(req),getSearchString(req)),
	next, res
    )
})

app.get('/legislation/acts/:actTitle/sections', (req, res, next) => {
    handleSearchQuery(
	sf.searchActsSections(
	    getPaginationFromQuery(req),
	    getSearchString(req),
	    req.params.actTitle ? req.params.actTitle : ""),
	next,res
    )
})

app.get('/cases/names', (req, res, next) => {
    handleSearchQuery(
	sf.searchCaseNames(getPaginationFromQuery(req),getSearchString(req)),
	next,res
    )
})

app.get('/cases', (req, res, next) => {
    handleSearchQuery(
	sf.searchCases(getPaginationFromQuery(req),getSearchString(req),req.query),
	next,res
    )
})

app.listen(PORT, () => { `Running on port ${PORT}` });
