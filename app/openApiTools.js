const yaml = require('js-yaml')

function createYamlSpec(spec) {
    const standardSpec = removeOpenLawSpecFields(spec)
    return yaml.safeDump(standardSpec)
}

function removeOpenLawSpecFields(spec) {
    return Object.fromEntries(Object.entries(spec)
		       .filter(([k,v]) => !k.includes('openlaw-'))
			      .map(([k,v]) => [k,
					       Array.isArray(v)
					       ? v.map(x => isBuiltin(x) ?  x : removeOpenLawSpecFields(x))
					       : isBuiltin(v) ? v : removeOpenLawSpecFields(v)]
			   )
		      )
}

function isBuiltin(v) {
    return !v || !isNaN(v) || typeof v == 'string' || typeof v == 'boolean'
}

function addRoutes(app,spec,funcWrapper) {
    Object.entries(spec.paths).forEach(([path,route]) => {
	// add input form correction
	const handler = Object.entries(route.get.parameters).reduce((a,[_,p]) => {
	    if ('$ref' in p)
		p = p['$ref'].split('/').slice(1).reduce((a,elem) => a[elem], spec)
	    
	    var checks = []
	    
	    if (p.schema.type == 'integer')
		checks = [[p.schema.type, _ => false, val => parseInt(val)],
			  [p.schema.default, val => val || val === 0, _ => p.schema.default],
			  [p.schema.minimum, val => (!val && val !== 0) || val > p.schema.minimum,
			   _ => p.schema.minimum],
			  [p.schema.maximum, val => (!val && val !== 0) || val < p.schema.maximum,
			   _ => p.schema.maximum]
			 ]
	    
	    if (p.schema.type == 'string')
		checks = [[p.schema.format, _ => p.schema.format !== 'date', val => new Date(val)], 
			  [p.schema.default, val => val, _ => p.schema.default],
			  [p.schema.maxLength, val => !val || val.length < p.schema.maxLength,
			   val => val.substring(0,p.schema.maxLength)]]
	    
	    const checkFunctions = checks
		  .filter(([prop,_,__]) => prop || prop === 0 || prop === '')
		  .map(([prop,test,res]) => val => test(val) ? val : res(val))
	    
	    return (req,res,next) => {
		req.query[p.name] = checkFunctions.reduce((av,c) => c(av), req.query[p.name])
		return a(req,res,next)
	    }
	}, route.get["openlaw-handler"])
	
	// resolve full route
	const regex =/\{([^\/]*)\}/g
	const relativePaths = spec.servers.map(s => s.url.replace(/\/$/,''))
	const expressPath = regex.test(path)
	      ? path
	      .match(regex)
	      .reduce((a,c) =>
		      a.replace(c, c.replace('{',':').replace('}','')), path)
	      : path
	
	relativePaths.forEach(r => app.get(r+expressPath,(req,res,next) => funcWrapper(handler,req,res,next)))
    })
}

module.exports.addRoutes = addRoutes
module.exports.createYamlSpec = createYamlSpec
