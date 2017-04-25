// Example express application adding the parse-server module to expose Parse
// compatible API routes.

var express = require('express');
var ParseServer = require('parse-server').ParseServer;
var path = require('path');

var databaseUri = process.env.DATABASE_URI || process.env.MONGODB_URI;

if (!databaseUri) {
  console.log('DATABASE_URI not specified, falling back to localhost.');
}

var pushConfig = {};

if (process.env.GCM_SENDER_ID && process.env.GCM_API_KEY) {
    pushConfig['android'] = { senderId: process.env.GCM_SENDER_ID || '',
                              apiKey: process.env.GCM_API_KEY || ''};
}

if (process.env.APNS_ENABLE) {
    pushConfig['ios'] = [
        {
            pfx: 'ParsePushDevelopmentCertificate.p12', // P12 file only
            bundleId: 'beta.codepath.parsetesting',  // change to match bundleId
            production: false // dev certificate
        }
    ]
}


var filesAdapter = null;  // enable Gridstore to be the default
if (process.env.S3_ENABLE) {
    var S3Adapter = require('parse-server').S3Adapter;

    filesAdapter = new S3Adapter(
        process.env.AWS_ACCESS_KEY,
        process.env.AWS_SECRET_ACCESS_KEY,
        {bucket: process.env.AWS_BUCKET_NAME, bucketPrefix: "", directAccess: true}
    );
}

var api = new ParseServer({
  databaseURI: databaseUri || 'mongodb://anamsarfraz:Lilonstitch2@ds119588.mlab.com:19588/heroku_lcm7nq9p',
  cloud: process.env.CLOUD_CODE_MAIN || __dirname + '/cloud/main.js',
  appId: process.env.APP_ID || 'myAppId',
  masterKey: process.env.MASTER_KEY || '', //Add your master key here. Keep it secret!
  push: pushConfig,
  filesAdapter: filesAdapter,
  liveQuery: { classNames: ["_User", "Message", "Event"]},
  serverURL: process.env.SERVER_URL || 'http://localhost/parse'  // needed for Parse Cloud and push notifications
});
// Client-keys like the javascript key or the .NET key are not necessary with parse-server
// If you wish you require them, you can set them as options in the initialization above:
// javascriptKey, restAPIKey, dotNetKey, clientKey

var app = express();

// Serve static assets from the /public folder
app.use('/public', express.static(path.join(__dirname, '/public')));

// Serve the Parse API on the /parse URL prefix
var mountPath = process.env.PARSE_MOUNT || '/parse';
app.use(mountPath, api);

// Parse Server plays nicely with the rest of your web routes
app.get('/', function(req, res) {
  res.status(200).send('InSync Privacy Policy\nLast modified: April 25th 2017 \nInSync provides event management by inviting contacts, chat messaging and guests location access in real-time. Our Privacy Policy helps explain our information practices. \nWhen we say “InSync,” “our,” “we,” or “us,” we’re talking about InSync Inc. This Privacy Policy (“Privacy Policy”) applies to to the InSync app.\nInformation We Collect\nInSync receives or collects information when we operate and provide our Services, including when you install, access, or use our Services.\nInformation You Provide\n•	Your Account Information. Your username, password, name and mobile number to create InSync account.\n•	Your contacts. They are only accessed during event creation time and are only visible to you.\n•	Your location. Only your latest location is saved and is only visible to attendees of  current event.\n•	Your pictures and videos are only visible to people invited to the event.\nAutomatically Collected Information\n•	Only your location is updated periodically and is only visible for the current event.\nThird-Party Information\n•	We do not sell your data and information to any third party.\nHow We Use Information\n•	We only use the information to share with other participants of the event using the InSync App.\nUpdates To Our Policy\nWe may amend or update our Privacy Policy. We will provide you notice of amendments to this Privacy Policy, as appropriate, and update the “Last Modified” date at the top of this Privacy Policy. Your continued use of our Services confirms your acceptance of our Privacy Policy, as amended. If you do not agree to our Privacy Policy, as amended, you must stop using our Services. Please review our Privacy Policy from time to time.');
});

var port = process.env.PORT || 1337;
var httpServer = require('http').createServer(app);
httpServer.listen(port, function() {
    console.log('parse-server-example running on port ' + port + '.');
});

// This will enable the Live Query real-time server
ParseServer.createLiveQueryServer(httpServer);
