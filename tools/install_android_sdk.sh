#!/bin/sh
apt-get install -y google-android-cmdline-tools-11.0-installer

# Current Expo SDK version (51.0.0) uses android SDK v34
# Update this installer if required when bumping Expo version
# https://docs.expo.dev/versions/latest/
yes | sdkmanager --install "platforms;android-34" "build-tools;34.0.0" "platform-tools"
yes | sdkmanager --licenses
