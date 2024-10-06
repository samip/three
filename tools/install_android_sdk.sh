#!/bin/sh
apt-get install -y google-android-cmdline-tools-11.0-installer
# install platform-tools including adb
# maybe specify adb version in future (not supported by sdkmaanger)
yes | sdkmanager "platform-tools"
yes | sdkmanager --licenses
