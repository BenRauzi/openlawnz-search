const express = require('express')
const cors = require('cors')
const swaggerUi = require('swagger-ui-express')
const sf = require('./searchFunctions.js')
const openApiTools = require('./openApiTools.js')
const getOpenApiSpec = require('./openApiSpec.js')

const app = express();
const PORT = process.env.OPENLAW_SEARCH_PORT || 8085

// search parameter constants
// once 'end' parameter has been removed, these can be too
const maxSearchLength = 160
const maxPageSize = 50

const spec = getOpenApiSpec({
    getActs: (req, res) => 
	    sf.searchActs(getPaginationFromQuery(req),req.query.search),

    getActSections: (req, res) =>
	    sf.searchActsSections(
		getPaginationFromQuery(req),
		req.query.search,
		req.params.actTitle),

    getCaseNames: (req, res) =>
	    sf.searchCaseNames(getPaginationFromQuery(req),req.query.search),

    getCases: (req, res) =>
	    sf.searchCases(getPaginationFromQuery(req),req.query.search,req.query),
}) 
const specReadable = openApiTools.createYamlSpec(spec)

function logInternalError(err,res) {
    console.error(err);
    res.status(500).send({error:'Internal server error'});
}

function getPaginationFromQuery(req) {
    // this function only exists to support the legacy 'end' parameter
    // once this is deprecated, we can just rely on the OpenAPI spec argument
    // checking
    var rawEnd = req.query.end

    var pagination = { start: req.query.start }
    
    if (isNaN(rawEnd)) {
        pagination.end = pagination.start+req.query.count
    } else if (rawEnd > pagination.start+maxPageSize) {
        pagination.end = pagination.start+maxPageSize
    } else if (rawEnd < pagination.start) {
        pagination.end = pagination.start+req.query.count
	console.error(pagination.end,req.query.count)
    } else {
        pagination.end = rawEnd;
    }

    return pagination
}

function handleSearchQuery(handleFunction, req, res, next)
{
    handleFunction(req,res)
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

app.use('/docs/v1/ui', swaggerUi.serve, swaggerUi.setup(spec))

app.get('/docs/v1/spec', (req,res,next) => res.set('Content-Type','text/plain').send(specReadable))

app.use(function(err, req, res, next) {
    logInternalError(err,res);
})

openApiTools.addRoutes(app,spec,handleSearchQuery)

app.listen(PORT, () => { `Running on port ${PORT}` })

module.exports = app
