#! /bin/sh

echoerr () {
   $VERBOSE  && echo $1 1>&2
}

VERBOSE=false
if [ "$1" == "-v" ]; then
    VERBOSE=true
fi

export PGPASSWORD=$DB_PASS

echoerr "Creating DB container"
docker run --rm  --name pg-openlaw-search-testdb -e POSTGRES_PASSWORD=$DB_PASS -d -p 5432:5432 postgres >/dev/null

echoerr "Waiting for docker to spin up DB..."

REMAINING_TRIES=20
until psql -h localhost -p 5432 -U postgres -c "CREATE DATABASE $DB_NAME;" >/dev/null 2>&1
do
    sleep 1
    ((REMAINING_TRIES=REMAINING_TRIES-1))
    if [[ $REMAINING_TRIES == 0 ]]; then
        echo "Can't connect to postgres server" 1>&2
        docker container stop pg >/dev/null 2>&1
        exit 1
    fi
done

echoerr "...DB is spun up"

exit 0
