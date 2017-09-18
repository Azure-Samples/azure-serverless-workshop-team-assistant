var documentClient = require("documentdb").DocumentClient;
var connectionString = process.env["votingbot_DOCUMENTDB"];
var arr = connectionString.split(';');
var endpoint = arr[0].split('=')[1];
var primaryKey = arr[1].split('=')[1] + "==";
var collectionUrl = 'dbs/votingbot/colls/votingbot';
var client = new documentClient(endpoint, { "masterKey": primaryKey });

module.exports = function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');

    if (req.body && req.body.votingname) {
        if(context.bindings.inputDocument && context.bindings.inputDocument.length == 1) {
            deleteDocument(req.body.votingname, context.bindings.inputDocument[0].id).then((result) => {
                console.log(`Deleted document: ${req.body.votingname}`);
                context.res = {
                    status : 201,
                    body: `Deleted document: ${req.body.votingname}`
                };
                context.done(null, context.res);                
            },
            (err) => {
                context.log('error: ', err);
                context.res = {
                    body: "Error: " + JSON.stringify(err)
                };
                context.done(null, context.res);
            });
        }
        else {
            context.res = {
                status : 400,
                body: "Record with this votingname can not be found. Please pass a votingname of an existing document in the request body"
            };
            context.done(null, context.res);
        }
    }
    else {
        res = {
            status: 400,
            body: "Please pass a name on the query string or in the request body"
        };
        context.done(null, res);
    }
};

function deleteDocument(partitionKey, id) {
    let documentUrl = `${collectionUrl}/docs/${id}`;
    console.log(`Deleting document:\n${id}\n`);

    return new Promise((resolve, reject) => {
        client.deleteDocument(documentUrl, {
            partitionKey: [partitionKey] }, (err, result) => {
            if (err) reject(err);
            else {
                resolve(result);
            }
        });
    });
};