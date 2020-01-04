#!/bin/bash

# This script starts the VisualCode and http server for the project.
# If the keys are not available for http-server for a dummy SSL for
# debugging, they are generated automatically.

# Settings
export PROJECT_PATH=~/de64.github.io
export DUMMY_FOLDER=$PROJECT_PATH/.dummykeys
# SSL key certificate pair
export KEY_PATH=$DUMMY_FOLDER/key.pem
export CERT_PATH=$DUMMY_FOLDER/cert.pem

# Execution
cd $PROJECT_PATH
# check if dummy certificate exists
if [ ! -f $CERT_PATH ]; then
	mkdir -p $DUMMY_FOLDER
	openssl req -newkey rsa:2048 -new -nodes -x509 -days 3650 -keyout $KEY_PATH -out $CERT_PATH
fi
git pull
code $PROJECT_PATH
jekyll serve --ssl-cert $CERT_PATH --ssl-key $KEY_PATH