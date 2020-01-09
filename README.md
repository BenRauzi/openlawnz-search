[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
![](https://badgen.net/dependabot/openlawnz/openlawnz-search/207661744=?icon=dependabot)
<!-- ![Build Status](https://codebuild.ap-southeast-2.amazonaws.com/badges?uuid=eyJlbmNyeXB0ZWREYXRhIjoieHdwOE9FK3NmcWlQMVZ5cUZMVXNKUkhEaC9YM1o2U01uL3JvRis0ektITXAyZFNPdU9vb0kyRkFEc3k0VVNFY0FZcDUzY3BiZDhpOGpUQ2hrM2lnSmJBPSIsIml2UGFyYW1ldGVyU3BlYyI6IndsL0MxOWg1THN3c2JDQU8iLCJtYXRlcmlhbFNldFNlcmlhbCI6MX0%3D&branch=staging) -->

# openlawnz-search

## Database Setup
We use Docker to download and provision the OpenLaw NZ database. Simply run docker.sh from [openlawnz-orchestration](https://github.com/openlawnz/openlawnz-orchestration) and then update your .env file.

There are 2 schemas:

`pipeline_cases`: this is populated by running the pipeline and is not affected by the parsers  
`cases`: this is populated and mutated by running the parsers  
And check if it has correctly restored SQL dump file.

## How to run
Schema inside /sql needs to be run in to the case database
Some environment variables need to be set:
* DB_HOST
* DB_PORT
* DB_NAME
* DB_USER
* DB_PASS
* SCHEMA
* PORT

Then:
```
npm install
npm start
```

## Usage
```
GET https://<host>/cases?search=driveway&start=0&end=10
```
