#!/bin/sh 
mkdir -p /src/javascript/build 
cd /src/javascript/build
cmake -S /src -B /src/javascript/build -DMATERIALX_BUILD_JS=ON