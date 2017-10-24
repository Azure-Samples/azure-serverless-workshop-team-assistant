# ボットへのチームスケジュール機能の追加

## 概要

このモジュールでは Azure Functions と Logic Apps を利用した、チームのカレンダー連携機能を開発します。例えばチームメイトとのミーティングを行う際、共通した空き時間をボットに探してもらうということが出来ます。

最終的なフローは以下の通りです。
1. ボットは複数ユーザーの共通空きスケジュールを検索するコマンドを、`Schedule appointment` for `jeff,thiago` として受け取る。
1. Logic Apps が各ユーザーの予定を取得する。
1. Azure Function で各ユーザーの空き時間を計算する。
1. 各ユーザー共通の空き時間が返される。

簡単にラボを進められるように、すでに 2 ユーザー分の Google アカウントを用意しています。実際にはアクセスできるアカウントがある限り、対象人数は自由に変更できます。Google API では `azureserverlessdemo@gmail.com` のようなアカウント ID を使ってメインの予定を取得できます。実際には予定表の名前を使う場合が多いのですが、今回はアカウント ID を使って予定にアクセスします。

まずは受け取った予定から、空き時間を調べるファンクションを作成します。このラボでは、朝 8 時から夕方 5 時の間で空き時間を取得します。

## ファクションの開発

まず予定をハードコードした状態で動作するものを作成します。

1. src\tasks-functions フォルダで名前が `SchedulerBot` の JavaScript の HttpTrigger ファクションを作成します。
    * `func new` -> `JavaScript` -> `HttpTrigger`
1. Visual Studio Code で作成したファンクションを開きます。: `code .`
1. `index.js` ファイルを以下のコードに置き換えます。: [code snippet](src/step-1/index.js)
    * このコードは、指定された時間帯で空いているスロットを検索します。
1. ファンクションが期待通り動くかテストします。
    * `func host start` -> `http://localhost:7071/api/SchedulerBot` に POST を送信します。

**期待される応答**

```javascript
{
    "availableSlots": 1,
    "availableTime": [
        {
            "start": "14:01:00",
            "end": "17:00:00"
        }
    ]
}
```

この応答は 2:01pm から 5:00pm の間で空きがあることを意味します。では次にファンクションを更新して予定が動的に渡された際に機能するようにします。これで Logic App で Google カレンダーから予定を取得して渡されても動作します。

1. `index.js` ファイルに戻り、以下の場所を  [code snippet](src/step-2/index.snippet.js) に差し替えます。 

```javascript
var scheduledEvents = [
        {
            "start": "8:00:00",
            "end": "14:00:00"
        }
    ];

    //TODO: Change scheduled events to events from Google Calendar
```

全てのコードは [このように](src/step-2/index.js) なります。
尚、このコードは UTC+8 タイムゾーンを想定しているため、
``` javascript
start: items['start'].toLocaleTimeString('en-US', { hour12: false }),
end: items['end'].toLocaleTimeString('en-US', { hour12: false })
```
のコードを、PC のローカルで日本時間である場合は -9-8 = -15 (夏時間の場合は -16) を追加します。
```javascript
start: new Date(new Date(items['start']).getTime() + (-15 * 3600000)).toLocaleTimeString('en-US', { hour12: false }),
end: new Date(new Date(items['end']).getTime() + (-15 * 3600000)).toLocaleTimeString('en-US', { hour12: false })
```
に差し替えます。

1. 再度ファンクションを実行しますが、今回は POST の Body として、[こちらのサンプル JSON](src/step-2/sample.json) を渡します。これは Logic App から渡されるものと同じです。

**期待される応答**
```javascript
{
    "availableSlots": 2,
    "availableTime": [
        {
            "start": "08:00:00",
            "end": "09:29:00"
        },
        {
            "start": "16:01:00",
            "end": "17:00:00"
        }
    ]
}
```

1. Azure 公開時には UTC で計算されるため、日本時間のカレンダーを使う場合は、以下のように変更してから、Azure に公開します。
```javascript
start: new Date(new Date(items['start']).getTime() + (9 * 3600000)).toLocaleTimeString('en-US', { hour12: false }),
end: new Date(new Date(items['end']).getTime() + (9 * 3600000)).toLocaleTimeString('en-US', { hour12: false })
```
    * `func azure functionapp publish {yourAzureFunctionAppName}` 

これで Azure Function で正しい時間を返せるようになりました。次には Logic App で予定データを取得します。

## Logic App の開発

例えば以下のよう Jeff (緑の予定) と Thiago (黄色の予定) があったとします。この場合、朝 8 時から夕方 5 時の間で、二人ともが予定が空いている時間帯を探します。  

![agenda](images/8.png)  

そのために、Azure Logic Apps を使って Google カレンダーに接続し、各ユーザーの予定を同時に取得したのち結果を集計します。

1. [Azure ポータル](https://portal.azure.com) にログインします。
1. 新しい Logic App を任意のリージョンに作り、`scheduler-bot` と名付けます。
1. トリガーとして `Request` トリガーを使います。
1. ”Use sample payload to generate schema” をクリックして、以下のコードをペーストします。
    ```json
    {
        "people": "azureserverlessdemo@gmail.com,ujmqvr5ouk8p9nmia2o4h6o33o@group.calendar.google.com"
    }
    ```
    これでボットが、people というデータをコンマ区切りで送ることが分かります。Logic App でこの内容を分割していきます。   
1. 次に変数を初期化します。 **Initialize variable** ステップを追加し、 変数名を **schedules**、型を Array とします。
    ![](images/4.png)
1. **..More** メニューより **Add a for each** を追加します。ここでは HTTP Request に渡されたアドレスごとに Google カレンダーの予定を取得します。ただ、people のデータは配列ではなくカンマ区切りの文字列で渡されるため、split 関数を使って配列に変換する必要があります。`Select an output from previous steps` を選択して、右側に出るメニューより **Expression** タブをクリックします。Expression として `split(triggerBody()['people'], ',')` と入力して **OK** をクリックします。
    **ヒント**: もし expressions タブが出ない場合、左側のメニューを消すなどして画面領域を広くしてみてください。 
    ![](images/5.png)
1. Foreach の中で、**Google Calendar - List the events on a calendar** アクションを追加します。
![google calendar action](images/1.png)  
1. 以下のアカウントでサインインするか、自分のアカウントでサインインします。(多要素認証が聞かれた場合は、自分のアカウントを利用してください。):
    * username: `azureserverlessdemo@gmail.com`
    * password: `s3rverless1`
1. **Calendar ID** では **Enter custom value** を選択し、 再度 Expression より `item()` と入力します。これで foreach で渡されるメールアドレスが指定できます。
1. 続いて　**Append to array variable** ステップを追加して、"schedules" 配列に **Event List** を追加します。  
    ![](images/6.png)  
1. foreach の外側に Azure Function のステップを追加します。
    * Function の一覧より、先ほど作成した `ScheduleBot` を選択します。
    * **schedules** 変数を引数として渡します。
1. 最後に response アクションを追加し、ユーザーに返す結果を指定します。Body に以下のスニペットをペーストします。  
    ```json
    {
    "message": "@{body('SchedulerBot')}"
    }
    ```  
    ![](images/7.png)
1. Logic　App を保存します。一番上の Request トリガーを展開して、URL をコピーし、Postman 等のツールで POST メッセージを送ってみてください。

## スキルの追加
Angular の Squire アプリに接続して、以下のようなスキルを追加します。


|フィールド|値|
|--|--|
|Title|Schedule appointment|
|Description|Get available time to meet with people|
|Method|POST|
|URL|*Logic app トリガーのアドレス*|
|Parameter Name|people|
|Parameter Prompt|誰とのスケジュールを確認しますか？(コンマ区切り)|


登録後、Bot から `Schedule appointment` と送信して、動作するか確認します。スケジュール確認の対象を聞かれた際は、`azureserverlessdemo@gmail.com,ujmqvr5ouk8p9nmia2o4h6o33o@group.calendar.google.com`　のようにカンマ区切りで対象のユーザーを指定します。

ボットをより高度に、かつ便利にするために、例えば `jeff` というアリアスを作って `azureserverlessdemo@gmail.com`にマップすることもできますが、このモジュールではここまでとします。
