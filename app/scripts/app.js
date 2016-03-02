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
  app.events = [];
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
    app.$.logSource.addEventListener('iron-overlay-closed', function() {
      if (!event.detail.confirmed) {
        return;
      }
      app.logs = app.$.inputLogs.value;
      app.parseLogs();
    });
    app.$.logSource.open();
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
    var lines = app.logs.split('\n');
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
    var components = {};
    var events = [];
    var threadRow = {};
    var calls = {};
    var currentEvent;
    var m;
    var rep;
    var mp;
    re = /.*(\d{4}-\d{2}-\d{2}) ([^ ]*) ([\d ]*) ([^ ]*) *([^ ]*) (.*)/;
    for (i = startLine; i < endLine; i++) {
      if ((m = re.exec(lines[i])) !== null) {
        currentEvent = {};
        currentEvent.date = m[1];
        currentEvent.time = m[2];
        currentEvent.shortTime = m[2].substr(6);
        if (m[3].indexOf(' ') > 0) {
          var pid = m[3].split(' ');
          currentEvent.processId = pid[0];
          currentEvent.threadId = pid[1];
        } else {
          currentEvent.threadId = m[3];
        }
        if (components.main === undefined) {
          components.main = currentEvent.threadId;
          components[currentEvent.threadId] = 'Core';
        }
        currentEvent.level = m[4];
        currentEvent.class = m[5];
        currentEvent.log = m[6];
        if (m[5] === 'nxdrive.client.base_automation_client') {
          if (m[6].indexOf('Dumping JSON structure') === 0) {
            continue;
          }
          if (m[6].indexOf('Calling') === 0) {
            calls[currentEvent.threadId] = currentEvent;
            rep = /Calling .*\/(.*) with headers (.*), cookies (.*) and JSON payload '(.*)'/;
            if ((mp = rep.exec(m[6])) !== null) {
              currentEvent.request = {};
              currentEvent.request.url = mp[1];
              currentEvent.request.headers = mp[2];
              currentEvent.request.cookies = mp[3];
              currentEvent.request.payload = mp[4];
              currentEvent.log = mp[1];
            } else {
              rep = /Calling (.*) with headers (.*) and cookies (.*)/;
              if ((mp = rep.exec(m[6])) !== null) {
                currentEvent.request = {};
                currentEvent.request.url = mp[1];
                currentEvent.request.headers = mp[2];
                currentEvent.request.cookies = mp[3];
                currentEvent.request.payload = '';
                currentEvent.log = mp[1];
              } else {
                rep = /Calling (.*) with headers: (.*)/;
                if ((mp = rep.exec(m[6])) !== null) {
                  currentEvent.request = {};
                  currentEvent.request.url = mp[1];
                  currentEvent.request.headers = mp[2];
                  currentEvent.request.cookies = '';
                  currentEvent.request.payload = '';
                  currentEvent.log = mp[1];
                }
              }
            }
          }
          if (m[6].indexOf('Response for ') === 0) {
            calls[currentEvent.threadId].response = m[6];
            continue;
          }
        }
        // Get the Thread start message to get the component
        if (m[5] === 'nxdrive.engine.workers') {
          rep = /Thread (\w*).* start/;
          if ((mp = rep.exec(m[6])) !== null) {
            components[currentEvent.threadId] = mp[1];
          }
        }
        // Try to guess the component
        if (components[currentEvent.threadId] === undefined) {
          if (m[6].indexOf('Queueing watchdog') === 0) {
            components[currentEvent.threadId] = 'Watchdog';
          }
        }
        // Try to guess the current row
        if (m[5] === 'nxdrive.engine.dao.sqlite') {
          // Acquired processor 2580 for row 2
          rep = /Acquired processor (\d*) for row (\d*)/;
          if ((mp = rep.exec(m[6])) !== null) {
            // mp[1] -> threadId
            // mp[2] -> row
            threadRow[mp[1]] = mp[2];
            // Dont display this event
            continue;
          }
          rep = /No processor to release with id (\d*)/;
          if ((mp = rep.exec(m[6])) !== null) {
            threadRow[mp[1]] = undefined;
            // Dont display this event
            continue;
          }
          rep = /Released processor (\d*)/;
          if ((mp = rep.exec(m[6])) !== null) {
            threadRow[mp[1]] = undefined;
            // Dont display this event
            continue;
          }
        }
        if (threadRow[currentEvent.threadId] !== undefined) {
          currentEvent.currentRow = threadRow[currentEvent.threadId];
        }
        events.push(currentEvent);
      } else if (currentEvent !== undefined) {
        currentEvent.log = currentEvent.log + '\n' + lines[i];
      }
    }
    // Post process for components
    for (i = 0; i < events.length; i++) {
      if (components[events[i].threadId] !== undefined) {
        events[i].component = components[events[i].threadId];
      } else {
        events[i].component = 'Core';
      }
      // Set the log level
      if (events[i].level === 'TRACE') {
        events[i].numLevel = 5;
      } else if (events[i].level === 'DEBUG') {
        events[i].numLevel = 10;
      } else if (events[i].level === 'INFO') {
        events[i].numLevel = 20;
      } else if (events[i].level === 'WARNING') {
        events[i].numLevel = 30;
      } else if (events[i].level === 'ERROR') {
        events[i].numLevel = 40;
      } else if (events[i].level === 'CRITICAL') {
        events[i].numLevel = 50;
      }
      // Set icon
      /*
      Watchers: icons:visibility
      File: editor:insert-drive-file
      Folder: icons:folder
      Generic: icons:assignment
      Core: icons:settings
      Watchdog: icons:track-changes
      */
      if (events[i].component.indexOf('Watcher') >= 0) {
        events[i].componentIcon = 'icons:visibility';
      } else if (events[i].component.indexOf('File') >= 0) {
        events[i].componentIcon = 'editor:insert-drive-file';
      } else if (events[i].component.indexOf('Folder') >= 0) {
        events[i].componentIcon = 'icons:folder';
      } else if (events[i].component.indexOf('Generic') >= 0) {
        events[i].componentIcon = 'icons:assignment';
      } else if (events[i].component === 'Core') {
        events[i].componentIcon = 'icons:settings';
      } else if (events[i].component === 'Watchdog') {
        events[i].componentIcon = 'icons:track-changes';
      }
      if (events[i].component.indexOf('Remote') >= 0) {
        events[i].networkType = 'remote';
      } else if (events[i].component.indexOf('Local') >= 0 ||
          events[i].component === 'SimpleWatcher') {
        events[i].networkType = 'local';
      } else if (events[i].component.indexOf('Folder') >= 0) {
        events[i].networkType = 'none';
      }
    }
    console.log(' ' + events.length + ' events');
    app.rawEvents = events;
    app.filterEvents();
  };
  app.loadJenkins = function() {
    app.$.ajaxLogs.params.os = app.$.jenkinsOs.value;
    if (app.$.jenkinsBuild.value > 0) {
      app.$.ajaxLogs.params.build = app.$.jenkinsBuild.value;
    } else {
      delete app.$.ajaxLogs.params.build;
    }
    app.$.ajaxLogs.generateRequest();
    app.$.ajaxLogs.addEventListener('response', function() {
      app.logs = app.$.ajaxLogs.lastResponse;
      app.$.logSource.close();
      app.parseLogs();
    });
  };
  app.filterEvents = function() {
    app.events = app.rawEvents;
  };
  // Scroll page to top and expand header
  app.scrollPageToTop = function() {
    app.$.headerPanelMain.scrollToTop(true);
  };
  app.openLogSource = function() {
    app.$.logSource.open();
  };
  app.closeDrawer = function() {
    app.$.paperDrawerPanel.closeDrawer();
  };

})(document);
