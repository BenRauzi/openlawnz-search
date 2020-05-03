const app = require('../../index.js')
const chai = require('chai')
const expect = chai.expect
const chaiQuantifiers = require('chai-quantifiers')
const request = require('supertest')
const maintenance = require('maintenance')
const path = require('path')
const fs = require('fs')

async function setupDatabase(cases) {
    await maintenance.deploy()
    await maintenance.addCases(cases)
}


describe("Testing that excerpts are correctly returned", function () {
    this.timeout(10000)

    before(async () => setupDatabase([{
	case_name: 'test case',
	case_text: 'test something',
	legislation: [{"title": "Test Act 2006", "section": "69"}]
    }]))

    describe('#GET /cases', () => {
	context('With a single case name "test case"', () => {
	    it('Response includes a highlighted excerpt and name when "search" param and "highlight_case_name" is provided',
	       async () => request(app)
	       .get('/cases?search=test&highlight_case_name=true')
	       .expect(200)
	       .then(res => {
		   expect(res.body.results).to.have.lengthOf(1)
		   expect(res.body.results[0].caseName).to.equal("<b>test</b> case")
		   expect(res.body.results[0].excerpt).to.equal("<b>test</b> something")
	       })
	      )
	    
	    it('Response includes a highlighted excerpt and name when "case_name" param is provided',
	       async () => request(app)
	       .get('/cases?case_name=test&highlight_case_name=true')
	       .expect(200)
	       .then(res => {
		   expect(res.body.results).to.have.lengthOf(1)
		   expect(res.body.results[0].caseName).to.equal("<b>test</b> case")
	       })
	      )
	    
	    it('Response does not include an excerpt field nor highlighting if no "search" nor "case_name" param is provided',
	       async () => request(app)
	       .get('/cases?highlight_case_name=true')
	       .expect(200)
	       .then(res => {
		   expect(res.body.results).to.have.lengthOf(1)
		   expect(res.body.results[0].caseName).to.equal("test case")
	       })
	      )
	})
    })

    describe('#GET /legislation/acts', () => {
	context('With a single act "Test Act 2006"', () => {
	    it('Response includes a highlighted act name when "highlight_act_name" is provided',
	       async () => request(app)
	       .get('/legislation/acts?search=test')
	       .expect(200)
	       .then(res => {
		   expect(res.body.results).to.have.lengthOf(1)
		   expect(res.body.results[0].actName).to.equal('<b>Test</b> Act 2006')
	       })
	      )
	})
    })
})
