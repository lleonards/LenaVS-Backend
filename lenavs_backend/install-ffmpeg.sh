#!/bin/bash

# Install FFmpeg on Render
echo "Installing FFmpeg..."

apt-get update
apt-get install -y ffmpeg

echo "FFmpeg installation complete"
ffmpeg -version
