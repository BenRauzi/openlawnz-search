/*
 These tests are the first tests I made. They all rely on a common set of data. Newer tests mostly have their own
 data relevant to each test. This makes it a lot easier to maintain the test cases. So I wouldn't expect us to
 need to add to these tests.
*/
const app = require('../../index.js')
const chai = require('chai')
const expect = chai.expect
const chaiQuantifiers = require('chai-quantifiers')
const request = require('supertest')
const maintenance = require('maintenance')
const path = require('path')
const fs = require('fs')

chai.use(chaiQuantifiers)

describe("Standard set of API tests", function () {
    this.timeout(10000)
    
    before(async () => {
	await maintenance.deploy()
	await maintenance
	    .addCasesFromFile(
		path.join(path.dirname(fs.realpathSync(__filename)),'data/standardDocuments.ndjson'),
	    false)
    })
    
    describe('#GET /cases', () => {
	context('With "case_name" provided', () => {
	    it('Return correct results when searching by "case_name" parameter', async () =>  { 
		return request(app)
		    .get('/cases?case_name=SMITH')
		    .expect(200)
		    .then(res => {
			expect(res.body.results).to.containExactlyOne(r => r.caseName=="SMITH v ACCESSIBLE PROPERTIES NEW ZEALAND LIMITED [2019] NZCA 38 [8 March 2019]")
			expect(res.body.results).to.containExactlyOne(r => r.caseName=="SMITH v SMITH [2019] NZHC 320 [1 March 2019]")
			expect(res.body.results).to.containExactlyOne(r => r.caseName=="PGG WRIGHTSON SEEDS LTD v WHOLESALE SEEDS LTD & SMITH [2019] NZHC 377 [8 March 2019]")
		    })
	    })

	    it('Should return exactly one result when a full case_name is provided', async () => {
		return request(app)
		    .get('/cases?case_name=SMITH v SMITH [2019] NZHC 320 [1 March 2019]')
		    .expect(200)
		    .then(res => {
			expect(res.body.results).to.have.lengthOf(1)
			expect(res.body.results).to.containExactlyOne(r => r.caseName=="SMITH v SMITH [2019] NZHC 320 [1 March 2019]")
		    })
	    })

	    it("Should return two entries when 'court' parameter is set to 'Supreme Court", async () => {
		return request(app)
		    .get('/cases?court=Supreme Court')
		    .expect(200)
		    .then(res => {
			expect(res.body.results).to.have.lengthOf(2)
			expect(res.body.total).to.equal(2)
			expect(res.body.results).to.containExactlyOne(r => r.caseName=="JOHN GARRY DAVIDOFF v R [2019] NZSC 30 [20 March 2019]")
			expect(res.body.results).to.containExactlyOne(r => r.caseName=="LAVERY v LAVERY [2019] NZHC 502 [20 March 2019]")
		    })
	    })

	    it("Should return exactly four cases when judgment date is between 2019-03-19 and 2019-03-20", async () => {
		return request(app)
		    .get('/cases?judgment_date_from=2019-03-19&judgment_date_to=2019-03-20')
		    .expect(200)
		    .then(res => {
			expect(res.body.results).to.have.lengthOf(4)
			expect(res.body.total).to.equal(4)
			expect(res.body.results).to.containExactlyOne(r => r.caseName=="JOHN GARRY DAVIDOFF v R [2019] NZSC 30 [20 March 2019]")
			expect(res.body.results).to.containAll(r => r.date=="2019-03-20")
		    })
	    })
	})
    })
})
