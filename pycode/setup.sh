#!/bin/bash

# Define the project directory
PROJECT_DIR="/sites/noti5.us/monitoring/pycode"

# Step 1: Navigate to the project directory
cd $PROJECT_DIR

# Step 2: Check if venv directory exists, if not, create the virtual environment
if [ ! -d "venv" ]; then
    echo "Virtual environment not found. Creating a new one..."
    python3 -m venv venv
    echo "Virtual environment created."
fi

# Step 3: Activate the virtual environment
echo "Activating the virtual environment..."
source venv/bin/activate

# Step 4: Install the required libraries from requirements.txt
if [ -f "requirements.txt" ]; then
    echo "Installing required libraries from requirements.txt..."
    pip install -r requirements.txt
else
    echo "requirements.txt not found in $PROJECT_DIR"
    exit 1
fi
 

# Final message
echo "Python environment setup completed successfully."
