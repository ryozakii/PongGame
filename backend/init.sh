#!/bin/bash

python manage.py collectstatic --noinput

python manage.py makemigrations

python manage.py migrate

# python3 manage.py runserver 0.0.0.0:8000

daphne -b 0.0.0.0 -p 8000 main.asgi:application
