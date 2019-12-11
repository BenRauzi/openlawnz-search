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
Case search results can be filtered by the following query string parameters:
* ```case_name```
* ```court```
* ```legislation_act```
* ```legislation_section```
* ```judgment_date_from```
* ```judgment_date_to```

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
