module.exports = f => ({
    openapi: "3.0.0",
    info: {
        title: "openlawnz-search",
        description: "Find legal cases from the OpenLawNZ database"
    },
    servers: [{
	url: '/api/v1/',
	description: 'API v1 endpoint. This is the recommended endpoint to use'
    },{
	url: '/',
	description: 'This is the default endpoint. It maps to v1 of the API. This endpoint is deprecated'
    }],
    produces: ["application/json"],
    components: {
	schemas: {
	    response: {
		type: 'object',
		properties: {
		    total: {
			type: 'integer',
			example: 200,
			description: 'Total number of search result hits'
		    }
		}
	    }
	},
	parameters: {
	    start: {
		name: 'start',
		'in': 'query',
		schema: {
		    type: 'integer',
		    minimum: 0,
		    'default': 0
		},
		description: 'The highest ranked search item to return'
	    },
	    end: {
		name: 'end',
		'in': 'query',
		schema: {
		    type: 'integer',
		    minimum: 1
		},
		deprecated: true,
		description: `The lowest ranked search item to return. This is deprecated: please use 'count' 
                              instead`
	    },
	    count: {
		name: 'count',
		'in': 'query',
		schema: {
		    type: 'integer',
		    minimum: 1,
		    'default': 20,
		    maximum: 50
		},
		description: `Number of search results to return`
	    }
	}
    },
    paths: {
        "/legislation/acts": {
            get: {
                "openlaw-handler": f.getActs,
		"tags": ["legislation"],
		"description": "Find Acts referenced by cases in the OpenLaw database",
                "parameters": createRequestSchema([
		    {
			name: 'search',
			'in': 'query',
			schema: {
			    type: 'string',
			    'default': '',
			    maxLength: 160
			},
			description: 'Search fragment of an Act title',
			examples: {
			    crimesAct: {
				summary: 'Retrieve Crimes Act 1961',
				value: 'crimes'
			    }
			}
		    }
		]),
                "responses": {
		    "200": createResponseSchema({
			type: 'object',
			properties: {
			    actName: {
				type: 'string'
			    }
			}
		    })
		}
	    }
	},
	"/legislation/acts/{actTitle}/sections": {
	    get: {
		"tags": ["legislation"],
		"openlaw-handler": f.getActSections,
		"description": "Find sections of an Act which are referenced in cases in the OpenLawNZ database",
		"parameters": createRequestSchema([
		    {
			name: 'actTitle',
			'in': 'path',
			schema: {
			    type: 'string',
			    default: '',
			    maxLength: 160
			},
			description: 'Full Act title',
			examples: {
			    crimesActSection: {
				summary: 'Retrieve sections in Crimes Act 1961',
				value: 'Crimes Act 1961'
			    }
			}
		    },
		    {
			name: 'search',
			'in': 'query',
			schema: {
			    type: 'string',
			    default: '',
			    maxLength: 160
			},
			description: 'Search fragment of an Act section name',
			examples: {
			    crimesActSection: {
				summary: 'Retrieve Crimes Act 1961 Section 116',
				value: '11'
			    }
			}
		    }
		]),
		"responses": {
		    "200": createResponseSchema({
			type: 'object',
			properties: {
			    actName: {
				type: 'string',
				example: 'Crimes Act 1961'
			    },
			    section: {
				type: 'string',
				example: "115"
			    }
			}
		    })
		}
	    }
	},
	"/cases/names": {
	    get: {
		"tags": ["cases"],
		"openlaw-handler": f.getCaseNames,
		"description": `Search for a particular case name. Note that this should provide duplicate 
                                functionality to /cases?case_name= API, but /cases API does not yet rank
                                results by case_name ranking scores`,
		"parameters": createRequestSchema([
		    {
			name: 'search',
			'in': 'query',
			schema: {
			    type: 'string',
			    default: '',
			    maxLength: 160
			},
			description: 'Search fragment of a case name',
			examples: {
			    laveryLavery: {
				summary: 'Search for "LAVERY v LAVERY [2019] NZHC 502 [20 March 2019]"',
				value: 'lavery'
			    }
			}
		    }
		]),
		"responses": {
		    "200": createResponseSchema({
			type: 'object',
			properties: {
			    caseName: {
				type: 'string',
				example: 'LAVERY v LAVERY [2019] NZHC 502 [20 March 2019]'
			    }
			}
		    })
		}
	    }
	},
	"/cases": {
	    get: {
		"tags": ["cases"],
		"openlaw-handler": f.getCases,
		"description": "Search for cases using a number of filters",
		"parameters": createRequestSchema([
		    {
			name: 'search',
			'in': 'query',
			schema: {
			    type: 'string',
			    default: '',
			    maxLength: 160
			},
			description: `Search fragment of either case text or case name. Note that each token in
                                      in the query is searched for separately at the moment and isn't necessarily
                                      matched as a phrase`,
			examples: {
			    nzhc: {
				summary: `Search for a case which includes either/all the terms 'family', 'court'
                                          and 'order'`,
				value: 'family court order'
			    }
			}
		    }, {
			name: 'court',
			'in': 'query',
			schema: {
			    type: 'string',
			    default: '',
			    maxLength: 160
			},
			description: `Filter search results to those which were heard in a particular court`,
			examples: {
			    highCourt: {
				summary: 'Supreme Court of New Zealand',
				value: 'Supreme Court'
			    }
			}
		    }, {
			name: 'legislation_act',
			'in': 'query',
			schema: {
			    type: 'string',
			    default: '',
			    maxLength: 160
			},
			description: `Filter search results to those which reference a particular act`,
			examples: {
			    propertyRelationsAct: {
				summary: `Property (Relationships) Act 1976`,
				value: `Property (Relationships) Act 1976`
			    }
			}
		    }, {
			name: 'legislation_section',
			'in': 'query',
			schema: {
			    type: 'string',
			    default: '',
			    maxLength: 160
			},
			description: `Filter search results to those which reference a particular section 
                                      of an act`,
			examples: {
			    section11B: {
				summary: 'Section 11B',
				value: '11B'
			    }
			}
		    }, {
			name: 'judgment_date_from',
			'in':  'query',
			schema: {
			    type: 'string',
			    format: 'date'
			},
			description: `Filter search results to those which have a judgment date more recently than
                                      judgment_date_from`,
			examples: {
			    newerThan2019: {
				summary: 'Newer than the start of 2019',
				value: '2019-01-01'
			    }
			}
		    }, {
			name: 'judgment_date_to',
			'in':  'query',
			schema: {
			    type: 'string',
			    format: 'date'
			},
			description: `Filter search results to those which have a judgment date less recently than
                                      judgment_date_to`,
			examples: {
			    olderThan2020: {
				summary: 'Older than start of 2020',
				value: '2020-01-01'
			    }
			}
		    }
		]),
		"responses": {
		    "200": createResponseSchema({
			type: 'object',
			properties: {
			    caseId: {
				type: 'integer',
				example: '1'
			    },
			    caseName: {
				type: 'string',
				example: "LAVERY v LAVERY [2019] NZHC 502 [20 March 2019]"
			    },
			    citation: {
				type: 'string',
				example: '[2019] NZHC 502'
			    },
			    date: {
				type: 'string',
				format: 'date',
				description: 'Judgment date of the case',
				example: '2019-03-20'
			    }
			}
		    })
		}			       
	    }
	}
    }
})

function createResponseSchema(responseEntrySchema) {
    return {
	description: "OK",
	content: {
	    'application/json': {
		allOf: [
		    { $ref: '#/components/schemas/response' },
		    { results: responseEntrySchema }
		]
	    }
	}
    }
}

function createRequestSchema(customParameterSchema) {
    return customParameterSchema.concat(defaultParams)
}

const defaultParams = [{ $ref: '#/components/parameters/start' },
		       { $ref: '#/components/parameters/end' },
		       { $ref: '#/components/parameters/count' }]
