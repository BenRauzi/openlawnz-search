#! /usr/bin/env node

const rl = require('readline')
const lib = require('.')

if (require.main == module) {
    var arg = process.argv[2]
    var opt = process.argv[3]
    
    if (arg=="schema-rebuild") {
        if (opt=="-f")
            lib.deploy()
	    .then(_ => {
		process.exit()
	    })
        else {
            var readline = rl.createInterface({
                input: process.stdin,
                output: process.stdout
            })
            readline.question("Are you sure you want to rebuild the schema? " +
			      "This will drop all existing data (y/n)", (answer) => {
				  if (answer=="y")
				      lib.deploy()
				      .then(_ => {
					  process.exit()
				      })
				  readline.close()
			      })
        }   
    } else if (arg=='add-cases') {
        var filename = opt
        if (typeof(filename) == 'undefined')
            console.error('Usage: maintenance add-cases <filename>')
        else
	    lib.addCasesFromFile(filename)
	    .then(_ => {
		process.exit()
	    })
    }
}
