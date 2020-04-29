# openlawnz-search

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
![](https://badgen.net/dependabot/openlawnz/openlawnz-search/207661744=?icon=dependabot)

## Running the server in development mode
First, install the search app dependencies:
```
cd app && npm install
```
```
openlawnz-search``` uses PostgreSQL for its search indices. In order to run the search app, you must provide a PostgreSQL database. If you have docker installed, the easiest way to start the search app is to run the following command:
```
npm run startcreatedb 
```
This will create a database server inside a docker image and start the search server, pointing to this database. Alternatively, you can provide your own database and run the server with:
```
npm start
```
You can also create the docker database independently of starting the search app:
```
npm run createdb
```

## Documentation
The API documentation can be found at ```/docs/v1/ui```, and the OpenAPI spec is at ```/docs/v1/spec```.

## Adding cases
To add cases, a JavaScript API is provided. This package is in the ```/maintenance```.