module.exports = function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');

    if (req.body && req.body.votingname && req.body.question && req.body.options) {
        var body = req.body;
        body.votingname = body.votingname.replace(/\s/g,'').toLowerCase();
        var optionsValues = req.body.options.replace(/\s/g,'').split(",");
        var options = [];
        for(var i=0; i< optionsValues.length; i++){
            var option = {};
            option.text = optionsValues[i];
            option.votes = 0;
            option.voters = [];
            options.push(option);
        }

        body.options = options;

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