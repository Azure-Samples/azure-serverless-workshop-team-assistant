module.exports = function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');

     if (req.body && req.body.votingname && req.body.isOpen != null) {

        if (context.bindings.inputDocument && context.bindings.inputDocument.length == 1)
        {
            context.bindings.outputDocument = context.bindings.inputDocument[0];
            context.bindings.outputDocument.isOpen = req.body.isOpen;
            context.res = {
                status: 200,
                body: context.bindings.outputDocument
            };
            context.done(null, context.res); 
        }
        else {
            context.res = {
                status: 400,
                body: "Record with this votingname can not be found. Please pass a votingname of an existing document in the request body"}; 
                context.done(null, context.res); 
        };
    }
    else {
        res = {
            status: 400,
            body: "Please pass a votingname and isOpen value in the request body"
        };

        context.done(null, res);
    }
};