#!/bin/bash -e
cd webroot/camera
while sleep 0.5
do
    /usr/bin/v4lctl -c /dev/video0 snap jpeg 640x480 snap.jpg
done
