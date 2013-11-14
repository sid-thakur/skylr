/*global todomvc, angular */
'use strict';

function random(min, max) 
{ 
   return Math.round(min + Math.random()*(max - min)) 
}

/**
 * The main controller for the app. The controller:
 * - retrieves and persists the model via the todoStorage service
 * - exposes the model to the template and provides event handlers
 */
instrumentationApp.controller ('eventController', function MessageController ($scope, dataService, socket, charts){
    $scope.showtooltip = false;
    $scope.index = 0;
    $scope.value = '';
    $scope.messages = [ ];
    $scope.maxItemsLength = 5;
    $scope.users = [];
    
    // chart
    $scope.messageLoop = null;
    $scope.messagesByCategory = {};
    $scope.latestMessages = [];
    $scope.categorizeMessage = function (message) {
	var category = 0;
	if (message.code % 3 == 0) {
	    category = 1;
	} else if (message.code % 4 == 0) {
	    category = 2;
	} else if (message.code % 5 == 0) {
	    category = 3;
	}
	//console.log ("incrementing value for category: " + category);
	var value = null;
	if ($scope.messagesByCategory.hasOwnProperty (category)) {
	    value = $scope.messagesByCategory [category];
	    value++;
	    $scope.messagesByCategory [category] = value;
	} else {
	    $scope.messagesByCategory [category] = 1;
	}
    };

    $scope.chartMessages = function (time) {
	for (var c = 0; c < $scope.latestMessages.length; c++) {
	    $scope.categorizeMessage ($scope.latestMessages [c]);
	}
	for (var key in $scope.messagesByCategory) {
	    var value = $scope.messagesByCategory [key];
	    charts.addData (key, time, value * 1000); 
	}

	$scope.latestMessages.length = random ($scope.latestMessages.length / 8,
					       $scope.latestMessages.length);// = []; //.length = 0;
	$scope.messagesByCategory = {};
    };
    setInterval(function() {
	$scope.chartMessages (new Date ().getTime ());
    }, 1000);

    $scope.startMessageLoop = function () {
	$scope.stopMessageLoop ();
	$scope.messageLoop = 
	    setInterval(function() {
		$scope.addFile ();
	    }, Math.random (0, 100));
    };
    $scope.stopMessageLoop = function () {
	if ($scope.messageLoop != null) {
	    clearInterval ($scope.messageLoop);
	    $scope.messageLoop = null;
	}
    };
    $scope.toggleMessageLoop = function () {
	$scope.messageLoop === null ?
	    $scope.startMessageLoop () :
	    $scope.stopMessageLoop ();
    };

    $scope.addFile = function () {
	var id = $scope.index++;
	var message = {
	    id       : id,
	    code     : random (0, 10000),
	    name     : $scope.name,
	    date     : new Date (),
	    filename : [ 'file-', id ].join (''),
	    content  : $scope.value
	};
	dataService.addFile (message);
	$scope.sendMessage (message);
    };

    $scope.addMessage = function (message) {
	$scope.messages.push (message);
	if ($scope.messages.length > $scope.maxItemsLength) {
	    var indexToRemove = 0;
	    var numberToRemove = 1;
	    $scope.messages.splice (indexToRemove, numberToRemove);
        }
	$scope.latestMessages.push (message);
    };

    // Socket listeners
    // ================

    socket.on('init', function (data) {
	$scope.name = "awesome";
    });

    socket.on('send:message', function (message) {
	//console.log (message);
	$scope.addMessage (message);
    });

    socket.on('user:join', function (data) {
	$scope.users.push (data)
    });

    // add a message to the conversation when a user disconnects or leaves the room
    socket.on('user:left', function (data) {
	var i, user;
	for (i = 0; i < $scope.users.length; i++) {
	    user = $scope.users[i];
	    if (user === data) {
		$scope.users.splice (i, 1);
		break;
	    }
	}
    });

    // Methods published to the scope
    // ==============================

    $scope.sendMessage = function (message) {
	socket.emit('send:message', message);

	// add the message to our model locally
	$scope.addMessage (message);

	// clear message box
	$scope.value = '';
    };

});
