#! /bin/sh

if [ "$1" = "" ]; then
	echo "usage: sh run_search_server.sh <db_server_port> <db_name> <db_user> <db_password>"
elif [ "$2" = "" ]; then
	echo "usage: sh run_search_server.sh <db_server_port> <db_name> <db_user> <db_password>"
elif [ "$3" = "" ]; then
	echo "usage: sh run_search_server.sh <db_server_port> <db_name> <db_user> <db_password>"
else
	export DB_PORT="$1"
	export DB_NAME="$2"
	export DB_USER="$3"
	export DB_PASS="$4"
	export PORT=8085
		
	cd app
	npm install
	echo starting server on port $PORT
 	npm start
fi

