module.exports = function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');
    var scheduledEvents = [];

    //Add all scheduled events into an array
    req.body.forEach(function (calendar) {
        calendar.items.forEach(function (items) {
            scheduledEvents.push({
                start: items['start'].toLocaleTimeString('en-US', { hour12: false }),
                end: items['end'].toLocaleTimeString('en-US', { hour12: false })
            });
            context.log(items['start']);
            context.log(new Date(items['start']).getUTCHours());
        })
    });

    //Sort all events chronologically
    scheduledEvents.sort(compare);

    var schedule = findSlotInDay(scheduledEvents);

    //Find first slot 
    context.log(JSON.stringify(schedule));

    context.res = {
        body: {
            availableSlots: schedule.length,
            availableTime: schedule
        }
    };

    context.done();
};

//Data comparison function
function compare(a, b) {
    if (a['start'] < b['start']) {
        return -1;
    }
    if (a['start'] > b['start']) {
        return 1;
    }
    return 0;
}

//Courtesy of StackOverflow 
//https://stackoverflow.com/questions/19277348/how-to-calculate-free-available-time-based-on-array-values
function findSlotInDay(scheduledEvents) {
    var schedule = [];
    var start = '08:00:00';
    var end = '17:00:00';
    var finalEnd = '17:00:00'
    for(var i=0, l=scheduledEvents.length; i<l; i++){
        end = subtractMinute(scheduledEvents[i].start);
      
        if(i)
          start = addMinute(scheduledEvents[i-1].end);
      
        if((end && !i) || (end && i && scheduledEvents[i-1].end < scheduledEvents[i].start))
          schedule.push({start: start, end: end});
      
       
      
        if(i+1 === l){
          start = addMinute(scheduledEvents[i].end);
      
          if(start)
              schedule.push({start: start, end: finalEnd});
        }
      }
    return schedule;
}

function subtractMinute(time){
    var h = +time.substr(0, 2);
    var m = +time.substr(3, 2);
  
    if(m > 0){
      m -= 1;
    }else{
      if(h > 0){
        h -= 1;
      }else{
        return false;
      }
      m = 59;
    }
  
    if(h < 10)
      h = '0'+h;
  
    if(m < 10)
      m = '0'+m;
  
    return h+':'+m+':00';
  }
  
  function addMinute(time){
    var h = +time.substr(0, 2);
    var m = +time.substr(3, 2);
  
    if(m < 59){
      m += 1;
    }else{
      if(h < 22){
        h += 1;
      }else{
        return false;
      }
      m = 0;
    }
  
    if(h < 10)
      h = '0'+h;
  
    if(m < 10)
      m = '0'+m;
  
    return h+':'+m+':00';
  }