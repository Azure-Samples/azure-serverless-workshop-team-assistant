# Squirebot

このモジュールでは、 squirebot を動かしてみます。そして、どのように動くのかを解析してみましょう。

# 1. 準備事項

下記のソフトウェアがインストールされていること

- Node 8.5.0
- Azure Functions core tools @ core
    - npm i -g azure-functions-core-tools@core
    - このツールを使うには、dotnet core がインストールされている必要があります。
- Bot Framework Emulator
 - VS Code もしくは、その他のテキストエディタ
- Azure アカウント
- Bot Framework アカウント

## 2. Set up

### 1. squirebot リポジトリをクローンする
```
git clone https://github.com/christopheranderson/squirebot
```

### 2. 依存(ライブラリ)のインストールとホストの立ち上げ

#### Function App
```bash
cd ./src/tasks-functions
npm i
npm start
```

`npm start` は `func host start --cors * command` を実行しています。

このコマンドは、Function のホストを起動します。

#### Web Client
```bash
cd ./src/webapp
npm i
npm start
```

このオペレーションは、Angular の静的コンテンツをホストしたサイトを立ち上げます。

立ち上がったら、お好みのブラウザを立ち上げて、[http://localhost:4200](http://localhost:4200)にアクセスしましょう。

`lanceFetcher` の中には、すでに一つのタスクが使用可能になっています。クリックするとその設定をみることができます。

### 3. Bot Framework Emulator

まだ、Bot Framework Emulator のインストールがお済みでなければ、下記のページからダウンロードしましょう。Windows, Linux そして、MacOS版が揃っています。

* [GitHub releases page](https://github.com/Microsoft/BotFramework-Emulator/releases)

Bot Framework Emulator を起動して、URL を `http://localhost:7071/api/bot`にセットしましょう。`application id` や、`secret` はセット不要です。

そして、チャットに、`hello` とタイプしましょう。ボットが、あなたを歓迎してくれるはずです。

`Fetch me my lance` とタイプしてみてください。bot がどのようなサイズか、どんな素材の槍(lance)がいいのか？を聞いてきます。それに答えると、アスキーアートの槍を返してくれます。

## 3. How it works


以前のステップで、Function App と、Web client をスタートさせました。web client は、Angular のプロジェクトです。現在の状態だと、クライアントは、`http://localhost:7071` に接続しています。これは、コンフィグファイルの`baseUrl` の設定で定義されています。


サンプルはこちらにあります。 `./src/webapp/src/app/tasks.service.ts`:

```typescript
@Injectable()
export class TasksService {
  baseUrl = environment.baseUrl || "";

  constructor(private http: HttpClient) { }

  getTasks(): Promise<ITask[]> {
    if (environment.mocked) {
      return Promise.resolve(tasks);
    } else {
      const p: Promise<ITask[]> = new Promise((res, rej) => {
        this.http
          .get(`${this.baseUrl}/api/tasks`)
          .subscribe(data => {
            res(data as ITask[]);
          }, (err) => {
            if (err.error instanceof Error) {
              rej(err);
            } else {
              if (err.status === 0) {
                if (isDevMode()) {
                  alert("Could not connect to host, might need to enable CORS or make sure it is up and running...");
                }
              }
              rej(new Error(`Bad response: status: ${err.status}, body: ${JSON.stringify(err.error, null, " ")}`));
            }
          });
      });
      return p;
    }
  }

 // Rest of the APIs are implemented in the file
```

この場合、このコードは、Function App の `api/tasks` を呼び出します。Functionをみてみましょう。このディレクトリの下にあります。

* [`./src/task-function/task-api`](https://github.com/christopheranderson/squirebot/blob/master/src/tasks-functions/task-api/index.js#L21-L53)

The code below is the code that will run in response to the requests from our client when there is a GET request.
このコードは、クライアントからGETリクエストがきた時に、レスポンスを返すコードです。

```javascript
function run(context, req) {
    // ... //
    switch (context.req.method) {
        case "GET":
            if (context.bindingData.id) {
                taskService.getTask(context.bindingData.id)
                    .catch(results => {
                        context.res.status(404).json({ message: results });
                    })
                    .then(results => {
                        context.res.status(200).json(results);
                    });
            } else {
                const count = context.req.query.count;
                const offset = context.req.query.offset;
                const name = context.req.query.name;

                if (name) {
                    taskService.getTaskByName(name)
                        .catch(results => {
                            context.res.status(404).json({ message: results });
                        })
                        .then(results => {
                            context.res.status(200).json(results);
                        });
                } else {
                    taskService.getTasks(count, offset)
                        .catch(results => {
                            context.res.status(400).json({ message: results });
                        })
                        .then(results => {
                            context.res.status(200).json(results);
                        });
                }
            }
            break;
//...
```

Http Trigger の Function を使う時に、いくつかのアプローチがあります。

1. 1 Function 毎に Route と Method を設定する
2. 1 Function 毎に Route を設定する
3. 1 Function 毎に複数の route を設定する

一般的に、Functions のベストプラクティスは、「１つの Function が、１つの事だけをする」というものです。このことに従うならば、オプション#1 が正しいでしょう。しかし、この場合、私たちは #2 を選びました。これは私たちが管理する Functions を少ない数にするためです。どちらにしても、いいことは、あとでリファクタリングしたかったらそんなに難しくないということです。

GET リクエストを処理するロジックをよくみてみると、`taskService.getTask(...)`メソッドを読んでいます。この`taskService` は、データベースにアクセスするための、共有モジュールからきています。中身をみてみましょう。　[`./src/tasks-functions/lib/tasks.js`](https://github.com/christopheranderson/squirebot/blob/master/src/tasks-functions/lib/tasks.js#L145).

```javascript
getTasks(count, offset) {
    if (!count) {
        count = 20;
    }

    if (!offset) {
        offset = 0;
    }

    if (this.useInMemory) {
        return Promise.resolve(LOCAL_TASKS.filter((task, index) => {
            return (index >= offset && index < offset + count);
        }));
    } else {
        return db.get(TASKS_COLLECTION, count, offset);
    }
}
```

サンプルはtaskService の `getTasks`メソッドがどのように実装されているかを示しています。この場合、ベストプラクティスに必要ないことをしています。しかし、Get Started として、あなたの理解を助けてくれるでしょう。また、`if` ステートメントで`useInMemory` であるかを判別してるのがわかります。これは、はじめに、データベースがなくても、アプリが実行できるようにしています。通常、開発のためには、データベースを持ってもらうことを推奨しますが、そのために同じロジックを２回実装するのはあまりよろしくありません。今回はMongoDBを使っているため、ローカルで動作する　MongoDB インスタンスを使用できました。

`MONGO_URL` という環境変数を設定すると、MongoDB ドライバーがデータベースと接続できるようになります。この場合、私たちは単純な、MongoDB ヘルパを用意するといいでしょう。また、MongoDB のクエリを実行するための、Mongoose などを使ってもいいでしょう。

Azure Functions に慣れている人は、MongoDB のライブラリの代わりに、なぜCosmosDB のバインディングを使わないのだろうと思うかもしれません。今回は、MongoDB をはじめとする他のデータベースライブラリが、Azure Functions から簡単に使えるというのを示したかったのです。一方、バインディングっは、コード量を減らしてくれます。他のコードを使うことに何の制限もありません。それは価値のあるいい例になることでしょう。私たちが、Cosmos DB バインディングを使わないというのは、私たちが Cosmos DB を使っていないということではありません。あしからず。

どのように動くかをみてみました。さぁ、Azure の上で動かしてみましょう。

## 4. CosmosDB を使ってみる

"Cosmos DB だって？今、Mongo DB って言わなかったっけ？" と思うかもしれません。

ご存知なければ、Cosmos DB は、マネージドの複数のモデルを持った Microsoft Azure のデータベースです。Serverless application 向けの様々ないい機能があります。その一つが、このサンプルです。MongoDB 互換のエンドポイントをサポートしています。だから、私たちは、Mongo　DB のインスタンスを立ち上げたり、VM にお金を払う必要がありません。

CosmosDB は、CLI かポータルで作成できます。

#### Azure CLI を使った Cosmos DB データベースと、コレクションの作成

Azure CLI をあなたの PC にインストールすることができます。もしくは、Cloud Shell を Azure Portal から使うことができます。

* [install the Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli?view=azure-cli-latest) 
* [Cloud Shell inside the Azure Portal](https://docs.microsoft.com/en-us/azure/cloud-shell/overview).

Azure CLI もしくは、Azure Portal の右上にある Cloud Shellボタンと使って、`databaseAccountname`　をユニークな名前に変えて、Cosmos DB アカウントとコレクションを作るために下記のファイルを実行してみてください。
)

> 注意: Cosmos DB アカウントを作るのは、数分かかります。また翻訳者が試した時は、英語大文字が入っているとエラーになりました。

```sh
#!/bin/bash

# Set variables for the new account, database, and collection
resourceGroupName='squire'
location='eastus'
databaseAccountname='<<<<Replace-with-Your-Unique-Name>>>>'
databaseName='squire'

# Create a resource group
az group create \
	--name $resourceGroupName \
	--location $location

# Create a DocumentDB API Cosmos DB account
az cosmosdb create \
	--name $databaseAccountname \
	--resource-group $resourceGroupName \
	--kind MongoDB

# Create a database
az cosmosdb database create \
	--name $databaseAccountname \
	--db-name $databaseName \
	--resource-group $resourceGroupName

# Get the database account connection strings
az cosmosdb list-keys \
    --name $databaseAccountname \
    --resource-group $resourceGroupName
```

コマンドの実行の最後に、Cosmos DB アカウントのキーが返却されます。primaryMasterKey の値をコピーして保存しておいてください。すぐに、Visual Studio Code の local settings file に追加することになります。

#### オプション: Azure Portal を使った Cosmos DB データベースとコレクションの作成

Azure CLI や Cloud Shell を使ったことがなく、ポータルでの操作をご希望でしたら、次のインストラクションに従ってください。

1. [Azure Portal](https://portal.azure.com)にログインする

2. 左のパネルで、New > Cosmos DB を検索してクリックします。そして、次の値で Cosmos DB アカウントを作ってみてください。

Field | Value
------------ | -------------
Id | <<<make up a unique name for you!>>>
API | MongoDB
Subscription | Your subscription (should already be selected)
Resource Group | Create new, squire
Location | East US

サンプルは下記の通りです。

![Create Cosmos DB Account](../5-voting-service/src/Content/Images/CosmosDB-1.PNG)

> 注意: Cosmos DB のアカウントを作るには、数分かかります。

3. Cosmos DB アカウントが作られたら、作成した、Cosmos DB のアカウントをポータル上で選択し、`COLLECTIONS > Browse > Add Database` を選択し"squire" という名前のデータベースを作ります。コレクションは作る必要がありません。MongoDB クライアントが自動的に作成してくれます。

4. 次に、データベースの Connection String を取得します。`Connection String` のセクションを見つけます。Cosmos DB アカウントの左側の列にあります。

![Get Connection string for Azure Cosmos DB](images/connection_string.png)

`Primary Connection String` の値をコピーして、保存しておきましょう。すぐに、Visual Studio Code の local settings file で使うことになります。

#### local settings のアップデート

Connection String で次のような URL が表示されていると思います。`mongodb://username:password@host:10255/?ssl=true`。これは、デフォルトで"test" コレクション用になっています。私たちは`squire` コレクションを作るのをオススメします。データベースのセッティングは次の感じに近くなっているだろうと思います。`mongodb://username:password@host:10255/[database]?ssl=true`.

訳者注：今までの設定だと、`[database]` は、`squire` だと思います。

新しいプロパティを`./src/tasks-functions/local.settings.json`に作りましょう。変数名は、`MONGO_URL` です。

local.setting.json は次のようになります。

```json
{
    "IsEncrypted": false,
    "Host": {
        "CORS": "*"
    },
    "Values": {
        "UseInMemoryStore":"false",
        "MONGO_URL":"mongodb://username:password@host:10255/[database]?ssl=true"
    }
}
```

`UseInMemoryStore` を `false` にするのを忘れないようにしてください。

Function のホストを再起動しましょう。Webページをロードすると、タスクが０件になっていると思います。

では、タスクをたす前に、アプリケーションを、Azure にデプロイしてみましょう。

## 5. Azure へのデプロイ

### 1. Function App を作成する

Azure にデプロイするためには、Function App を作成する必要があります。Function App は Functions のコレクションとして働きます。そして、複数の Functions を同じ Function App  にデプロイすることができます。それにより、共通のエンドポイントや、そのほかのものをシェアできます。

Function App は、Portal CLI や、ポータルのメニューなどから作成できます。

#### CLI

-  Azure Portal CLI を使う場合のインストラクションは次の通りです。[ここ](https://docs.microsoft.com/en-us/azure/azure-functions/functions-create-first-azure-function-azure-cli)

#### Portal

1. ポータルで "+ New" をクリックします
2. "Function App" を検索して、クリックします
3. 詳細を入力します
    - name は "<yourname>-squire" などにする
    - consumption plan (デフォルト)
    - east us (locatiopn)
    - Cosmos DB と同じ resrouce group を使うと削除が楽になリマス
    - App Insight は有効にする。(オプションだが、おすすめ)
4. create をクリックして、出来上がるのを待つ (数分かかります)

### 2. Functions をパッケージングする

Publish の前に、私たちができることの一つに、コールドスタートの時間を短縮することがあります。全ての Functions をシングルファイルにパックします。Node.js のコールドスタートにとって最もインパクトのあることの一つは、モジュールの解決です。

私たちは、Azure Functions のために、webpackをあなたのコードにかけるツールを書きました。npm を使ってダウンロードできます。

```bash
npm i -g azure-functions-pack
```

そして、Function App のベースで、次のコマンドを実行します。

```bash
funcpack pack .
```

結果として、次のような出力が出ると思います。

```bash
info: Generating project files/metadata
info: Webpacking project
info: Complete!
```

Functions がパッケージ化されました。ライブラリが入っている node_modules は削除可能です。しかし、それなしで動くようになっています。このオペレーションによって、デプロイメントが高速化されます。必要であれば、いつでも再インストールできます。

```bash
rm -r node_modules
```

### 3. Azure Functions Core Tools を使って Publish する

私たちのコードを、Azure Functions Core Tools を使って Publishしましょう。

1. Azure にログインする

```bash
func azure login
```

2. Function App に publish します。

先ほど指定した、Function App 名を指定します。( "<yourname>-squire" )

```bash
func azure functionapp publish <FUNCTION APP NAME HERE> -i -y
```

このコマンドは、あなたのディレクトリを Function App に publish します。

3. (オプション) すでに、publish したので、アンパックして、node_module をインストールして構いません。シンプルなスクリプトを書いても構いませんが、自分でやって、理解していただきたいと思います。

```bash
funcpack unpack .
npm i
```

あなたの Function がデプロイされて、"http://&lt;YOUR　FUNCTION APP NAME&gt;.azurewebsites.net/api/tasks"にブラウザ経由でアクセスができます。そして、戻り値が帰って来たら正しく動いています。

### 4. Angular App から Azure Functions を指定する

Function App にアクセスするためには、適切な base URLを指定する必要があります。

次のファイルを開けて、`./src/webapp/src/environments/environment.prod.ts`
base URL を次のように追加しましょう。

```typescript
export const environment = {
  production: true,
  mocked: false,
  baseUrl: "https://<YOUR FUNCTION APP NAME HERE>.azurewebsites.net"
};
```

ターミナルを開いて、"./src/webapp/" に移動してください。そして、`npm run build` を実行してください。このオペレーションは、`dist` ディレクトリを作ります。それは、アプリケーションのコピーで、static/tree をまぜこぜにしたようなコピー担っています。

Azure Portal で、Function App の Resource Group に行くと、Function App と一緒に作られたstorage account が見つかリます。この storage account を静的コンテンツをホストするために、ストレージコンテナを作るために使います。

"content" という名前のコンテナを作りましょう。もし、この名前を変えるなら、package.json の "build" スクリプトを違う名前に変える必要があります。また、不特定の人がアクセスできるように、Public access level を、"Blob" にしましょう。

![Container create screenshot](./images/container-create.png)

upload をクリックして、全ての `dist` ディレクトリの内容をアップロードしましょう。

アップロードした "index.html" をクリックすると、URL が取得できます。ブラウザの開発者ツールを使ってみてみると、現状だと、 CORS が有効ではないので、Function Appと通信できないでしょう。

２つのオプションがあります。

1. CORS を有効化する
2. Azure Functions proxy 経由で静的コンテンツを呼ぶ


２つのオプションのうち #2 は、より良い方法です。URL がストレージアカウントのURLではなくなるからです。#1 は早いのと、学ぶには有効な手段です。


#### 1. CORS を有効にする

1. storage account のドメインをコピーします。次のような感じでしょう。 "https://chrandesquire.blob.core.windows.net"

2. Function App のブレードに行って、Platform Feature option を選びます。すると、CORS オプションが見つかるはずです。

3. 上記のURLをリストの最後に追加して、"save" ボタンを押します。

![CORS Screenshot](./images/cors-create.png)

新しいタスクを足して、Function App をみる準備ができました。

#### 2. Azure Functions Proxies を使用する

1. Azure Portalの Function App ブレードに行きます。

2. Function App の Settings をクリックして、 Azure Functions Proxy を有効化します。

3. 左のメニューのProxies の横にある "+" ボタンをクリックします。

4. 新しい proxy を作成します。名前はなんでも構いませんが、私は "index" という名前を使います。"route"プロパティを"/" もしくは、"/index.html" (もしくは、好きなものに)設定しましょう。また、backend URL を、あたなのstorage コンテナの index.html ファイルに指定しましょう（"https://<YOURNAME>.blob.core.windows.net/content/index.html"　といった感じ)。そして、Create をクリックします。

5. コンテナである content に対して、route の設定が必要です。新たに proxy を作りましょう。名前は、"content" で route プロパティは、"/content/{*restOfPath}" backend URL は、コンテナにします。(もしくは、index.html ページと同じもので、index.htmlを除いたもの)　おそらく "https://<YOURNAME>.blob.core.windows.net/content/{restOfPath}"といった感じになると思います。Create をクリックしてください。

Function App の最初のプロキシで、base route を上書きしていることに注意してください。２つ目の設定では、`{*restOfPath}`トークンが残りのパスを受け付けて、backend URL に引き渡します。重要なポイントですが、backend URL の方では、"*" を除いて、`{restOfPath}` になります。


新しく作った、indexにアクセスして、Web ページが動作しているのを確認してください。CORS は必要ありません。

### 5. Bot を the Bot Framework に接続する

1. はじめに、[bot framework developer portal](https://dev.botframework.com/bots/provision?createFirstBot=true)に行きましょう。アカウントがなければ、サインアップしましょう。

2. create ボタンをクリックして、新しいBot を作ります。`Register an existing bot built using Bot Builder SDK`を選択してOKを押します。:
![Create a Bot](./images/create-a-bot.png)

3. bot の詳細を記述します。`messaging endpoint`には、`bot` function のurl を指定します。URL の中の key 付きです。次に、Microsoft App ID とパスワードを作成して、save します。これらの値はあとで使います。
![Configure the Bot](./images/configure-bot.png)


3. Azure の Function App を開いて、App Settings に、先ほど取得した AppID と　パスワードを下記の環境変数の値としてセットします。
    - MICROSOFT_APP_ID
    - MICROSOFT_APP_PASSWORD

4. Bot Framework のページ上であなたの bot を "test" してみましょう。"test" ボタンを押してください。すると、web ベースのbotインターフェイスが開きます。"hello" とタイプしてみてください。次に、何かをタイプします。例えば ("fetch me my lance")など。
　恐らく、bot はどうしたら良いかわからないでしょう。新しくデプロイした、squire bot の webpage に戻ります。Angular で作られた、先ほど、Proxyの設定をした、Web ページです。新しいタスクを作ります。今回は、このページ上で、"hello" function を参照するようにします。Function App のページにいって、hello function の URL をコピーし、先ほどのWeb ページに、ペーストします。このタスクは、”hello" ではなく、"hello world" と呼ぶことをオススメします。デフォルトのグリーティングとコンフリクトするからです。 Parameters には、"hello" を追加し、prompt として "What is your name?" を指定してセーブしましょう。

bot をもう一度テストすると、二回連続で "hello" をタイプすると、プロンプトの内容を返却してくれるはずです。

お好みであれば、あなたの bot を Slack や、 Microsoft Teams に接続することができます。次のインストラクションをご参照ください。[Bots documentation page](https://docs.microsoft.com/en-us/bot-framework/portal-configure-channels).

ここで、このモジュールも完了させることができました！長旅でしたが、あなたはきっとたくさんのことを学んだでしょう。あなたは、 Function App を作成して、Azure 上に Deploy しました。また、あなたは、Cosmos DB をどのように使うかを学びました。 Microsoft Bot Framework の使い方も学びました。新しいサービスを作成し、 chat アプリケーションを webhook で拡張しました。次のステップで、squirebot のプラグインについて学んで行きましょう。
