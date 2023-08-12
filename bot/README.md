**Disclaimer: User Responsibility for Bot – Interactive Trading on Hyperliquid Perpetual DEX**

The bot ("the Bot") written in Node.js is designed to enable interactive trading on the Hyperliquid perpetual decentralized exchange. By utilizing the Bot for trading activities, you acknowledge and agree that each user bears sole responsibility for their trading decisions, strategies, and outcomes. The original author of the Bot and its contributors assume no responsibility and are not liable for any consequences arising from your use of the Bot, including trading losses, technical issues, or other matters associated with the code.

The Bot is provided as an open-source tool for educational and informational purposes exclusively. It is not intended to constitute financial, investment, or trading advice. The information and capabilities offered by the Bot are based on available data and patterns, yet the cryptocurrency market is characterized by its volatility and rapid fluctuations. Consequently, all trading decisions executed with the assistance of the Bot are executed at your own risk.

The Bot interfaces with the Hyperliquid Perpetual DEX, and it is imperative to understand that decentralized exchanges come with inherent risks. The original author and contributors of the Bot possess no control over the functionality, security, or operations of the underlying Hyperliquid Perpetual DEX. Any issues, bugs, vulnerabilities, or other technical problems pertaining to the Hyperliquid Perpetual DEX or the Bot's interaction with it fall beyond the jurisdiction and accountability of the original author and contributors.

It is important to acknowledge that the codebase of the Bot may possess limitations, and bugs or errors might be present. While the original author and contributors have endeavored to develop a dependable tool, they provide no guarantees with regards to the accuracy, reliability, or performance of the Bot. It is your duty to meticulously review, test, and evaluate the code prior to deploying it for trading activities.

Under no circumstances shall the original author or contributors be held liable for any direct, indirect, incidental, consequential, or punitive damages stemming from your utilization of the Bot, encompassing but not limited to trading losses, technical failures, or any other associated matters.

By employing the Bot for interactive trading on the Hyperliquid Perpetual DEX, you willingly release and hold harmless the original author and contributors from any claims, losses, liabilities, or expenditures that may arise due to your utilization of the Bot.

In conclusion, your decision to use the bot for trading on the Hyperliquid Perpetual DEX indicates your acceptance of these stipulations and your comprehension of the fact that you exclusively bear the responsibility for your trading activities and interactions with the Bot. If you do not concur with these conditions, we strongly advise refraining from using the Bot for trading purposes.

# Guide

![image](https://github.com/elevatordown/hyperliquid-ts-sdk/assets/138456736/7fa9faba-b07e-48c3-a63b-c23441da4155)
![image](https://github.com/elevatordown/hyperliquid-ts-sdk/assets/138456736/82217d67-94a3-4eb3-8964-2a33f8dd7ebe)
![image](https://github.com/elevatordown/hyperliquid-ts-sdk/assets/138456736/f35a6aba-e6dc-45b0-9a25-7bfb5d2bbddf)
![image](https://github.com/elevatordown/hyperliquid-ts-sdk/assets/138456736/e0f66ca2-1007-4126-a21d-de45cb305402)
![image](https://github.com/elevatordown/hyperliquid-ts-sdk/assets/138456736/4f46f50a-b882-4622-95b9-24cb20c2db5f)



# Documentation

This documentation provides instructions for setting up and running the bot that interacts with the Telegram API and Ethereum blockchain. The bot is designed to be run using the `yarn ts-node` command and can be deployed using Docker and Fly.io. It requires the following environment variables: `BOT_TOKEN` for the Telegram chat key and `SECRET_KEY` for the Ethereum wallet secret key.

## Prerequisites

Before proceeding with the setup, ensure you have the following installed:

- Node.js
- Yarn
- Docker (for Docker configuration)
- Flyctl CLI (for Fly.io configuration)

## Setting Up Environment Variables

To run the bot successfully, you need to provide two environment variables:

1. `BOT_TOKEN`: This is your Telegram Bot API token. You can obtain it by creating a bot on Telegram and obtaining the token from the BotFather.
2. `SECRET_KEY`: This is the secret key of the Ethereum wallet that the bot will use for interactions with the Ethereum blockchain.

Make sure to keep these keys secure and do not share them publicly.

## Running the Bot Locally

Follow these steps to run the bot locally:

1. Clone the Git repository containing the bot's source code.
2. Navigate to the root directory of the repository.
3. Create a `.env` file in the root directory and add the following content:

```
BOT_TOKEN=<your-telegram-chat-token>
SECRET_KEY=<your-ethereum-secret-key>
```

4. Open a terminal and navigate to the root directory.
5. Run the following commands:

```sh
yarn install
yarn ts-node bot/index.ts
```

To containerize the bot using Docker, see the Dockerfile at the root of the repository.
To deploy the bot to fly.io, see the fly configuration file at the root of the repository.
