const knex = require('knex')

const DB_HOST = process.env.DB_HOST || 'localhost'
const DB_PORT = process.env.DB_PORT || 5432
const DB_NAME = process.env.DB_NAME || 'cases'
const DB_USER = process.env.DB_USER || 'postgres'
const DB_PASS = process.env.DB_PASS

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

function createSearchQuery(knexQuery,pagination) {
    return knexQuery
        .offset(pagination.start)
        .limit(pagination.end-pagination.start)
        .orderBy('rank','desc')
}

function getBaseQuery(searchTable,searchTerms) {
    var tsQueries = searchTerms
        .map((_,idx) => `plainto_tsquery('english',?) query${idx}`)
        .join()
    
    var query = pg.from(pg.raw(`${searchTable}, ${tsQueries}`, searchTerms.map(t => t[0])))

    searchTerms.forEach((term,idx) => {
        var search = term[0]
        var column = term[1]
        
        if (search)
            query.whereRaw(`query${idx} @@ "${column}"`)
    })

    return query;
}

function createCountQuery(knexQuery) {
    return knexQuery.count()
}

function equalsJson(query,field,string) {
    query.whereRaw(`document->>'${field}' = ?`,string)
}

function getResultsList(searchQuery, countQuery, resultMapper) {
    return searchQuery
        .then(rows => {
            if(!rows || rows.length==0)
                return { total: 0, results: []};
            
            return countQuery
                .then(countRows => {
                    var totalCount = countRows[0].count

                    return {
                        total: totalCount,
                        results: rows.map(resultMapper)
                    }
                })
                .catch(err => {
                    console.error(err)
                    console.error(countQuery.toString())
		    throw error
                })
        })
        .catch(error => {
            console.error(searchQuery.toString())
            console.error(error)
	    throw error
        });
}

/* API functions */
function searchActs(pagination, search) {
    var query = pg
        .from(pg.raw(`search.legislation_documents s, plainto_tsquery('english',?) query`, [search]))
    
    if (search)
        query.whereRaw('query @@ search_document')

    var countQuery = createCountQuery(query.clone())
    var searchQuery = createSearchQuery(query.clone(), pagination)
        .select(pg.raw(`ts_rank_cd('{0.5,0.7,0.9,1.0}',search_document,query) AS RANK`))
        .select(`s.title`)

    return getResultsList(
        searchQuery,
        countQuery,
        (row) => { return { actName: row.title  }}
    )
}

function searchActsSections(pagination, search, actTitle) {
    var query = pg
        .from('search.legislation_act_section_documents')
        .whereRaw(`"section" ILIKE ?||'%'`, [search])
        .where('title',actTitle)
    var countQuery = createCountQuery(query.clone())
    var searchQuery = createSearchQuery(query.clone(), pagination)
        .select('title')
        .select('section')
        .select(pg.raw('1 AS rank')) // don't rank this for now, might add later
    
    return getResultsList(
        searchQuery,
        countQuery,
        (row) => {
            return {
                actName: row.title,
                section: row.section
            }
        }
    )
}

function searchCaseNames(pagination, search) {
    var query = pg
        .from(pg.raw(`search.case_search_documents s, plainto_tsquery('english',?) query`, [search]))

    if (search)
        query.whereRaw('query @@ "case_name_search_document"')

    var countQuery = createCountQuery(query.clone())
    var searchQuery = createSearchQuery(query.clone(), pagination)
        .select(pg.raw(`ts_rank_cd('{0.5,0.7,0.9,1.0}',"case_name_search_document",query) AS RANK`))
        .select(pg.raw(`s.document->>'case_name' AS case_name`))
    
    return getResultsList(
        searchQuery,
        countQuery,
        (row) => {
            return {
                caseName: row.case_name,
            }
        }
    )
}

function searchCases(pagination, search, params) {
    var searchTerms = [[search,"full_text_search_document"]]
    if (params.case_name)
        searchTerms.push([params.case_name,"case_name_search_document"])
    
    var query = getBaseQuery("search.case_search_documents",searchTerms)    
    
    if (params.court)
        equalsJson(query,'court_name',params.court)
    if (params.legislation_act)
        query.whereRaw(`document->'legislation' @> ANY(ARRAY [?]::jsonb[])`,`[{"title":"${params.legislation_act}"}]`)
    if (params.legislation_section)
        query.whereRaw(`document->'legislation' @> ANY(ARRAY [?]::jsonb[])`,`[{"section":"${params.legislation_section}"}]`)
    if (params.judgment_date_from) {
        if (!isNaN(params.judgment_date_from))
            query.whereRaw("document->>'date' > ?",params.judgment_date_from)
    }
    if (params.judgment_date_to) {
        if (!isNaN(params.judgment_date_to))
            query.whereRaw("document->>'date' < ?",params.judgment_date_to)
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
    
    return getResultsList(
        searchQuery,
        countQuery,
        resultMapper
    )
}

module.exports.searchActs = searchActs
module.exports.searchActsSections = searchActsSections
module.exports.searchCaseNames = searchCaseNames
module.exports.searchCases = searchCases
