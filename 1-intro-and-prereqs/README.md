# Introduction and setup

To begin the workshop, we'll have you set up all the various accounts and download any prereqs you don't already have.

## 1. Accounts

This workshop relies upon a few services that are provided by various entities. They should all have a free option to get started.

### Azure Subscription

In the the workshop, we'll be using Azure to run and host our serverless application in the cloud. If you don't have an Azure subscrition, you can get a 12 month free trial [here](https://azure.microsoft.com/en-us/free/?v=17.39a). If you have any issues, please ask an instructor for help.

### Microsoft Bot Framework account

In the workshop, in order for your bot to talk with the world, we'll be using Microsoft bot framework, which acts as a middlelayer to talk to all the various chat services (Slack, Facebook, Microsoft teams, Kik, etc.) with a single unified API. The service is free to get started, but you will need a Microsoft account to login. You can login to the bot service [here](https://dev.botframework.com/bots), and if you don't have a Microsoft account, you can sign up for one [here](https://account.microsoft.com/account)

### Slack or similar chat service

In the workshop, we're using Slack to prove we connected the bot, but it is 100% optional. If you want a Slack account, you can make one which will allow a small number of intergations [here](https://slack.com/create#email). You can use the Bot Framework's developer chat interface or any of the following interfaces:

 - Bing
 - Cortana
 - Email
 - Facebook
 - GroupMe
 - Kik
 - Skype
 - Skype for Business
 - Slack
 - SMS
 - Microsoft Teams
 - Telegram
 - WeChat
 - WebChat

 You can learn more about what is supported at each level via the [Bot Framework channel inspector docs](https://docs.microsoft.com/en-us/bot-framework/portal-channel-inspector).

### GitHub Account

In the workshop, we assume you have a GitHub Account. If that isn't the case, please create one [here](https://github.com/join?source=header-home).

## 2. Developer tools

Today you'll need the following developer tools:
 - [git](https://git-scm.com/downloads)
 - [Node 8.5.0](https://nodejs.org/en/download/releases/)
 - [dotnet core](https://www.microsoft.com/net/download/core)
 - [Azure Functions Core Tools 2.0 aka @core](https://www.npmjs.com/package/azure-functions-core-tools)
    - npm i -g azure-functions-core-tools@core
 - [Bot Framework Emulator](https://github.com/Microsoft/BotFramework-Emulator/releases/tag/v3.5.31). 
     * NOTE: If you have a problem with the latest Mac installers. So, install the older release [botframework\-emulator\-3\.5\.19\-mac\.zip](https://github.com/Microsoft/BotFramework-Emulator/releases/download/v3.5.19/botframework-emulator-3.5.19-mac.zip). The emulator will automatically download updates when it launches, and you simply have to restart it once that is complete.
 - [Azure CLI 2.0](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli?view=azure-cli-latest)
 - [Azure Storage Explorer](https://azure.microsoft.com/en-us/features/storage-explorer/).
 - A modern browser
 - A REST API tool (cURL or [Postman](https://www.getpostman.com/) will do)
 - [VS Code](https://code.visualstudio.com/Download)
    - If you'd prefer to use a different tool than VS Code, that's totally fine. You might need some help getting debugging working later on, but it's not required.

## 3. Introduction

In today's workshop, we'll be building a new service, end to end, with serverless technologies. The problem we'll be trying to solve is that today it's hard to build a simple webhook interface with all the various chat services today in a universal manner. We have to have slightly different implementations depending on which service you're talking to, be it Slack, Facebook, Teams, etc. Our solution is to build a SaaS service around the Microsoft Bot Framework which allows for users to create 1 webhook based service and it will work with all the bot providers. It will also allow for you to ask certain prompts from users in order to determine what the inputs to the webhook call will be.

The outcome for this workshop should be an improved knowledge on how to build RESTful APIs with Azure Functions, a deeper understanding of Logic Apps, and practice with building services on top of other SaaS services like Bot Framework and Cognitive Services.

### Architecture

<TBD>
