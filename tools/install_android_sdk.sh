#!/bin/sh
export ANDROID_HOME=${ANDROID_HOME:-/opt/android-sdk}

apt-get install -y openjdk-21-jdk
apt-get install -y --reinstall google-android-cmdline-tools-11.0-installer

# Current Expo SDK version (51.0.0) uses android SDK v34
# Update this installer if required when bumping Expo version
# https://docs.expo.dev/versions/latest/
yes | sdkmanager --sdk_root=$ANDROID_HOME --install "platforms;android-34" "build-tools;34.0.0" "platform-tools"
yes | sdkmanager --licenses

chown $USER $ANDROID_HOME -R

echo "Add these to .bashrc or similar"
echo "export ANDROID_HOME=$ANDROID_HOME"
echo "export PATH=\$PATH:$ANDROID_HOME/platform-tools"
