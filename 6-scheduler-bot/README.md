# Add a team schedule module to your bot

## Overview

In this module we will use Azure Functions and Logic Apps to build in functionality that integrates with team calendars.  The idea is you can ask your bot to find a suitable meeting time between teammates, and it will respond back with available times.

The eventual flow will be:  
1. Bot is notified of a command to find schedules `Schedule appointment` for `jeff,thiago`
1. Logic Apps goes and grabs the calendar details for each person provided
1. A Function is called to calculate availability in calendars
1. A response is returned to the user with available times

To simplify the lab we already have a Google account setup with 2 users whos calendars we are going to look into.  However, the lab could work with any number of google calendars - as long as you have an account that can access them.  The Google API requires you reference the calendar by the calendar ID, like `azureserverlessdemo@gmail.com` would be the main calendar for that account.  In a real-world solution we would likely store a "friendly name" for the calendar - but for the purpose of simplicity we will keep the full calendar ID for this module.

First let's build a function that can calculate available timeslots after recieving a list of scheduled appointments.  This function will find all timeslots during a day between 8am and 5pm.

## Building the function

Let's build a function to find available time slots when the schedule is hard-coded in.

1. In your function app on your machine, create a new javascript function called `SchedulerBot`
    * `func new` -> `JavaScript` -> `HttpTrigger`
1. Open the new function in Visual Studio Code: `code .`
1. In the new `index.js` file, overwrite with the following: [code snippet](src/step-1/index.js)
    * This code will run and return any available slot within a set of scheduled events.  
1. Test to make sure the function works
    * `func host start` -> do a POST on the exposed URL locally `http://localhost:7071/api/SchedulerBot`

**Response from step-1 index.js**

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

This is stating that there is one available timeslot between 2:01pm and 5:00pm. Now let's replace the function so the schedule will be passed in and dynamically generated.  This will work when our Logic App is able to pass in the schedule information from Google Calendar.

1. Go back to the `index.js` file and replace the 

```javascript
var scheduledEvents = [
        {
            "start": "8:00:00",
            "end": "14:00:00"
        }
    ];

    //TODO: Change scheduled events to events from Google Calendar
```

with this snippet: [code snippet](src/step-2/index.snippet.js)  (the full index.js should look [like this](src/step-2/index.js))

1. Run the function again after saving changes, and this time when you POST, post with the following JSON body: [sample JSON](src/step-2/sample.json).  This is what the Logic App will generate.

**Response from step-2 index.js with sample.json body**
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
1. Publish the function app to Azure
    * `func azure functionapp publish {yourAzureFunctionAppName}`  

Now the function can correctly return back available times - we just need to write a Logic App to pull in calendar data.

## Building the Logic App

So we have a Google Account setup with the following schedule for calendars from Jeff (azureserverlessdemo - the green items) and Thiago (ujmqvr5.... - the yellow ones).  We need to pull *both* of their agendas and push this data to our Function to calculate when there is an available meeting time between 8am and 5pm.  Here's a sample of both of their calendars:  

![agenda](images/8.png)  

Do this we are going to use Azure Logic Apps and their connectors with services like Google Calendar.  We will also be doing a small "scatter-gather" pattern by spinning a worker for each calendar and then aggregating the results for all calendars.

1. Go to the [Azure Portal](https://portal.azure.com)
1. Create a new logic app called `scheduler-bot` in any region you prefer
1. Open the logic app and add a `Request` trigger
1. Click on the `Use sample payload to generate schema` button to specify the shape of the request.
1. Paste in the following example request from the bot:  
    ```json
    {
        "people": "azureserverlessdemo@gmail.com,ujmqvr5ouk8p9nmia2o4h6o33o@group.calendar.google.com"
    }
    ```
    This is specifying that the bot will send in a "people" parameter.  It will have a single value that is **comma seperated**.  We'll need to split it up in the app.  
1. Now we need to initialize a variable that will store each event schedule.  Add a step for **Initialize variable**.  Name the variable **schedules**, make it an Array, and you can leave the value empty.  
    ![](images/4.png)
1. Add a New step, and under **..More** select **Add a for each** as we need to grab calendar details FOR EACH of the `people` from the trigger.  However, if you recall the "people" we are sending in with the sample above are all in a single property.  They are seperated by a comma.  So we need to "split" the people by commas.  Doing a split will return an array, something like: `['person1', 'person2']` which will allow us to iterate over each person.  While we could write an Azure Function to do this, there is a simple [workflow definition language](http://aka.ms/logicappsdocs) to do basic transformations like this.  
1. In the `Select an output from previous steps`, select the **Expression** tab on the right and type in the following expression to split the people by a `,`: `split(triggerBody()['people'], ',')` -> then press **OK**  
    **HINT**: If you don't see expressions, zoom your browser out. You may be in "responsive" mode.  Note that zooming out the design surface will not work, you MUST zoom out the browser.
    ![](images/5.png)
1. Add an action - **Google Calendar - List the events on a calendar**  
![google calendar action](images/1.png)  
1. Sign in with the following account:
    * username: `azureserverlessdemo@gmail.com`
    * password: `s3rverless1`
    
    You may be asked to verify the account when you login.  If so, please see a proctor.

1. For the **Calendar ID** select **Enter custom value**.  Choose another expression to get the current item of the foreach loop.  The expression is: `item()`.  Open the expression editor tab again and type in `item()`  
1. Add another step in the foreach to **Append to array variable** - append the **Event List** to the "schedules" array.  
    ![](images/6.png)  
1. After/outside the foreach, call the function to evaluate the responses.
    * Add a function, select your app, select the `ScheduleBot` function
    * Pass in the **schedules** variable to the function
1. Add a response after the function, paste in the following to return a message to the bot.  This will just return a stringified version of the response body from the Function Step (called `SchedulerBot`):  
    ```json
    {
    "message": "@{body('SchedulerBot')}"
    }
    ```  
    ![](images/7.png)
1. Save the logic app, and copy the trigger invoke URL from the trigger.  If you want before registering with the bot you can debug by using a REST client (like Postman) and POSTing to the Logic App URL with sample payload from step 5 above.  However you can just register it to your bot to see it work live if you want.

## Train the bot
Go to the Squire UX and add a new skill.


|Field|Value|
|--|--|
|Title|Schedule appointment|
|Description|Get available time to meet with people|
|Method|POST|
|URL|*Copy the URL from your Logic app trigger*|
|Parameter Name|people|
|Parameter Prompt|Who do you want to schedule it with? (Comma seperated)|


Go to your bot and ask it to `Schedule appointment`.

When it asks with whom, paste in the following 2 google calendars:
`azureserverlessdemo@gmail.com,ujmqvr5ouk8p9nmia2o4h6o33o@group.calendar.google.com`

We could continue to improve the bot by adding in some aliases for the Logic App via CosmosDB or some other store. For instance `jeff` could substitute to `azureserverlessdemo@gmail.com`, making the bot easier to communicate with. For sake of simplicity we will leave as-is for now.