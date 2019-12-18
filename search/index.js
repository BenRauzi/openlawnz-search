const express = require('express');
const cors = require('cors');
const knex = require('knex');

const app = express();
const DB_HOST = process.env.DB_HOST || 'localhost'
const DB_PORT = process.env.DB_PORT || 5432
const DB_NAME = process.env.DB_NAME || 'cases'
const DB_USER = process.env.DB_USER || 'postgres'
const DB_PASS = process.env.DB_PASS
const SCHEMA = process.env.SCHEMA || 'cases'
const PORT = process.env.OPENLAW_SEARCH_PORT || 8085

const pg = knex({
    client: 'pg',
    connection: {
        user: DB_USER,
        host: DB_HOST,
        database: DB_NAME,
        password: DB_PASS,
        port: DB_PORT
    }
})

// search parameter constants
const maxSearchLength = 160
const maxPageSize = 50
const defaultPageSize = 20;

// other constants
const sUndefined = "undefined"

function logInternalError(err,res) {
    console.error(err);
    res.status(500).send({error:'Internal server error'});
}

function createSearchQuery(knexQuery,pagination) {
    return knexQuery
        .offset(pagination.start)
        .limit(pagination.end-pagination.start)
        .orderBy('rank','desc')
}

function createCountQuery(knexQuery) {
    return knexQuery.count()
}

function isDefined(variable) {
    return typeof variable != sUndefined;
}

function equalsJson(query,field,string) {
    query.whereRaw(`document->>'${field}' = ?`,string)
}

function getSearchString(req) {
    var rawSearch = req.query.search

    if (!isDefined(rawSearch))
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

    pagination = {}

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

function handleSearchQuery(searchQuery, countQuery, resultMapper, next, res)
{
    searchQuery
        .then(rows => {
            if(!isDefined(rows) || rows.length==0)
                return res.status(200).send({ total: 0, results: []});
            
            countQuery
                .then(countRows => {
                    var totalCount = countRows[0].count

                    return res.status(200).send({
                        total: totalCount,
                        results: rows.map(resultMapper)
                    })
                })
                .catch(err => {
                    console.error(err)
                    console.error(countQuery.toString())
                    next(err)
                })
        })
        .catch(error => {
            console.error(searchQuery.toString())
            console.error(error);
            next(error);
        });
}

app.use(cors());

app.use(function(err, req, res, next) {
    logInternalError(err,res);
})

app.get('/legislation/acts', (req, res, next) => {
    var pagination = getPaginationFromQuery(req);
    var search = getSearchString(req);

    var query = pg
        .from(pg.raw(`search.legislation_documents s, plainto_tsquery('english',?) query`, [search]))

    if (search != "")
        query.whereRaw('query @@ search_document')

    var countQuery = createCountQuery(query.clone())
    var searchQuery = createSearchQuery(query.clone(), pagination)
        .select(pg.raw(`ts_rank_cd('{0.5,0.7,0.9,1.0}',search_document,query) AS RANK`))
        .select(`s.title`)

    handleSearchQuery(
        searchQuery,
        countQuery,
        (row) => { return { actName: row.title  }},
        next,
        res)
})

app.get('/legislation/acts/:actTitle/sections', (req, res, next) => {
    var pagination = getPaginationFromQuery(req)
    var search = getSearchString(req)
    var actTitle = req.params.actTitle
    actTitle = isDefined(actTitle) ? actTitle : ""

    var query = pg
        .from('search.legislation_act_section_documents')
        .whereRaw(`"section" ILIKE ?||'%'`, [search])
        .where('title',actTitle)
    var countQuery = createCountQuery(query.clone())
    var searchQuery = createSearchQuery(query.clone(), pagination)
        .select('title')
        .select('section')
        .select(pg.raw('1 AS rank')) // don't rank this for now, might add later
    
    handleSearchQuery(
        searchQuery,
        countQuery,
        (row) => {
            return {
                actName: row.title,
                section: row.section
            }
        },
        next,
        res)
})

app.get('/cases/names', (req, res, next) => {
    var pagination = getPaginationFromQuery(req);
    var search = getSearchString(req)
    var query = pg
        .from(pg.raw(`search.case_search_documents s, plainto_tsquery('english',?) query`, [search]))

    if (search !== '')
        query.whereRaw('query @@ "case_name_search_document"')

    var countQuery = createCountQuery(query.clone())
    var searchQuery = createSearchQuery(query.clone(), pagination)
        .select(pg.raw(`ts_rank_cd('{0.5,0.7,0.9,1.0}',"case_name_search_document",query) AS RANK`))
        .select(pg.raw(`s.document->>'case_name' AS case_name`))
    
    handleSearchQuery(
        searchQuery,
        countQuery,
        (row) => {
            return {
                caseName: row.case_name,
            }
        },
        next,
        res
    )
});

function getBaseQuery(searchTable,searchTerms) {
    var tsQueries = searchTerms
        .map((_,idx) => `plainto_tsquery('english',?) query${idx}`)
        .join()
    
    var query = pg.from(pg.raw(`${searchTable}, ${tsQueries}`, searchTerms.map(t => t[0])))

    searchTerms.forEach((term,idx) => {
        var search = term[0]
        var column = term[1]
        
        if (search !== "")
            query.whereRaw(`query${idx} @@ "${column}"`)
    })

    return query;
}

app.get('/cases', (req, res, next) => {
    var search = getSearchString(req)
    var pagination = getPaginationFromQuery(req)

    // get full-text search terms
    var searchTerms = [[search,"full_text_search_document"]]
    if (isDefined(req.query.case_name))
        searchTerms.push([req.query.case_name,"case_name_search_document"])
    
    var query = getBaseQuery("search.case_search_documents",searchTerms)    
    
    //if (isDefined(req.query.case_name))
    //    equalsJson(query,'case_name',req.query.case_name)
    if (isDefined(req.query.court))
        equalsJson(query,'court',req.query.court)
    if (isDefined(req.query.legislation_act))
        query.whereRaw(`document->'legislation' @> ANY(ARRAY [?]::jsonb[])`,`[{"title":"${req.query.legislation_act}"}]`)
    if (isDefined(req.query.legislation_section))
        query.whereRaw(`document->'legislation' @> ANY(ARRAY [?]::jsonb[])`,`[{"section":"${req.query.legislation_section}"}]`)
    if (isDefined(req.query.judgment_date_from)) {
        var date = new Date(req.query.judgment_date_from)
        if (!isNaN(date))
            query.whereRaw("document->>'case_date' > ?",date)
    }
    if (isDefined(req.query.judgment_date_to)) {
        var date = new Date(req.query.judgment_date_to)
        if (!isNaN(date))
            query.whereRaw("document->>'case_date' < ?",date)
    }

    var countQuery = createCountQuery(query.clone())
    var searchQuery = createSearchQuery(query.clone(),pagination)
        .select(pg.raw(`ts_rank_cd('{0.5,0.7,0.9,1.0}',"full_text_search_document",query0) AS RANK`))
        .select('document')

    var resultMapper = row => {
        return {
            caseId: row.document.case_id,
            caseName: row.document.case_name,
            citation: row.document.citation,
            date: row.document.date
        }
    }
    
    handleSearchQuery(
        searchQuery,
        countQuery,
        resultMapper,
        next,
        res)
})

app.listen(PORT, () => { `Running on port ${PORT}` });
