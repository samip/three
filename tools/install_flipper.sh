#!/bin/bash
export FLIPPER_DIR=${FLIPPER_DIR:-/opt/flipper}
# make sure FLIPPER_DIR is not empty and doesnt exist

if [ -z "$FLIPPER_DIR" ]; then
  echo "Error: FLIPPER_DIR is not set."
  exit 1
fi

# make sure FLIPPER_DIR doesnt exist
if [ -d "$FLIPPER_DIR" ]; then
  echo "Error: Directory $FLIPPER_DIR already exists."
  exit 1
fi

# If you are debugging React Native applications, 
# v0.239.0 will be the last release with support for it due to technical limitations for React Dev Tools and Hermes Debugger plugins. 
# As such, please refer to that release when debugging React Native applications. 
#- https://github.com/facebook/flipper
wget https://github.com/facebook/flipper/releases/download/v0.239.0/Flipper-linux.zip
sudo apt-get install  -y watchman
unzip -qq Flipper-linux.zip -d "$FLIPPER_DIR"
pushd "$FLIPPER_DIR" > /dev/null || exit 1
# Wont start without these
sudo chown root chrome-sandbox
sudo chmod 755 chrome-sandbox
sudo chmod u+s chrome-sandbox # setuid required

popd > /dev/null || exit 1

rm Flipper-linux.zip