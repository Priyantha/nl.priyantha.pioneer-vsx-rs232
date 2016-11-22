# Pioneer RS232 over IP controll app for Athom Homey

This app lets you control a Marantz amplifier from within flows on a Homey device (by Athom). Homey is NodeJS based and allows for apps to extend its functionality.

This piece of code is able to control a Pioneer receiver from within flows on a Homey device (by Athom). I have taken most of the code from the app made for [Marantz amplifiers by Marco van den Hout](/../../../../hilvarenbeek/nl.marcovandenhout.marantz/)  and have taken inspiration from the app for [Pioneer VSX amplifiers by Marco van 't Klooster](/../../../../kerkenit/nl.marcovantklooster.pioneer/) but that didn't work for my situation.

I have a quite old Pioneer receiver (I am calling it a receiver instead of amplifier, because this device does more than only being a amplifier, it has a tuner a pre-amplifier and switching inputs and outputs and video in and outputs) which does not have a Ethernet port.
But it does have a RS232 port which is a great thing, this ensures a very reliable connection.

The Pioneer VSX Receiver Control app for Athom Homey is using the RS232 port with [rfc2217_server.py](/../../../../pyserial/pyserial/blob/master/examples/rfc2217_server.py/)

There will be a quick-guide how to configure this RS232 to IP  method in the Wiki part of project.

Maybe it is a bit redundant, but I would like to thank [Marco van den Hout](/../../../../hilvarenbeek/) for creating the original Marantz app and [Marco van 't Klooster](/../../../../kerkenit/) who has used that same Marantz app as foundaation for his Pioneer VSX app. Without both of them this app/module did not exist, so thank you very much!

# Changelog

**Version 0.0.1:**
* Initial version
* All the stuff in the ChangeLog from the original project from Marco van Hout's Marantz project is relevant for this project so:
  * Added mute and source input commands (flow actions) ( [BY: Marantz - Marco van den Hout](/../../../../hilvarenbeek/nl.marcovandenhout.marantz/) )
  * Added zones in flow actions see also ( [BY: Marantz - Marco van den Hout](/../../../../hilvarenbeek/nl.marcovandenhout.marantz/) )
  * Added volume command (flow action) ( [BY: Marantz - Marco van den Hout](/../../../../hilvarenbeek/nl.marcovandenhout.marantz/) )
  * Bugfix: fixed a problem where the entered IP address was not registered ( [BY: Marantz - Marco van den Hout](/../../../../hilvarenbeek/nl.marcovandenhout.marantz/) )
  * Added possible inputs ( [BY: Marantz - Marco van den Hout](/../../../../hilvarenbeek/nl.marcovandenhout.marantz/) )
  * Added possibility to change the device's name as it is being added (paired) ( [BY: Marantz - Marco van den Hout](/../../../../hilvarenbeek/nl.marcovandenhout.marantz/) )
  * Made the IP address a setting, so you can change it from the Devices tab using the wrench icon (mouseover) ( [BY: Marantz - Marco van den Hout](/../../../../hilvarenbeek/nl.marcovandenhout.marantz/) )
  * Improved error handling on network connectivity problems so the app is less likely to crash when it couldn't open a network socket ( [BY: Marantz - Marco van den Hout](/../../../../hilvarenbeek/nl.marcovandenhout.marantz/) )
  * Rewrite according to updated developers documentation at Athom ( [BY: Marantz - Marco van den Hout](/../../../../hilvarenbeek/nl.marcovandenhout.marantz/) )
  * Added capability to turn the amplifier on or off (shows on device cards) ( [BY: Marantz - Marco van den Hout](/../../../../hilvarenbeek/nl.marcovandenhout.marantz/) )
  * Added send custom command action, allowing for raw commands that are not covered yet (e.g. send MVUP to turn master volume one step up) ( [BY: Marantz - Marco van den Hout](/../../../../hilvarenbeek/nl.marcovandenhout.marantz/) )
