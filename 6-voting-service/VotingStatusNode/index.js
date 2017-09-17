module.exports = function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');
    if(context.bindings.inputDocument && context.bindings.inputDocument.length == 1) {
        context.res = {
            status : 200,
            body : context.bindings.inputDocument[0]
        };
        context.done(null, context.res);
    }
    else {
        context.res = {
            status : 400,
            body: "Record with this votingname can not be found. Please pass a votingname of an existing document in the request body"
        };
        context.done(null, context.res);
    }
};