const ut = require('util')
const rl = require('readline')
const dbFuncs = require('./database_functions')
const fs = require('fs')

const preaddir = ut.promisify(fs.readdir)
const preadFile = ut.promisify(fs.readFile)

const pool = dbFuncs.getDbPool()

const PORT = process.env.PORT || 8086

function deploy() {
    var onError = (err) => createErrorMessage("Schema rebuild",err)

    var files = preaddir('schema/sql')
        .then(names => Promise.all(
            names.map(
                fname => preadFile(`schema/sql/${fname}`)
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

if (require.main == module) {
    var arg = process.argv[2]
    var opt = process.argv[3]
    
    if (arg=="schema-rebuild") {
        if (opt=="-f")
            deploy()
        else {
            var readline = rl.createInterface({
                input: process.stdin,
                output: process.stdout
            })
            readline.question("Are you sure you want to rebuild the schema? This will drop all existing data (y/n)", (answer) => {
                if (answer=="y")
                    deploy()
                readline.close()
            })
        }   
    } else if (arg=='add-cases') {
        var filename = opt
        if (typeof(filename) == 'undefined')
            console.error('Usage: maintenance add-cases <filename>')
        else {
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
    }
}

module.exports.deploy = deploy
module.exports.addCases = addCases
