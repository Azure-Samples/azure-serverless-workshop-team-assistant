module.exports = function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');

    if (req.body && req.body.votingname && req.body.question && req.body.options) {
        var body = req.body;

        for(var i=0; i< body.options.length; i++){
            body.options[i].votes = 0;
            body.options[i].voters = [];
        }

        context.bindings.outputDocument = body;

        context.res = {
            status: 201, 
            body: body
        };
    }
    else {
        context.res = {
            status: 400,
            body: "Please pass a voting object in the request body"
        };
    }
    context.done();
};