# Raindrop Auto Tag

Automatically tag untagged raindrops using AI suggestions from the Raindrop.io API.

## Setup

1. Copy `.env.example` to `.env`
2. Fill in your Raindrop.io API credentials:
   - `RD_CLIENT_ID`: Your client ID
   - `RD_CLIENT_SECRET`: Your client secret  
   - `RD_TOKEN`: Your bearer token
3. Install dependencies: `npm install`

## Usage

```bash
node index.js
```

The script will:
1. Find the most recent untagged raindrop
2. Get AI tag suggestions from Raindrop.io
3. Remove duplicate/similar tags (edit distance ≤ 2)
4. Apply the cleaned tags to the raindrop

## Features

- **Smart deduplication**: Removes similar tags like "server"/"servers" or "selfhosted"/"self-hosted"
- **Error handling**: Marks problematic raindrops with `#error` tag to prevent infinite loops
- **Clean output**: Shows original suggestions and final accepted tags

## Example Output

```
Found untagged raindrop: "Self-Hosting Guide | Hacker News"
URL: https://news.ycombinator.com/item?id=12345
Created: 7/21/2025, 10:30:15 AM

Getting AI tag suggestions...
Original tags (8): selfhosted, self-hosted, hosting, server, servers, hn, guide, tutorial
Accepted tags (5): selfhosted, hosting, server, hn, guide

Applying tags...
✅ Raindrop successfully tagged!
```