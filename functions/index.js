var functions = require('firebase-functions');
var admin = require('firebase-admin');

admin.initializeApp(functions.config().firebase);

//sendNotificationNewcattle
exports.sendNotificationNewCattle = functions.database.ref('/user-cattles/{userId}/')
.onWrite(event=>{
  //get user reference
  var userRef = functions.database.ref('/user/{userId}/');
  console.log("user reference :"+userRef);

  //only send notif if data is first created
  if (event.data.previous.exists()) {
        return;
      }

  //get new cattle data
  var eventSnapshot = event.data;
  var user = event.params.userId;

  var userSnapshot = userRef.data;
  var cattle = eventSnapshot.child("id").val();
  var cattleCount = userSnapshot.child('numCattle');
  console.log("number cattle : "+cattleCount);

  var payload = {
    data: {
      title : "New Cattle Submitted!",
      content: "A Cattle " + cattle + "has been submitted!",
    }
  };

  //Send a message to device
  return admin.messaging().sendToTopic(user, payload)
  .then(function (response){
    console.log('notifying ' + user + ' about new cattle submitted');
    console.log("Successfully sent message", response);
  })
  .catch(function(error){
    console.log("Error sending message", error);
  })
})

exports.sendNotificationCattleUpdate =  functions.database.ref('/cattle/{cattleKey}')
.onWrite(event=>{

  var eventSnapshot = event.data;
  var cattle = event.params.cattleKey;
  var user = eventSnapshot.child('init-data').child('uid').val();
  var IdCattle = eventSnapshot.child('init-data').child('id').val();
  var update = eventSnapshot.child('init-data').child('updateCount').val();
  var bwNew = eventSnapshot.child('update-data-'+update).child('bw').val();
  var bwPrev = eventSnapshot.child('update-data'+(update-1)).child('bw').val();
  var develop = false;
  console.log("index update data : "+ update);
  console.log("New BW: "+bwNew+" and "+"Previous BW: "+bwPrev);
  console.log("cattle Id: "+cattle);

  var msg ="";
  //compare two value from update-data-
  if (bwNew>bwPrev) {
    develop = true;
    msg ="Positive cattle development reach!";
    console.log(msg);
  }else{
    msg = IdCattle+" Negative cattle development, see the report to analyze cattle's development!"
    console.log(msg);
  }

  var payload = {
    data: {
      title : IdCattle+" New Cattle Update!",
      content: msg,
    }
  };

  //Send a message to device
  return admin.messaging().sendToTopic(user, payload)
  .then(function (response){
    admin.database().ref('/cattle/'+event.params.cattleKey).set({developed : true});
    console.log("Successfully sent message", response);
  })
  .catch(function(error){
    console.log("Error sending message", error);
  });

});
