#!/bin/bash

# Define the virtual environment directory and requirements file
VENV_DIR="./env"
PROGRAM="cli.py"  # Replace with your main Python program
ENV_FILE="../frontend/.env"
# Function to create a virtual environment
create_virtualenv() {
    if [ ! -d "$VENV_DIR" ]; then
        echo "Creating virtual environment..."
        python3.9 -m venv "$VENV_DIR"
    else
        echo "Virtual environment already exists."
    fi
}

# Function to activate the virtual environment
activate_virtualenv() {
    # If venv exists, activate it
    if [ -d "$VENV_DIR" ]; then
        source "$VENV_DIR/bin/activate"
    else
        echo "Virtual environment not found!"
        exit 1
    fi
}

# Function to install dependencies
install_requirements() {
        echo "Installing requirements ."
        pip install --upgrade websockets requests
}

# Function to run the program
run_program() {
    if [ -f "$PROGRAM" ]; then
        echo "Running the program: $PROGRAM"
        python "$PROGRAM"
    else
        echo "Program $PROGRAM not found. Please check the filename."
        exit 1
    fi
}

# Main workflow
if [ -f $ENV_FILE ]; then
    export $(grep -v '^#' $ENV_FILE | xargs)
else
    echo "$ENV_FILE not found. Please check the filename."
    exit 1
fi
create_virtualenv
activate_virtualenv
install_requirements
run_program
