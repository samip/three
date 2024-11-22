#!/bin/sh
mkdir -p /src/javascript/build
cmake -S /src -B /src/javascript/build -DMATERIALX_BUILD_JS=ON

cmake --build /src/javascript/build
