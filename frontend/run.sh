#!/bin/bash

docker build -t game .
docker run -p 3000:3000 game

