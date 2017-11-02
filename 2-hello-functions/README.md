# Hello Functions

このモジュールでは、シンプルな、Functions を作ります。HTTP Request と Response のリスナーで アスキーアートのレスポンスを返します。これらを全てローカルで開発して、如何に早く開発ができるかを示します。もちろん、Azure 上にある Azure Functions Portal でも開発が可能です。

## 1. 準備事項

以下のものが必要です。
 - Node 8.5.0
 - Azure Functions Core Tools (@core)
    - npm i -g azure-functions-core-tools@core
    - このツールを使うには、dotnet core がインストールされている必要があります。
 - VS Code もしくは、その他のテキストエディタ
 - cURL, Postman, もしくは、その他の REST API ツール

## 2. Function App project　を作成する

Azure Functions は、シンプルなプロジェクト構造になっていて、ローカルでも動作します。各Function を格納するサブディレクトリを作ることができます。Function のサブディレクトリは、コードや、依存するもの（ライブラリなど）、静的コンテンツを含むことができます。全ての Functionのディレクトリは、`function.json` が必要です。Functions のランタイムは、それを元に Function を見つけ出します。また、このファイルは、あなたのアプリケーションの振る舞いを決定します。Function のディレクトリは、コードが必要です。もしくは、`function.json` にどこにコードがあるのかが設定されている必要があります。このワークショップの大部分では、我々は、`index.js` を同じディレクトリに置いて使います。そうすると、Azure Functions のランタイムが自動的にコードを発見することができます。

Azure Functions のプロジェクト構造を下記に示します。

```
(root)
 - host.json
 - local.settings.json
 - package.json
 - node_modules
 -- (...)
 - foo   // <--- Function directory
 -- function.json
 -- index.js
 - bar   // <--- Function directory
 -- function.json
 -- index.js
```

このディレクトリ構造をいちいち作る必要はありません。Azure Functions core tools がテンプレートを生成してくれます。新しい Functions のプロジェクトを作成するためには、新しいディレクトリを作って、初期化 (initialize) しましょう。

```bash
# 新しいディレクトリを作る
mkdir hello-functions
cd hello-functions
# ディレクトリを初期化する
func init
```

出力結果は次のようになる。(Mac の例)

```
Writing .gitignore
Writing host.json
Writing local.settings.json
Created launch.json
Initialized empty Git repository in /Users/chris/workspace/hello-functions/.git/
```

このオペレーションでは、既存のコードは上書きしません。なんらかのきっかけでファイルを消してして再作成したいなら、もう一度 `func init` を実行してください。

## 3. 最初の Function を作成する

ワークショップの最初の Function を作成するためには、次のコマンドを実行しましょう。

```
func new
```

このコマンドは、私たちに、どのタイプの Function を作るのか聞いてきます。コマンドライン引数を指定することもできます。次の例では、JavaScript の HTTP Functions を作る例です。

```
func new -l JavaScript -t HttpTrigger -n hello
```

次のような出力例になります。

```
Select a language: JavaScript
Select a template: HttpTrigger
Function name: [HttpTriggerJS] Writing /Users/chris/workspace/hello-functions/hello/index.js
Writing /Users/chris/workspace/hello-functions/hello/sample.dat
Writing /Users/chris/workspace/hello-functions/hello/function.json
```

加えて、ディレクトリには、つぎの３つのファイルが作られます。

1. `index.js` Function のコード
2. `function.json` Function の設定ファイル
3. `sample.dat` テンプレートが作成したテスト用のデータ。なくても良い。不要なら消してください。

さぁ、最初の Function　をテストしてみましょう。

## 4. Azure Functions を実行する

作成した Function　を実行するためには、Function プロジェクトのルート(local.setting.json, host.json のあるディレクトリ)に移動して、次のコマンドを実行してください。

```
func host start
```

次のような出力結果になります。

```

                  %%%%%%
                 %%%%%%
            @   %%%%%%    @
          @@   %%%%%%      @@
       @@@    %%%%%%%%%%%    @@@
     @@      %%%%%%%%%%        @@
       @@         %%%%       @@
         @@      %%%       @@
           @@    %%      @@
                %%
                %

[10/7/17 3:14:29 PM] Reading host configuration file '/Users/chris/workspace/hello-functions/host.json'
[10/7/17 3:14:29 PM] Host configuration file read:
[10/7/17 3:14:29 PM] { }
info: Worker.Node.d8612901-590c-4313-9a02-02a7d424f334[0]
      Start Process: node  --inspect=5858 "/Users/chris/.azurefunctions/bin/workers/Node/dist/src/nodejsWorker.js" --host 127.0.0.1 --port 60505 --workerId d8612901-590c-4313-9a02-02a7d424f334 --requestId 7e03b625-8175-41f7-a47b-f06dec532484
info: Worker.Node.d8612901-590c-4313-9a02-02a7d424f334[0]
      Debugger listening on ws://127.0.0.1:5858/3ed53bc1-e73e-450e-b98b-d1d78b73c0ed
info: Worker.Node.d8612901-590c-4313-9a02-02a7d424f334[0]
      For help see https://nodejs.org/en/docs/inspector
[10/7/17 3:14:30 PM] Generating 1 job function(s)
[10/7/17 3:14:30 PM] Starting Host (HostId=christophersmacbookpro-114832657, Version=2.0.11308.0, ProcessId=50327, Debug=False, Attempt=0)
[10/7/17 3:14:30 PM] Found the following functions:
[10/7/17 3:14:30 PM] Host.Functions.hello
[10/7/17 3:14:30 PM]
[10/7/17 3:14:30 PM] Job host started
info: Worker.Node.d8612901-590c-4313-9a02-02a7d424f334[0]
      Worker d8612901-590c-4313-9a02-02a7d424f334 connecting on 127.0.0.1:60505
Listening on http://localhost:7071/
Hit CTRL-C to exit...

Http Functions:

	hello: http://localhost:7071/api/hello
```

エラーが発生したら、依存性の問題かもしれません。もう一度手順を見直して、エラーを注意深く見てみましょう。よくありがちなエラーとしては、古いバージョンの Node.js を動かしているというのがあります。もし、適切なバージョンの、Node worker を動かしていなかったら、新しいバージョンにアップデートして、再インストールが必要になるでしょう。

先ほどの出力結果の最後の行をみてみると、作ったFunction がホストられている URL がわかります。`http://localhost:7071/api/hello`

cURLもしくはブラウザ で、GET リクエストを送ってみよう。おそらく、`Please pass a name on the query string or in the request body`というメッセージが帰ってくると思います。再度クエリーパラメータをつけて送ってみましょう。こんな感じで。`?name=world`. (aka `http://localhost:7071/api/hello?name=world`)。そしたらきっと`Hello world` というレスポンスが帰ってくるでしょう。違う名前を試してみてください。`?name=trogdor`　きっとレスポンスが変わると思います。

今はまだ、`function.json` の設定の詳細については説明しませんがみてみましょう。`httpTrigger` の input と、`http` の output が、レスポンスとしてあるだけだということに気づくかもしれません。この設定によって、Azure Functions のランタイムが、この Function が、Queue トリガーではなく、Httpトリガーであるということを知ることができます。

## 5. hello world をアスキーアートに変える

本ワークショップでは、"squirebot" というサービスを作ります。このbotは、あなたのためにどのようなことをするか学びます。ただ、あなたはbot に教える必要があります。例えば、古のsquire(騎士の家来のような意味) のように。最初の我々のタスクは　squirebot が、我々に、槍を差し出すといったものになるでしょう。

槍の代わりに私たちの Functions では、アスキーアートを返しましょう。コードを読んでみてください。本質的に、私たちは、２つのテンプレートを持っています。長い槍、短い槍そして、槍を表現する単純に文字を検索して、リプレースして見ましょう。

```javascript
module.exports = function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');

    if (req.body && req.body.lance_length && req.body.lance_material) {
        const long_lance =
`         TTT
         TTTTTTTTT
    TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT
         TTTTTTTTT
         TTT`

        const short_lance =
`      TTT
    TTTTTTTTTTTT
      TTT`

        let material = req.body.lance_material === "wood" ? "w" : "m";

        let lance = req.body.lance_length === "short" ? short_lance.replace(/T/gi, material) : long_lance.replace(/T/gi, material);

        context.res = {
            // status: 200, /* Defaults to 200 */
            body: {
                //card:"hero",
                message: `Here's your lance!
${lance}`
            }
        };
    }
    else {
        context.res = {
            status: 400,
            body: {
                message: "I couldn't figure out how to do that..."
            }
        };
    }
    context.done();
};
```

cURL か Postman を使って実行してみましょう。(ブラウザでは、うまくいきません。 POSTがリクエストが必要です。)


```
curl -H "Content-Type: application/json" -X POST -d "{\"lance_length\":\"long\",\"lance_material\":\"metal\"}" http://localhost:7071/api/hello
```

槍の美しいアスキーアートが帰ってくるはずです。それでは、Function のホストを止めてください。

## 6. squirebot のためのタスクを準備する

これはもはや hello world Function ではありません。A lance fetching Function でしょう。最後に、Function の名前を変えてみましょう。

Function の名前は、ディレクトリ名と紐づいています。今回だと、`hello` です。Function の名前を変えるために、ディレクトリ名を変えましょう。File Explore, VS Code, terminal 等でディレクトリ名を`lanceFetcher`に変えましょう。


`mv ./hello ./lanceFetcher`



再度 functions のホストをスタートしてみましょう。API が、`api/lanceFetcher`に変わっているのがわかると思います。Function 名やルート（route)を変える必要はありません。`route` を変えたい場合は、`function.json`のプロパティとして設定できます。例えば、`route` を、`foobar` に変えたいとします。そうしたら、`api/foobar` でアクセスできるようになります。もし、`api` をベースURLから削除したかったら、`host.json`の中で行えます。[learn about host.json settings on docs.microsoft.com](https://docs.microsoft.com/en-us/azure/azure-functions/functions-host-json)　を参照してください。

おめでとうございます。モジュール２はこれで終了です。初めての Function を書きましたね。すでに、Function project を作成するための基礎を学びました。どのように、テンプレートから、Function を作るか、どのように、Function を編集して、名前を変更するか、そして、どのようにローカルで Function を実行するかについても。

## 7. (Optional) C# function を Visual Studio で作成する


Visual Studio を使って、上記と同じような C# Function を作ることができます。次のチュートリアルをやってみましょう。
[Create your first function using Visual Studio](https://docs.microsoft.com/en-us/azure/azure-functions/functions-create-your-first-function-visual-studio).


