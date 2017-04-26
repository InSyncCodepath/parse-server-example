var twilio = require('twilio')('AC614646571a6babe92d5fa4d3c8301d0d', '81ea0e70153dcdbd50b132ce0f3d2792');
Parse.Cloud.define("sendVerificationCode", function(request, response) {
    //var verificationCode = Math.floor(Math.random()*999999);
    var verificationCode = 0000;
    var phoneNumber = request.params.phoneNumber;
    twilio.sendSms({
        from: "+1-408-775-7056",
        //To: request.params.phoneNumber,
        to: phoneNumber,
        body: verificationCode+" is your InSync verification code."
    }, function(err, responseData) {
        if (err) {
          response.error(err);
        } else {
           response.success("Success");
           var user = new Parse.User();
	   user.set('username', phoneNumber);
	   user.set('password', ""+verificationCode);
           user.set('phoneNumber', phoneNumber);
           user.set('name', request.params.name);
	   // Save new code verification object to db
	   user.save(null, {
	      success: function(user) {
		 console.log("successfully created new user object in DB");
	      },
	      error: function(user, error) {
		 console.log(error);
                 user.set('password', ""+verificationCode);
                 user.save(null, {
                    success: function(user) {
                    console.log("successfully updated user object in DB");
                 },
                 error: function(user, error) {
                     console.log(error);
                 
                 },
                 useMasterKey: true
                 });

	      }, 
              useMasterKey: true
	   });
        }
    });
});

Parse.Cloud.define("sendUserMessage", function(request, response) {
    var phoneNumber = request.params.phoneNumber;
    twilio.sendSms({
        from: "+1-408-775-7056",
        //To: request.params.phoneNumber,
        to: phoneNumber,
        body: request.params.message
    }, function(err, responseData) {
        if (err) {
          response.error(err);
        } else {
           response.success("Success");
        }
    });
});

Parse.Cloud.define("verifyCode", function(request, response) {
    //var code = request.params.phoneVerificationCode;
    //var phoneNumber = request.params.phoneNumber;
    var username = "+1-408-872-2732";
    var password = "3997";
    
    Parse.User.logIn(username, password, {
        success: function(user) {
               var pushQuery = new Parse.Query(Parse.Installation);
               pushQuery.equalTo("deviceType", "android");
               pushQuery.equalTo("userId", user.id);
               Parse.Push.send({
                 where: pushQuery, // Set our Installation query
                   data: {
                     sessiontoken: user.getSessionToken()
                   }
               }, { success: function() {
                      console.log("#### PUSH OK");
               }, error: function(error) {
                      console.log("#### PUSH ERROR" + error.message);
               }, useMasterKey: true});

               response.success('success');
             },
             error: function(user, error) {
                response.error("Error verifying user code");
             }
         });
});

// Android push test
Parse.Cloud.define('pingReply', function(request, response) {
  var params = request.params;
  var customData = params.customData;

  if (!customData) {
    response.error("Missing customData!")
  }

  var sender = JSON.parse(customData).sender;
  var query = new Parse.Query(Parse.Installation);
  query.equalTo("installationId", sender);

  Parse.Push.send({
  where: query,
  // Parse.Push requires a dictionary, not a string.
  data: {"alert": "The Giants scored!"},
  }, { success: function() {
     console.log("#### PUSH OK");
  }, error: function(error) {
     console.log("#### PUSH ERROR" + error.message);
  }, useMasterKey: true});

  response.success('success');
});

Parse.Cloud.define('pushChannelTest', function(request, response) {

  // request has 2 parameters: params passed by the client and the authorized user
  var params = request.params;
  var user = request.user;

  // To be used with:
  // https://github.com/codepath/ParsePushNotificationExample
  // See https://github.com/codepath/ParsePushNotificationExample/blob/master/app/src/main/java/com/test/MyCustomReceiver.java
  var customData = params.customData;
  var launch = params.launch;
  var broadcast = params.broadcast;
  var userIds = params.userIds;

  // use to custom tweak whatever payload you wish to send
  var pushQuery = new Parse.Query(Parse.Installation);
  pushQuery.equalTo("deviceType", "android");
  pushQuery.containedIn("userId", userIds);

  var payload = {};

  if (customData) {
      payload.customdata = customData;
  }
  else if (launch) {
      payload.launch = launch;
  }
  else if (broadcast) {
      payload.broadcast = broadcast;
  }

  // Note that useMasterKey is necessary for Push notifications to succeed.

  Parse.Push.send({
  where: pushQuery,      // for sending to a specific channel
  data: payload,
  }, { success: function() {
     console.log("#### PUSH OK");
  }, error: function(error) {
     console.log("#### PUSH ERROR" + error.message);
  }, useMasterKey: true});

  response.success('success');
});

// Android push test 2
Parse.Cloud.define('pushChannelTestTwo', function(request, response) {

  // request has 2 parameters: params passed by the client and the authorized user
  var params = request.params;
  var user = request.user;

  // extract out the channel to send
  var action = params.action;
  var message = params.message;
  var customData = params.customData;

  // use to custom tweak whatever payload you wish to send
  var pushQuery = new Parse.Query(Parse.Installation);
  pushQuery.equalTo("deviceType", "android");

  var payload = {};
  payload.alert = message;
  payload.action = action;
  payload.customdata = customData;

  // Note that useMasterKey is necessary for Push notifications to succeed.

  Parse.Push.send({
  where: pushQuery,
  data: payload,      // for sending to a specific channel                                                                                                                                 data: payload,
  }, { success: function() {
     console.log("#### PUSH OK");
  }, error: function(error) {
     console.log("#### PUSH ERROR" + error.message);
  }, useMasterKey: true});

  response.success('success');
});

// iOS push testing
Parse.Cloud.define("iosPushTest", function(request, response) {

  // request has 2 parameters: params passed by the client and the authorized user
  var params = request.params;
  var user = request.user;

  // Our "Message" class has a "text" key with the body of the message itself
  var messageText = params.text;

  var pushQuery = new Parse.Query(Parse.Installation);
  pushQuery.equalTo('deviceType', 'ios'); // targeting iOS devices only

  Parse.Push.send({
    where: pushQuery, // Set our Installation query
    data: {
      alert: "Message: " + messageText
    }
  }, { success: function() {
      console.log("#### PUSH OK");
  }, error: function(error) {
      console.log("#### PUSH ERROR" + error.message);
  }, useMasterKey: true});

  response.success('success');
});

// Event expiration time job
Parse.Cloud.define("EventEndJob", function(request, response) {

  var queryEnded = new Parse.Query("Event");
  queryEnded.equalTo("hasEnded", true);

  var bufferDate = new Date();
  var bufferHours = 3;
  bufferDate.setHours(bufferDate.getHours() - bufferHours);
  var queryTime = new Parse.Query("Event");
  queryTime.lessThan("endDate", bufferDate);

  var endEventQuery = Parse.Query.or(queryEnded, queryTime);
  endEventQuery.find({
    success: function(events) {	
	var eventsToCheck = [];
	var index = 0;
	for (var i = 0; i < events.length; i++) {
          var highlightsVideo = events[i].get("highlightsVideo");
	  if (highlightsVideo != null && highlightsVideo.trim().length > 0) {
            continue;
          }
	
	  eventsToCheck[index] = events[i];
	  index++;
	 }
	
         console.log("Got the following "+eventsToCheck.length+" unprocessed past events.");
         for (var i=0; i < eventsToCheck.length; i++) {
           console.log("Event ID: "+eventsToCheck[i].id+", Event Name: "+eventsToCheck[i].get("name"));
         }
         var eventHostQuery = new Parse.Query("UserEventRelation");
         eventHostQuery.containedIn("event", eventsToCheck);
         eventHostQuery.equalTo("isHosting", true);
         eventHostQuery.find({
             success: function(eventsHosts) {
               var userIds = [];
               var userIndex = 0;
               for (var i = 0; i < eventsHosts.length; i++) {
                 userIds[userIndex] = eventsHosts[i].get("userId");
                 userIndex++;
               }
               console.log("Got "+userIds.length+" hosts for the unprocessed past events.");
	       var pushQuery = new Parse.Query(Parse.Installation);
	       pushQuery.equalTo("deviceType", "android");
	       pushQuery.containedIn("userId", userIds);
	       Parse.Push.send({
		 where: pushQuery, // Set our Installation query
		   data: {
		     hostdata: eventsHosts
		   }
	       }, { success: function() {
		      console.log("#### PUSH OK");
	       }, error: function(error) {
		      console.log("#### PUSH ERROR" + error.message);
	       }, useMasterKey: true});

	       response.success('success');
             },
             error: function() {
                response.error("Error fetching host user ids for event end processing");
             }
         });
    },
    error: function() {
	response.error("Error fetching ended events to generate highlights.");
    }
  });
});

// RSVP Status Check Job
Parse.Cloud.define("RSVPStatusJob", function(request, response) {
  var currentDate = new Date();
  var eventQuery = new Parse.Query("Event");
  eventQuery.notEqualTo("hasEnded", true);
  eventQuery.greaterThan("startDate", currentDate);

  eventQuery.find({
    success: function(events) {	
         console.log("Got the following "+events.length+" upcoming events.");
         for (var i=0; i < events.length; i++) {
           console.log("Event ID: "+events[i].id+", Event Name: "+events[i].get("name"));
         }
         var eventHostQuery = new Parse.Query("UserEventRelation");
         eventHostQuery.containedIn("event", events);
         eventHostQuery.equalTo("isHosting", false);
         eventHostQuery.include("event");
         eventHostQuery.greaterThan("rsvpStatus", 1);
         eventHostQuery.find({
             success: function(eventsHosts) {
               for (var i = 0; i < eventsHosts.length; i++) {
                 var eventData = eventsHosts[i].get("event");
	         var pushQuery = new Parse.Query(Parse.Installation);
	         pushQuery.equalTo("deviceType", "android");
	         pushQuery.equalTo("userId", eventsHosts[i].get("userId"));
	         Parse.Push.send({
		   where: pushQuery, // Set our Installation query
		   data: {
                     customdata: {
                       title: "Your RSVP is pending for "+eventData.get("name"),
                       eventId: eventData.id,
                       notificationType: 1
                     }
                   },
	         }, { success: function() {
		      console.log("#### PUSH OK");
	         }, error: function(error) {
		      console.log("#### PUSH ERROR" + error.message);
	         }, useMasterKey: true});
               }
               console.log("Got "+eventsHosts.length+" guests of the upcoming events without RSVP.");

	       response.success('success');
             },
             error: function() {
                response.error("Error fetching host user ids for rsvp status");
             }
         });
    },
    error: function() {
	response.error("Error fetching current events to check rsvp status.");
    }
  });
});

