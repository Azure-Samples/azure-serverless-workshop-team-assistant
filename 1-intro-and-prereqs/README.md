# イントロダクションとセットアップ

ワークショップを始めるに当たって、さまざまなアカウントをセットアップして、必要となるソフトウェアをダウンロードし、インストールしていきます。すでに必要なバージョンをインストール済みである場合は、スキップ可能です。

## 1. アカウント (Accounts)

本ワークショップは、様々なサービスに依存しています。それらは全てフリーオプションを持っています。

### Azure　のサブスクリプション

Serverless アプリケーションをクラウドでホストするために、 Azure を使います。Azure のサブスクリプションを持っていない場合は、12 ヶ月のフリートライアルを使えます。[ここ](https://azure.microsoft.com/en-us/free/?v=17.39a) から申し込んでください。問題が発生した場合は、インストラクターに助けを求めてください。

### Microsoft Bot Framework アカウント

これから作成するBot は、Microsoft Bot Framework を使います。Bot Framework は、いくつかのチャットサービス (Slack, Facebook, Microsoft Teams, Kik, etc.) のミドルレイヤとして活躍します。単一の統一されたAPIを使います。Bot Framework は、開始時は無料で始めることができますが、Microsoft アカウントがログインするためには必要です。[ここ](https://dev.botframework.com/bots)で、Bot Framework のサービスにログインできます。Microsoft アカウントを持っていない場合は、[ここ](https://account.microsoft.com/account)から取得してください。


### Slack もしくは類似のサービス

これから、Slack を使って、Bot に接続確認を行います。ただ、使わなくても問題ありません。Slackアカウントが必要なら、[ここ](https://slack.com/create#email) から取得してください。いつくかのインテグレーションを楽しむことができます。Bot Framework のインターフェイスとしては、Bot Framework の開発チャットインターフェイス、Bing、Cortana、Email、Facebook、GroupMe、Kik、Skype、Skype for Business、Slack、SMS、Microsoft Teams、Telegram、WeChat、WebChat などが使えます。それぞれのサポートレベルについては、次のリンクをご参照ください。[Bot Framework channel inspector docs](https://docs.microsoft.com/en-us/bot-framework/portal-channel-inspector).

### GitHub アカウント

ワークショップでは、GitHub アカウントを使用します。もし、持っていない場合は、[ここ](https://github.com/join?source=header-home)から作成してください。 

## 2. Developer tools

ワークショップでは、次のツールを使います。:
 - [git](https://git-scm.com/downloads)
 - [Node 8.5.0](https://nodejs.org/en/download/releases/)
 - [dotnet core](https://www.microsoft.com/net/download/core)
 - [Azure Functions Core Tools 2.0 aka @core](https://www.npmjs.com/package/azure-functions-core-tools)
    - npm i -g azure-functions-core-tools@core
 - [Bot Framework Emulator](https://github.com/Microsoft/BotFramework-Emulator/releases/tag/v3.5.31). 
     * NOTE: Mac 最新版のインストーラで問題がある場合は、以前のバージョンを使うことができます。
     [botframework\-emulator\-3\.5\.19\-mac\.zip](https://github.com/Microsoft/BotFramework-Emulator/releases/download/v3.5.19/botframework-emulator-3.5.19-mac.zip).エミュレータは、起動時に自動的にダウンロードし、アップロードします。完了時に再起動だけお願いいたします。
 - [Azure CLI 2.0](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli?view=azure-cli-latest)
 - [Azure Storage Explorer](https://azure.microsoft.com/en-us/features/storage-explorer/).
 - モダンなブラウザ
 - A REST API ツール (cURL or [Postman](https://www.getpostman.com/) will do)
 -  Visual Studio, その他:
     - Azure workload がインストールされた[Visual Studio 2017 Update 3](https://www.visualstudio.com/downloads/) (Windows)
     - [C# extension](https://code.visualstudio.com/docs/languages/csharp) がインストールされた[Visual Studio Code](https://code.visualstudio.com/download) (Mac/Linux)
     - 上記のと違うツールを使いたい場合も、問題ありません。デバッグするときに助けが必要になるかもしれませんが、必須ではありません。

## 3. Introduction

このワークショップでは、エンドツーエンドで、Serverless の新しいサービスを作成します。本ワークショップの課題は、シンプルな webhook のインターフェイスですが、それを様々なチャットサービスに同様に展開するのは大変なことです。Slack, Facebook, Teams などのサービス毎に、少しだけ違った実装にする必要もあります。我々のソリューションでは、Microsoft Bot Framework の SaaS サービスを作って、ユーザに 1つの webhook ベースのサービスを作ってもらい、それが、すべてのBotのプロバイダーで動作させるとういものです。これにより、あなたは、webhook が呼ばれるための、インプットの何が必要であるかを知るために、あなたが、ユーザから情報を引き出すのを助けてくれます。

このワークショップでは、Azure Functions の RESTful API をどのように作ったらいいかを学ぶことができ、Logic Apps をより深く知ることができます。また、SaaS サービス　例えば、Bot Framework や、 Cognitive Service を使って、サービスを作るということも学ぶことができます。

### Architecture

<TBD>
