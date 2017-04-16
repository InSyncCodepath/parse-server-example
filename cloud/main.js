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
                 userIds[index] = eventsHosts[i].userId;
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
         eventHostQuery.lessThan("rsvpStatus", 2);
         eventHostQuery.find({
             success: function(eventsHosts) {
               var userIds = [];
               var userIndex = 0;
               for (var i = 0; i < eventsHosts.length; i++) {
                 userIds[index] = eventsHosts[i].userId;
                 userIndex++;              
               }
               console.log("Got "+eventsHosts.length+" guests of the upcoming events without RSVP.");
	       var pushQuery = new Parse.Query(Parse.Installation);
	       pushQuery.equalTo("deviceType", "android");
	       pushQuery.containedIn("userId", userIds);

	       Parse.Push.send({
		 where: pushQuery, // Set our Installation query                                                                                                                                                              
		   data: {
		     guestdata: eventsHosts
		   }
	       }, { success: function() {
		      console.log("#### PUSH OK");
	       }, error: function(error) {
		      console.log("#### PUSH ERROR" + error.message);
	       }, useMasterKey: true});

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

