/*
Copyright (c) 2015 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

(function(document) {
  'use strict';

  // Grab a reference to our auto-binding template
  // and give it some initial binding values
  // Learn more about auto-binding templates at http://goo.gl/Dx1u2g
  var app = document.querySelector('#app');

  // Sets app default base URL
  app.baseUrl = '/';
  if (window.location.port === '') {  // if production
    // Uncomment app.baseURL below and
    // set app.baseURL to '/your-pathname/' if running from folder in production
    // app.baseUrl = '/polymer-starter-kit/';
  }

  app.displayInstalledToast = function() {
    // Check to make sure caching is actually enabled—it won't be in the dev environment.
    if (!Polymer.dom(document).querySelector('platinum-sw-cache').disabled) {
      Polymer.dom(document).querySelector('#caching-complete').show();
    }
  };

  // Listen for template bound event to know when bindings
  // have resolved and content has been stamped to the page
  app.addEventListener('dom-change', function() {
    console.log('Our app is ready to rock!');
  });

  // See https://github.com/Polymer/polymer/issues/1381
  window.addEventListener('WebComponentsReady', function() {
    // imports are loaded and elements have been registered
  });

  // Main area's paper-scroll-header-panel custom condensing transformation of
  // the appName in the middle-container and the bottom title in the bottom-container.
  // The appName is moved to top and shrunk on condensing. The bottom sub title
  // is shrunk to nothing on condensing.
  window.addEventListener('paper-header-transform', function(e) {
    var appName = Polymer.dom(document).querySelector('#mainToolbar .app-name');
    var middleContainer = Polymer.dom(document).querySelector('#mainToolbar .middle-container');
    var bottomContainer = Polymer.dom(document).querySelector('#mainToolbar .bottom-container');
    var detail = e.detail;
    var heightDiff = detail.height - detail.condensedHeight;
    var yRatio = Math.min(1, detail.y / heightDiff);
    // appName max size when condensed. The smaller the number the smaller the condensed size.
    var maxMiddleScale = 0.50;
    var auxHeight = heightDiff - detail.y;
    var auxScale = heightDiff / (1 - maxMiddleScale);
    var scaleMiddle = Math.max(maxMiddleScale, auxHeight / auxScale + maxMiddleScale);
    var scaleBottom = 1 - yRatio;

    // Move/translate middleContainer
    Polymer.Base.transform('translate3d(0,' + yRatio * 100 + '%,0)', middleContainer);

    // Scale bottomContainer and bottom sub title to nothing and back
    Polymer.Base.transform('scale(' + scaleBottom + ') translateZ(0)', bottomContainer);

    // Scale middleContainer appName
    Polymer.Base.transform('scale(' + scaleMiddle + ') translateZ(0)', appName);
  });

  app.parseLogs = function() {
    console.log('Parsing logs');
    var lines = app.$.rawLogs.lastResponse.split('\n');
    var jenkins = false;
    console.log(' ' + lines.length + ' lines');
    var startLine = 0;
    var endLine = 0;
    var re;
    var i;
    if (lines[0].indexOf('Started') === 0) {
      jenkins = true;
      // Filter until we find the real log
      re = /\[INFO\] *\[exec\] .*begin captured logging.*/; 
      
      for (i = 1; i < lines.length; i++) {
        if (re.exec(lines[i]) !== null) {
          if (startLine > 0) {
            endLine = i;
            break;
          }
          startLine = i + 1;
          re = /\[INFO\] *\[exec\] .*end captured logging.*/; 
        }
      }
      console.log(' ' + (startLine + (lines.length - endLine)) + ' filtered lines');
    }
    if (endLine === 0) {
      endLine = lines.length;
    }
    var events = [];
    var currentEvent;
    var m;
    re = /.*(\d{4}-\d{2}-\d{2}) ([^ ]*) ([\d ]*) ([^ ]*) *([^ ]*) (.*)/;
    for (i = startLine; i < endLine; i++) {
      if ((m = re.exec(lines[i])) !== null) {
        currentEvent = {};
        currentEvent.date = m[1];
        currentEvent.time = m[2];
        if (m[3].indexOf(' ') > 0) {
          var pid = m[3].split(' ');
          currentEvent.processId = pid[0];
          currentEvent.threadId = pid[1];
        } else {
          currentEvent.threadId = m[3];
        }
        currentEvent.level = m[4];
        currentEvent.class = m[5];
        currentEvent.log = m[6];
        events.push(currentEvent);
      } else if (currentEvent !== undefined) {
        currentEvent.log = currentEvent.log + '<br />' + lines[i];
      }
    }
    console.log(' ' + events.length + ' events');
  };
  // Scroll page to top and expand header
  app.scrollPageToTop = function() {
    app.$.headerPanelMain.scrollToTop(true);
  };

  app.closeDrawer = function() {
    app.$.paperDrawerPanel.closeDrawer();
  };

})(document);
