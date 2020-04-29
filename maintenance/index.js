const rl = require('readline')
const dbFuncs = require('./database_functions')
const fs = require('fs')
const path = require('path')
const ut = require('util')

const preaddir = ut.promisify(fs.readdir)
const preadFile = ut.promisify(fs.readFile)
const pool = dbFuncs.getDbPool()

function deploy(verbose=true) {
    const sqlDir = path.join(path.dirname(fs.realpathSync(__filename)),'schema/sql')
    return preaddir(sqlDir)
        .then(names => Promise.all(
            names.map(
                fname => preadFile(path.join(sqlDir,fname))
                    .then(content => ({ fname: fname, content: content }))
            )))
        .then(contents => contents
              .sort(x => x.fname)
              .map(x => ';\n'+x.content)
              .join('\r\n'))
        .then(content => {
            return pool
                .raw(content)
        })
}

function addCases(cases) {
    return pool('search.case_search_documents')
        .insert(cases.map(row => {
            return { document: JSON.stringify(row) }
        }));
}


function addCasesFromFile(filename, printVerbose=true) {
    var readInterface = rl.createInterface({
        input: fs.createReadStream(filename),
        console: false
    })

    return new Promise((resolve,reject) => {
	var sem = 10
	var closed = false
	
	readInterface.on('close', () => {
            closed = true
	    
            if (sem==10)
		resolve()
	})
	
	readInterface.on('line', line => {
            var jsonLine = JSON.parse(line)
            sem -= 1
	    
            if (sem==0)
		readInterface.pause()
	    
            addCases(jsonLine)
		.then(_ => {
		    if (printVerbose)
			console.error(`Read up to ${jsonLine[jsonLine.length-1].case_id}`)
		    
                    sem += 1
                    readInterface.resume()
		    
                    if (sem==10 && closed)
			resolve()
		})
		.catch(err => {
                    reject(err)
		})
	})
    })
}

module.exports.deploy = deploy
module.exports.addCases = addCases
module.exports.addCasesFromFile = addCasesFromFile
