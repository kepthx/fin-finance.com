#!/bin/bash

SERVICE_NAME="web_app"

if [[ $# -eq 0 ]]; then
	docker-compose up -d $@
elif [ $1 = 'restart' ]; then
	docker-compose down && docker-compose up -d $@
elif [ $1 = 'dev' ]; then
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml run --rm --service-ports $SERVICE_NAME npm run dev ${@:2}
elif [ $1 = 'test' ]; then
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml run --rm --service-ports $SERVICE_NAME npm run test ${@:2}
elif [ $1 = 'debug' ]; then
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml run --rm --service-ports $SERVICE_NAME npm run dev:debug ${@:2}
elif [ $1 = 'exec' ]; then
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml run --rm --service-ports $SERVICE_NAME ${@:2}
elif [ $1 = 'i' ]; then
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml run --rm --service-ports $SERVICE_NAME npm i --save ${@:2}
elif [ $1 = 'idev' ]; then
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml run --rm --service-ports $SERVICE_NAME npm i --save-dev ${@:2}
elif [ $1 = 'un' ]; then
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml run --rm --service-ports $SERVICE_NAME npm un -save ${@:2}
elif [ $1 = 'build' ]; then
	docker-compose build "${@:2}" --no-cache
elif [ $1 = 'rebuild' ]; then
	docker-compose build --no-cache
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml run $SERVICE_NAME npm i
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml run $SERVICE_NAME npm run build
else
	docker-compose up -d $@
fi
