/* jshint strict: true, esnext: true, newcap: false,
   globalstrict: true, node: true */

"use strict";

var { ToggleButton } = require('sdk/ui/button/toggle');
var { data } = require("sdk/self");
var panels = require("sdk/panel");
var tabs = require("sdk/tabs");

const { match } = require('./service/match');
const { iconURL } = require('./ratings');
const database = require('./service/database');
const Point = require('./service/point');
const { log } = require('./utils/log');
const { TEXT } = require('./ratings');
var { button } = require('./tos-button');

// create ToggleButton
var button = ToggleButton({
  id: "tosdr-checker-toolbarbutton",
  label: "No Rating",
  icon: iconURL('none'),
  onChange: handleChange
});

// TOS-checker panel
const panel = panels.Panel({
  width: 560,
  height: 475,
  name : "TOSDR-Panel",
  contentURL: data.url("popup.html"),
  contentScriptFile: [data.url("libs/jquery-1.11.0.min.js"),
            data.url("popup.js")],
  contentScriptWhen: 'ready',
  onShow: function(){
    let { valid, service } = match(tabs.activeTab.url);
    if (service) {
      Point.get(service.id).then(function ({ pointsData }) {
        service.pointsData = pointsData;
        panel.port.emit("service", service);
      });
    }else{
		// Show Not rated panel
    	panel.port.emit("service", null);
    }
  },
  onMessage: function(message){
    //hide the panel if recieved close message
    if(message == "close") {
      panel.hide();
    }
  },
  onHide: handleHide
});

// panel.port.on('get-rating-text', function(rating) {
//   panel.port.emit('set-rating-text', TEXT[rating]);
// });

function handleChange(state) {
    panel.show({
      position: button
    });
}

function handleHide() {
  var icon = button.state("tab").icon;
  button.state('window', {
	  checked: false
  });
}

// Hide panel when new tab opened
// https://addons.mozilla.org/en-US/firefox/addon/terms-of-service-didnt-read/reviews/498180/
tabs.on('open', function() {
	button.state('window', {
		checked: false
	});
	panel.hide();
});

function rate(url, service) {
  // a null service means there is currently no rating available
  let icon = (null === service)? iconURL('none') : iconURL(service.tosdr.rated);
  button.state("tab", {
	  icon: icon,
	  label: service.tosdr.rated
  });
}

function onPageShow(tab){
  let { valid, service } = match(tab.url);
  if (valid) {
    rate(tab.url, service);
  } else {
	  button.state(tab, {
		  disabled:true
	  });
  }
}

function onTab(tab) {
	button.state('window', {
	  checked: false
	});
  let { valid, service } = match(tab.url);
  if (valid) {
    rate(tab.url, service);
  } else {
	  button.state(tab, {
		  disabled:true
	  });
  }
}

// Listen for "pageshow" which triggered on page load, ready or retrieval from the bfcache. 
tabs.on('pageshow', onPageShow);

// Listen for tab activation.
tabs.on('activate', onTab);

exports.button = button;