#!/bin/bash

# Build and push Docker images
# Usage: ./build-and-push.sh [registry-url] [tag]

REGISTRY=${1:-"your-registry.com"}
TAG=${2:-"latest"}

echo "Building and pushing Docker images..."
echo "Registry: $REGISTRY"
echo "Tag: $TAG"

# Build bed-icu image
echo "Building bed-icu image..."
docker build -t $REGISTRY/bed-icu:$TAG ./bed-icu
if [ $? -eq 0 ]; then
    echo "Pushing bed-icu image..."
    docker push $REGISTRY/bed-icu:$TAG
else
    echo "Failed to build bed-icu image"
    exit 1
fi

# Build nano image
echo "Building nano image..."
docker build -t $REGISTRY/nano:$TAG ./nano
if [ $? -eq 0 ]; then
    echo "Pushing nano image..."
    docker push $REGISTRY/nano:$TAG
else
    echo "Failed to build nano image"
    exit 1
fi

echo "All images built and pushed successfully!"
echo ""
echo "Images:"
echo "  - $REGISTRY/bed-icu:$TAG"
echo "  - $REGISTRY/nano:$TAG"