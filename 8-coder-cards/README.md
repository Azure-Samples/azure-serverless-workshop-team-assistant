# Coder Cards: geek trading card generator

CoderCards is a geek trading card generator. It uses Microsoft Cognitive Services to detect the predominant emotion in a face, which is used to choose a card back.

## Prerequisites

1. Visual Studio, either:
   - [Visual Studio 2017 Update 3](https://www.visualstudio.com/downloads/) with the Azure workload installed (Windows)
   - [Visual Studio Code](https://code.visualstudio.com/download) with the [C# extension](https://code.visualstudio.com/docs/languages/csharp) (Mac/Linux)

1. If running on a Mac/Linux, [.NET Core 2.0](https://www.microsoft.com/net/core#macos)

1. If running on a Mac/Linx, install [azure\-functions\-core\-tools](https://www.npmjs.com/package/azure-functions-core-tools)@core from npm. For more information, see https://aka.ms/func-xplat.

1. [Azure Storage Explorer](https://azure.microsoft.com/en-us/features/storage-explorer/).

1. [Bot Framework Emulator](https://github.com/Microsoft/BotFramework-Emulator/releases/). 

    * NOTE: There's a problem with the latest Mac installers. So, install the older release [botframework\-emulator\-3\.5\.19\-mac\.zip](https://github.com/Microsoft/BotFramework-Emulator/releases/download/v3.5.19/botframework-emulator-3.5.19-mac.zip). The emulator will automatically download updates when it launches, and you simply have to restart it once that is complete.

1. Azure Storage Account

1. [Azure CLI 2.0](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli?view=azure-cli-latest)

## About CoderCards

* There are two functions defined in this project:
  * **RequestImageProcessing**. HTTP trigger that writes a queue message. The request payload must be in the following form:

  ```json
      {
        "PersonName": "Scott Guthrie",
        "Title": "Red Polo Connoisseur",
        "BlobName": "Scott Guthrie-Red Polo Connoisseur.jpg"
      }
  ```

  * **GenerateCard**. Queue trigger that binds to the blob specified in the BlobName property of the queue payload. Based on the predominant emotion of the input image, it generates a card using one of 4 card templates.
     
     * The card is written to the output blob container specified by the app setting `output-container`. 

Here's a visualization of the bindings, using the [Azure Functions Bindings Visualizer](https://functions-visualizer.azurewebsites.net):

![Functions bindings](images/function-bindings.png)

## 1. Create Emotion API key

1. Create an Cognitive Services Emotion API key: 

    - In the Azure portal, click **+ New** and search for **Emotion API**.
    - Enter the required information in the Create blade. You may use the free tier **F0** for this module.

## 2. Configure the CoderCards project

1. Get the [CoderCards project on GitHub](https://github.com/Azure-Samples/functions-dotnet-codercards), either by `git clone` or downloading the zip.

   - Use the `master` branch if you're on Windows
   - Use the `core` branch if you're on a Mac.

1. In the portal, find the resource group and account name for the Azure Storage account you wish to use.

1. From a terminal, navigate to the **functions-dotnet-codercards** directory. Run the following, using the storage account name and resource group from above:

    ```
    az login
    python <Storage Account Name> <Resource group> true
    ```

    This will modify the file **local.settings.json**. The last argument controls whether to create containers prefixed with "local", which is useful if you want to use the same storage account when running locally and in Azure.

1. If using Visual Studio, open **CoderCards.sln**. On a Mac, open the **functions-dotnet-codercards** folder in VS Code. 

1. Open the file **CoderCards/local.settings.json** 

1. In the Azure portal, select your Emotion API instance. Select the **Keys** menu item and copy the value of **KEY 1**. Paste the value for the key `EmotionAPIKey`in **local.settings.json**.

1. Add the following `Host` setting to **local.settings.json**, as a peer to the `Values` collection:

    ```json
    {
        "IsEncrypted": false,
        "Host": {
            "LocalHttpPort": 7072,
            "CORS": "*"
        },
        "Values": {
            ...
        }
    }
    ```

### Summary of App Settings 

| Key                 | Description |
|-----                | ------|
| AzureWebJobsStorage | Storage account connection string |
| EmotionAPIKey       | Key for [Cognitive Services Emotion API](https://www.microsoft.com/cognitive-services/en-us/emotion-api) |
| input-queue         |  Name of Storage queue for to trigger card generation. Use a value like "local-queue" locally and "input-queue" on Azure
| input-container     | Name of Storage container for input images. Use a value like "input-local" locally and "card-input" on Azure |
| output-container     | Name of Storage container for output images. Use a value like "output-local" locally and "card-output" on Azure |
| SITEURL              | Set to `http://localhost:7072` locally. Not required on Azure. |
| STORAGE_URL          | URL of storage account, in the form `https://accountname.blob.core.windows.net/` |
| CONTAINER_SAS        | SAS token for uploading to input-container. Include the "?" prefix. |

If you want to set these values in Azure, you can set them in **local.settings.json** and use the Azure Functions Core Tools to publish to Azure.

```
func azure functionapp publish function-app-name --publish-app-settings
```

## 3. Run the project

1. Compile and run:

    - If using Visual Studio, just press F5 to compile and run **CoderCards.sln**.

    - If using VS Code on a Mac, run `dotnet build; dotnet publish`. Then, navigate to the output folder and run the Functions core tools:

        ```
        cd CoderCards/bin/Debug/netstandard2.0/osx/publish
        func host start
        ```

    You should see output similar to the following:

    ```
    Http Functions:

        Settings: http://localhost:7072/api/Settings

        RequestImageProcessing: http://localhost:7072/api/RequestImageProcessing

    [10/6/17 7:01:18 AM] Found the following functions:
    [10/6/17 7:01:18 AM] Host.Functions.Settings
    [10/6/17 7:01:18 AM] Host.Functions.GenerateCard
    [10/6/17 7:01:18 AM] Host.Functions.RequestImageProcessing
    [10/6/17 7:01:18 AM] 
    [10/6/17 7:01:18 AM] Job host started
    [10/6/17 7:01:18 AM] Host lock lease acquired by instance ID '0000000000000000000000005CADA547'.
    ```

2. To test that the host is up and running, navigate to [http://localhost:7072/api/Settings](http://localhost:7072/api/Settings).

## 4. Use the bot

1. Go to the Squire UX and add a new skill:

    |Field|Value|
    |--|--|
    |Title|generate CoderCard|
    |Description|Generate a CoderCard|
    |Method|POST|
    |URL| http://localhost:7072/api/RequestImageProcessing|
    |Parameter Name|BlobName|
    |Parameter Prompt|What is the source image URL?|
    |Parameter Name|PersonName|
    |Parameter Prompt|What is the person name?|
    |Parameter Name|Title|
    |Parameter Prompt|What is the person's title?|

1. In Azure Storage explorer, navigate to the storage account you're using. 

    - Select the container `input-local`.
    - Right-click and select **Set public access level**.
    - Select **Public read access for blobs only**.

2. Upload a *square* image of a face to `input-local` and copy the filename.

2. Go to your bot and ask it to `generate CoderCard`. Provide the filename you uploaded earlier.

3. Check the functions output window to see when the function is complete. The file will be written to the `output-local` container. Use Azure Storage Explorer to see the results.

    ```
    [10/4/2017 1:34:59 AM] Function completed (Success, Id=a1d2a381-4eb6-4d82-8dc9-324ad90932c4, Duration=4993ms)
    [10/4/2017 1:34:59 AM] Executed 'GenerateCard' (Succeeded, Id=a1d2a381-4eb6-4d82-8dc9-324ad90932c4)
    ```

## (Optional) 5. Use the CoderCards SPA

1. Run the Functions host on port 7071. Either modify the port **local.settings.json** or pass an explicit port when you start the functions host: `func host start --port 7071`.

2. In a command prompt, go to the `CoderCardsClient` directory.

    - Run `npm install`
    - Run `npm start`. This will launch a webpage at `http://127.0.0.1:8080/`. 


## (Optional) 6. Running manually 

1. Choose images that are **square** and upload to the `input-local` container. (Images that aren't square will be stretched.)

1. Send an HTTP request using Postman or CURL, specifying the path of the blob you just uploaded:

    `POST http://localhost:7072/api/RequestImageProcessing`

    ```json
    {
      "PersonName": "My Name", 
      "Title": "My Title",
      "BlobName": "BlobFilename.jpg"
    }
    ```