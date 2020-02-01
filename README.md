[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
![](https://badgen.net/dependabot/openlawnz/openlawnz-search/207661744=?icon=dependabot)
<!-- ![Build Status](https://codebuild.ap-southeast-2.amazonaws.com/badges?uuid=eyJlbmNyeXB0ZWREYXRhIjoieHdwOE9FK3NmcWlQMVZ5cUZMVXNKUkhEaC9YM1o2U01uL3JvRis0ektITXAyZFNPdU9vb0kyRkFEc3k0VVNFY0FZcDUzY3BiZDhpOGpUQ2hrM2lnSmJBPSIsIml2UGFyYW1ldGVyU3BlYyI6IndsL0MxOWg1THN3c2JDQU8iLCJtYXRlcmlhbFNldFNlcmlhbCI6MX0%3D&branch=staging) -->

# openlawnz-search
## Structure
openlawnz-search has two components - a public-facing search app which handles search queries over HTTP, and a maintenance app which provides some methods for creating search schema and adding cases to the search engine.

## Development setup
### Database
openlawnz-search uses PostgreSQL for its search indices. In order to run this app, you must provide a running PostgreSQL database server.

### How to run
Some scripts are provided to run the search app for development. Run them in order:
```
sh build_test_server.sh <db_server_port> <db_name> <db_user> <db_password>
sh run_search_server.sh <db_server_port> <db_name> <db_user> <db_password>
```

## Usage
There are four main search APIs currently available.
Each search API supports paging of results through ```start``` and ```end``` query string parameters.

### Case search
```
GET https://<host>/cases?search=<search string>
```
#### Search filters
Case search results can be filtered by query string parameters. These filters can either be binary (the filter must match the field exactly) or fuzzy (some part of the filter text must match the field).
##### Binary filters
* ```court```
* ```legislation_act```
* ```legislation_section```
* ```judgment_date_from```
* ```judgment_date_to```
##### Fuzzy filters
* ```case_name```

### Case title search
```
GET https://<host>/cases/names?search=<search string>
```

### Legislation act search
```
GET https://<host>/legislation/acts?search=<search string>
```

### Legislation section search
```
GET https://<host>/legislation/acts/<act name>/sections?search=<search string>
```
