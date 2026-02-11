# Contributing

If you would like to contribute, please submit a pull request.

Dev environments are set up using [Docker](https://docs.docker.com/desktop/).

Before building, you must create a `.env` file in each of `packages/api`, `packages/bot`, and `packages/webapp` by copying `example.env` to `.env` and editing as needed.

```bash
cp example.env .env
```

To run locally, run the following commands in the root directory:

```bash
npm install # installs dev dependencies

docker compose up --build # builds the containers for all packages
```

If you wish for changes to automatically sync during development, you can use Docker's hot reloading.

```sh
docker compose up --watch
```

The web app will be available at [localhost:5000](http://localhost:5000). The Discord bot runs on port `4000` and the API runs on port `3000`.

To test Discord interactions locally, your Discord bot must allow for redirects from `localhost:5000`. This can be done in the [Discord Developer Portal](https://discord.com/developers/applications) by adding `http://localhost:5000` to the OAuth2 redirect URLs.

Furthermore, two _optional_ network tunnels are established for the webapp and bot server with Ngrok, seen at [localhost:4040](http://localhost:4040). You need a [Ngrok auth token](https://dashboard.ngrok.com/get-started/your-authtoken) in `ngrok.yml` to run the tunnel.

The tunnels are especially helpful for testing Discord interactions on the bot, as you can use the Ngrok URL for the interactions URL by appending `/interactions`.
