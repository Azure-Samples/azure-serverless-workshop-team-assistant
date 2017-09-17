module.exports = function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');

    if (req.body && req.body.votingname && req.body.user && req.body.option) {
        if (context.bindings.inputDocument && context.bindings.inputDocument.length == 1)
        {
            var body = context.bindings.inputDocument[0];
            var found = false;
            var alreadyset = false;
            for (var index = 0; index < body.options.length; ++index) {
                if (body.options[index].text.toLowerCase() == req.body.option.toLowerCase()) {
                    found = true;
                    for (var index2 = 0; index2 < body.options[index].voters.length; index2++) {
                        if (body.options[index].voters[index2].toLowerCase() == req.body.user.toLowerCase()) {
                            context.res = {
                                status: 201,
                                body: "Vote was already there, nothing updated"
                            };
                            alreadyset = true;
                            break;
                        }
                    }
                    if (found & !alreadyset){
                        body.options[index].votes++;
                        body.options[index].voters.push(req.body.user);
                    }
                    break;
                }
            }
            if (found & !alreadyset){
                context.bindings.outputDocument = body;
                context.res = {
                    status: 201, 
                    body: context.bindings.outputDocument
                };
            }
            else {
                if (!alreadyset){
                    context.res = {
                        status: 400,
                        body: "No vote option found with value " + req.body.option + " in voting session " + req.body.votingname
                    }
                }           
            }
        }
        else {
            context.res = {
                status: 400,
                body: "Record with this votingname can not be found. Please pass a votingname of an existing document in the request body"}; 
                context.done(null, context.res); 
        };
    }
    else {
        context.res = {
            status: 400,
            body: "Please pass a vote object in the request body"
        };
    }
    context.done();
};