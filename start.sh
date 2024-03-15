#!/bin/bash
source venv/bin/activate
if [ -z "$1" ]; then
    yarn start
else
    yarn "$1"
fi
