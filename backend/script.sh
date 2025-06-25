#!/bin/bash

# Step 1: Pull the latest PostgreSQL image
echo "Pulling PostgreSQL image..."
docker pull postgres:14

# Step 2: Check if PostgreSQL container is already running and remove it if needed
if docker ps -a | grep -q "postgres_container"; then
    echo "Removing existing PostgreSQL container..."
    docker rm -f postgres_container
fi

# Step 3: Run the PostgreSQL container
echo "Starting PostgreSQL container..."
docker run -d \
  --name postgres_container \
  -e POSTGRES_USER=$POSTGRES_USER \
  -e POSTGRES_PASSWORD=$POSTGRES_PASSWORD \
  -e POSTGRES_DB=$POSTGRES_DB \
  -e POSTGRES_HOST_AUTH_METHOD=trust \
  -p $POSTGRES_PORT:5432 \
  postgres:14

# Step 4: Wait for PostgreSQL to start
echo "Waiting for PostgreSQL to initialize..."
sleep 10  # Give PostgreSQL enough time to start (increase if necessary)

# Step 5: Check if PostgreSQL container is running
if ! docker ps | grep -q "postgres_container"; then
    echo "PostgreSQL container did not start correctly. Exiting..."
    exit 1
fi

# Step 6: Set the POSTGRES_HOST variable for Django to connect
POSTGRES_HOST="localhost"  # Use localhost to connect to the PostgreSQL container
echo "PostgreSQL container host is: $POSTGRES_HOST"

# Step 7: Resolve APP_DIR if needed
APP_DIR=$(cd $APP_DIR && pwd)
echo "Resolved APP_DIR: $APP_DIR"

if [ -d "$APP_DIR" ] && [ -f "$APP_DIR/manage.py" ]; then
    echo "Running Django migrations..."
    cd $APP_DIR || { echo "Failed to change directory to $APP_DIR"; exit 1; }

    # Set environment variables for the Django app
    export POSTGRES_HOST=$POSTGRES_HOST
    export POSTGRES_PORT=$POSTGRES_PORT
    export POSTGRES_USER=$POSTGRES_USER
    export POSTGRES_PASSWORD=$POSTGRES_PASSWORD
    export POSTGRES_DB=$POSTGRES_DB

    # Run migrations
    python3 manage.py makemigrations acounts chat friends gamestats pingpong
    python3 manage.py migrate

    if [ $? -eq 0 ]; then
        echo "Migrations completed successfully."
    else
        echo "An error occurred during the migration process."
        exit 1
    fi
else
    echo "Error: manage.py not found in $APP_DIR."
    exit 1
fi

# Final confirmation
echo "PostgreSQL container running, and Django migrations completed successfully!"
