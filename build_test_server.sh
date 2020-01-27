#! /bin/sh

if [ "$1" = "" ]; then
	echo "usage: sh build_test_server.sh <db_server_port> <db_name> <db_user> <db_password>"
elif [ "$2" = "" ]; then
	echo "usage: sh build_test_server.sh <db_server_port> <db_name> <db_user> <db_password>"
elif [ "$3" = "" ]; then
	echo "usage: sh build_test_server.sh <db_server_port> <db_name> <db_user> <db_password>"
else
	export DB_PORT="$1"
	export DB_NAME="$2"
	export DB_USER="$3"
	export DB_PASS="$4"
	
	cd maintenance
	npm install
	node index schema-rebuild
	node index add-cases ../test/documents.json	
fi

