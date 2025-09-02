#!/bin/bash

# Deploy Firebase Storage Rules
# Make sure you have Firebase CLI installed and are logged in

echo "Deploying Firebase Storage Rules..."

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "Firebase CLI is not installed. Please install it first:"
    echo "npm install -g firebase-tools"
    exit 1
fi

# Check if user is logged in
if ! firebase projects:list &> /dev/null; then
    echo "Please login to Firebase first:"
    echo "firebase login"
    exit 1
fi

# Deploy the storage rules
firebase deploy --only storage

echo "Storage rules deployed successfully!"
echo ""
echo "Your Firebase Storage is now configured with the following rules:"
echo "- Users can upload profile images to /profile-images/{userId}/"
echo "- Users can upload pet images to /pet-images/{userId}/"
echo "- 5MB limit for profile images, 10MB limit for pet images"
echo "- Only authenticated users can upload to their own folders"
echo "- Anyone can read images (for displaying)"
