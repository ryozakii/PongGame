all : up

up :
	docker compose --env-file frontend/.env up  --build

down :
	docker compose --env-file frontend/.env down

fclean : down
	docker image rm  $$(docker image ls -aq)
	docker volume rm $$(docker volume ls -q)
	docker system prune -a --force

re : clean
	docker compose --env-file frontend/.env up  --build


.PHONY:	all up down fclean re