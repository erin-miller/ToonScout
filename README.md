# ToonScout

## [Suggestions or bug reports? Submit here!](https://github.com/erin-miller/ToonScout/issues)

ToonScout is a web application and Discord bot that provides advising and information for Toontown Rewritten players. ToonScout is not affiliated with Toontown Rewritten or The Walt Disney Company.

You can access ToonScout at [scouttoon.info](https://scouttoon.info).

## Support

If you have any questions or need help, please join the [ToonScout Discord server](https://discord.gg/Qb929SrdRP) and open a ticket.

## Contributing

If you would like to contribute, please ask for assignments to issues or submit a pull request.

Dev environments are set up using [Docker](https://docs.docker.com/desktop/). To run locally, run the following command in the root directory:

```bash
docker compose up
```

The web app will be available at [localhost:5000](http://localhost:5000). The Discord bot runs on port `4000` and the API runs on port `3000`.

To test Discord interactions locally, your Discord bot must allow for redirects from `localhost:5000`. This can be done in the [Discord Developer Portal](https://discord.com/developers/applications) by adding `http://localhost:5000` to the OAuh2 redirect URLs.

Furthermore, two _optional_ network tunnels are established for the webapp and bot server with Ngrok, seen at [localhost:4040](http://localhost:4040). You need a [Ngrok auth token](https://dashboard.ngrok.com/get-started/your-authtoken) in `ngrok.yml` to run the tunnel.

The tunnels are especially helpful for testing Discord interactions between the webapp and the bot. Please be patient as you first enter the tunnel, as Next.js has to build the app.
