var fetch = require('node-fetch')

const PORT = process.env.OPENLAW_SEARCH_PORT | 8085

function checkFieldValueMatches(matchValue,resultValue){
    if(typeof matchValue === 'RegExp')
	return matchValue.test(resultValue)
    return resultValue==matchValue
}

const testResponseNotEmpty = [r => r.results.length>0 && r.total>0, "Must return results when 'search' parameter not provided"]
const testNumberOfResponses = n => [r => r.results.length==n, `Must return ${n} responses`]
const testResponseFieldsDefined = fields => [r => r.results.every(e => fields(e).every(isDefined)), "Must return correct fields per result"]
const testResponseMatches = matchEntries => [r => matchEntries
                                             .every(me => r.results
                                                    .some(re => Object.entries(me)
                                                          .every(fme => Object.entries(re)
                                                                 .some(rme => rme[0]==fme[0] && checkFieldValueMatches(fme[1],rme[1]))
                                                                )
                                                         )
                                                   ),
                                             `Must include responses: ${JSON.stringify(matchEntries)}`
                                            ]

var requestsAndTests = [
    // test no error
    [
        '/cases?search=test', []
    ],

    // test case_name fulltext search returns expected results
    [
        '/cases?case_name=SMITH', [testResponseNotEmpty, testResponseMatches([
            {caseName: "SMITH v ACCESSIBLE PROPERTIES NEW ZEALAND LIMITED [2019] NZCA 38 [8 March 2019]"},
            {caseName: "SMITH v SMITH [2019] NZHC 320 [1 March 2019]"},
            {caseName: "PGG WRIGHTSON SEEDS LTD v WHOLESALE SEEDS LTD & SMITH [2019] NZHC 377 [8 March 2019]"}
        ])]
    ],

    // make sure an exact case_name match returns only one result
    [
        '/cases?case_name=SMITH v SMITH [2019] NZHC 320 [1 March 2019]', [testNumberOfResponses(1), testResponseMatches([
            {caseName: "SMITH v SMITH [2019] NZHC 320 [1 March 2019]"}
        ])]
    ],

    // /cases response includes a highlighted excerpt if 'search' parameter is provided, and case_name is highlighted
    [
	'/cases?search=police', [testResponseNotEmpty, testResponseMatches([
	    {excerpt: /someRegexMakingSureDrivewayIsHighlighted/},
	    {caseName: "LANGLANDS v <b>POLICE</b> [2019] NZHC 214 [20 February 2019]"}
	])]
    ],

    // /cases response includes an excerpt with no higlights if 'search' filter is not provided
    [
	'/cases?start=0&end=1', [testResponseMatches([
	    {excerpt: /someRegexMakingSureNoHighlights/}
	])]
    ],

    // case_name search returns highlights in the case_name
    todo
    
    // 'court' filter returns correct number of matches
    [
        '/cases?court=Supreme Court', [testNumberOfResponses(2), testResponseMatches([
            {caseName: "JOHN GARRY DAVIDOFF v R [2019] NZSC 30 [20 March 2019]"},
            {caseName: "LAVERY v LAVERY [2019] NZHC 502 [20 March 2019]"}
        ])]
    ],

    // 'judgment_date_to' and 'judgment_date_from' parameters return expected cases 
    [
        '/cases?court=Supreme Court&judgment_date_from=2019-03-19&judgment_date_to=2019-03-20', [testResponseMatches([
            {caseName: "JOHN GARRY DAVIDOFF v R [2019] NZSC 30 [20 March 2019]"}
        ])]
    ],

    // correct fields are defined in /cases response
    [
        '/cases', [testResponseFieldsDefined(e => [e.caseId,e.caseName,e.citation,e.date]),testResponseNotEmpty]
    ],

    // correct fields are defined in /legislation/acts response
    [
        '/legislation/acts', [testResponseFieldsDefined(e => [e.actName]),testResponseNotEmpty]
    ],

    // correct fields are defined in /legislation/acts/<act>/sections response
    [
        '/legislation/acts/Criminal Procedure Act 2011/sections', [testResponseFieldsDefined(e => [e.actName,e.section]),testResponseNotEmpty]
    ],

    // correct fields are defined in /cases/names response
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
