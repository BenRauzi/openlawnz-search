var fetch = require('node-fetch')

const PORT = process.env.OPENLAW_SEARCH_PORT | 8085

const testResponseNotEmpty = [r => r.results.length>0 && r.total>0, "Must return results when 'search' parameter not provided"]
const testResponseFieldsDefined = fields => [r => r.results.every(e => fields(e).every(isDefined)), "Must return correct fields per result"]      

var requestsAndTests = [
    [
        '/cases?search=test', []
    ],
    [
        '/cases', [testResponseFieldsDefined(e => [e.caseId,e.caseName,e.citation,e.date]),testResponseNotEmpty]
    ],
    [
        '/legislation/acts', [testResponseFieldsDefined(e => [e.actName]),testResponseNotEmpty]
    ],
    [
        '/legislation/acts/Criminal Procedure Act 2011/sections', [testResponseFieldsDefined(e => [e.actName,e.section]),testResponseNotEmpty]
    ],
    [
        '/cases/names', [testResponseFieldsDefined(e => [e.caseName]),testResponseNotEmpty]
    ],
]

var testPromises = requestsAndTests
    .map(async testCase => {
        var requestUri = testCase[0]
        var tests = testCase[1]

        var resp = await fetch(`http://localhost:${PORT}${requestUri}`)
        var body = await resp.json()

        var errors = tests
            .map(t => t[0](body) ? null : `Request: ${requestUri} Error: ${t[1]}`)
            .filter(r => r!=null)

        return errors;
    })

var errors = Promise
    .all(testPromises)
    .then(errors => {
        if (errors.length>0) {
            errors.flat().forEach(err => { console.log(err) })
            process.exit(1)
        }
    })
    
function isDefined(x) {
    return typeof x !== "undefined"
}
