#!/bin/bash
set -e

REPO="vikash1a/blocknote-editor"
VSIX_PATH="/tmp/blocknote-editor-latest.vsix"
CODE="/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code"

echo "Fetching latest release..."
URL=$(gh release view --repo "$REPO" --json assets \
  --jq '.assets[] | select(.name | endswith(".vsix")) | .browserDownloadUrl')

if [ -z "$URL" ]; then
  echo "No VSIX found in the latest release."
  exit 1
fi

echo "Downloading $URL..."
curl -sL "$URL" -o "$VSIX_PATH"

echo "Installing..."
"$CODE" --install-extension "$VSIX_PATH" --force

rm -f "$VSIX_PATH"
echo "Done. Reload VS Code to apply the update."
