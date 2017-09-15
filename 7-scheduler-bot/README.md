# Add a team schedule module to your bot

## Overview

In this module we will use Azure Functions and Logic Apps to build in functionality that integrates with team calendars.  The idea is you can ask your bot to find a suitable meeting time between teammates, and it will respond back with available times.

The eventual flow will be:  
1. Bot is notified of a command to find schedules `/squire schedule jeff thiago`
1. Logic Apps goes and grabs the calendar details for each person provided
1. A Function is called to calculate availability in calendars
1. A response is returned to the user with available times

## Building the function

1. In your function app on your machine, create a new javascript function called `SchedulerBot`
    * `func new` -> `JavaScript` -> `HttpTrigger`
1. Open the new function in Visual Studio Code: `code .`
1. In the new `index.js` file, overwrite with the following: [code snippet](src/step-1/index.js)
    * This code will run and return any available slot within a set of scheduled events.  
1. Test to make sure the function works
    * `func run .` -> do a POST on the exposed URL locally `http://localhost:7071/api/SchedulerBot`

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

This is stating that there is one available timeslot between 2:01pm and 5:00pm.

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

1. Run the function again after saving changes, and this time when you POST, post with the following JSON body: [sample JSON](src/step-2/sample.json)

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

Now the function can correctly return back available times - we just need to write a Logic App to pull in calendar data.

## Building the Logic App

1. Go to the [Azure Portal](https://portal.azure.com)