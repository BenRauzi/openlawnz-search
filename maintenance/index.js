const rl = require('readline')
const dbFuncs = require('./database_functions')
const fs = require('fs')
const path = require('path')
const ut = require('util')

const preaddir = ut.promisify(fs.readdir)
const preadFile = ut.promisify(fs.readFile)
const pool = dbFuncs.getDbPool()

function deploy() {
    const onError = (err) => createErrorMessage("Schema rebuild",err)
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
            pool
                .raw(content)
                .then(_ => {
                    console.error("Schema rebuild complete")
                    process.exit()
                })
                .catch(err => {
                    onError(err)
                    console.error(content)
                })
        })
}

function createErrorMessage(process,err) {
    console.error(`${process} failed`)
    console.error(err)
}

function addCases(cases) {
    return pool('search.case_search_documents')
        .insert(cases.map(row => {
            return { document: JSON.stringify(row) }
        }));
}


function addCasesFromFile(filename) {
    var readInterface = rl.createInterface({
        input: fs.createReadStream(filename),
        console: false
    })
    
    var sem = 10
    var closed = false
    
    readInterface.on('close', () => {
        closed = true
	
        if (sem==10)
            process.exit()
    })
    
    readInterface.on('line', line => {
        var jsonLine = JSON.parse(line)
        sem -= 1
	
        if (sem==0)
            readInterface.pause()
	
        addCases(jsonLine)
            .then(_ => {
                console.error(`Read up to ${jsonLine[jsonLine.length-1].case_id}`)
		
                sem += 1
                readInterface.resume()
		
                if (sem==10 && closed)
                    process.exit()
            })
            .catch(err => {
                console.log(err)
                process.exit(1)
            })
    })
}

module.exports.deploy = deploy
module.exports.addCases = addCases
module.exports.addCasesFromFile = addCasesFromFile
