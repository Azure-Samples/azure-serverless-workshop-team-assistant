# Hello Functions

In this module, you'll create a simple Function which listens for HTTP Requests and responds with an ASCII art response. We'll do this all locally to show how fast it is to develop and test locally. It is possible to do this all in the Azure Functions portal, however.

## 1. Pre-reqs

You'll need:
 - Node 8.5.0
 - Azure Functions Core Tools (@core)
    - npm i -g azure-functions-core-tools@core
    - This has a dependency on dotnet core being installed
 - VS Code or similar text editor
 - cURL, Postman, or a general REST API tool

## 2. Create a Function App project

Azure Functions can run locally with a very simple project structure. Essentially, you can create a directory which contains a child directory for each Function. It can also contain shared code/dependencies/static content. Each Function directory needs a `function.json` in it in order to be discovered by the Functions runtime; this file specifies the behavior of your application. The Function directory should also contain your code or you need to add a setting to your `function.json` on where that code lives. For most of this workshop, we'll just drop an `index.js` file in the same directory and let the runtime discover it automatically.

Here's a simple ASCII representation of a Functions project structure.

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

Fortunately, you don't have to create this all by hand. We can us the Azure Functions core tools to template for us. To create a new Functions Project, let's create a new directory and initialize it.

```bash
# Create a new directory
mkdir hello-functions
cd hello-functions
# Initialize that directory
func init
```

It should show an output like so:

```
Writing .gitignore
Writing host.json
Writing local.settings.json
Created launch.json
Initialized empty Git repository in /Users/chris/workspace/hello-functions/.git/
```

The tool won't overwrite any existing files, so if you ever accidentally delete a file and want to recreate it (like if you don't check in your `.vscode` directory), just run `func init` again.

## 3. Create a your first Function

To create our first Function of the workshop, all we need to do is run:

```
func new
```

which will prompt us for which type of Function we'd like to create. We can also specify it via command line arguments. In this case, we want to create a JavaScript HTTP Function, so we'll run instead:

```
func new -l JavaScript -t HttpTrigger -n hello
```

which should output something like

```
Select a language: JavaScript
Select a template: HttpTrigger
Function name: [HttpTriggerJS] Writing /Users/chris/workspace/hello-functions/hello/index.js
Writing /Users/chris/workspace/hello-functions/hello/sample.dat
Writing /Users/chris/workspace/hello-functions/hello/function.json
```

In addition to the directory, this created three files for us:

1. `index.js` which contains our code
2. `function.json` which contains our config for the Function
3. `sample.dat` which is some test data you can use with the template out of the box. We don't need this, so you can delete it if you'd like.

Let's go ahead and test out our Function now.

## 4. Running Azure Functions

To start your Functions, be sure you're in the root of your Function project and run:

```
func host start
```

This should print an output like this:

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

If you see errors, you might be missing a dependency. Get the attention of one of the instructors if you don't know what's wrong from the errors. One of the commons errors that occurs is if you're running an older version of Node.js, it won't install the Node worker properlly and you'll need to update to a new version of Node and reinstall.

Note at the bottom of that output, we have a URL where our Function is hosted: `http://localhost:7071/api/hello`

Go ahead an make a GET request to that via cURL, Postman, or even just a web browser. You should get a message like `Please pass a name on the query string or in the request body`. Now try again with a query parameter of `?name=world`. (aka `http://localhost:7071/api/hello?name=world`) which should get you a response like `Hello world`. You can try different name values like `?name=trogdor` and see the response change.

While we won't go into detail on all the settings you can do with function.json here, it is worth looking at it and noting we have an `httpTrigger` input and an `http` output for the response. This is how the runtime knows that this Function is an http triggered Function and not a queue triggered Function.

## 5. Changing from hello world to ascii art

In our workshop, we're building a service called "squirebot". The idea behind the name is that it is a bot which learns how to do things for you, but you have to train it, much like a squire of old. It is only appropriate then, that our first task we'll want squirebot to do for us is fetch us a lance.

Let's change our function a bit to instead return some ASCII art. You can read through the code, but essentially we have two different templates for long and short lances and we just do a simple find and replace depending on which letters we want it to be made of.

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

Now try to run this via cURL or Postman (not your browser since this needs to be POST).

```
curl -H "Content-Type: application/json" -X POST -d "{\"lance_length\":\"long\",\"lance_material\":\"metal\"}" http://localhost:7071/api/hello
```

This should return us a fancy ASCII lance. You can now stop your Functions host.

## 6. Preparing our task for our squirebot

Because this is no longer a hello world Function, and instead a lance fetching Function, one last step is to rename our Function.

The name of your Function is tied to the directory name, which in this case is `hello`. You can rename your directory to rename your Function. You can rename your directory from your file explorer, VS Code, or terminal. Rename your directory to "lanceFetcher".

`mv ./hello ./lanceFetcher`

Now, if you start the funcitons host again, you'll see your API has changed to `api/lanceFetcher`. You don't have to change your Function name to change your route - you can also do it by setting the `route` property in the `function.json`. For example, if I change the `route` property to `foobar`, can access my function on `api/foobar`. If you want to remove `api` from the base route, you can do this in the host.json. You can [learn about host.json settings on docs.microsoft.com](https://docs.microsoft.com/en-us/azure/azure-functions/functions-host-json).

Congratulations, you've now completed module 2 and created your first Function. You now know the basics on how to create a Functions project, how to create a Function from a template, how to edit and rename a Function, and how to run the Function locally.

## 7. (Optional) Create a C# function in Visual Studio

You can create a C# function app in Visual Studio with the same HTTP function as above. Follow the tutorial [Create your first function using Visual Studio](https://docs.microsoft.com/en-us/azure/azure-functions/functions-create-your-first-function-visual-studio).
