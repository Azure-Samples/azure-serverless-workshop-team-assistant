# Squirebot

This this module, we'll get the squirebot up and running. We'll also examine how it works.

# 1. Pre-reqs

- Node 8.5.0
- Azure Functions core tools @ core
    - npm i -g azure-functions-core-tools@core
    - Also requires dotnet core installed (for now)
- Bot Framework Emulator
- VS Code/text editor, git, terminal
- Azure Account
- Bot Framework Account

## 2. Set up

### 1. Clone the squirebot repo
```
git clone https://github.com/christopheranderson/squirebot
```

### 2. Install dependencies and start up hosts

#### Function App
```bash
cd ./src/tasks-functions
npm i
npm start
```

npm start will run the func host start --cors * command

This should spin up the Function host

#### Web Client
```bash
cd ./src/webapp
npm i
npm start
```

This should spin up a local site hosting the static Angular content

When it has finished building, open up your favorite browser to [http://localhost:4200](http://localhost:4200)

You should now be able to see 1 task already existing for the build in "lanceFetcher" function. You can click on it to see the configuration.

### 3. Bot Framework Emulator

If you haven't already installed the emulator, you can download packages for Windows, Linux and macOS from the [GitHub releases page](https://github.com/Microsoft/BotFramework-Emulator/releases).

Start the bot framework emulator and set the url to "http://localhost:7071/api/bot". You don't need to set the application id or secret.

Then type "hello" into the chat, and the bot should greet you.

You can then type "Fetch me my lance" and the bot should prompt you with what size do you want your lance and what material. It should then return an ASCII lance to us.

## 3. How it works

In the previous step, you started a Function App and a web client. The web client is an Angular project. Running in its current form, the service connects to "http://localhost:7071". This is determined by the `baseUrl` setting in the config file.

Here's a sample from `./src/webapp/src/app/tasks.service.ts`:
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

In this case, this calls the `api/tasks` route on the Function App. Let's take a look at this Function. It's under [`./src/task-function/task-api`](https://github.com/christopheranderson/squirebot/blob/master/src/tasks-functions/task-api/index.js#L21-L53)

The code below is the code that will run in response to the requests from our client when there is a GET request.

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

There are a few different approaches that people use with HTTP Triggered Functions:

1. 1 Function per Route and Method
2. 1 Function per Route
3. 1 Function for many routes

In general, the best practice with Functions is for a Function to "do 1 thing". If we wanted to hold true to that, we might go for option #1. In this case, though, we've done #2, mainly to keep the number of Functions we have to manage low. The nice thing about all of this is that it isn't very hard to refactor this later if we want to.

If you look closer at the logic handling that GET request, it's calling `taskService.getTask(...)`. This `taskService` is coming from a shared module that our Functions use to talk to our database. You can take a look at it in the [`./src/tasks-functions/lib/tasks.js`](https://github.com/christopheranderson/squirebot/blob/master/src/tasks-functions/lib/tasks.js#L145).

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

This example shows how the taskService's `getTasks` method is implemented. In this case, we've done something that isn't necessarily best practice, but we've done it to help you get started. You'll notice that there is an "if" statement which is looking to see if we're going to "useInMemory". This is because we wanted you to be able to get started trying the app without a database created. Normally, I'd encourage you to just have a database for development purposes because reimplementing both pieces of logic isn't helpful. Since we're using MongoDB's client, we could use a locally running MongoDB instance.

When we do provide a `MONGO_URL` environment variable, we will use the MongoDB driver to talk to a database. In this case, we just have a simple MongoDB helper to make it simple to use. You could also use something like Mongoose if you wanted something nicer than raw MongoDB queries.

For those of you familiar with Azure Functions, you might ask why we didn't use the Cosmos DB bindings for this, rather than using a Mongo library. In this case, we did it to show that you can use Mongo DB and other database libraries in Azure Functions very easily. As nice as bindings are to help reduce the amount of code you write, there's no limitations to using other code and it's worth having some samples that show that off. Just because we're not using Cosmos DB bindings doesn't mean we're not using Cosmos DB, though...

Now that we've looked at how it all works, let's start getting it on Azure.

## 4. Working with CosmosDB

You may be thinking, "Cosmos DB? I thought you just said Mongo DB?".

In case you're not aware, Cosmos DB is a managed multi-model database that Microsoft Azure offers with a number of great features for serverless applications. One of the most interesting features for this sample, though, is that it has a Mongo DB compatible endpoint. This is helpful for us since we don't need to standup a Mongo DB instance and pay VM pricing for that.

You can create a Cosmos DB via the CLI or portal.

#### Create the Cosmos DB Database and Collection via the Azure CLI in the Portal

You can [install the Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli?view=azure-cli-latest) on your machine, or use it from the [Cloud Shell inside the Azure Portal](https://docs.microsoft.com/en-us/azure/cloud-shell/overview).

Using the Azure CLI, or the Cloud Shell button on the menu in the upper-right of the Azure portal, replace the value of `databaseAccountname` with a unique name, and run the following file to create our Cosmos DB account and collection:

> Note: the Cosmos DB account create step takes a few minutes to finish

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
At the end of running the commands you should have access to the Cosmos DB account keys. Copy the value of the primaryMasterKey and save it. Soon we will add it to the local settings file in Visual Studio Code.

#### Optional: Create the Cosmos DB Database and Collection via the Azure Portal

Follow these instructions if you didn't use the Azure CLI or Cloud Shell to create the data store and prefer to use the Azure Portal.

1. Login in to the [Azure Portal](https://portal.azure.com)

2. In the left pane, click New, click Databases, and then under Azure Cosmos DB, click Create. Create a new Cosmos DB account wit the following values:

Field | Value
------------ | -------------
Id | <<<make up a unique name for you!>>>
API | MongoDB
Subscription | Your subscription (should already be selected)
Resource Group | Create new, squire
Location | East US

Here is an example:

![Create Cosmos DB Account](../5-voting-service/src/Content/Images/CosmosDB-1.PNG)

> Note: this Cosmos DB account create step takes a few minutes to finish

3. After the account is created, create a new database named "squire" by selecting `Browse` underneath the `Collections` heading and clicking on `Add Database`. We don't need to create collections because MongoDB's client will do this for us automatically.

4. Next we need to get the database connection string.You can find it under the section `Connection String` in the left menu on the main screen for your Azure Cosmos DB account

![Get Connection string for Azure Cosmos DB](images/connection_string.png)

Copy the value of the Primary Connection String and save it. Soon we will add it to the local settings file in Visual Studio Code.

#### Updating local settings

You'll now have a url that looks something like: `mongodb://username:password@host:10255/?ssl=true`. This will use the "test" collection by default. I'd recommend creating a "squire" collection and using that as the database and setting the setting, so your URL should be closer to `mongodb://username:password@host:10255/[database]?ssl=true`.

You should be able to create a new property in `./src/tasks-functions/local.settings.json` called `MONGO_URL`.

It should look something like:

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

Be sure that "UseInMemoryStore" is set to false!!!

Now go back and restart your Function's host. If you reload the webpage, it should have no Tasks on it now.

Let's deploy the app to Azure before we start adding new tasks.

## 5. Deploying to Azure

### 1. Create a Function App
In order to deploy to Azure, we need to create a Function App. A Function App acts as a collection of Functions, which lets us deploy multiple Functions to the same Function App. This let's us share a common endpoint and more.

You can create a new Function App via the Portal CLI or just Portal menu options.

#### CLI

-  Setup Azure Portal CLI following the instructions here - https://docs.microsoft.com/en-us/azure/azure-functions/functions-create-first-azure-function-azure-cli

#### Portal

1. Click on "+ New" in the portal
2. Search for "Function App" and click on it
3. Fill out the details however you'd like try to use
    - name like "<yourname>-squire"
    - consumption plan (should be default)
    - east us
    - You should try to use the same resource group as your Cosmos DB to make clean up easy
    - Create a new Storage Account (this is different from your Cosmos DB)
    - Enable App Insights (not needed, but a good idea)
4. Click create and then wait for it to create (might take a few seconds).

### 2. Package our Functions

Before we publish, one thing we can do to reduce cold start is to pack all our Functions into a single file. One of the largest impacts to Node.js cold start is module resolution.

We've written a tool for Azure Functions which will webpack your code for you. You can download this tool via npm:

```bash
npm i -g azure-functions-pack
```

then run at the base of your Function App

```bash
funcpack pack .
```

which should result in:

```bash
info: Generating project files/metadata
info: Webpacking project
info: Complete!
```

Now that we've packed our functions, we can even remove our node_modules directory and it still works. I recommend doing this to speed up deployment. You can just reinstall them later.

```bash
rm -r node_modules
```

### 3. Publish via Azure Functions Core Tools

Now, we can publish our code via the Azure Functions core tools:

1. Login to azure

```bash
func azure login
```

2. Publish to Function App

```bash
func azure functionapp publish <YOUR NAME HERE> -i -y
```

This should publish your directory to your Function App.

3. (Optional) Now that you've published you can unpack and install your node modules. It's helpful to write a simple script for this, but we wanted you to do it by hand to understand how it works.

```bash
funcpack unpack .
npm i
```

Now that your Function is deployed you should be able to go access "http://&lt;YOURNAME&gt;.azurewebsites.net/api/tasks" via a browser and it will return data (not the webapp, yet) to confirm everything works.

### 4. Pointing our Angular App at Azure

In order to access our Function App, we need to point it to the right base URL.

Go to the `./src/webapp/src/environments/environment.prod.ts` and add your base URL so it looks like this:

```typescript
export const environment = {
  production: true,
  mocked: false,
  baseUrl: "https://<YOUR NAME HERE>.azurewebsites.net"
};
```

Now you can open a terminal to "./src/webapp/" and run `npm run build`. This will create a `dist` directory with a static/tree shaken copy of our application.

If you go to your Resource Group you created for your Function App, you should already have a storage account created with your Function App. We'll use this to create a storage container for our static content.

Be sure you create your container with the name "content". If you change it, you need to modify the package.json "build" script to use a different name. Also be sure you create it with "Blob" selected for anonymous access.

![Container create screenshot](./images/container-create.png)

Now click upload and select all the content in the `dist` directory.

Now if you click on your "index.html" file you just uploaded and open up the URL is gives you, it should load in the browser. But if you bring up your dev console, it won't be able to talk to the Function App as CORS is not enabled.

We have two options:

1. Enable CORS
2. Route calls for our static content through an Azure Functions proxy

I'll list both options. #2 is the one with the nicest outcome because it will be all 1 URL, not a storage account URL. #1 is fast though and useful to learn as well.

#### 1. Enable CORS

1. Copy your storage account domain. Should looks like "https://chrandesquire.blob.core.windows.net"

2. Go to your Function App blade and click on your Platform Features option. Then find the CORS option.

3. Add your URL to the bottom of the list and click "save"

![CORS Screenshot](./images/cors-create.png)

Now you should be able to see add new tasks and see your Function App.  As a reminder, the tasks you previously saw when running the application locally will not show up as you are now pointing at the CosmosDB in Azure.

#### 2. Use Azure Functions Proxies

1. Go to your Function App blade

2. Click on Function App Settings and use the toggle to enable Azure Functions Proxies

3. Click on the "+" button next to Proxies on the left menu

4. Create a new proxy. The name doesn't matter, but I used "index". Set the "route" property to "/" or "/index.html" (or whatever you want). Set the backend URL to the URL to your storage container's index.html file. (Should be "https://<YOURNAME>.blob.core.windows.net/content/index.html"). Click save.

5. Now we need to create a route for the rest of the content. Create another new proxy. The name can be "content", the route property should be "/content/{*restOfPath}", the backend URL should be the container (or the same as your index.html page, without index.html at the end) with at the end (should look like "https://<YOURNAME>.blob.core.windows.net/content/{restOfPath}". Click save.

Note that we overwrote the base route for the Function App in the first proxy. Second thing to note is the `{*restOfPath}` token which grabs the rest of the path for us and gives us a token we can use in the backend URL. Importantly, we remove the "*" from the token there, so it is just `{restOfPath}`.

Now go to the route you created for your index file and view your webpage working! No CORS needed.  As a reminder, the tasks you previously saw when running the application locally will not show up as you are now pointing at the CosmosDB in Azure.

### 5. Connecting your bot to the Bot Framework

1. To get started, go to the [bot framework developer portal](https://dev.botframework.com/bots/provision?createFirstBot=true) and, if you haven't already, sign up for an account.

2. Click the button to create a new bot and choose `Register an existing bot built using Bot Builder SDK`:
![Create a Bot](./images/create-a-bot.png)

3.  Fill out the details of your bot. In the `messaging endpoint` value, enter in the Configuration section, enter the url of the `bot` function in your Function App in Azure, including the key in the URL. Then create the Microsoft App ID and Password and save those values for later.
![Configure the Bot](./images/configure-bot.png)

3. Go to your Function App on Azure and set the app settings with the App ID and secret from the previous step:
    - MICROSOFT_APP_ID
    - MICROSOFT_APP_PASSWORD

4. You should be able to then "test" your bot via the "test" button. This opens a web based bot interface. Type "hello" in there and then try to tell it to do something (like "fetch me my lance").

It doesn't know how to do that, probably. Well go back to your newly deployed squire bot webpage (either the CORS or non-CORS version) and create a new task. This time, point it to your "hello" funciton in your Function App that you've already deployed (copy+paste the URL from the Functions UI to get the API key). I'd recommend calling the bot "hello world" rather than "hello" since this conflicts with the default greeting. Make sure to create a parameter named "hello" with a prompt like "What is your name?".

Now your bot should be able to say hello back!

If you'd like to, you can connect your bot to Slack or Microsoft teams by following the instructions on the [Bots documentation page](https://docs.microsoft.com/en-us/bot-framework/portal-configure-channels).

At this point, you've completed the module! It was a long journey, but you've done a lot! You've created a Function app and deployed it to Azure. You've learned how to use Cosmos DB. You've learned how to use the Microsoft Bot Framework. You've created a whole new service for extending chat applications with webhooks! Continue on to the next step to learn how to create more plugins for the squirebot.
