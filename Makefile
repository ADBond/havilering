start-app:
	docker compose up -d --build

stop-app:
	docker compose down -v

test:
	docker compose run --build --entrypoint "npm run test" frontend
