"use strict";

// We need network functions.
var net = require('net');
// Temporarily store the device's IP address and name. For later use, it gets added to the device's settings
var tempIP = '';
var tempDeviceName = '';
// Variable to hold responses from the AVR
var receivedData = "";
// As we are using the rfc2217_server.py tool running on a Linux PC(eg. raspi or any other) we are able to
// use any telnet port, but for this first version we use port 23, as this is a fork of the Marantz module.
var telnetPort = 23;
// a list of devices, with their 'id' as key
// it is generally advisable to keep a list of
// paired and active devices in your driver's memory.
var devices = {};
// All known inputs for supported Pioneer VSX RS232 equipped AV receivers and a more friendly name to use.
// If you find your favorite input missing, please file a bug on the GitHub repository.
var allPossibleInputs = [
		{	inputName: "00FN",
	 		friendlyName: "Phono"
		},
		{	inputName: "01FN",
	 		friendlyName: "CD player"
		},
		{	inputName: "02FN",
	 		friendlyName: "Tuner"
		},
		{	inputName: "03FN",
	 		friendlyName: "CDR"
		},
		{	inputName: "04FN",
			friendlyName: "DVD"
		},
		{	inputName: "05FN",
			friendlyName: "TV"
		},
		{	inputName: "06FN",
	 		friendlyName: "SAT"
		},
		{	inputName: "10FN",
	 		friendlyName: "Video or Video1"
		},
		{	inputName: "12FN",
	 		friendlyName: "Multi CH"
		},
		{	inputName: "13FN",
	 		friendlyName: "USB"
		},
		{	inputName: "14FN",
			friendlyName: "Video2"
		},
		{	inputName: "15FN",
	 		friendlyName: "DVR or DVR1"
		},
		{	inputName: "16FN",
			friendlyName: "DVR2"
		},
		{	inputName: "17FN",
	 		friendlyName: "iPod"
		},
		{	inputName: "18FN",
	 		friendlyName: "XM"
		},
		{	inputName: "19FN",
	 		friendlyName: "HDMI 1"
		},
		{	inputName: "20FN",
	 		friendlyName: "HDMI 2"
		},
		{	inputName: "21FN",
	 		friendlyName: "HDMI 2"
		}
];

// init gets run at the time the app is loaded. We get the already added devices then need to run the callback when done.
module.exports.init = function( devices_data, callback ) {
	devices_data.forEach(function(device_data){
		Homey.log('Pioneer VSX RS232 Control App - init device: ' + JSON.stringify(device_data));
	  initDevice( device_data );
	})
	//tell Homey we're happy to go
	  callback();
}

// start of pairing functions
module.exports.pair = function( socket ) {
// socket is a direct channel to the front-end

// this method is run when Homey.emit('list_devices') is run on the front-end
// which happens when you use the template `list_devices`
	socket.on('list_devices', function( data, callback ) {

		Homey.log( "Pioneer VSX RS232 Control App - list_devices data: " + JSON.stringify(data));
// tempIP and tempDeviceName we got from when get_devices was run (hopefully?)

		var newDevices = [{
			data: {
				id				: tempIP
			},
			name: tempDeviceName,
			settings: { "settingIPAddress": tempIP } // initial settings
		}];

		callback( null, newDevices );
	});


// this is called when the user presses save settings button in start.html
	socket.on('get_devices', function( data, callback ) {

		// Set passed pair settings in variables
		tempIP = data.ipaddress;
		tempDeviceName = data.deviceName;
		Homey.log ( "Pioneer VSX RS232 Control App - got get_devices from front-end, tempIP =", tempIP, " tempDeviceName = ", tempDeviceName );
// FIXME: should check if IP leads to an actual Marantz device - BUG from the original author <<
// assume IP is OK and continue, which will cause the front-end to run list_amplifiers which is the template list_devices
		socket.emit ( 'continue', null );
	});

		socket.on('disconnect', function() {
			console.log("Pioneer VSX RS232 Control App - Pairing is finished (done or aborted)");
	  })
}
// end pair

module.exports.added = function( device_data, callback ) {
    // run when a device has been added by the user (as of v0.8.33)
		Homey.log("Pioneer VSX RS232 Control App - device added: " + JSON.stringify(device_data));
		// update devices data array
    initDevice( device_data );
		Homey.log('Pioneer VSX RS232 Control App - add done. devices =' + JSON.stringify(devices));
		callback( null, true );
}

module.exports.renamed = function( device_data, new_name ) {
    // run when the user has renamed the device in Homey.
    // It is recommended to synchronize a device's name, so the user is not confused
    // when it uses another remote to control that device (e.g. the manufacturer's app).
		Homey.log("Pioneer VSX RS232 Control App - device renamed: " + JSON.stringify(device_data) + " new name: " + new_name);
		// update the devices array we keep
		devices[device_data.id].data.name = new_name;
}

module.exports.deleted = function( device_data ) {
    // run when the user has deleted the device from Homey
		Homey.log("Pioneer VSX RS232 Control App - device deleted: " + JSON.stringify(device_data));
		// remove from the devices array we keep
    delete devices[ device_data.id ];
}

// handling settings (wrench icon in devices)
module.exports.settings = function( device_data, newSettingsObj, oldSettingsObj, changedKeysArr, callback ) {
    // run when the user has changed the device's settings in Homey.
    // changedKeysArr contains an array of keys that have been changed, for your convenience :)

    // always fire the callback, or the settings won't change!
    // if the settings must not be saved for whatever reason:
    // callback( "Your error message", null );
    // else callback( null, true );

		Homey.log ('Pioneer VSX RS232 Control App - Settings were changed: ' + JSON.stringify(device_data) + ' / ' + JSON.stringify(newSettingsObj) + ' / old = ' + JSON.stringify(oldSettingsObj) + ' / changedKeysArr = ' + JSON.stringify(changedKeysArr));

		try {
      changedKeysArr.forEach(function (key) {
					switch (key) {
						case 'settingIPAddress':
							Homey.log ('Pioneer VSX RS232 Control App - IP address changed to ' + newSettingsObj.settingIPAddress);
							// FIXME: check if IP is valid, otherwise return callback with an error
							break;
					}
      })
      callback(null, true)
    } catch (error) {
      callback(error)
    }

}

// capabilities

module.exports.capabilities = {
    onoff: {

        get: function( device_data, callbackCapability ){

					Homey.log("Pioneer VSX RS232 Control App - getting device on/off status of " + device_data.id);
					var command = '?P\r';
					sendCommandToDevice ( device_data, command, function(receivedData) {
						Homey.log("Pioneer VSX RS232 Control App - got callback, receivedData: " + receivedData);
// if the response contained "PWR0", the AVR was on. Else it was probably in standby.
						if (receivedData.indexOf("PWR0") >= 1) {
							Homey.log("Pioneer VSX RS232 Control App - telling capability power is on");
							callbackCapability (null, true);
						}	else {
							Homey.log("Pioneer VSX RS232 Control App - telling capability power is off");
							callbackCapability (null, false);
						}
					} );
        },

        set: function( device_data, turnon, callbackCapability ) {

	        Homey.log('Pioneer VSX RS232 Control App - Setting device_status of ' + device_data.id + ' to ' + turnon);

					if (turnon) {
						var command = 'PO\r';
						sendCommandToDevice ( device_data, command );
						callbackCapability (null, true);

					} else {
						var command = 'PF\r';
						sendCommandToDevice ( device_data, command );
						callbackCapability (null, true);

					}
        }
    }
}

// end capabilities

// start flow action handlers

Homey.manager('flow').on('action.powerOn', function( callback, args ){
	var device = args.device;
	var zone = args.zone;
	powerOn ( device, zone );
  callback( null, true ); // we've fired successfully
});

Homey.manager('flow').on('action.powerOff', function( callback, args ){
	var device = args.device;
	var zone = args.zone;
	powerOff ( device, zone );
  callback( null, true ); // we've fired successfully
});

Homey.manager('flow').on('action.changeInput', function( callback, args ){
	var input = args.input.inputName;
	var zone = args.zone;
	var device = args.device;
	changeInputSource ( device, zone, input );
  callback( null, true ); // we've fired successfully
});

Homey.manager('flow').on('action.changeInput.input.autocomplete', function( callback, value ) {
	var inputSearchString = value.query;
	var items = searchForInputsByValue( inputSearchString );
	callback( null, items );
});

Homey.manager('flow').on('action.volumeUp', function(callback, args) {
	var targetVolume = args.volume;
	volumeUp(args.device, targetVolume);
	callback(null, true);
});
Homey.manager('flow').on('action.volumeDown', function(callback, args) {
	var targetVolume = args.volume;
	volumeDown(args.device, targetVolume);
	callback(null, true);
});

Homey.manager('flow').on('action.mute', function( callback, args ){
	var device = args.device;
	var zone = args.zone;
	mute ( device, zone );
  callback( null, true ); // we've fired successfully
});

Homey.manager('flow').on('action.unMute', function( callback, args ){
	var device = args.device;
	var zone = args.zone;
	unMute ( device, zone );
  callback( null, true ); // we've fired successfully
});

Homey.manager('flow').on('action.setVolume', function( callback, args ){
	var device = args.device;
	var zone = args.zone;
	var targetVolume = args.volume;
	setVolume ( device, zone, targetVolume );
  callback( null, true ); // we've fired successfully
});

Homey.manager('flow').on('action.customCommand', function( callback, args ){
	var device = args.device;
	var customCommand = args.command+'\r';
	sendCommandToDevice ( device, customCommand );
  callback( null, true ); // we've fired successfully
});

//

function powerOn ( device, zone ) {
	// supported zones: "Whole unit" (default), "Zone2", "Zone3"
	var command = 'PO\r';
	switch (zone) {
		case 'Whole unit':
			command = 'PO\r';
			break;
		case 'Zone2':
			command = 'APO\r';
			break;
		case 'Zone3':
			command = 'BPO\r'
			break;
	}
	sendCommandToDevice ( device, command );
}

function powerOff ( device, zone ) {
	// supported zones: "Whole unit" (default), "Zone2", "Zone3"
	var command = 'PF\r';
	switch (zone) {
		case 'Whole unit':
			command = 'PF\r';
			break;
		case 'Zone2':
			command = 'APF\r';
			break;
		case 'Zone3':
			command = 'BPF\r'
			break;
	}
	sendCommandToDevice ( device, command );
}

function changeInputSource ( device, zone, input ) {
	// supported zones: "Main Zone" (default), "Zone2", "Zone3"
	// I have disabled "Zone2" and "Zone3" for this function because there is no code available for this for Pioneer devices according to the specsheet
		var sourceZone = 'FU';
		switch (zone) {
			case 'Main Zone':
				sourceZone = 'FU';
				break;
//			case 'Zone2':
//				sourceZone = 'Z2';
//				break;
//			case 'Zone3':
//				sourceZone = 'Z3';
//				break;
		}
		var command = sourceZone+input+'\r';
		sendCommandToDevice ( device, command );
}

// Test
function volumeUp ( device, zone, targetVolume ) {
// volume ranges from 00 to 93
// according to the Pioneer documentation for the VSX-82-TXS9(which is quite old)
// according to Marantz protocol some models have 99 as --, some have 00 as --
//        var asciiVolume = "0"+targetVolume.toString();
//        var asciiVolume = asciiVolume.slice(-2);
// supported zones: "Main Zone" (default), "Zone2", "Zone3"
// No volume control "Zone3"
        var volumeZone = 'VU\r';
        switch (zone) {
                case 'Main Zone':
                        volumeZone = 'VU\r';
                        break;
                case 'Zone2':
                        volumeZone = 'ZU\r';
                        break;
//              case 'Zone3':
//                      volumeZone = 'Z3';
//                      break;
        }
        var command = volumeZone+'\r';
        sendCommandToDevice ( device, command );
}

function volumeDown ( device, zone, targetVolume ) {
// volume ranges from 00 to 93
// according to the Pioneer documentation for the VSX-82-TXS9(which is quite old)
// according to Marantz protocol some models have 99 as --, some have 00 as --
//        var asciiVolume = "0"+targetVolume.toString();
//        var asciiVolume = asciiVolume.slice(-2);
// supported zones: "Main Zone" (default), "Zone2", "Zone3"
// No volume control "Zone3"
        var volumeZone = 'VD\r';
        switch (zone) {
                case 'Main Zone':
                        volumeZone = 'VD\r';
                        break;
                case 'Zone2':
                        volumeZone = 'ZD\r';
                        break;
//              case 'Zone3':
//                      volumeZone = 'Z3';
//                      break;
        }
        var command = volumeZone+'\r';
        sendCommandToDevice ( device, command );
}

// Test

function mute ( device, zone ) {
	// supported zones: "Main Zone" (default), "Zone2", "Zone3"
	// No volume control for "Zone3"
	var command = 'MO\r';
	switch (zone) {
		case 'Main Zone':
			command = 'MO\r';
			break;
		case 'Zone2':
			command = '00ZV\r';
			break;
//		case 'Zone3':
//			command = 'Z3MUON\r'
//			break;
	}
	sendCommandToDevice ( device, command );
}

function unMute ( device, zone ) {
	// supported zones: "Main Zone" (default), "Zone2", "Zone3"
	// Because there is no unmute command I have choosen to use volume level 56 which is -25dB
	// No volume control for "Zone3"
	var command = 'MF\r';
	switch (zone) {
		case 'Main Zone':
			command = 'MF\r';
			break;
		case 'Zone2':
			command = '56ZV\r';
			break;
//		case 'Zone3':
//			command = 'Z3MUOFF\r'
//			break;
	}
	sendCommandToDevice ( device, command );
}

function setVolume ( device, zone, targetVolume ) {
// volume ranges from 00 to 93
// according to the Pioneer documentation for the VSX-82-TXS9(which is quite old)
// according to Marantz protocol some models have 99 as --, some have 00 as --
        var asciiVolume = "0"+targetVolume.toString();
        var asciiVolume = asciiVolume.slice(-2);
// supported zones: "Main Zone" (default), "Zone2", "Zone3"
// No volume control "Zone3"
        var volumeZone = 'VL';
        switch (zone) {
                case 'Main Zone':
                        volumeZone = 'VL';
                        break;
                case 'Zone2':
                        volumeZone = 'ZV';
                        break;
//              case 'Zone3':
//                      volumeZone = 'Z3';
//                      break;
        }
	var command = asciiVolume+volumeZone+'\r';
        sendCommandToDevice ( device, command );
}


//

function sendCommandToDevice ( device, command, callbackCommand ) {
	module.exports.getSettings (device, function(err, settings){
		Homey.log ( "Pioneer VSX RS232 Control App - got settings "+JSON.stringify(settings) );
		tempIP = settings.settingIPAddress;
		sendCommand ( tempIP, command, callbackCommand );
	});
}

function sendCommand ( hostIP, command, callbackCommand ) {
	// clear variable that holds data received from the AVR
	receivedData = "";
	// for logging strip last char which will be the newline \n char
	var displayCommand=command.substring(0, command.length -1);
	Homey.log ( "Pioneer VSX RS232 Control App - sending "+displayCommand+" to "+hostIP );
	var client = new net.Socket();
	client.on('error', function(err){
	    Homey.log("Pioneer VSX RS232 Control App - IP socket error: "+err.message);
	})
	client.connect(telnetPort, hostIP);
	client.write(command);

// get a response
	client.on('data', function(data){
			var tempData = data.toString().replace("\r", ";");
			Homey.log("Pioneer VSX RS232 Control App - got: " + tempData);
			receivedData += tempData;
	})

// after a delay, close connection
	setTimeout ( function() {
		receivedData = receivedData.replace("\r", ";")
		Homey.log("Pioneer VSX RS232 Control App - closing connection, receivedData: " + receivedData );
		client.end();
// if we got a callback function, call it with the receivedData
		if (callbackCommand && typeof(callbackCommand) == "function") {
			callbackCommand(receivedData);
		}
  }, 1000);
}

function searchForInputsByValue ( value ) {
// for now, consider all known Pioneer VSX RS232 inputs
	var possibleInputs = allPossibleInputs;
	var tempItems = [];
	for (var i = 0; i < possibleInputs.length; i++) {
		var tempInput = possibleInputs[i];
		if ( tempInput.friendlyName.indexOf(value) >= 0 ) {
			tempItems.push({ icon: "", name: tempInput.friendlyName, inputName: tempInput.inputName });
		}
	}
	return tempItems;
}

// a helper method to add a device to the devices list
function initDevice( device_data ) {
    devices[ device_data.id ] = {};
    devices[ device_data.id ].state = { onoff: true };
    devices[ device_data.id ].data = device_data;
}
