# openlawnz-search

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
