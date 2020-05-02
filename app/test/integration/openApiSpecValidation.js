const app = require('../../index.js')
const request = require('supertest')
const expect = require('chai').expect
const SwaggerParser = require("@apidevtools/swagger-parser")
const yaml = require('js-yaml')

describe("Testing that the OpenAPI spec is reachable and valid", () => {
    describe('#GET /docs/v1/spec', () => {
	it('Returns valid spec', async () => {
	    return request(app)
		.get('/docs/v1/spec')
		.expect(200)
		.then(res => yaml.safeLoad(res.text))
		.then(spec => SwaggerParser.validate(spec))	  
	})
    })
})
