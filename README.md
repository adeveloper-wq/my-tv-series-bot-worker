# my-tv-series-bot-worker
The code for the Cloudflare-worker that randomly selects a new episode from a TV series every 30 minutes and triggers a rebuild of the corresponding Github pages site (I use this to randomly select an episode that I want to watch from my comfort TV shows :D). The corresponding repo: https://github.com/adeveloper-wq/my-tv-series-bot

## Deployment
Use `wranger publish` to deploy this as a Cloudflare worker.
