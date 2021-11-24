"use strict";

// WebcamJS v1.0.26
// Webcam library for capturing JPEG/PNG images in JavaScript
// Attempts getUserMedia, falls back to Flash
// Author: Joseph Huckaby: http://github.com/jhuckaby
// Based on JPEGCam: http://code.google.com/p/jpegcam/
// Copyright (c) 2012 - 2019 Joseph Huckaby
// Licensed under the MIT License
(function (window) {
  var _userMedia; // declare error types
  // inheritance pattern here:
  // https://stackoverflow.com/questions/783818/how-do-i-create-a-custom-error-in-javascript


  function FlashError() {
    var temp = Error.apply(this, arguments);
    temp.name = this.name = "FlashError";
    this.stack = temp.stack;
    this.message = temp.message;
  }

  function WebcamError() {
    var temp = Error.apply(this, arguments);
    temp.name = this.name = "WebcamError";
    this.stack = temp.stack;
    this.message = temp.message;
  }

  var IntermediateInheritor = function () {};

  IntermediateInheritor.prototype = Error.prototype;
  FlashError.prototype = new IntermediateInheritor();
  WebcamError.prototype = new IntermediateInheritor();
  var Webcam = {
    version: '1.0.26',
    // globals
    protocol: location.protocol.match(/https/i) ? 'https' : 'http',
    loaded: false,
    // true when webcam movie finishes loading
    live: false,
    // true when webcam is initialized and ready to snap
    userMedia: true,
    // true when getUserMedia is supported natively
    iOS: /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream,
    params: {
      width: 0,
      height: 0,
      dest_width: 0,
      // size of captured image
      dest_height: 0,
      // these default to width/height
      image_format: 'jpeg',
      // image format (may be jpeg or png)
      jpeg_quality: 90,
      // jpeg image quality from 0 (worst) to 100 (best)
      enable_flash: true,
      // enable flash fallback,
      force_flash: false,
      // force flash mode,
      flip_horiz: false,
      // flip image horiz (mirror mode)
      fps: 30,
      // camera frames per second
      upload_name: 'webcam',
      // name of file in upload post data
      constraints: null,
      // custom user media constraints,
      swfURL: '',
      // URI to webcam.swf movie (defaults to the js location)
      flashNotDetectedText: 'ERROR: No Adobe Flash Player detected.  Webcam.js relies on Flash for browsers that do not support getUserMedia (like yours).',
      noInterfaceFoundText: 'No supported webcam interface found.',
      unfreeze_snap: true,
      // Whether to unfreeze the camera after snap (defaults to true)
      iosPlaceholderText: 'Click here to open camera.',
      user_callback: null,
      // callback function for snapshot (used if no user_callback parameter given to snap function)
      user_canvas: null // user provided canvas for snapshot (used if no user_canvas parameter given to snap function)

    },
    errors: {
      FlashError: FlashError,
      WebcamError: WebcamError
    },
    hooks: {},
    // callback hook functions
    init: function () {
      // initialize, check for getUserMedia support
      var self = this; // Setup getUserMedia, with polyfill for older browsers
      // Adapted from: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia

      this.mediaDevices = navigator.mediaDevices && navigator.mediaDevices.getUserMedia ? navigator.mediaDevices : navigator.mozGetUserMedia || navigator.webkitGetUserMedia ? {
        getUserMedia: function (c) {
          return new Promise(function (y, n) {
            (navigator.mozGetUserMedia || navigator.webkitGetUserMedia).call(navigator, c, y, n);
          });
        }
      } : null;
      window.URL = window.URL || window.webkitURL || window.mozURL || window.msURL;
      this.userMedia = this.userMedia && !!this.mediaDevices && !!window.URL; // Older versions of firefox (< 21) apparently claim support but user media does not actually work

      if (navigator.userAgent.match(/Firefox\D+(\d+)/)) {
        if (parseInt(RegExp.$1, 10) < 21) this.userMedia = null;
      } // Make sure media stream is closed when navigating away from page


      if (this.userMedia) {
        window.addEventListener('beforeunload', function (event) {
          self.reset();
        });
      }
    },
    exifOrientation: function (binFile) {
      // extract orientation information from the image provided by iOS
      // algorithm based on exif-js
      var dataView = new DataView(binFile);

      if (dataView.getUint8(0) != 0xFF || dataView.getUint8(1) != 0xD8) {
        console.log('Not a valid JPEG file');
        return 0;
      }

      var offset = 2;
      var marker = null;

      while (offset < binFile.byteLength) {
        // find 0xFFE1 (225 marker)
        if (dataView.getUint8(offset) != 0xFF) {
          console.log('Not a valid marker at offset ' + offset + ', found: ' + dataView.getUint8(offset));
          return 0;
        }

        marker = dataView.getUint8(offset + 1);

        if (marker == 225) {
          offset += 4;
          var str = "";

          for (n = 0; n < 4; n++) {
            str += String.fromCharCode(dataView.getUint8(offset + n));
          }

          if (str != 'Exif') {
            console.log('Not valid EXIF data found');
            return 0;
          }

          offset += 6; // tiffOffset

          var bigEnd = null; // test for TIFF validity and endianness

          if (dataView.getUint16(offset) == 0x4949) {
            bigEnd = false;
          } else if (dataView.getUint16(offset) == 0x4D4D) {
            bigEnd = true;
          } else {
            console.log("Not valid TIFF data! (no 0x4949 or 0x4D4D)");
            return 0;
          }

          if (dataView.getUint16(offset + 2, !bigEnd) != 0x002A) {
            console.log("Not valid TIFF data! (no 0x002A)");
            return 0;
          }

          var firstIFDOffset = dataView.getUint32(offset + 4, !bigEnd);

          if (firstIFDOffset < 0x00000008) {
            console.log("Not valid TIFF data! (First offset less than 8)", dataView.getUint32(offset + 4, !bigEnd));
            return 0;
          } // extract orientation data


          var dataStart = offset + firstIFDOffset;
          var entries = dataView.getUint16(dataStart, !bigEnd);

          for (var i = 0; i < entries; i++) {
            var entryOffset = dataStart + i * 12 + 2;

            if (dataView.getUint16(entryOffset, !bigEnd) == 0x0112) {
              var valueType = dataView.getUint16(entryOffset + 2, !bigEnd);
              var numValues = dataView.getUint32(entryOffset + 4, !bigEnd);

              if (valueType != 3 && numValues != 1) {
                console.log('Invalid EXIF orientation value type (' + valueType + ') or count (' + numValues + ')');
                return 0;
              }

              var value = dataView.getUint16(entryOffset + 8, !bigEnd);

              if (value < 1 || value > 8) {
                console.log('Invalid EXIF orientation value (' + value + ')');
                return 0;
              }

              return value;
            }
          }
        } else {
          offset += 2 + dataView.getUint16(offset + 2);
        }
      }

      return 0;
    },
    fixOrientation: function (origObjURL, orientation, targetImg) {
      // fix image orientation based on exif orientation data
      // exif orientation information
      //    http://www.impulseadventure.com/photo/exif-orientation.html
      //    link source wikipedia (https://en.wikipedia.org/wiki/Exif#cite_note-20)
      var img = new Image();
      img.addEventListener('load', function (event) {
        var canvas = document.createElement('canvas');
        var ctx = canvas.getContext('2d'); // switch width height if orientation needed

        if (orientation < 5) {
          canvas.width = img.width;
          canvas.height = img.height;
        } else {
          canvas.width = img.height;
          canvas.height = img.width;
        } // transform (rotate) image - see link at beginning this method


        switch (orientation) {
          case 2:
            ctx.transform(-1, 0, 0, 1, img.width, 0);
            break;

          case 3:
            ctx.transform(-1, 0, 0, -1, img.width, img.height);
            break;

          case 4:
            ctx.transform(1, 0, 0, -1, 0, img.height);
            break;

          case 5:
            ctx.transform(0, 1, 1, 0, 0, 0);
            break;

          case 6:
            ctx.transform(0, 1, -1, 0, img.height, 0);
            break;

          case 7:
            ctx.transform(0, -1, -1, 0, img.height, img.width);
            break;

          case 8:
            ctx.transform(0, -1, 1, 0, 0, img.width);
            break;
        }

        ctx.drawImage(img, 0, 0); // pass rotated image data to the target image container

        targetImg.src = canvas.toDataURL();
      }, false); // start transformation by load event

      img.src = origObjURL;
    },
    attach: function (elem) {
      // create webcam preview and attach to DOM element
      // pass in actual DOM reference, ID, or CSS selector
      if (typeof elem == 'string') {
        elem = document.getElementById(elem) || document.querySelector(elem);
      }

      if (!elem) {
        return this.dispatch('error', new WebcamError("Could not locate DOM element to attach to."));
      }

      this.container = elem;
      elem.innerHTML = ''; // start with empty element
      // insert "peg" so we can insert our preview canvas adjacent to it later on

      var peg = document.createElement('div');
      elem.appendChild(peg);
      this.peg = peg; // set width/height if not already set

      if (!this.params.width) this.params.width = elem.offsetWidth;
      if (!this.params.height) this.params.height = elem.offsetHeight; // make sure we have a nonzero width and height at this point

      if (!this.params.width || !this.params.height) {
        return this.dispatch('error', new WebcamError("No width and/or height for webcam.  Please call set() first, or attach to a visible element."));
      } // set defaults for dest_width / dest_height if not set


      if (!this.params.dest_width) this.params.dest_width = this.params.width;
      if (!this.params.dest_height) this.params.dest_height = this.params.height;
      this.userMedia = _userMedia === undefined ? this.userMedia : _userMedia; // if force_flash is set, disable userMedia

      if (this.params.force_flash) {
        _userMedia = this.userMedia;
        this.userMedia = null;
      } // check for default fps


      if (typeof this.params.fps !== "number") this.params.fps = 30; // adjust scale if dest_width or dest_height is different

      var scaleX = this.params.width / this.params.dest_width;
      var scaleY = this.params.height / this.params.dest_height;

      if (this.userMedia) {
        // setup webcam video container
        var video = document.createElement('video');
        video.setAttribute('autoplay', 'autoplay');
        video.setAttribute('playsinline', 'playsinline');
        video.style.width = '' + this.params.dest_width + 'px';
        video.style.height = '' + this.params.dest_height + 'px';

        if (scaleX != 1.0 || scaleY != 1.0) {
          elem.style.overflow = 'hidden';
          video.style.webkitTransformOrigin = '0px 0px';
          video.style.mozTransformOrigin = '0px 0px';
          video.style.msTransformOrigin = '0px 0px';
          video.style.oTransformOrigin = '0px 0px';
          video.style.transformOrigin = '0px 0px';
          video.style.webkitTransform = 'scaleX(' + scaleX + ') scaleY(' + scaleY + ')';
          video.style.mozTransform = 'scaleX(' + scaleX + ') scaleY(' + scaleY + ')';
          video.style.msTransform = 'scaleX(' + scaleX + ') scaleY(' + scaleY + ')';
          video.style.oTransform = 'scaleX(' + scaleX + ') scaleY(' + scaleY + ')';
          video.style.transform = 'scaleX(' + scaleX + ') scaleY(' + scaleY + ')';
        } // add video element to dom


        elem.appendChild(video);
        this.video = video; // ask user for access to their camera

        var self = this;
        this.mediaDevices.getUserMedia({
          "audio": false,
          "video": this.params.constraints || {
            mandatory: {
              minWidth: this.params.dest_width,
              minHeight: this.params.dest_height
            }
          }
        }).then(function (stream) {
          // got access, attach stream to video
          video.onloadedmetadata = function (e) {
            self.stream = stream;
            self.loaded = true;
            self.live = true;
            self.dispatch('load');
            self.dispatch('live');
            self.flip();
          }; // as window.URL.createObjectURL() is deprecated, adding a check so that it works in Safari.
          // older browsers may not have srcObject


          if ("srcObject" in video) {
            video.srcObject = stream;
          } else {
            // using URL.createObjectURL() as fallback for old browsers
            video.src = window.URL.createObjectURL(stream);
          }
        }).catch(function (err) {
          // JH 2016-07-31 Instead of dispatching error, now falling back to Flash if userMedia fails (thx @john2014)
          // JH 2016-08-07 But only if flash is actually installed -- if not, dispatch error here and now.
          if (self.params.enable_flash && self.detectFlash()) {
            setTimeout(function () {
              self.params.force_flash = 1;
              self.attach(elem);
            }, 1);
          } else {
            self.dispatch('error', err);
          }
        });
      } else if (this.iOS) {
        // prepare HTML elements
        var div = document.createElement('div');
        div.id = this.container.id + '-ios_div';
        div.className = 'webcamjs-ios-placeholder';
        div.style.width = '' + this.params.width + 'px';
        div.style.height = '' + this.params.height + 'px';
        div.style.textAlign = 'center';
        div.style.display = 'table-cell';
        div.style.verticalAlign = 'middle';
        div.style.backgroundRepeat = 'no-repeat';
        div.style.backgroundSize = 'contain';
        div.style.backgroundPosition = 'center';
        var span = document.createElement('span');
        span.className = 'webcamjs-ios-text';
        span.innerHTML = this.params.iosPlaceholderText;
        div.appendChild(span);
        var img = document.createElement('img');
        img.id = this.container.id + '-ios_img';
        img.style.width = '' + this.params.dest_width + 'px';
        img.style.height = '' + this.params.dest_height + 'px';
        img.style.display = 'none';
        div.appendChild(img);
        var input = document.createElement('input');
        input.id = this.container.id + '-ios_input';
        input.setAttribute('type', 'file');
        input.setAttribute('accept', 'image/*');
        input.setAttribute('capture', 'camera');
        var self = this;
        var params = this.params; // add input listener to load the selected image

        input.addEventListener('change', function (event) {
          if (event.target.files.length > 0 && event.target.files[0].type.indexOf('image/') == 0) {
            var objURL = URL.createObjectURL(event.target.files[0]); // load image with auto scale and crop

            var image = new Image();
            image.addEventListener('load', function (event) {
              var canvas = document.createElement('canvas');
              canvas.width = params.dest_width;
              canvas.height = params.dest_height;
              var ctx = canvas.getContext('2d'); // crop and scale image for final size

              ratio = Math.min(image.width / params.dest_width, image.height / params.dest_height);
              var sw = params.dest_width * ratio;
              var sh = params.dest_height * ratio;
              var sx = (image.width - sw) / 2;
              var sy = (image.height - sh) / 2;
              ctx.drawImage(image, sx, sy, sw, sh, 0, 0, params.dest_width, params.dest_height);
              var dataURL = canvas.toDataURL();
              img.src = dataURL;
              div.style.backgroundImage = "url('" + dataURL + "')";
            }, false); // read EXIF data

            var fileReader = new FileReader();
            fileReader.addEventListener('load', function (e) {
              var orientation = self.exifOrientation(e.target.result);

              if (orientation > 1) {
                // image need to rotate (see comments on fixOrientation method for more information)
                // transform image and load to image object
                self.fixOrientation(objURL, orientation, image);
              } else {
                // load image data to image object
                image.src = objURL;
              }
            }, false); // Convert image data to blob format

            var http = new XMLHttpRequest();
            http.open("GET", objURL, true);
            http.responseType = "blob";

            http.onload = function (e) {
              if (this.status == 200 || this.status === 0) {
                fileReader.readAsArrayBuffer(this.response);
              }
            };

            http.send();
          }
        }, false);
        input.style.display = 'none';
        elem.appendChild(input); // make div clickable for open camera interface

        div.addEventListener('click', function (event) {
          if (params.user_callback) {
            // global user_callback defined - create the snapshot
            self.snap(params.user_callback, params.user_canvas);
          } else {
            // no global callback definied for snapshot, load image and wait for external snap method call
            input.style.display = 'block';
            input.focus();
            input.click();
            input.style.display = 'none';
          }
        }, false);
        elem.appendChild(div);
        this.loaded = true;
        this.live = true;
      } else if (this.params.enable_flash && this.detectFlash()) {
        // flash fallback
        window.Webcam = Webcam; // needed for flash-to-js interface

        var div = document.createElement('div');
        div.innerHTML = this.getSWFHTML();
        elem.appendChild(div);
      } else {
        this.dispatch('error', new WebcamError(this.params.noInterfaceFoundText));
      } // setup final crop for live preview


      if (this.params.crop_width && this.params.crop_height) {
        var scaled_crop_width = Math.floor(this.params.crop_width * scaleX);
        var scaled_crop_height = Math.floor(this.params.crop_height * scaleY);
        elem.style.width = '' + scaled_crop_width + 'px';
        elem.style.height = '' + scaled_crop_height + 'px';
        elem.style.overflow = 'hidden';
        elem.scrollLeft = Math.floor(this.params.width / 2 - scaled_crop_width / 2);
        elem.scrollTop = Math.floor(this.params.height / 2 - scaled_crop_height / 2);
      } else {
        // no crop, set size to desired
        elem.style.width = '' + this.params.width + 'px';
        elem.style.height = '' + this.params.height + 'px';
      }
    },
    reset: function () {
      // shutdown camera, reset to potentially attach again
      if (this.preview_active) this.unfreeze(); // attempt to fix issue #64

      this.unflip();

      if (this.userMedia) {
        if (this.stream) {
          if (this.stream.getVideoTracks) {
            // get video track to call stop on it
            var tracks = this.stream.getVideoTracks();
            if (tracks && tracks[0] && tracks[0].stop) tracks[0].stop();
          } else if (this.stream.stop) {
            // deprecated, may be removed in future
            this.stream.stop();
          }
        }

        delete this.stream;
        delete this.video;
      }

      if (this.userMedia !== true && this.loaded && !this.iOS) {
        // call for turn off camera in flash
        var movie = this.getMovie();
        if (movie && movie._releaseCamera) movie._releaseCamera();
      }

      if (this.container) {
        this.container.innerHTML = '';
        delete this.container;
      }

      this.loaded = false;
      this.live = false;
    },
    set: function () {
      // set one or more params
      // variable argument list: 1 param = hash, 2 params = key, value
      if (arguments.length == 1) {
        for (var key in arguments[0]) {
          this.params[key] = arguments[0][key];
        }
      } else {
        this.params[arguments[0]] = arguments[1];
      }
    },
    on: function (name, callback) {
      // set callback hook
      name = name.replace(/^on/i, '').toLowerCase();
      if (!this.hooks[name]) this.hooks[name] = [];
      this.hooks[name].push(callback);
    },
    off: function (name, callback) {
      // remove callback hook
      name = name.replace(/^on/i, '').toLowerCase();

      if (this.hooks[name]) {
        if (callback) {
          // remove one selected callback from list
          var idx = this.hooks[name].indexOf(callback);
          if (idx > -1) this.hooks[name].splice(idx, 1);
        } else {
          // no callback specified, so clear all
          this.hooks[name] = [];
        }
      }
    },
    dispatch: function () {
      // fire hook callback, passing optional value to it
      var name = arguments[0].replace(/^on/i, '').toLowerCase();
      var args = Array.prototype.slice.call(arguments, 1);

      if (this.hooks[name] && this.hooks[name].length) {
        for (var idx = 0, len = this.hooks[name].length; idx < len; idx++) {
          var hook = this.hooks[name][idx];

          if (typeof hook == 'function') {
            // callback is function reference, call directly
            hook.apply(this, args);
          } else if (typeof hook == 'object' && hook.length == 2) {
            // callback is PHP-style object instance method
            hook[0][hook[1]].apply(hook[0], args);
          } else if (window[hook]) {
            // callback is global function name
            window[hook].apply(window, args);
          }
        } // loop


        return true;
      } else if (name == 'error') {
        var message;

        if (args[0] instanceof FlashError || args[0] instanceof WebcamError) {
          message = args[0].message;
        } else {
          message = "Could not access webcam: " + args[0].name + ": " + args[0].message + " " + args[0].toString();
        } // default error handler if no custom one specified


        alert("Webcam.js Error: " + message);
      }

      return false; // no hook defined
    },
    setSWFLocation: function (value) {
      // for backward compatibility.
      this.set('swfURL', value);
    },
    detectFlash: function () {
      // return true if browser supports flash, false otherwise
      // Code snippet borrowed from: https://github.com/swfobject/swfobject
      var SHOCKWAVE_FLASH = "Shockwave Flash",
          SHOCKWAVE_FLASH_AX = "ShockwaveFlash.ShockwaveFlash",
          FLASH_MIME_TYPE = "application/x-shockwave-flash",
          win = window,
          nav = navigator,
          hasFlash = false;

      if (typeof nav.plugins !== "undefined" && typeof nav.plugins[SHOCKWAVE_FLASH] === "object") {
        var desc = nav.plugins[SHOCKWAVE_FLASH].description;

        if (desc && typeof nav.mimeTypes !== "undefined" && nav.mimeTypes[FLASH_MIME_TYPE] && nav.mimeTypes[FLASH_MIME_TYPE].enabledPlugin) {
          hasFlash = true;
        }
      } else if (typeof win.ActiveXObject !== "undefined") {
        try {
          var ax = new ActiveXObject(SHOCKWAVE_FLASH_AX);

          if (ax) {
            var ver = ax.GetVariable("$version");
            if (ver) hasFlash = true;
          }
        } catch (e) {
          ;
        }
      }

      return hasFlash;
    },
    getSWFHTML: function () {
      // Return HTML for embedding flash based webcam capture movie		
      var html = '',
          swfURL = this.params.swfURL; // make sure we aren't running locally (flash doesn't work)

      if (location.protocol.match(/file/)) {
        this.dispatch('error', new FlashError("Flash does not work from local disk.  Please run from a web server."));
        return '<h3 style="color:red">ERROR: the Webcam.js Flash fallback does not work from local disk.  Please run it from a web server.</h3>';
      } // make sure we have flash


      if (!this.detectFlash()) {
        this.dispatch('error', new FlashError("Adobe Flash Player not found.  Please install from get.adobe.com/flashplayer and try again."));
        return '<h3 style="color:red">' + this.params.flashNotDetectedText + '</h3>';
      } // set default swfURL if not explicitly set


      if (!swfURL) {
        // find our script tag, and use that base URL
        var base_url = '';
        var scpts = document.getElementsByTagName('script');

        for (var idx = 0, len = scpts.length; idx < len; idx++) {
          var src = scpts[idx].getAttribute('src');

          if (src && src.match(/\/webcam(\.min)?\.js/)) {
            base_url = src.replace(/\/webcam(\.min)?\.js.*$/, '');
            idx = len;
          }
        }

        if (base_url) swfURL = base_url + '/webcam.swf';else swfURL = 'webcam.swf';
      } // if this is the user's first visit, set flashvar so flash privacy settings panel is shown first


      if (window.localStorage && !localStorage.getItem('visited')) {
        this.params.new_user = 1;
        localStorage.setItem('visited', 1);
      } // construct flashvars string


      var flashvars = '';

      for (var key in this.params) {
        if (flashvars) flashvars += '&';
        flashvars += key + '=' + escape(this.params[key]);
      } // construct object/embed tag


      html += '<object classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000" type="application/x-shockwave-flash" codebase="' + this.protocol + '://download.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=9,0,0,0" width="' + this.params.width + '" height="' + this.params.height + '" id="webcam_movie_obj" align="middle"><param name="wmode" value="opaque" /><param name="allowScriptAccess" value="always" /><param name="allowFullScreen" value="false" /><param name="movie" value="' + swfURL + '" /><param name="loop" value="false" /><param name="menu" value="false" /><param name="quality" value="best" /><param name="bgcolor" value="#ffffff" /><param name="flashvars" value="' + flashvars + '"/><embed id="webcam_movie_embed" src="' + swfURL + '" wmode="opaque" loop="false" menu="false" quality="best" bgcolor="#ffffff" width="' + this.params.width + '" height="' + this.params.height + '" name="webcam_movie_embed" align="middle" allowScriptAccess="always" allowFullScreen="false" type="application/x-shockwave-flash" pluginspage="http://www.macromedia.com/go/getflashplayer" flashvars="' + flashvars + '"></embed></object>';
      return html;
    },
    getMovie: function () {
      // get reference to movie object/embed in DOM
      if (!this.loaded) return this.dispatch('error', new FlashError("Flash Movie is not loaded yet"));
      var movie = document.getElementById('webcam_movie_obj');
      if (!movie || !movie._snap) movie = document.getElementById('webcam_movie_embed');
      if (!movie) this.dispatch('error', new FlashError("Cannot locate Flash movie in DOM"));
      return movie;
    },
    freeze: function () {
      // show preview, freeze camera
      var self = this;
      var params = this.params; // kill preview if already active

      if (this.preview_active) this.unfreeze(); // determine scale factor

      var scaleX = this.params.width / this.params.dest_width;
      var scaleY = this.params.height / this.params.dest_height; // must unflip container as preview canvas will be pre-flipped

      this.unflip(); // calc final size of image

      var final_width = params.crop_width || params.dest_width;
      var final_height = params.crop_height || params.dest_height; // create canvas for holding preview

      var preview_canvas = document.createElement('canvas');
      preview_canvas.width = final_width;
      preview_canvas.height = final_height;
      var preview_context = preview_canvas.getContext('2d'); // save for later use

      this.preview_canvas = preview_canvas;
      this.preview_context = preview_context; // scale for preview size

      if (scaleX != 1.0 || scaleY != 1.0) {
        preview_canvas.style.webkitTransformOrigin = '0px 0px';
        preview_canvas.style.mozTransformOrigin = '0px 0px';
        preview_canvas.style.msTransformOrigin = '0px 0px';
        preview_canvas.style.oTransformOrigin = '0px 0px';
        preview_canvas.style.transformOrigin = '0px 0px';
        preview_canvas.style.webkitTransform = 'scaleX(' + scaleX + ') scaleY(' + scaleY + ')';
        preview_canvas.style.mozTransform = 'scaleX(' + scaleX + ') scaleY(' + scaleY + ')';
        preview_canvas.style.msTransform = 'scaleX(' + scaleX + ') scaleY(' + scaleY + ')';
        preview_canvas.style.oTransform = 'scaleX(' + scaleX + ') scaleY(' + scaleY + ')';
        preview_canvas.style.transform = 'scaleX(' + scaleX + ') scaleY(' + scaleY + ')';
      } // take snapshot, but fire our own callback


      this.snap(function () {
        // add preview image to dom, adjust for crop
        preview_canvas.style.position = 'relative';
        preview_canvas.style.left = '' + self.container.scrollLeft + 'px';
        preview_canvas.style.top = '' + self.container.scrollTop + 'px';
        self.container.insertBefore(preview_canvas, self.peg);
        self.container.style.overflow = 'hidden'; // set flag for user capture (use preview)

        self.preview_active = true;
      }, preview_canvas);
    },
    unfreeze: function () {
      // cancel preview and resume live video feed
      if (this.preview_active) {
        // remove preview canvas
        this.container.removeChild(this.preview_canvas);
        delete this.preview_context;
        delete this.preview_canvas; // unflag

        this.preview_active = false; // re-flip if we unflipped before

        this.flip();
      }
    },
    flip: function () {
      // flip container horiz (mirror mode) if desired
      if (this.params.flip_horiz) {
        var sty = this.container.style;
        sty.webkitTransform = 'scaleX(-1)';
        sty.mozTransform = 'scaleX(-1)';
        sty.msTransform = 'scaleX(-1)';
        sty.oTransform = 'scaleX(-1)';
        sty.transform = 'scaleX(-1)';
        sty.filter = 'FlipH';
        sty.msFilter = 'FlipH';
      }
    },
    unflip: function () {
      // unflip container horiz (mirror mode) if desired
      if (this.params.flip_horiz) {
        var sty = this.container.style;
        sty.webkitTransform = 'scaleX(1)';
        sty.mozTransform = 'scaleX(1)';
        sty.msTransform = 'scaleX(1)';
        sty.oTransform = 'scaleX(1)';
        sty.transform = 'scaleX(1)';
        sty.filter = '';
        sty.msFilter = '';
      }
    },
    savePreview: function (user_callback, user_canvas) {
      // save preview freeze and fire user callback
      var params = this.params;
      var canvas = this.preview_canvas;
      var context = this.preview_context; // render to user canvas if desired

      if (user_canvas) {
        var user_context = user_canvas.getContext('2d');
        user_context.drawImage(canvas, 0, 0);
      } // fire user callback if desired


      user_callback(user_canvas ? null : canvas.toDataURL('image/' + params.image_format, params.jpeg_quality / 100), canvas, context); // remove preview

      if (this.params.unfreeze_snap) this.unfreeze();
    },
    snap: function (user_callback, user_canvas) {
      // use global callback and canvas if not defined as parameter
      if (!user_callback) user_callback = this.params.user_callback;
      if (!user_canvas) user_canvas = this.params.user_canvas; // take snapshot and return image data uri

      var self = this;
      var params = this.params;
      if (!this.loaded) return this.dispatch('error', new WebcamError("Webcam is not loaded yet")); // if (!this.live) return this.dispatch('error', new WebcamError("Webcam is not live yet"));

      if (!user_callback) return this.dispatch('error', new WebcamError("Please provide a callback function or canvas to snap()")); // if we have an active preview freeze, use that

      if (this.preview_active) {
        this.savePreview(user_callback, user_canvas);
        return null;
      } // create offscreen canvas element to hold pixels


      var canvas = document.createElement('canvas');
      canvas.width = this.params.dest_width;
      canvas.height = this.params.dest_height;
      var context = canvas.getContext('2d'); // flip canvas horizontally if desired

      if (this.params.flip_horiz) {
        context.translate(params.dest_width, 0);
        context.scale(-1, 1);
      } // create inline function, called after image load (flash) or immediately (native)


      var func = function () {
        // render image if needed (flash)
        if (this.src && this.width && this.height) {
          context.drawImage(this, 0, 0, params.dest_width, params.dest_height);
        } // crop if desired


        if (params.crop_width && params.crop_height) {
          var crop_canvas = document.createElement('canvas');
          crop_canvas.width = params.crop_width;
          crop_canvas.height = params.crop_height;
          var crop_context = crop_canvas.getContext('2d');
          crop_context.drawImage(canvas, Math.floor(params.dest_width / 2 - params.crop_width / 2), Math.floor(params.dest_height / 2 - params.crop_height / 2), params.crop_width, params.crop_height, 0, 0, params.crop_width, params.crop_height); // swap canvases

          context = crop_context;
          canvas = crop_canvas;
        } // render to user canvas if desired


        if (user_canvas) {
          var user_context = user_canvas.getContext('2d');
          user_context.drawImage(canvas, 0, 0);
        } // fire user callback if desired


        user_callback(user_canvas ? null : canvas.toDataURL('image/' + params.image_format, params.jpeg_quality / 100), canvas, context);
      }; // grab image frame from userMedia or flash movie


      if (this.userMedia) {
        // native implementation
        context.drawImage(this.video, 0, 0, this.params.dest_width, this.params.dest_height); // fire callback right away

        func();
      } else if (this.iOS) {
        var div = document.getElementById(this.container.id + '-ios_div');
        var img = document.getElementById(this.container.id + '-ios_img');
        var input = document.getElementById(this.container.id + '-ios_input'); // function for handle snapshot event (call user_callback and reset the interface)

        iFunc = function (event) {
          func.call(img);
          img.removeEventListener('load', iFunc);
          div.style.backgroundImage = 'none';
          img.removeAttribute('src');
          input.value = null;
        };

        if (!input.value) {
          // No image selected yet, activate input field
          img.addEventListener('load', iFunc);
          input.style.display = 'block';
          input.focus();
          input.click();
          input.style.display = 'none';
        } else {
          // Image already selected
          iFunc(null);
        }
      } else {
        // flash fallback
        var raw_data = this.getMovie()._snap(); // render to image, fire callback when complete


        var img = new Image();
        img.onload = func;
        img.src = 'data:image/' + this.params.image_format + ';base64,' + raw_data;
      }

      return null;
    },
    configure: function (panel) {
      // open flash configuration panel -- specify tab name:
      // "camera", "privacy", "default", "localStorage", "microphone", "settingsManager"
      if (!panel) panel = "camera";

      this.getMovie()._configure(panel);
    },
    flashNotify: function (type, msg) {
      // receive notification from flash about event
      switch (type) {
        case 'flashLoadComplete':
          // movie loaded successfully
          this.loaded = true;
          this.dispatch('load');
          break;

        case 'cameraLive':
          // camera is live and ready to snap
          this.live = true;
          this.dispatch('live');
          break;

        case 'error':
          // Flash error
          this.dispatch('error', new FlashError(msg));
          break;

        default:
          // catch-all event, just in case
          // console.log("webcam flash_notify: " + type + ": " + msg);
          break;
      }
    },
    b64ToUint6: function (nChr) {
      // convert base64 encoded character to 6-bit integer
      // from: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Base64_encoding_and_decoding
      return nChr > 64 && nChr < 91 ? nChr - 65 : nChr > 96 && nChr < 123 ? nChr - 71 : nChr > 47 && nChr < 58 ? nChr + 4 : nChr === 43 ? 62 : nChr === 47 ? 63 : 0;
    },
    base64DecToArr: function (sBase64, nBlocksSize) {
      // convert base64 encoded string to Uintarray
      // from: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Base64_encoding_and_decoding
      var sB64Enc = sBase64.replace(/[^A-Za-z0-9\+\/]/g, ""),
          nInLen = sB64Enc.length,
          nOutLen = nBlocksSize ? Math.ceil((nInLen * 3 + 1 >> 2) / nBlocksSize) * nBlocksSize : nInLen * 3 + 1 >> 2,
          taBytes = new Uint8Array(nOutLen);

      for (var nMod3, nMod4, nUint24 = 0, nOutIdx = 0, nInIdx = 0; nInIdx < nInLen; nInIdx++) {
        nMod4 = nInIdx & 3;
        nUint24 |= this.b64ToUint6(sB64Enc.charCodeAt(nInIdx)) << 18 - 6 * nMod4;

        if (nMod4 === 3 || nInLen - nInIdx === 1) {
          for (nMod3 = 0; nMod3 < 3 && nOutIdx < nOutLen; nMod3++, nOutIdx++) {
            taBytes[nOutIdx] = nUint24 >>> (16 >>> nMod3 & 24) & 255;
          }

          nUint24 = 0;
        }
      }

      return taBytes;
    },
    upload: function (image_data_uri, target_url, callback) {
      // submit image data to server using binary AJAX
      var form_elem_name = this.params.upload_name || 'webcam'; // detect image format from within image_data_uri

      var image_fmt = '';
      if (image_data_uri.match(/^data\:image\/(\w+)/)) image_fmt = RegExp.$1;else throw "Cannot locate image format in Data URI"; // extract raw base64 data from Data URI

      var raw_image_data = image_data_uri.replace(/^data\:image\/\w+\;base64\,/, ''); // contruct use AJAX object

      var http = new XMLHttpRequest();
      http.open("POST", target_url, true); // setup progress events

      if (http.upload && http.upload.addEventListener) {
        http.upload.addEventListener('progress', function (e) {
          if (e.lengthComputable) {
            var progress = e.loaded / e.total;
            Webcam.dispatch('uploadProgress', progress, e);
          }
        }, false);
      } // completion handler


      var self = this;

      http.onload = function () {
        if (callback) callback.apply(self, [http.status, http.responseText, http.statusText]);
        Webcam.dispatch('uploadComplete', http.status, http.responseText, http.statusText);
      }; // create a blob and decode our base64 to binary


      var blob = new Blob([this.base64DecToArr(raw_image_data)], {
        type: 'image/' + image_fmt
      }); // stuff into a form, so servers can easily receive it as a standard file upload

      var form = new FormData();
      form.append(form_elem_name, blob, form_elem_name + "." + image_fmt.replace(/e/, '')); // send data to server

      http.send(form);
    }
  };
  Webcam.init();

  if (typeof define === 'function' && define.amd) {
    define(function () {
      return Webcam;
    });
  } else if (typeof module === 'object' && module.exports) {
    module.exports = Webcam;
  } else {
    window.Webcam = Webcam;
  }
})(window);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL2Fzc2V0cy9qcy93ZWJjYW0uanMiXSwibmFtZXMiOlsid2luZG93IiwiX3VzZXJNZWRpYSIsIkZsYXNoRXJyb3IiLCJ0ZW1wIiwiRXJyb3IiLCJhcHBseSIsImFyZ3VtZW50cyIsIm5hbWUiLCJzdGFjayIsIm1lc3NhZ2UiLCJXZWJjYW1FcnJvciIsIkludGVybWVkaWF0ZUluaGVyaXRvciIsInByb3RvdHlwZSIsIldlYmNhbSIsInZlcnNpb24iLCJwcm90b2NvbCIsImxvY2F0aW9uIiwibWF0Y2giLCJsb2FkZWQiLCJsaXZlIiwidXNlck1lZGlhIiwiaU9TIiwidGVzdCIsIm5hdmlnYXRvciIsInVzZXJBZ2VudCIsIk1TU3RyZWFtIiwicGFyYW1zIiwid2lkdGgiLCJoZWlnaHQiLCJkZXN0X3dpZHRoIiwiZGVzdF9oZWlnaHQiLCJpbWFnZV9mb3JtYXQiLCJqcGVnX3F1YWxpdHkiLCJlbmFibGVfZmxhc2giLCJmb3JjZV9mbGFzaCIsImZsaXBfaG9yaXoiLCJmcHMiLCJ1cGxvYWRfbmFtZSIsImNvbnN0cmFpbnRzIiwic3dmVVJMIiwiZmxhc2hOb3REZXRlY3RlZFRleHQiLCJub0ludGVyZmFjZUZvdW5kVGV4dCIsInVuZnJlZXplX3NuYXAiLCJpb3NQbGFjZWhvbGRlclRleHQiLCJ1c2VyX2NhbGxiYWNrIiwidXNlcl9jYW52YXMiLCJlcnJvcnMiLCJob29rcyIsImluaXQiLCJzZWxmIiwibWVkaWFEZXZpY2VzIiwiZ2V0VXNlck1lZGlhIiwibW96R2V0VXNlck1lZGlhIiwid2Via2l0R2V0VXNlck1lZGlhIiwiYyIsIlByb21pc2UiLCJ5IiwibiIsImNhbGwiLCJVUkwiLCJ3ZWJraXRVUkwiLCJtb3pVUkwiLCJtc1VSTCIsInBhcnNlSW50IiwiUmVnRXhwIiwiJDEiLCJhZGRFdmVudExpc3RlbmVyIiwiZXZlbnQiLCJyZXNldCIsImV4aWZPcmllbnRhdGlvbiIsImJpbkZpbGUiLCJkYXRhVmlldyIsIkRhdGFWaWV3IiwiZ2V0VWludDgiLCJjb25zb2xlIiwibG9nIiwib2Zmc2V0IiwibWFya2VyIiwiYnl0ZUxlbmd0aCIsInN0ciIsIlN0cmluZyIsImZyb21DaGFyQ29kZSIsImJpZ0VuZCIsImdldFVpbnQxNiIsImZpcnN0SUZET2Zmc2V0IiwiZ2V0VWludDMyIiwiZGF0YVN0YXJ0IiwiZW50cmllcyIsImkiLCJlbnRyeU9mZnNldCIsInZhbHVlVHlwZSIsIm51bVZhbHVlcyIsInZhbHVlIiwiZml4T3JpZW50YXRpb24iLCJvcmlnT2JqVVJMIiwib3JpZW50YXRpb24iLCJ0YXJnZXRJbWciLCJpbWciLCJJbWFnZSIsImNhbnZhcyIsImRvY3VtZW50IiwiY3JlYXRlRWxlbWVudCIsImN0eCIsImdldENvbnRleHQiLCJ0cmFuc2Zvcm0iLCJkcmF3SW1hZ2UiLCJzcmMiLCJ0b0RhdGFVUkwiLCJhdHRhY2giLCJlbGVtIiwiZ2V0RWxlbWVudEJ5SWQiLCJxdWVyeVNlbGVjdG9yIiwiZGlzcGF0Y2giLCJjb250YWluZXIiLCJpbm5lckhUTUwiLCJwZWciLCJhcHBlbmRDaGlsZCIsIm9mZnNldFdpZHRoIiwib2Zmc2V0SGVpZ2h0IiwidW5kZWZpbmVkIiwic2NhbGVYIiwic2NhbGVZIiwidmlkZW8iLCJzZXRBdHRyaWJ1dGUiLCJzdHlsZSIsIm92ZXJmbG93Iiwid2Via2l0VHJhbnNmb3JtT3JpZ2luIiwibW96VHJhbnNmb3JtT3JpZ2luIiwibXNUcmFuc2Zvcm1PcmlnaW4iLCJvVHJhbnNmb3JtT3JpZ2luIiwidHJhbnNmb3JtT3JpZ2luIiwid2Via2l0VHJhbnNmb3JtIiwibW96VHJhbnNmb3JtIiwibXNUcmFuc2Zvcm0iLCJvVHJhbnNmb3JtIiwibWFuZGF0b3J5IiwibWluV2lkdGgiLCJtaW5IZWlnaHQiLCJ0aGVuIiwic3RyZWFtIiwib25sb2FkZWRtZXRhZGF0YSIsImUiLCJmbGlwIiwic3JjT2JqZWN0IiwiY3JlYXRlT2JqZWN0VVJMIiwiY2F0Y2giLCJlcnIiLCJkZXRlY3RGbGFzaCIsInNldFRpbWVvdXQiLCJkaXYiLCJpZCIsImNsYXNzTmFtZSIsInRleHRBbGlnbiIsImRpc3BsYXkiLCJ2ZXJ0aWNhbEFsaWduIiwiYmFja2dyb3VuZFJlcGVhdCIsImJhY2tncm91bmRTaXplIiwiYmFja2dyb3VuZFBvc2l0aW9uIiwic3BhbiIsImlucHV0IiwidGFyZ2V0IiwiZmlsZXMiLCJsZW5ndGgiLCJ0eXBlIiwiaW5kZXhPZiIsIm9ialVSTCIsImltYWdlIiwicmF0aW8iLCJNYXRoIiwibWluIiwic3ciLCJzaCIsInN4Iiwic3kiLCJkYXRhVVJMIiwiYmFja2dyb3VuZEltYWdlIiwiZmlsZVJlYWRlciIsIkZpbGVSZWFkZXIiLCJyZXN1bHQiLCJodHRwIiwiWE1MSHR0cFJlcXVlc3QiLCJvcGVuIiwicmVzcG9uc2VUeXBlIiwib25sb2FkIiwic3RhdHVzIiwicmVhZEFzQXJyYXlCdWZmZXIiLCJyZXNwb25zZSIsInNlbmQiLCJzbmFwIiwiZm9jdXMiLCJjbGljayIsImdldFNXRkhUTUwiLCJjcm9wX3dpZHRoIiwiY3JvcF9oZWlnaHQiLCJzY2FsZWRfY3JvcF93aWR0aCIsImZsb29yIiwic2NhbGVkX2Nyb3BfaGVpZ2h0Iiwic2Nyb2xsTGVmdCIsInNjcm9sbFRvcCIsInByZXZpZXdfYWN0aXZlIiwidW5mcmVlemUiLCJ1bmZsaXAiLCJnZXRWaWRlb1RyYWNrcyIsInRyYWNrcyIsInN0b3AiLCJtb3ZpZSIsImdldE1vdmllIiwiX3JlbGVhc2VDYW1lcmEiLCJzZXQiLCJrZXkiLCJvbiIsImNhbGxiYWNrIiwicmVwbGFjZSIsInRvTG93ZXJDYXNlIiwicHVzaCIsIm9mZiIsImlkeCIsInNwbGljZSIsImFyZ3MiLCJBcnJheSIsInNsaWNlIiwibGVuIiwiaG9vayIsInRvU3RyaW5nIiwiYWxlcnQiLCJzZXRTV0ZMb2NhdGlvbiIsIlNIT0NLV0FWRV9GTEFTSCIsIlNIT0NLV0FWRV9GTEFTSF9BWCIsIkZMQVNIX01JTUVfVFlQRSIsIndpbiIsIm5hdiIsImhhc0ZsYXNoIiwicGx1Z2lucyIsImRlc2MiLCJkZXNjcmlwdGlvbiIsIm1pbWVUeXBlcyIsImVuYWJsZWRQbHVnaW4iLCJBY3RpdmVYT2JqZWN0IiwiYXgiLCJ2ZXIiLCJHZXRWYXJpYWJsZSIsImh0bWwiLCJiYXNlX3VybCIsInNjcHRzIiwiZ2V0RWxlbWVudHNCeVRhZ05hbWUiLCJnZXRBdHRyaWJ1dGUiLCJsb2NhbFN0b3JhZ2UiLCJnZXRJdGVtIiwibmV3X3VzZXIiLCJzZXRJdGVtIiwiZmxhc2h2YXJzIiwiZXNjYXBlIiwiX3NuYXAiLCJmcmVlemUiLCJmaW5hbF93aWR0aCIsImZpbmFsX2hlaWdodCIsInByZXZpZXdfY2FudmFzIiwicHJldmlld19jb250ZXh0IiwicG9zaXRpb24iLCJsZWZ0IiwidG9wIiwiaW5zZXJ0QmVmb3JlIiwicmVtb3ZlQ2hpbGQiLCJzdHkiLCJmaWx0ZXIiLCJtc0ZpbHRlciIsInNhdmVQcmV2aWV3IiwiY29udGV4dCIsInVzZXJfY29udGV4dCIsInRyYW5zbGF0ZSIsInNjYWxlIiwiZnVuYyIsImNyb3BfY2FudmFzIiwiY3JvcF9jb250ZXh0IiwiaUZ1bmMiLCJyZW1vdmVFdmVudExpc3RlbmVyIiwicmVtb3ZlQXR0cmlidXRlIiwicmF3X2RhdGEiLCJjb25maWd1cmUiLCJwYW5lbCIsIl9jb25maWd1cmUiLCJmbGFzaE5vdGlmeSIsIm1zZyIsImI2NFRvVWludDYiLCJuQ2hyIiwiYmFzZTY0RGVjVG9BcnIiLCJzQmFzZTY0IiwibkJsb2Nrc1NpemUiLCJzQjY0RW5jIiwibkluTGVuIiwibk91dExlbiIsImNlaWwiLCJ0YUJ5dGVzIiwiVWludDhBcnJheSIsIm5Nb2QzIiwibk1vZDQiLCJuVWludDI0Iiwibk91dElkeCIsIm5JbklkeCIsImNoYXJDb2RlQXQiLCJ1cGxvYWQiLCJpbWFnZV9kYXRhX3VyaSIsInRhcmdldF91cmwiLCJmb3JtX2VsZW1fbmFtZSIsImltYWdlX2ZtdCIsInJhd19pbWFnZV9kYXRhIiwibGVuZ3RoQ29tcHV0YWJsZSIsInByb2dyZXNzIiwidG90YWwiLCJyZXNwb25zZVRleHQiLCJzdGF0dXNUZXh0IiwiYmxvYiIsIkJsb2Ii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Q0UsTUFBTCxDQUFZWixjQUFaLEVBQTRCUSxJQUE1QixFQUFrQ1IsY0FBYyxHQUFHLEdBQWpCLEdBQXVCQyxTQUFTLENBQUM1RixPQUFWLENBQWtCLEdBQWxCLEVBQXVCLEVBQXZCLENBQXpELEVBeENvRCxDQTBDcEQ7O0FBQ0FqQyxNQUFBQSxJQUFJLENBQUNRLElBQUwsQ0FBVThILElBQVY7QUFDSDtBQXIrQlEsR0FBYjtBQXkrQkE1UyxFQUFBQSxNQUFNLENBQUNtQyxJQUFQOztBQUVBLE1BQUksT0FBTzRRLE1BQVAsS0FBa0IsVUFBbEIsSUFBZ0NBLE1BQU0sQ0FBQ0MsR0FBM0MsRUFBZ0Q7QUFDNUNELElBQUFBLE1BQU0sQ0FBQyxZQUFZO0FBQUUsYUFBTy9TLE1BQVA7QUFBZ0IsS0FBL0IsQ0FBTjtBQUNILEdBRkQsTUFHSyxJQUFJLE9BQU9pVCxNQUFQLEtBQWtCLFFBQWxCLElBQThCQSxNQUFNLENBQUNDLE9BQXpDLEVBQWtEO0FBQ25ERCxJQUFBQSxNQUFNLENBQUNDLE9BQVAsR0FBaUJsVCxNQUFqQjtBQUNILEdBRkksTUFHQTtBQUNEYixJQUFBQSxNQUFNLENBQUNhLE1BQVAsR0FBZ0JBLE1BQWhCO0FBQ0g7QUFFSixDQWhoQ0EsRUFnaENDYixNQWhoQ0QsQ0FBRCIsInNvdXJjZXNDb250ZW50IjpbIi8vIFdlYmNhbUpTIHYxLjAuMjZcbi8vIFdlYmNhbSBsaWJyYXJ5IGZvciBjYXB0dXJpbmcgSlBFRy9QTkcgaW1hZ2VzIGluIEphdmFTY3JpcHRcbi8vIEF0dGVtcHRzIGdldFVzZXJNZWRpYSwgZmFsbHMgYmFjayB0byBGbGFzaFxuLy8gQXV0aG9yOiBKb3NlcGggSHVja2FieTogaHR0cDovL2dpdGh1Yi5jb20vamh1Y2thYnlcbi8vIEJhc2VkIG9uIEpQRUdDYW06IGh0dHA6Ly9jb2RlLmdvb2dsZS5jb20vcC9qcGVnY2FtL1xuLy8gQ29weXJpZ2h0IChjKSAyMDEyIC0gMjAxOSBKb3NlcGggSHVja2FieVxuLy8gTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBMaWNlbnNlXG5cbihmdW5jdGlvbiAod2luZG93KSB7XG4gICAgdmFyIF91c2VyTWVkaWE7XG5cbiAgICAvLyBkZWNsYXJlIGVycm9yIHR5cGVzXG5cbiAgICAvLyBpbmhlcml0YW5jZSBwYXR0ZXJuIGhlcmU6XG4gICAgLy8gaHR0cHM6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvNzgzODE4L2hvdy1kby1pLWNyZWF0ZS1hLWN1c3RvbS1lcnJvci1pbi1qYXZhc2NyaXB0XG4gICAgZnVuY3Rpb24gRmxhc2hFcnJvcigpIHtcbiAgICAgICAgdmFyIHRlbXAgPSBFcnJvci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICB0ZW1wLm5hbWUgPSB0aGlzLm5hbWUgPSBcIkZsYXNoRXJyb3JcIjtcbiAgICAgICAgdGhpcy5zdGFjayA9IHRlbXAuc3RhY2s7XG4gICAgICAgIHRoaXMubWVzc2FnZSA9IHRlbXAubWVzc2FnZTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBXZWJjYW1FcnJvcigpIHtcbiAgICAgICAgdmFyIHRlbXAgPSBFcnJvci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICB0ZW1wLm5hbWUgPSB0aGlzLm5hbWUgPSBcIldlYmNhbUVycm9yXCI7XG4gICAgICAgIHRoaXMuc3RhY2sgPSB0ZW1wLnN0YWNrO1xuICAgICAgICB0aGlzLm1lc3NhZ2UgPSB0ZW1wLm1lc3NhZ2U7XG4gICAgfVxuXG4gICAgdmFyIEludGVybWVkaWF0ZUluaGVyaXRvciA9IGZ1bmN0aW9uICgpIHsgfTtcbiAgICBJbnRlcm1lZGlhdGVJbmhlcml0b3IucHJvdG90eXBlID0gRXJyb3IucHJvdG90eXBlO1xuXG4gICAgRmxhc2hFcnJvci5wcm90b3R5cGUgPSBuZXcgSW50ZXJtZWRpYXRlSW5oZXJpdG9yKCk7XG4gICAgV2ViY2FtRXJyb3IucHJvdG90eXBlID0gbmV3IEludGVybWVkaWF0ZUluaGVyaXRvcigpO1xuXG4gICAgdmFyIFdlYmNhbSA9IHtcbiAgICAgICAgdmVyc2lvbjogJzEuMC4yNicsXG5cbiAgICAgICAgLy8gZ2xvYmFsc1xuICAgICAgICBwcm90b2NvbDogbG9jYXRpb24ucHJvdG9jb2wubWF0Y2goL2h0dHBzL2kpID8gJ2h0dHBzJyA6ICdodHRwJyxcbiAgICAgICAgbG9hZGVkOiBmYWxzZSwgICAvLyB0cnVlIHdoZW4gd2ViY2FtIG1vdmllIGZpbmlzaGVzIGxvYWRpbmdcbiAgICAgICAgbGl2ZTogZmFsc2UsICAgICAvLyB0cnVlIHdoZW4gd2ViY2FtIGlzIGluaXRpYWxpemVkIGFuZCByZWFkeSB0byBzbmFwXG4gICAgICAgIHVzZXJNZWRpYTogdHJ1ZSwgLy8gdHJ1ZSB3aGVuIGdldFVzZXJNZWRpYSBpcyBzdXBwb3J0ZWQgbmF0aXZlbHlcblxuICAgICAgICBpT1M6IC9pUGFkfGlQaG9uZXxpUG9kLy50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpICYmICF3aW5kb3cuTVNTdHJlYW0sXG5cbiAgICAgICAgcGFyYW1zOiB7XG4gICAgICAgICAgICB3aWR0aDogMCxcbiAgICAgICAgICAgIGhlaWdodDogMCxcbiAgICAgICAgICAgIGRlc3Rfd2lkdGg6IDAsICAgICAgICAgLy8gc2l6ZSBvZiBjYXB0dXJlZCBpbWFnZVxuICAgICAgICAgICAgZGVzdF9oZWlnaHQ6IDAsICAgICAgICAvLyB0aGVzZSBkZWZhdWx0IHRvIHdpZHRoL2hlaWdodFxuICAgICAgICAgICAgaW1hZ2VfZm9ybWF0OiAnanBlZycsICAvLyBpbWFnZSBmb3JtYXQgKG1heSBiZSBqcGVnIG9yIHBuZylcbiAgICAgICAgICAgIGpwZWdfcXVhbGl0eTogOTAsICAgICAgLy8ganBlZyBpbWFnZSBxdWFsaXR5IGZyb20gMCAod29yc3QpIHRvIDEwMCAoYmVzdClcbiAgICAgICAgICAgIGVuYWJsZV9mbGFzaDogdHJ1ZSwgICAgLy8gZW5hYmxlIGZsYXNoIGZhbGxiYWNrLFxuICAgICAgICAgICAgZm9yY2VfZmxhc2g6IGZhbHNlLCAgICAvLyBmb3JjZSBmbGFzaCBtb2RlLFxuICAgICAgICAgICAgZmxpcF9ob3JpejogZmFsc2UsICAgICAvLyBmbGlwIGltYWdlIGhvcml6IChtaXJyb3IgbW9kZSlcbiAgICAgICAgICAgIGZwczogMzAsICAgICAgICAgICAgICAgLy8gY2FtZXJhIGZyYW1lcyBwZXIgc2Vjb25kXG4gICAgICAgICAgICB1cGxvYWRfbmFtZTogJ3dlYmNhbScsIC8vIG5hbWUgb2YgZmlsZSBpbiB1cGxvYWQgcG9zdCBkYXRhXG4gICAgICAgICAgICBjb25zdHJhaW50czogbnVsbCwgICAgIC8vIGN1c3RvbSB1c2VyIG1lZGlhIGNvbnN0cmFpbnRzLFxuICAgICAgICAgICAgc3dmVVJMOiAnJywgICAgICAgICAgICAvLyBVUkkgdG8gd2ViY2FtLnN3ZiBtb3ZpZSAoZGVmYXVsdHMgdG8gdGhlIGpzIGxvY2F0aW9uKVxuICAgICAgICAgICAgZmxhc2hOb3REZXRlY3RlZFRleHQ6ICdFUlJPUjogTm8gQWRvYmUgRmxhc2ggUGxheWVyIGRldGVjdGVkLiAgV2ViY2FtLmpzIHJlbGllcyBvbiBGbGFzaCBmb3IgYnJvd3NlcnMgdGhhdCBkbyBub3Qgc3VwcG9ydCBnZXRVc2VyTWVkaWEgKGxpa2UgeW91cnMpLicsXG4gICAgICAgICAgICBub0ludGVyZmFjZUZvdW5kVGV4dDogJ05vIHN1cHBvcnRlZCB3ZWJjYW0gaW50ZXJmYWNlIGZvdW5kLicsXG4gICAgICAgICAgICB1bmZyZWV6ZV9zbmFwOiB0cnVlLCAgICAvLyBXaGV0aGVyIHRvIHVuZnJlZXplIHRoZSBjYW1lcmEgYWZ0ZXIgc25hcCAoZGVmYXVsdHMgdG8gdHJ1ZSlcbiAgICAgICAgICAgIGlvc1BsYWNlaG9sZGVyVGV4dDogJ0NsaWNrIGhlcmUgdG8gb3BlbiBjYW1lcmEuJyxcbiAgICAgICAgICAgIHVzZXJfY2FsbGJhY2s6IG51bGwsICAgIC8vIGNhbGxiYWNrIGZ1bmN0aW9uIGZvciBzbmFwc2hvdCAodXNlZCBpZiBubyB1c2VyX2NhbGxiYWNrIHBhcmFtZXRlciBnaXZlbiB0byBzbmFwIGZ1bmN0aW9uKVxuICAgICAgICAgICAgdXNlcl9jYW52YXM6IG51bGwgICAgICAgLy8gdXNlciBwcm92aWRlZCBjYW52YXMgZm9yIHNuYXBzaG90ICh1c2VkIGlmIG5vIHVzZXJfY2FudmFzIHBhcmFtZXRlciBnaXZlbiB0byBzbmFwIGZ1bmN0aW9uKVxuICAgICAgICB9LFxuXG4gICAgICAgIGVycm9yczoge1xuICAgICAgICAgICAgRmxhc2hFcnJvcjogRmxhc2hFcnJvcixcbiAgICAgICAgICAgIFdlYmNhbUVycm9yOiBXZWJjYW1FcnJvclxuICAgICAgICB9LFxuXG4gICAgICAgIGhvb2tzOiB7fSwgLy8gY2FsbGJhY2sgaG9vayBmdW5jdGlvbnNcblxuICAgICAgICBpbml0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAvLyBpbml0aWFsaXplLCBjaGVjayBmb3IgZ2V0VXNlck1lZGlhIHN1cHBvcnRcbiAgICAgICAgICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgICAgICAgICAgLy8gU2V0dXAgZ2V0VXNlck1lZGlhLCB3aXRoIHBvbHlmaWxsIGZvciBvbGRlciBicm93c2Vyc1xuICAgICAgICAgICAgLy8gQWRhcHRlZCBmcm9tOiBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvTWVkaWFEZXZpY2VzL2dldFVzZXJNZWRpYVxuICAgICAgICAgICAgdGhpcy5tZWRpYURldmljZXMgPSAobmF2aWdhdG9yLm1lZGlhRGV2aWNlcyAmJiBuYXZpZ2F0b3IubWVkaWFEZXZpY2VzLmdldFVzZXJNZWRpYSkgP1xuICAgICAgICAgICAgICAgIG5hdmlnYXRvci5tZWRpYURldmljZXMgOiAoKG5hdmlnYXRvci5tb3pHZXRVc2VyTWVkaWEgfHwgbmF2aWdhdG9yLndlYmtpdEdldFVzZXJNZWRpYSkgPyB7XG4gICAgICAgICAgICAgICAgICAgIGdldFVzZXJNZWRpYTogZnVuY3Rpb24gKGMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAoeSwgbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIChuYXZpZ2F0b3IubW96R2V0VXNlck1lZGlhIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hdmlnYXRvci53ZWJraXRHZXRVc2VyTWVkaWEpLmNhbGwobmF2aWdhdG9yLCBjLCB5LCBuKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSA6IG51bGwpO1xuXG4gICAgICAgICAgICB3aW5kb3cuVVJMID0gd2luZG93LlVSTCB8fCB3aW5kb3cud2Via2l0VVJMIHx8IHdpbmRvdy5tb3pVUkwgfHwgd2luZG93Lm1zVVJMO1xuICAgICAgICAgICAgdGhpcy51c2VyTWVkaWEgPSB0aGlzLnVzZXJNZWRpYSAmJiAhIXRoaXMubWVkaWFEZXZpY2VzICYmICEhd2luZG93LlVSTDtcblxuICAgICAgICAgICAgLy8gT2xkZXIgdmVyc2lvbnMgb2YgZmlyZWZveCAoPCAyMSkgYXBwYXJlbnRseSBjbGFpbSBzdXBwb3J0IGJ1dCB1c2VyIG1lZGlhIGRvZXMgbm90IGFjdHVhbGx5IHdvcmtcbiAgICAgICAgICAgIGlmIChuYXZpZ2F0b3IudXNlckFnZW50Lm1hdGNoKC9GaXJlZm94XFxEKyhcXGQrKS8pKSB7XG4gICAgICAgICAgICAgICAgaWYgKHBhcnNlSW50KFJlZ0V4cC4kMSwgMTApIDwgMjEpIHRoaXMudXNlck1lZGlhID0gbnVsbDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gTWFrZSBzdXJlIG1lZGlhIHN0cmVhbSBpcyBjbG9zZWQgd2hlbiBuYXZpZ2F0aW5nIGF3YXkgZnJvbSBwYWdlXG4gICAgICAgICAgICBpZiAodGhpcy51c2VyTWVkaWEpIHtcbiAgICAgICAgICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignYmVmb3JldW5sb2FkJywgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYucmVzZXQoKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBleGlmT3JpZW50YXRpb246IGZ1bmN0aW9uIChiaW5GaWxlKSB7XG4gICAgICAgICAgICAvLyBleHRyYWN0IG9yaWVudGF0aW9uIGluZm9ybWF0aW9uIGZyb20gdGhlIGltYWdlIHByb3ZpZGVkIGJ5IGlPU1xuICAgICAgICAgICAgLy8gYWxnb3JpdGhtIGJhc2VkIG9uIGV4aWYtanNcbiAgICAgICAgICAgIHZhciBkYXRhVmlldyA9IG5ldyBEYXRhVmlldyhiaW5GaWxlKTtcbiAgICAgICAgICAgIGlmICgoZGF0YVZpZXcuZ2V0VWludDgoMCkgIT0gMHhGRikgfHwgKGRhdGFWaWV3LmdldFVpbnQ4KDEpICE9IDB4RDgpKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ05vdCBhIHZhbGlkIEpQRUcgZmlsZScpO1xuICAgICAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIG9mZnNldCA9IDI7XG4gICAgICAgICAgICB2YXIgbWFya2VyID0gbnVsbDtcbiAgICAgICAgICAgIHdoaWxlIChvZmZzZXQgPCBiaW5GaWxlLmJ5dGVMZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAvLyBmaW5kIDB4RkZFMSAoMjI1IG1hcmtlcilcbiAgICAgICAgICAgICAgICBpZiAoZGF0YVZpZXcuZ2V0VWludDgob2Zmc2V0KSAhPSAweEZGKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdOb3QgYSB2YWxpZCBtYXJrZXIgYXQgb2Zmc2V0ICcgKyBvZmZzZXQgKyAnLCBmb3VuZDogJyArIGRhdGFWaWV3LmdldFVpbnQ4KG9mZnNldCkpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgbWFya2VyID0gZGF0YVZpZXcuZ2V0VWludDgob2Zmc2V0ICsgMSk7XG4gICAgICAgICAgICAgICAgaWYgKG1hcmtlciA9PSAyMjUpIHtcbiAgICAgICAgICAgICAgICAgICAgb2Zmc2V0ICs9IDQ7XG4gICAgICAgICAgICAgICAgICAgIHZhciBzdHIgPSBcIlwiO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKG4gPSAwOyBuIDwgNDsgbisrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdHIgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShkYXRhVmlldy5nZXRVaW50OChvZmZzZXQgKyBuKSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKHN0ciAhPSAnRXhpZicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdOb3QgdmFsaWQgRVhJRiBkYXRhIGZvdW5kJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIG9mZnNldCArPSA2OyAvLyB0aWZmT2Zmc2V0XG4gICAgICAgICAgICAgICAgICAgIHZhciBiaWdFbmQgPSBudWxsO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIHRlc3QgZm9yIFRJRkYgdmFsaWRpdHkgYW5kIGVuZGlhbm5lc3NcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRhdGFWaWV3LmdldFVpbnQxNihvZmZzZXQpID09IDB4NDk0OSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYmlnRW5kID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZGF0YVZpZXcuZ2V0VWludDE2KG9mZnNldCkgPT0gMHg0RDREKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBiaWdFbmQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJOb3QgdmFsaWQgVElGRiBkYXRhISAobm8gMHg0OTQ5IG9yIDB4NEQ0RClcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmIChkYXRhVmlldy5nZXRVaW50MTYob2Zmc2V0ICsgMiwgIWJpZ0VuZCkgIT0gMHgwMDJBKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIk5vdCB2YWxpZCBUSUZGIGRhdGEhIChubyAweDAwMkEpXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICB2YXIgZmlyc3RJRkRPZmZzZXQgPSBkYXRhVmlldy5nZXRVaW50MzIob2Zmc2V0ICsgNCwgIWJpZ0VuZCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChmaXJzdElGRE9mZnNldCA8IDB4MDAwMDAwMDgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiTm90IHZhbGlkIFRJRkYgZGF0YSEgKEZpcnN0IG9mZnNldCBsZXNzIHRoYW4gOClcIiwgZGF0YVZpZXcuZ2V0VWludDMyKG9mZnNldCArIDQsICFiaWdFbmQpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gZXh0cmFjdCBvcmllbnRhdGlvbiBkYXRhXG4gICAgICAgICAgICAgICAgICAgIHZhciBkYXRhU3RhcnQgPSBvZmZzZXQgKyBmaXJzdElGRE9mZnNldDtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGVudHJpZXMgPSBkYXRhVmlldy5nZXRVaW50MTYoZGF0YVN0YXJ0LCAhYmlnRW5kKTtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBlbnRyaWVzOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBlbnRyeU9mZnNldCA9IGRhdGFTdGFydCArIGkgKiAxMiArIDI7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZGF0YVZpZXcuZ2V0VWludDE2KGVudHJ5T2Zmc2V0LCAhYmlnRW5kKSA9PSAweDAxMTIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgdmFsdWVUeXBlID0gZGF0YVZpZXcuZ2V0VWludDE2KGVudHJ5T2Zmc2V0ICsgMiwgIWJpZ0VuZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG51bVZhbHVlcyA9IGRhdGFWaWV3LmdldFVpbnQzMihlbnRyeU9mZnNldCArIDQsICFiaWdFbmQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh2YWx1ZVR5cGUgIT0gMyAmJiBudW1WYWx1ZXMgIT0gMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnSW52YWxpZCBFWElGIG9yaWVudGF0aW9uIHZhbHVlIHR5cGUgKCcgKyB2YWx1ZVR5cGUgKyAnKSBvciBjb3VudCAoJyArIG51bVZhbHVlcyArICcpJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgdmFsdWUgPSBkYXRhVmlldy5nZXRVaW50MTYoZW50cnlPZmZzZXQgKyA4LCAhYmlnRW5kKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodmFsdWUgPCAxIHx8IHZhbHVlID4gOCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnSW52YWxpZCBFWElGIG9yaWVudGF0aW9uIHZhbHVlICgnICsgdmFsdWUgKyAnKScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgb2Zmc2V0ICs9IDIgKyBkYXRhVmlldy5nZXRVaW50MTYob2Zmc2V0ICsgMik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZml4T3JpZW50YXRpb246IGZ1bmN0aW9uIChvcmlnT2JqVVJMLCBvcmllbnRhdGlvbiwgdGFyZ2V0SW1nKSB7XG4gICAgICAgICAgICAvLyBmaXggaW1hZ2Ugb3JpZW50YXRpb24gYmFzZWQgb24gZXhpZiBvcmllbnRhdGlvbiBkYXRhXG4gICAgICAgICAgICAvLyBleGlmIG9yaWVudGF0aW9uIGluZm9ybWF0aW9uXG4gICAgICAgICAgICAvLyAgICBodHRwOi8vd3d3LmltcHVsc2VhZHZlbnR1cmUuY29tL3Bob3RvL2V4aWYtb3JpZW50YXRpb24uaHRtbFxuICAgICAgICAgICAgLy8gICAgbGluayBzb3VyY2Ugd2lraXBlZGlhIChodHRwczovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9FeGlmI2NpdGVfbm90ZS0yMClcbiAgICAgICAgICAgIHZhciBpbWcgPSBuZXcgSW1hZ2UoKTtcbiAgICAgICAgICAgIGltZy5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICAgICAgICAgdmFyIGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICAgICAgICAgICAgICAgIHZhciBjdHggPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcblxuICAgICAgICAgICAgICAgIC8vIHN3aXRjaCB3aWR0aCBoZWlnaHQgaWYgb3JpZW50YXRpb24gbmVlZGVkXG4gICAgICAgICAgICAgICAgaWYgKG9yaWVudGF0aW9uIDwgNSkge1xuICAgICAgICAgICAgICAgICAgICBjYW52YXMud2lkdGggPSBpbWcud2lkdGg7XG4gICAgICAgICAgICAgICAgICAgIGNhbnZhcy5oZWlnaHQgPSBpbWcuaGVpZ2h0O1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNhbnZhcy53aWR0aCA9IGltZy5oZWlnaHQ7XG4gICAgICAgICAgICAgICAgICAgIGNhbnZhcy5oZWlnaHQgPSBpbWcud2lkdGg7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gdHJhbnNmb3JtIChyb3RhdGUpIGltYWdlIC0gc2VlIGxpbmsgYXQgYmVnaW5uaW5nIHRoaXMgbWV0aG9kXG4gICAgICAgICAgICAgICAgc3dpdGNoIChvcmllbnRhdGlvbikge1xuICAgICAgICAgICAgICAgICAgICBjYXNlIDI6IGN0eC50cmFuc2Zvcm0oLTEsIDAsIDAsIDEsIGltZy53aWR0aCwgMCk7IGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIDM6IGN0eC50cmFuc2Zvcm0oLTEsIDAsIDAsIC0xLCBpbWcud2lkdGgsIGltZy5oZWlnaHQpOyBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSA0OiBjdHgudHJhbnNmb3JtKDEsIDAsIDAsIC0xLCAwLCBpbWcuaGVpZ2h0KTsgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgNTogY3R4LnRyYW5zZm9ybSgwLCAxLCAxLCAwLCAwLCAwKTsgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgNjogY3R4LnRyYW5zZm9ybSgwLCAxLCAtMSwgMCwgaW1nLmhlaWdodCwgMCk7IGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIDc6IGN0eC50cmFuc2Zvcm0oMCwgLTEsIC0xLCAwLCBpbWcuaGVpZ2h0LCBpbWcud2lkdGgpOyBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSA4OiBjdHgudHJhbnNmb3JtKDAsIC0xLCAxLCAwLCAwLCBpbWcud2lkdGgpOyBicmVhaztcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBjdHguZHJhd0ltYWdlKGltZywgMCwgMCk7XG4gICAgICAgICAgICAgICAgLy8gcGFzcyByb3RhdGVkIGltYWdlIGRhdGEgdG8gdGhlIHRhcmdldCBpbWFnZSBjb250YWluZXJcbiAgICAgICAgICAgICAgICB0YXJnZXRJbWcuc3JjID0gY2FudmFzLnRvRGF0YVVSTCgpO1xuICAgICAgICAgICAgfSwgZmFsc2UpO1xuICAgICAgICAgICAgLy8gc3RhcnQgdHJhbnNmb3JtYXRpb24gYnkgbG9hZCBldmVudFxuICAgICAgICAgICAgaW1nLnNyYyA9IG9yaWdPYmpVUkw7XG4gICAgICAgIH0sXG5cbiAgICAgICAgYXR0YWNoOiBmdW5jdGlvbiAoZWxlbSkge1xuICAgICAgICAgICAgLy8gY3JlYXRlIHdlYmNhbSBwcmV2aWV3IGFuZCBhdHRhY2ggdG8gRE9NIGVsZW1lbnRcbiAgICAgICAgICAgIC8vIHBhc3MgaW4gYWN0dWFsIERPTSByZWZlcmVuY2UsIElELCBvciBDU1Mgc2VsZWN0b3JcbiAgICAgICAgICAgIGlmICh0eXBlb2YgKGVsZW0pID09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgZWxlbSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGVsZW0pIHx8IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoZWxlbSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIWVsZW0pIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5kaXNwYXRjaCgnZXJyb3InLCBuZXcgV2ViY2FtRXJyb3IoXCJDb3VsZCBub3QgbG9jYXRlIERPTSBlbGVtZW50IHRvIGF0dGFjaCB0by5cIikpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5jb250YWluZXIgPSBlbGVtO1xuICAgICAgICAgICAgZWxlbS5pbm5lckhUTUwgPSAnJzsgLy8gc3RhcnQgd2l0aCBlbXB0eSBlbGVtZW50XG5cbiAgICAgICAgICAgIC8vIGluc2VydCBcInBlZ1wiIHNvIHdlIGNhbiBpbnNlcnQgb3VyIHByZXZpZXcgY2FudmFzIGFkamFjZW50IHRvIGl0IGxhdGVyIG9uXG4gICAgICAgICAgICB2YXIgcGVnID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgICAgICBlbGVtLmFwcGVuZENoaWxkKHBlZyk7XG4gICAgICAgICAgICB0aGlzLnBlZyA9IHBlZztcblxuICAgICAgICAgICAgLy8gc2V0IHdpZHRoL2hlaWdodCBpZiBub3QgYWxyZWFkeSBzZXRcbiAgICAgICAgICAgIGlmICghdGhpcy5wYXJhbXMud2lkdGgpIHRoaXMucGFyYW1zLndpZHRoID0gZWxlbS5vZmZzZXRXaWR0aDtcbiAgICAgICAgICAgIGlmICghdGhpcy5wYXJhbXMuaGVpZ2h0KSB0aGlzLnBhcmFtcy5oZWlnaHQgPSBlbGVtLm9mZnNldEhlaWdodDtcblxuICAgICAgICAgICAgLy8gbWFrZSBzdXJlIHdlIGhhdmUgYSBub256ZXJvIHdpZHRoIGFuZCBoZWlnaHQgYXQgdGhpcyBwb2ludFxuICAgICAgICAgICAgaWYgKCF0aGlzLnBhcmFtcy53aWR0aCB8fCAhdGhpcy5wYXJhbXMuaGVpZ2h0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZGlzcGF0Y2goJ2Vycm9yJywgbmV3IFdlYmNhbUVycm9yKFwiTm8gd2lkdGggYW5kL29yIGhlaWdodCBmb3Igd2ViY2FtLiAgUGxlYXNlIGNhbGwgc2V0KCkgZmlyc3QsIG9yIGF0dGFjaCB0byBhIHZpc2libGUgZWxlbWVudC5cIikpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBzZXQgZGVmYXVsdHMgZm9yIGRlc3Rfd2lkdGggLyBkZXN0X2hlaWdodCBpZiBub3Qgc2V0XG4gICAgICAgICAgICBpZiAoIXRoaXMucGFyYW1zLmRlc3Rfd2lkdGgpIHRoaXMucGFyYW1zLmRlc3Rfd2lkdGggPSB0aGlzLnBhcmFtcy53aWR0aDtcbiAgICAgICAgICAgIGlmICghdGhpcy5wYXJhbXMuZGVzdF9oZWlnaHQpIHRoaXMucGFyYW1zLmRlc3RfaGVpZ2h0ID0gdGhpcy5wYXJhbXMuaGVpZ2h0O1xuXG4gICAgICAgICAgICB0aGlzLnVzZXJNZWRpYSA9IF91c2VyTWVkaWEgPT09IHVuZGVmaW5lZCA/IHRoaXMudXNlck1lZGlhIDogX3VzZXJNZWRpYTtcbiAgICAgICAgICAgIC8vIGlmIGZvcmNlX2ZsYXNoIGlzIHNldCwgZGlzYWJsZSB1c2VyTWVkaWFcbiAgICAgICAgICAgIGlmICh0aGlzLnBhcmFtcy5mb3JjZV9mbGFzaCkge1xuICAgICAgICAgICAgICAgIF91c2VyTWVkaWEgPSB0aGlzLnVzZXJNZWRpYTtcbiAgICAgICAgICAgICAgICB0aGlzLnVzZXJNZWRpYSA9IG51bGw7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGNoZWNrIGZvciBkZWZhdWx0IGZwc1xuICAgICAgICAgICAgaWYgKHR5cGVvZiB0aGlzLnBhcmFtcy5mcHMgIT09IFwibnVtYmVyXCIpIHRoaXMucGFyYW1zLmZwcyA9IDMwO1xuXG4gICAgICAgICAgICAvLyBhZGp1c3Qgc2NhbGUgaWYgZGVzdF93aWR0aCBvciBkZXN0X2hlaWdodCBpcyBkaWZmZXJlbnRcbiAgICAgICAgICAgIHZhciBzY2FsZVggPSB0aGlzLnBhcmFtcy53aWR0aCAvIHRoaXMucGFyYW1zLmRlc3Rfd2lkdGg7XG4gICAgICAgICAgICB2YXIgc2NhbGVZID0gdGhpcy5wYXJhbXMuaGVpZ2h0IC8gdGhpcy5wYXJhbXMuZGVzdF9oZWlnaHQ7XG5cbiAgICAgICAgICAgIGlmICh0aGlzLnVzZXJNZWRpYSkge1xuICAgICAgICAgICAgICAgIC8vIHNldHVwIHdlYmNhbSB2aWRlbyBjb250YWluZXJcbiAgICAgICAgICAgICAgICB2YXIgdmlkZW8gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd2aWRlbycpO1xuICAgICAgICAgICAgICAgIHZpZGVvLnNldEF0dHJpYnV0ZSgnYXV0b3BsYXknLCAnYXV0b3BsYXknKTtcbiAgICAgICAgICAgICAgICB2aWRlby5zZXRBdHRyaWJ1dGUoJ3BsYXlzaW5saW5lJywgJ3BsYXlzaW5saW5lJyk7XG4gICAgICAgICAgICAgICAgdmlkZW8uc3R5bGUud2lkdGggPSAnJyArIHRoaXMucGFyYW1zLmRlc3Rfd2lkdGggKyAncHgnO1xuICAgICAgICAgICAgICAgIHZpZGVvLnN0eWxlLmhlaWdodCA9ICcnICsgdGhpcy5wYXJhbXMuZGVzdF9oZWlnaHQgKyAncHgnO1xuXG4gICAgICAgICAgICAgICAgaWYgKChzY2FsZVggIT0gMS4wKSB8fCAoc2NhbGVZICE9IDEuMCkpIHtcbiAgICAgICAgICAgICAgICAgICAgZWxlbS5zdHlsZS5vdmVyZmxvdyA9ICdoaWRkZW4nO1xuICAgICAgICAgICAgICAgICAgICB2aWRlby5zdHlsZS53ZWJraXRUcmFuc2Zvcm1PcmlnaW4gPSAnMHB4IDBweCc7XG4gICAgICAgICAgICAgICAgICAgIHZpZGVvLnN0eWxlLm1velRyYW5zZm9ybU9yaWdpbiA9ICcwcHggMHB4JztcbiAgICAgICAgICAgICAgICAgICAgdmlkZW8uc3R5bGUubXNUcmFuc2Zvcm1PcmlnaW4gPSAnMHB4IDBweCc7XG4gICAgICAgICAgICAgICAgICAgIHZpZGVvLnN0eWxlLm9UcmFuc2Zvcm1PcmlnaW4gPSAnMHB4IDBweCc7XG4gICAgICAgICAgICAgICAgICAgIHZpZGVvLnN0eWxlLnRyYW5zZm9ybU9yaWdpbiA9ICcwcHggMHB4JztcbiAgICAgICAgICAgICAgICAgICAgdmlkZW8uc3R5bGUud2Via2l0VHJhbnNmb3JtID0gJ3NjYWxlWCgnICsgc2NhbGVYICsgJykgc2NhbGVZKCcgKyBzY2FsZVkgKyAnKSc7XG4gICAgICAgICAgICAgICAgICAgIHZpZGVvLnN0eWxlLm1velRyYW5zZm9ybSA9ICdzY2FsZVgoJyArIHNjYWxlWCArICcpIHNjYWxlWSgnICsgc2NhbGVZICsgJyknO1xuICAgICAgICAgICAgICAgICAgICB2aWRlby5zdHlsZS5tc1RyYW5zZm9ybSA9ICdzY2FsZVgoJyArIHNjYWxlWCArICcpIHNjYWxlWSgnICsgc2NhbGVZICsgJyknO1xuICAgICAgICAgICAgICAgICAgICB2aWRlby5zdHlsZS5vVHJhbnNmb3JtID0gJ3NjYWxlWCgnICsgc2NhbGVYICsgJykgc2NhbGVZKCcgKyBzY2FsZVkgKyAnKSc7XG4gICAgICAgICAgICAgICAgICAgIHZpZGVvLnN0eWxlLnRyYW5zZm9ybSA9ICdzY2FsZVgoJyArIHNjYWxlWCArICcpIHNjYWxlWSgnICsgc2NhbGVZICsgJyknO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIGFkZCB2aWRlbyBlbGVtZW50IHRvIGRvbVxuICAgICAgICAgICAgICAgIGVsZW0uYXBwZW5kQ2hpbGQodmlkZW8pO1xuICAgICAgICAgICAgICAgIHRoaXMudmlkZW8gPSB2aWRlbztcblxuICAgICAgICAgICAgICAgIC8vIGFzayB1c2VyIGZvciBhY2Nlc3MgdG8gdGhlaXIgY2FtZXJhXG4gICAgICAgICAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICAgICAgICAgIHRoaXMubWVkaWFEZXZpY2VzLmdldFVzZXJNZWRpYSh7XG4gICAgICAgICAgICAgICAgICAgIFwiYXVkaW9cIjogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIFwidmlkZW9cIjogdGhpcy5wYXJhbXMuY29uc3RyYWludHMgfHwge1xuICAgICAgICAgICAgICAgICAgICAgICAgbWFuZGF0b3J5OiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWluV2lkdGg6IHRoaXMucGFyYW1zLmRlc3Rfd2lkdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWluSGVpZ2h0OiB0aGlzLnBhcmFtcy5kZXN0X2hlaWdodFxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKHN0cmVhbSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gZ290IGFjY2VzcywgYXR0YWNoIHN0cmVhbSB0byB2aWRlb1xuICAgICAgICAgICAgICAgICAgICAgICAgdmlkZW8ub25sb2FkZWRtZXRhZGF0YSA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5zdHJlYW0gPSBzdHJlYW07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5sb2FkZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYubGl2ZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5kaXNwYXRjaCgnbG9hZCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuZGlzcGF0Y2goJ2xpdmUnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmZsaXAoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBhcyB3aW5kb3cuVVJMLmNyZWF0ZU9iamVjdFVSTCgpIGlzIGRlcHJlY2F0ZWQsIGFkZGluZyBhIGNoZWNrIHNvIHRoYXQgaXQgd29ya3MgaW4gU2FmYXJpLlxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gb2xkZXIgYnJvd3NlcnMgbWF5IG5vdCBoYXZlIHNyY09iamVjdFxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKFwic3JjT2JqZWN0XCIgaW4gdmlkZW8pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2aWRlby5zcmNPYmplY3QgPSBzdHJlYW07XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB1c2luZyBVUkwuY3JlYXRlT2JqZWN0VVJMKCkgYXMgZmFsbGJhY2sgZm9yIG9sZCBicm93c2Vyc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZpZGVvLnNyYyA9IHdpbmRvdy5VUkwuY3JlYXRlT2JqZWN0VVJMKHN0cmVhbSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgIC5jYXRjaChmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBKSCAyMDE2LTA3LTMxIEluc3RlYWQgb2YgZGlzcGF0Y2hpbmcgZXJyb3IsIG5vdyBmYWxsaW5nIGJhY2sgdG8gRmxhc2ggaWYgdXNlck1lZGlhIGZhaWxzICh0aHggQGpvaG4yMDE0KVxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gSkggMjAxNi0wOC0wNyBCdXQgb25seSBpZiBmbGFzaCBpcyBhY3R1YWxseSBpbnN0YWxsZWQgLS0gaWYgbm90LCBkaXNwYXRjaCBlcnJvciBoZXJlIGFuZCBub3cuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc2VsZi5wYXJhbXMuZW5hYmxlX2ZsYXNoICYmIHNlbGYuZGV0ZWN0Rmxhc2goKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkgeyBzZWxmLnBhcmFtcy5mb3JjZV9mbGFzaCA9IDE7IHNlbGYuYXR0YWNoKGVsZW0pOyB9LCAxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuZGlzcGF0Y2goJ2Vycm9yJywgZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmICh0aGlzLmlPUykge1xuICAgICAgICAgICAgICAgIC8vIHByZXBhcmUgSFRNTCBlbGVtZW50c1xuICAgICAgICAgICAgICAgIHZhciBkaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgICAgICAgICBkaXYuaWQgPSB0aGlzLmNvbnRhaW5lci5pZCArICctaW9zX2Rpdic7XG4gICAgICAgICAgICAgICAgZGl2LmNsYXNzTmFtZSA9ICd3ZWJjYW1qcy1pb3MtcGxhY2Vob2xkZXInO1xuICAgICAgICAgICAgICAgIGRpdi5zdHlsZS53aWR0aCA9ICcnICsgdGhpcy5wYXJhbXMud2lkdGggKyAncHgnO1xuICAgICAgICAgICAgICAgIGRpdi5zdHlsZS5oZWlnaHQgPSAnJyArIHRoaXMucGFyYW1zLmhlaWdodCArICdweCc7XG4gICAgICAgICAgICAgICAgZGl2LnN0eWxlLnRleHRBbGlnbiA9ICdjZW50ZXInO1xuICAgICAgICAgICAgICAgIGRpdi5zdHlsZS5kaXNwbGF5ID0gJ3RhYmxlLWNlbGwnO1xuICAgICAgICAgICAgICAgIGRpdi5zdHlsZS52ZXJ0aWNhbEFsaWduID0gJ21pZGRsZSc7XG4gICAgICAgICAgICAgICAgZGl2LnN0eWxlLmJhY2tncm91bmRSZXBlYXQgPSAnbm8tcmVwZWF0JztcbiAgICAgICAgICAgICAgICBkaXYuc3R5bGUuYmFja2dyb3VuZFNpemUgPSAnY29udGFpbic7XG4gICAgICAgICAgICAgICAgZGl2LnN0eWxlLmJhY2tncm91bmRQb3NpdGlvbiA9ICdjZW50ZXInO1xuICAgICAgICAgICAgICAgIHZhciBzcGFuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICAgICAgICAgICAgICAgIHNwYW4uY2xhc3NOYW1lID0gJ3dlYmNhbWpzLWlvcy10ZXh0JztcbiAgICAgICAgICAgICAgICBzcGFuLmlubmVySFRNTCA9IHRoaXMucGFyYW1zLmlvc1BsYWNlaG9sZGVyVGV4dDtcbiAgICAgICAgICAgICAgICBkaXYuYXBwZW5kQ2hpbGQoc3Bhbik7XG4gICAgICAgICAgICAgICAgdmFyIGltZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2ltZycpO1xuICAgICAgICAgICAgICAgIGltZy5pZCA9IHRoaXMuY29udGFpbmVyLmlkICsgJy1pb3NfaW1nJztcbiAgICAgICAgICAgICAgICBpbWcuc3R5bGUud2lkdGggPSAnJyArIHRoaXMucGFyYW1zLmRlc3Rfd2lkdGggKyAncHgnO1xuICAgICAgICAgICAgICAgIGltZy5zdHlsZS5oZWlnaHQgPSAnJyArIHRoaXMucGFyYW1zLmRlc3RfaGVpZ2h0ICsgJ3B4JztcbiAgICAgICAgICAgICAgICBpbWcuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgICAgICAgICBkaXYuYXBwZW5kQ2hpbGQoaW1nKTtcbiAgICAgICAgICAgICAgICB2YXIgaW5wdXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnB1dCcpO1xuICAgICAgICAgICAgICAgIGlucHV0LmlkID0gdGhpcy5jb250YWluZXIuaWQgKyAnLWlvc19pbnB1dCc7XG4gICAgICAgICAgICAgICAgaW5wdXQuc2V0QXR0cmlidXRlKCd0eXBlJywgJ2ZpbGUnKTtcbiAgICAgICAgICAgICAgICBpbnB1dC5zZXRBdHRyaWJ1dGUoJ2FjY2VwdCcsICdpbWFnZS8qJyk7XG4gICAgICAgICAgICAgICAgaW5wdXQuc2V0QXR0cmlidXRlKCdjYXB0dXJlJywgJ2NhbWVyYScpO1xuXG4gICAgICAgICAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICAgICAgICAgIHZhciBwYXJhbXMgPSB0aGlzLnBhcmFtcztcbiAgICAgICAgICAgICAgICAvLyBhZGQgaW5wdXQgbGlzdGVuZXIgdG8gbG9hZCB0aGUgc2VsZWN0ZWQgaW1hZ2VcbiAgICAgICAgICAgICAgICBpbnB1dC5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGV2ZW50LnRhcmdldC5maWxlcy5sZW5ndGggPiAwICYmIGV2ZW50LnRhcmdldC5maWxlc1swXS50eXBlLmluZGV4T2YoJ2ltYWdlLycpID09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBvYmpVUkwgPSBVUkwuY3JlYXRlT2JqZWN0VVJMKGV2ZW50LnRhcmdldC5maWxlc1swXSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGxvYWQgaW1hZ2Ugd2l0aCBhdXRvIHNjYWxlIGFuZCBjcm9wXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgaW1hZ2UgPSBuZXcgSW1hZ2UoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGltYWdlLmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FudmFzLndpZHRoID0gcGFyYW1zLmRlc3Rfd2lkdGg7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FudmFzLmhlaWdodCA9IHBhcmFtcy5kZXN0X2hlaWdodDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgY3R4ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBjcm9wIGFuZCBzY2FsZSBpbWFnZSBmb3IgZmluYWwgc2l6ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJhdGlvID0gTWF0aC5taW4oaW1hZ2Uud2lkdGggLyBwYXJhbXMuZGVzdF93aWR0aCwgaW1hZ2UuaGVpZ2h0IC8gcGFyYW1zLmRlc3RfaGVpZ2h0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgc3cgPSBwYXJhbXMuZGVzdF93aWR0aCAqIHJhdGlvO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBzaCA9IHBhcmFtcy5kZXN0X2hlaWdodCAqIHJhdGlvO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBzeCA9IChpbWFnZS53aWR0aCAtIHN3KSAvIDI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHN5ID0gKGltYWdlLmhlaWdodCAtIHNoKSAvIDI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3R4LmRyYXdJbWFnZShpbWFnZSwgc3gsIHN5LCBzdywgc2gsIDAsIDAsIHBhcmFtcy5kZXN0X3dpZHRoLCBwYXJhbXMuZGVzdF9oZWlnaHQpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGRhdGFVUkwgPSBjYW52YXMudG9EYXRhVVJMKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW1nLnNyYyA9IGRhdGFVUkw7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGl2LnN0eWxlLmJhY2tncm91bmRJbWFnZSA9IFwidXJsKCdcIiArIGRhdGFVUkwgKyBcIicpXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICB9LCBmYWxzZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHJlYWQgRVhJRiBkYXRhXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgZmlsZVJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBmaWxlUmVhZGVyLmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBvcmllbnRhdGlvbiA9IHNlbGYuZXhpZk9yaWVudGF0aW9uKGUudGFyZ2V0LnJlc3VsdCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG9yaWVudGF0aW9uID4gMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBpbWFnZSBuZWVkIHRvIHJvdGF0ZSAoc2VlIGNvbW1lbnRzIG9uIGZpeE9yaWVudGF0aW9uIG1ldGhvZCBmb3IgbW9yZSBpbmZvcm1hdGlvbilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gdHJhbnNmb3JtIGltYWdlIGFuZCBsb2FkIHRvIGltYWdlIG9iamVjdFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmZpeE9yaWVudGF0aW9uKG9ialVSTCwgb3JpZW50YXRpb24sIGltYWdlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBsb2FkIGltYWdlIGRhdGEgdG8gaW1hZ2Ugb2JqZWN0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGltYWdlLnNyYyA9IG9ialVSTDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9LCBmYWxzZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIENvbnZlcnQgaW1hZ2UgZGF0YSB0byBibG9iIGZvcm1hdFxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGh0dHAgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGh0dHAub3BlbihcIkdFVFwiLCBvYmpVUkwsIHRydWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaHR0cC5yZXNwb25zZVR5cGUgPSBcImJsb2JcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgIGh0dHAub25sb2FkID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5zdGF0dXMgPT0gMjAwIHx8IHRoaXMuc3RhdHVzID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpbGVSZWFkZXIucmVhZEFzQXJyYXlCdWZmZXIodGhpcy5yZXNwb25zZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGh0dHAuc2VuZCgpO1xuXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgaW5wdXQuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgICAgICAgICBlbGVtLmFwcGVuZENoaWxkKGlucHV0KTtcbiAgICAgICAgICAgICAgICAvLyBtYWtlIGRpdiBjbGlja2FibGUgZm9yIG9wZW4gY2FtZXJhIGludGVyZmFjZVxuICAgICAgICAgICAgICAgIGRpdi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAocGFyYW1zLnVzZXJfY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGdsb2JhbCB1c2VyX2NhbGxiYWNrIGRlZmluZWQgLSBjcmVhdGUgdGhlIHNuYXBzaG90XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLnNuYXAocGFyYW1zLnVzZXJfY2FsbGJhY2ssIHBhcmFtcy51c2VyX2NhbnZhcyk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBubyBnbG9iYWwgY2FsbGJhY2sgZGVmaW5pZWQgZm9yIHNuYXBzaG90LCBsb2FkIGltYWdlIGFuZCB3YWl0IGZvciBleHRlcm5hbCBzbmFwIG1ldGhvZCBjYWxsXG4gICAgICAgICAgICAgICAgICAgICAgICBpbnB1dC5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcbiAgICAgICAgICAgICAgICAgICAgICAgIGlucHV0LmZvY3VzKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbnB1dC5jbGljaygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5wdXQuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sIGZhbHNlKTtcbiAgICAgICAgICAgICAgICBlbGVtLmFwcGVuZENoaWxkKGRpdik7XG4gICAgICAgICAgICAgICAgdGhpcy5sb2FkZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHRoaXMubGl2ZSA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmICh0aGlzLnBhcmFtcy5lbmFibGVfZmxhc2ggJiYgdGhpcy5kZXRlY3RGbGFzaCgpKSB7XG4gICAgICAgICAgICAgICAgLy8gZmxhc2ggZmFsbGJhY2tcbiAgICAgICAgICAgICAgICB3aW5kb3cuV2ViY2FtID0gV2ViY2FtOyAvLyBuZWVkZWQgZm9yIGZsYXNoLXRvLWpzIGludGVyZmFjZVxuICAgICAgICAgICAgICAgIHZhciBkaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgICAgICAgICBkaXYuaW5uZXJIVE1MID0gdGhpcy5nZXRTV0ZIVE1MKCk7XG4gICAgICAgICAgICAgICAgZWxlbS5hcHBlbmRDaGlsZChkaXYpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5kaXNwYXRjaCgnZXJyb3InLCBuZXcgV2ViY2FtRXJyb3IodGhpcy5wYXJhbXMubm9JbnRlcmZhY2VGb3VuZFRleHQpKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gc2V0dXAgZmluYWwgY3JvcCBmb3IgbGl2ZSBwcmV2aWV3XG4gICAgICAgICAgICBpZiAodGhpcy5wYXJhbXMuY3JvcF93aWR0aCAmJiB0aGlzLnBhcmFtcy5jcm9wX2hlaWdodCkge1xuICAgICAgICAgICAgICAgIHZhciBzY2FsZWRfY3JvcF93aWR0aCA9IE1hdGguZmxvb3IodGhpcy5wYXJhbXMuY3JvcF93aWR0aCAqIHNjYWxlWCk7XG4gICAgICAgICAgICAgICAgdmFyIHNjYWxlZF9jcm9wX2hlaWdodCA9IE1hdGguZmxvb3IodGhpcy5wYXJhbXMuY3JvcF9oZWlnaHQgKiBzY2FsZVkpO1xuXG4gICAgICAgICAgICAgICAgZWxlbS5zdHlsZS53aWR0aCA9ICcnICsgc2NhbGVkX2Nyb3Bfd2lkdGggKyAncHgnO1xuICAgICAgICAgICAgICAgIGVsZW0uc3R5bGUuaGVpZ2h0ID0gJycgKyBzY2FsZWRfY3JvcF9oZWlnaHQgKyAncHgnO1xuICAgICAgICAgICAgICAgIGVsZW0uc3R5bGUub3ZlcmZsb3cgPSAnaGlkZGVuJztcblxuICAgICAgICAgICAgICAgIGVsZW0uc2Nyb2xsTGVmdCA9IE1hdGguZmxvb3IoKHRoaXMucGFyYW1zLndpZHRoIC8gMikgLSAoc2NhbGVkX2Nyb3Bfd2lkdGggLyAyKSk7XG4gICAgICAgICAgICAgICAgZWxlbS5zY3JvbGxUb3AgPSBNYXRoLmZsb29yKCh0aGlzLnBhcmFtcy5oZWlnaHQgLyAyKSAtIChzY2FsZWRfY3JvcF9oZWlnaHQgLyAyKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBubyBjcm9wLCBzZXQgc2l6ZSB0byBkZXNpcmVkXG4gICAgICAgICAgICAgICAgZWxlbS5zdHlsZS53aWR0aCA9ICcnICsgdGhpcy5wYXJhbXMud2lkdGggKyAncHgnO1xuICAgICAgICAgICAgICAgIGVsZW0uc3R5bGUuaGVpZ2h0ID0gJycgKyB0aGlzLnBhcmFtcy5oZWlnaHQgKyAncHgnO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIHJlc2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAvLyBzaHV0ZG93biBjYW1lcmEsIHJlc2V0IHRvIHBvdGVudGlhbGx5IGF0dGFjaCBhZ2FpblxuICAgICAgICAgICAgaWYgKHRoaXMucHJldmlld19hY3RpdmUpIHRoaXMudW5mcmVlemUoKTtcblxuICAgICAgICAgICAgLy8gYXR0ZW1wdCB0byBmaXggaXNzdWUgIzY0XG4gICAgICAgICAgICB0aGlzLnVuZmxpcCgpO1xuXG4gICAgICAgICAgICBpZiAodGhpcy51c2VyTWVkaWEpIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5zdHJlYW0pIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuc3RyZWFtLmdldFZpZGVvVHJhY2tzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBnZXQgdmlkZW8gdHJhY2sgdG8gY2FsbCBzdG9wIG9uIGl0XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgdHJhY2tzID0gdGhpcy5zdHJlYW0uZ2V0VmlkZW9UcmFja3MoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0cmFja3MgJiYgdHJhY2tzWzBdICYmIHRyYWNrc1swXS5zdG9wKSB0cmFja3NbMF0uc3RvcCgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKHRoaXMuc3RyZWFtLnN0b3ApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGRlcHJlY2F0ZWQsIG1heSBiZSByZW1vdmVkIGluIGZ1dHVyZVxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zdHJlYW0uc3RvcCgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGRlbGV0ZSB0aGlzLnN0cmVhbTtcbiAgICAgICAgICAgICAgICBkZWxldGUgdGhpcy52aWRlbztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCh0aGlzLnVzZXJNZWRpYSAhPT0gdHJ1ZSkgJiYgdGhpcy5sb2FkZWQgJiYgIXRoaXMuaU9TKSB7XG4gICAgICAgICAgICAgICAgLy8gY2FsbCBmb3IgdHVybiBvZmYgY2FtZXJhIGluIGZsYXNoXG4gICAgICAgICAgICAgICAgdmFyIG1vdmllID0gdGhpcy5nZXRNb3ZpZSgpO1xuICAgICAgICAgICAgICAgIGlmIChtb3ZpZSAmJiBtb3ZpZS5fcmVsZWFzZUNhbWVyYSkgbW92aWUuX3JlbGVhc2VDYW1lcmEoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHRoaXMuY29udGFpbmVyKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jb250YWluZXIuaW5uZXJIVE1MID0gJyc7XG4gICAgICAgICAgICAgICAgZGVsZXRlIHRoaXMuY29udGFpbmVyO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLmxvYWRlZCA9IGZhbHNlO1xuICAgICAgICAgICAgdGhpcy5saXZlID0gZmFsc2U7XG4gICAgICAgIH0sXG5cbiAgICAgICAgc2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAvLyBzZXQgb25lIG9yIG1vcmUgcGFyYW1zXG4gICAgICAgICAgICAvLyB2YXJpYWJsZSBhcmd1bWVudCBsaXN0OiAxIHBhcmFtID0gaGFzaCwgMiBwYXJhbXMgPSBrZXksIHZhbHVlXG4gICAgICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PSAxKSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIga2V5IGluIGFyZ3VtZW50c1swXSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnBhcmFtc1trZXldID0gYXJndW1lbnRzWzBdW2tleV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wYXJhbXNbYXJndW1lbnRzWzBdXSA9IGFyZ3VtZW50c1sxXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBvbjogZnVuY3Rpb24gKG5hbWUsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAvLyBzZXQgY2FsbGJhY2sgaG9va1xuICAgICAgICAgICAgbmFtZSA9IG5hbWUucmVwbGFjZSgvXm9uL2ksICcnKS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgaWYgKCF0aGlzLmhvb2tzW25hbWVdKSB0aGlzLmhvb2tzW25hbWVdID0gW107XG4gICAgICAgICAgICB0aGlzLmhvb2tzW25hbWVdLnB1c2goY2FsbGJhY2spO1xuICAgICAgICB9LFxuXG4gICAgICAgIG9mZjogZnVuY3Rpb24gKG5hbWUsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAvLyByZW1vdmUgY2FsbGJhY2sgaG9va1xuICAgICAgICAgICAgbmFtZSA9IG5hbWUucmVwbGFjZSgvXm9uL2ksICcnKS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgaWYgKHRoaXMuaG9va3NbbmFtZV0pIHtcbiAgICAgICAgICAgICAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gcmVtb3ZlIG9uZSBzZWxlY3RlZCBjYWxsYmFjayBmcm9tIGxpc3RcbiAgICAgICAgICAgICAgICAgICAgdmFyIGlkeCA9IHRoaXMuaG9va3NbbmFtZV0uaW5kZXhPZihjYWxsYmFjayk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpZHggPiAtMSkgdGhpcy5ob29rc1tuYW1lXS5zcGxpY2UoaWR4LCAxKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIG5vIGNhbGxiYWNrIHNwZWNpZmllZCwgc28gY2xlYXIgYWxsXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaG9va3NbbmFtZV0gPSBbXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgZGlzcGF0Y2g6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIC8vIGZpcmUgaG9vayBjYWxsYmFjaywgcGFzc2luZyBvcHRpb25hbCB2YWx1ZSB0byBpdFxuICAgICAgICAgICAgdmFyIG5hbWUgPSBhcmd1bWVudHNbMF0ucmVwbGFjZSgvXm9uL2ksICcnKS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuXG4gICAgICAgICAgICBpZiAodGhpcy5ob29rc1tuYW1lXSAmJiB0aGlzLmhvb2tzW25hbWVdLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGlkeCA9IDAsIGxlbiA9IHRoaXMuaG9va3NbbmFtZV0ubGVuZ3RoOyBpZHggPCBsZW47IGlkeCsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBob29rID0gdGhpcy5ob29rc1tuYW1lXVtpZHhdO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgKGhvb2spID09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNhbGxiYWNrIGlzIGZ1bmN0aW9uIHJlZmVyZW5jZSwgY2FsbCBkaXJlY3RseVxuICAgICAgICAgICAgICAgICAgICAgICAgaG9vay5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmICgodHlwZW9mIChob29rKSA9PSAnb2JqZWN0JykgJiYgKGhvb2subGVuZ3RoID09IDIpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBjYWxsYmFjayBpcyBQSFAtc3R5bGUgb2JqZWN0IGluc3RhbmNlIG1ldGhvZFxuICAgICAgICAgICAgICAgICAgICAgICAgaG9va1swXVtob29rWzFdXS5hcHBseShob29rWzBdLCBhcmdzKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmICh3aW5kb3dbaG9va10pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNhbGxiYWNrIGlzIGdsb2JhbCBmdW5jdGlvbiBuYW1lXG4gICAgICAgICAgICAgICAgICAgICAgICB3aW5kb3dbaG9va10uYXBwbHkod2luZG93LCBhcmdzKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gLy8gbG9vcFxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAobmFtZSA9PSAnZXJyb3InKSB7XG4gICAgICAgICAgICAgICAgdmFyIG1lc3NhZ2U7XG4gICAgICAgICAgICAgICAgaWYgKChhcmdzWzBdIGluc3RhbmNlb2YgRmxhc2hFcnJvcikgfHwgKGFyZ3NbMF0gaW5zdGFuY2VvZiBXZWJjYW1FcnJvcikpIHtcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZSA9IGFyZ3NbMF0ubWVzc2FnZTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlID0gXCJDb3VsZCBub3QgYWNjZXNzIHdlYmNhbTogXCIgKyBhcmdzWzBdLm5hbWUgKyBcIjogXCIgK1xuICAgICAgICAgICAgICAgICAgICAgICAgYXJnc1swXS5tZXNzYWdlICsgXCIgXCIgKyBhcmdzWzBdLnRvU3RyaW5nKCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gZGVmYXVsdCBlcnJvciBoYW5kbGVyIGlmIG5vIGN1c3RvbSBvbmUgc3BlY2lmaWVkXG4gICAgICAgICAgICAgICAgYWxlcnQoXCJXZWJjYW0uanMgRXJyb3I6IFwiICsgbWVzc2FnZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBmYWxzZTsgLy8gbm8gaG9vayBkZWZpbmVkXG4gICAgICAgIH0sXG5cbiAgICAgICAgc2V0U1dGTG9jYXRpb246IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgLy8gZm9yIGJhY2t3YXJkIGNvbXBhdGliaWxpdHkuXG4gICAgICAgICAgICB0aGlzLnNldCgnc3dmVVJMJywgdmFsdWUpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGRldGVjdEZsYXNoOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAvLyByZXR1cm4gdHJ1ZSBpZiBicm93c2VyIHN1cHBvcnRzIGZsYXNoLCBmYWxzZSBvdGhlcndpc2VcbiAgICAgICAgICAgIC8vIENvZGUgc25pcHBldCBib3Jyb3dlZCBmcm9tOiBodHRwczovL2dpdGh1Yi5jb20vc3dmb2JqZWN0L3N3Zm9iamVjdFxuICAgICAgICAgICAgdmFyIFNIT0NLV0FWRV9GTEFTSCA9IFwiU2hvY2t3YXZlIEZsYXNoXCIsXG4gICAgICAgICAgICAgICAgU0hPQ0tXQVZFX0ZMQVNIX0FYID0gXCJTaG9ja3dhdmVGbGFzaC5TaG9ja3dhdmVGbGFzaFwiLFxuICAgICAgICAgICAgICAgIEZMQVNIX01JTUVfVFlQRSA9IFwiYXBwbGljYXRpb24veC1zaG9ja3dhdmUtZmxhc2hcIixcbiAgICAgICAgICAgICAgICB3aW4gPSB3aW5kb3csXG4gICAgICAgICAgICAgICAgbmF2ID0gbmF2aWdhdG9yLFxuICAgICAgICAgICAgICAgIGhhc0ZsYXNoID0gZmFsc2U7XG5cbiAgICAgICAgICAgIGlmICh0eXBlb2YgbmF2LnBsdWdpbnMgIT09IFwidW5kZWZpbmVkXCIgJiYgdHlwZW9mIG5hdi5wbHVnaW5zW1NIT0NLV0FWRV9GTEFTSF0gPT09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgICAgICAgICB2YXIgZGVzYyA9IG5hdi5wbHVnaW5zW1NIT0NLV0FWRV9GTEFTSF0uZGVzY3JpcHRpb247XG4gICAgICAgICAgICAgICAgaWYgKGRlc2MgJiYgKHR5cGVvZiBuYXYubWltZVR5cGVzICE9PSBcInVuZGVmaW5lZFwiICYmIG5hdi5taW1lVHlwZXNbRkxBU0hfTUlNRV9UWVBFXSAmJiBuYXYubWltZVR5cGVzW0ZMQVNIX01JTUVfVFlQRV0uZW5hYmxlZFBsdWdpbikpIHtcbiAgICAgICAgICAgICAgICAgICAgaGFzRmxhc2ggPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKHR5cGVvZiB3aW4uQWN0aXZlWE9iamVjdCAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBheCA9IG5ldyBBY3RpdmVYT2JqZWN0KFNIT0NLV0FWRV9GTEFTSF9BWCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChheCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHZlciA9IGF4LkdldFZhcmlhYmxlKFwiJHZlcnNpb25cIik7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodmVyKSBoYXNGbGFzaCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY2F0Y2ggKGUpIHsgOyB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBoYXNGbGFzaDtcbiAgICAgICAgfSxcblxuICAgICAgICBnZXRTV0ZIVE1MOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAvLyBSZXR1cm4gSFRNTCBmb3IgZW1iZWRkaW5nIGZsYXNoIGJhc2VkIHdlYmNhbSBjYXB0dXJlIG1vdmllXHRcdFxuICAgICAgICAgICAgdmFyIGh0bWwgPSAnJyxcbiAgICAgICAgICAgICAgICBzd2ZVUkwgPSB0aGlzLnBhcmFtcy5zd2ZVUkw7XG5cbiAgICAgICAgICAgIC8vIG1ha2Ugc3VyZSB3ZSBhcmVuJ3QgcnVubmluZyBsb2NhbGx5IChmbGFzaCBkb2Vzbid0IHdvcmspXG4gICAgICAgICAgICBpZiAobG9jYXRpb24ucHJvdG9jb2wubWF0Y2goL2ZpbGUvKSkge1xuICAgICAgICAgICAgICAgIHRoaXMuZGlzcGF0Y2goJ2Vycm9yJywgbmV3IEZsYXNoRXJyb3IoXCJGbGFzaCBkb2VzIG5vdCB3b3JrIGZyb20gbG9jYWwgZGlzay4gIFBsZWFzZSBydW4gZnJvbSBhIHdlYiBzZXJ2ZXIuXCIpKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gJzxoMyBzdHlsZT1cImNvbG9yOnJlZFwiPkVSUk9SOiB0aGUgV2ViY2FtLmpzIEZsYXNoIGZhbGxiYWNrIGRvZXMgbm90IHdvcmsgZnJvbSBsb2NhbCBkaXNrLiAgUGxlYXNlIHJ1biBpdCBmcm9tIGEgd2ViIHNlcnZlci48L2gzPic7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIG1ha2Ugc3VyZSB3ZSBoYXZlIGZsYXNoXG4gICAgICAgICAgICBpZiAoIXRoaXMuZGV0ZWN0Rmxhc2goKSkge1xuICAgICAgICAgICAgICAgIHRoaXMuZGlzcGF0Y2goJ2Vycm9yJywgbmV3IEZsYXNoRXJyb3IoXCJBZG9iZSBGbGFzaCBQbGF5ZXIgbm90IGZvdW5kLiAgUGxlYXNlIGluc3RhbGwgZnJvbSBnZXQuYWRvYmUuY29tL2ZsYXNocGxheWVyIGFuZCB0cnkgYWdhaW4uXCIpKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gJzxoMyBzdHlsZT1cImNvbG9yOnJlZFwiPicgKyB0aGlzLnBhcmFtcy5mbGFzaE5vdERldGVjdGVkVGV4dCArICc8L2gzPic7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIHNldCBkZWZhdWx0IHN3ZlVSTCBpZiBub3QgZXhwbGljaXRseSBzZXRcbiAgICAgICAgICAgIGlmICghc3dmVVJMKSB7XG4gICAgICAgICAgICAgICAgLy8gZmluZCBvdXIgc2NyaXB0IHRhZywgYW5kIHVzZSB0aGF0IGJhc2UgVVJMXG4gICAgICAgICAgICAgICAgdmFyIGJhc2VfdXJsID0gJyc7XG4gICAgICAgICAgICAgICAgdmFyIHNjcHRzID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ3NjcmlwdCcpO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGlkeCA9IDAsIGxlbiA9IHNjcHRzLmxlbmd0aDsgaWR4IDwgbGVuOyBpZHgrKykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgc3JjID0gc2NwdHNbaWR4XS5nZXRBdHRyaWJ1dGUoJ3NyYycpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoc3JjICYmIHNyYy5tYXRjaCgvXFwvd2ViY2FtKFxcLm1pbik/XFwuanMvKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYmFzZV91cmwgPSBzcmMucmVwbGFjZSgvXFwvd2ViY2FtKFxcLm1pbik/XFwuanMuKiQvLCAnJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZHggPSBsZW47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGJhc2VfdXJsKSBzd2ZVUkwgPSBiYXNlX3VybCArICcvd2ViY2FtLnN3Zic7XG4gICAgICAgICAgICAgICAgZWxzZSBzd2ZVUkwgPSAnd2ViY2FtLnN3Zic7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGlmIHRoaXMgaXMgdGhlIHVzZXIncyBmaXJzdCB2aXNpdCwgc2V0IGZsYXNodmFyIHNvIGZsYXNoIHByaXZhY3kgc2V0dGluZ3MgcGFuZWwgaXMgc2hvd24gZmlyc3RcbiAgICAgICAgICAgIGlmICh3aW5kb3cubG9jYWxTdG9yYWdlICYmICFsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgndmlzaXRlZCcpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wYXJhbXMubmV3X3VzZXIgPSAxO1xuICAgICAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCd2aXNpdGVkJywgMSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGNvbnN0cnVjdCBmbGFzaHZhcnMgc3RyaW5nXG4gICAgICAgICAgICB2YXIgZmxhc2h2YXJzID0gJyc7XG4gICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gdGhpcy5wYXJhbXMpIHtcbiAgICAgICAgICAgICAgICBpZiAoZmxhc2h2YXJzKSBmbGFzaHZhcnMgKz0gJyYnO1xuICAgICAgICAgICAgICAgIGZsYXNodmFycyArPSBrZXkgKyAnPScgKyBlc2NhcGUodGhpcy5wYXJhbXNba2V5XSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGNvbnN0cnVjdCBvYmplY3QvZW1iZWQgdGFnXG4gICAgICAgICAgICBodG1sICs9ICc8b2JqZWN0IGNsYXNzaWQ9XCJjbHNpZDpkMjdjZGI2ZS1hZTZkLTExY2YtOTZiOC00NDQ1NTM1NDAwMDBcIiB0eXBlPVwiYXBwbGljYXRpb24veC1zaG9ja3dhdmUtZmxhc2hcIiBjb2RlYmFzZT1cIicgKyB0aGlzLnByb3RvY29sICsgJzovL2Rvd25sb2FkLm1hY3JvbWVkaWEuY29tL3B1Yi9zaG9ja3dhdmUvY2Ficy9mbGFzaC9zd2ZsYXNoLmNhYiN2ZXJzaW9uPTksMCwwLDBcIiB3aWR0aD1cIicgKyB0aGlzLnBhcmFtcy53aWR0aCArICdcIiBoZWlnaHQ9XCInICsgdGhpcy5wYXJhbXMuaGVpZ2h0ICsgJ1wiIGlkPVwid2ViY2FtX21vdmllX29ialwiIGFsaWduPVwibWlkZGxlXCI+PHBhcmFtIG5hbWU9XCJ3bW9kZVwiIHZhbHVlPVwib3BhcXVlXCIgLz48cGFyYW0gbmFtZT1cImFsbG93U2NyaXB0QWNjZXNzXCIgdmFsdWU9XCJhbHdheXNcIiAvPjxwYXJhbSBuYW1lPVwiYWxsb3dGdWxsU2NyZWVuXCIgdmFsdWU9XCJmYWxzZVwiIC8+PHBhcmFtIG5hbWU9XCJtb3ZpZVwiIHZhbHVlPVwiJyArIHN3ZlVSTCArICdcIiAvPjxwYXJhbSBuYW1lPVwibG9vcFwiIHZhbHVlPVwiZmFsc2VcIiAvPjxwYXJhbSBuYW1lPVwibWVudVwiIHZhbHVlPVwiZmFsc2VcIiAvPjxwYXJhbSBuYW1lPVwicXVhbGl0eVwiIHZhbHVlPVwiYmVzdFwiIC8+PHBhcmFtIG5hbWU9XCJiZ2NvbG9yXCIgdmFsdWU9XCIjZmZmZmZmXCIgLz48cGFyYW0gbmFtZT1cImZsYXNodmFyc1wiIHZhbHVlPVwiJyArIGZsYXNodmFycyArICdcIi8+PGVtYmVkIGlkPVwid2ViY2FtX21vdmllX2VtYmVkXCIgc3JjPVwiJyArIHN3ZlVSTCArICdcIiB3bW9kZT1cIm9wYXF1ZVwiIGxvb3A9XCJmYWxzZVwiIG1lbnU9XCJmYWxzZVwiIHF1YWxpdHk9XCJiZXN0XCIgYmdjb2xvcj1cIiNmZmZmZmZcIiB3aWR0aD1cIicgKyB0aGlzLnBhcmFtcy53aWR0aCArICdcIiBoZWlnaHQ9XCInICsgdGhpcy5wYXJhbXMuaGVpZ2h0ICsgJ1wiIG5hbWU9XCJ3ZWJjYW1fbW92aWVfZW1iZWRcIiBhbGlnbj1cIm1pZGRsZVwiIGFsbG93U2NyaXB0QWNjZXNzPVwiYWx3YXlzXCIgYWxsb3dGdWxsU2NyZWVuPVwiZmFsc2VcIiB0eXBlPVwiYXBwbGljYXRpb24veC1zaG9ja3dhdmUtZmxhc2hcIiBwbHVnaW5zcGFnZT1cImh0dHA6Ly93d3cubWFjcm9tZWRpYS5jb20vZ28vZ2V0Zmxhc2hwbGF5ZXJcIiBmbGFzaHZhcnM9XCInICsgZmxhc2h2YXJzICsgJ1wiPjwvZW1iZWQ+PC9vYmplY3Q+JztcblxuICAgICAgICAgICAgcmV0dXJuIGh0bWw7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZ2V0TW92aWU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIC8vIGdldCByZWZlcmVuY2UgdG8gbW92aWUgb2JqZWN0L2VtYmVkIGluIERPTVxuICAgICAgICAgICAgaWYgKCF0aGlzLmxvYWRlZCkgcmV0dXJuIHRoaXMuZGlzcGF0Y2goJ2Vycm9yJywgbmV3IEZsYXNoRXJyb3IoXCJGbGFzaCBNb3ZpZSBpcyBub3QgbG9hZGVkIHlldFwiKSk7XG4gICAgICAgICAgICB2YXIgbW92aWUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnd2ViY2FtX21vdmllX29iaicpO1xuICAgICAgICAgICAgaWYgKCFtb3ZpZSB8fCAhbW92aWUuX3NuYXApIG1vdmllID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3dlYmNhbV9tb3ZpZV9lbWJlZCcpO1xuICAgICAgICAgICAgaWYgKCFtb3ZpZSkgdGhpcy5kaXNwYXRjaCgnZXJyb3InLCBuZXcgRmxhc2hFcnJvcihcIkNhbm5vdCBsb2NhdGUgRmxhc2ggbW92aWUgaW4gRE9NXCIpKTtcbiAgICAgICAgICAgIHJldHVybiBtb3ZpZTtcbiAgICAgICAgfSxcblxuICAgICAgICBmcmVlemU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIC8vIHNob3cgcHJldmlldywgZnJlZXplIGNhbWVyYVxuICAgICAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICAgICAgdmFyIHBhcmFtcyA9IHRoaXMucGFyYW1zO1xuXG4gICAgICAgICAgICAvLyBraWxsIHByZXZpZXcgaWYgYWxyZWFkeSBhY3RpdmVcbiAgICAgICAgICAgIGlmICh0aGlzLnByZXZpZXdfYWN0aXZlKSB0aGlzLnVuZnJlZXplKCk7XG5cbiAgICAgICAgICAgIC8vIGRldGVybWluZSBzY2FsZSBmYWN0b3JcbiAgICAgICAgICAgIHZhciBzY2FsZVggPSB0aGlzLnBhcmFtcy53aWR0aCAvIHRoaXMucGFyYW1zLmRlc3Rfd2lkdGg7XG4gICAgICAgICAgICB2YXIgc2NhbGVZID0gdGhpcy5wYXJhbXMuaGVpZ2h0IC8gdGhpcy5wYXJhbXMuZGVzdF9oZWlnaHQ7XG5cbiAgICAgICAgICAgIC8vIG11c3QgdW5mbGlwIGNvbnRhaW5lciBhcyBwcmV2aWV3IGNhbnZhcyB3aWxsIGJlIHByZS1mbGlwcGVkXG4gICAgICAgICAgICB0aGlzLnVuZmxpcCgpO1xuXG4gICAgICAgICAgICAvLyBjYWxjIGZpbmFsIHNpemUgb2YgaW1hZ2VcbiAgICAgICAgICAgIHZhciBmaW5hbF93aWR0aCA9IHBhcmFtcy5jcm9wX3dpZHRoIHx8IHBhcmFtcy5kZXN0X3dpZHRoO1xuICAgICAgICAgICAgdmFyIGZpbmFsX2hlaWdodCA9IHBhcmFtcy5jcm9wX2hlaWdodCB8fCBwYXJhbXMuZGVzdF9oZWlnaHQ7XG5cbiAgICAgICAgICAgIC8vIGNyZWF0ZSBjYW52YXMgZm9yIGhvbGRpbmcgcHJldmlld1xuICAgICAgICAgICAgdmFyIHByZXZpZXdfY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gICAgICAgICAgICBwcmV2aWV3X2NhbnZhcy53aWR0aCA9IGZpbmFsX3dpZHRoO1xuICAgICAgICAgICAgcHJldmlld19jYW52YXMuaGVpZ2h0ID0gZmluYWxfaGVpZ2h0O1xuICAgICAgICAgICAgdmFyIHByZXZpZXdfY29udGV4dCA9IHByZXZpZXdfY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG5cbiAgICAgICAgICAgIC8vIHNhdmUgZm9yIGxhdGVyIHVzZVxuICAgICAgICAgICAgdGhpcy5wcmV2aWV3X2NhbnZhcyA9IHByZXZpZXdfY2FudmFzO1xuICAgICAgICAgICAgdGhpcy5wcmV2aWV3X2NvbnRleHQgPSBwcmV2aWV3X2NvbnRleHQ7XG5cbiAgICAgICAgICAgIC8vIHNjYWxlIGZvciBwcmV2aWV3IHNpemVcbiAgICAgICAgICAgIGlmICgoc2NhbGVYICE9IDEuMCkgfHwgKHNjYWxlWSAhPSAxLjApKSB7XG4gICAgICAgICAgICAgICAgcHJldmlld19jYW52YXMuc3R5bGUud2Via2l0VHJhbnNmb3JtT3JpZ2luID0gJzBweCAwcHgnO1xuICAgICAgICAgICAgICAgIHByZXZpZXdfY2FudmFzLnN0eWxlLm1velRyYW5zZm9ybU9yaWdpbiA9ICcwcHggMHB4JztcbiAgICAgICAgICAgICAgICBwcmV2aWV3X2NhbnZhcy5zdHlsZS5tc1RyYW5zZm9ybU9yaWdpbiA9ICcwcHggMHB4JztcbiAgICAgICAgICAgICAgICBwcmV2aWV3X2NhbnZhcy5zdHlsZS5vVHJhbnNmb3JtT3JpZ2luID0gJzBweCAwcHgnO1xuICAgICAgICAgICAgICAgIHByZXZpZXdfY2FudmFzLnN0eWxlLnRyYW5zZm9ybU9yaWdpbiA9ICcwcHggMHB4JztcbiAgICAgICAgICAgICAgICBwcmV2aWV3X2NhbnZhcy5zdHlsZS53ZWJraXRUcmFuc2Zvcm0gPSAnc2NhbGVYKCcgKyBzY2FsZVggKyAnKSBzY2FsZVkoJyArIHNjYWxlWSArICcpJztcbiAgICAgICAgICAgICAgICBwcmV2aWV3X2NhbnZhcy5zdHlsZS5tb3pUcmFuc2Zvcm0gPSAnc2NhbGVYKCcgKyBzY2FsZVggKyAnKSBzY2FsZVkoJyArIHNjYWxlWSArICcpJztcbiAgICAgICAgICAgICAgICBwcmV2aWV3X2NhbnZhcy5zdHlsZS5tc1RyYW5zZm9ybSA9ICdzY2FsZVgoJyArIHNjYWxlWCArICcpIHNjYWxlWSgnICsgc2NhbGVZICsgJyknO1xuICAgICAgICAgICAgICAgIHByZXZpZXdfY2FudmFzLnN0eWxlLm9UcmFuc2Zvcm0gPSAnc2NhbGVYKCcgKyBzY2FsZVggKyAnKSBzY2FsZVkoJyArIHNjYWxlWSArICcpJztcbiAgICAgICAgICAgICAgICBwcmV2aWV3X2NhbnZhcy5zdHlsZS50cmFuc2Zvcm0gPSAnc2NhbGVYKCcgKyBzY2FsZVggKyAnKSBzY2FsZVkoJyArIHNjYWxlWSArICcpJztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gdGFrZSBzbmFwc2hvdCwgYnV0IGZpcmUgb3VyIG93biBjYWxsYmFja1xuICAgICAgICAgICAgdGhpcy5zbmFwKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAvLyBhZGQgcHJldmlldyBpbWFnZSB0byBkb20sIGFkanVzdCBmb3IgY3JvcFxuICAgICAgICAgICAgICAgIHByZXZpZXdfY2FudmFzLnN0eWxlLnBvc2l0aW9uID0gJ3JlbGF0aXZlJztcbiAgICAgICAgICAgICAgICBwcmV2aWV3X2NhbnZhcy5zdHlsZS5sZWZ0ID0gJycgKyBzZWxmLmNvbnRhaW5lci5zY3JvbGxMZWZ0ICsgJ3B4JztcbiAgICAgICAgICAgICAgICBwcmV2aWV3X2NhbnZhcy5zdHlsZS50b3AgPSAnJyArIHNlbGYuY29udGFpbmVyLnNjcm9sbFRvcCArICdweCc7XG5cbiAgICAgICAgICAgICAgICBzZWxmLmNvbnRhaW5lci5pbnNlcnRCZWZvcmUocHJldmlld19jYW52YXMsIHNlbGYucGVnKTtcbiAgICAgICAgICAgICAgICBzZWxmLmNvbnRhaW5lci5zdHlsZS5vdmVyZmxvdyA9ICdoaWRkZW4nO1xuXG4gICAgICAgICAgICAgICAgLy8gc2V0IGZsYWcgZm9yIHVzZXIgY2FwdHVyZSAodXNlIHByZXZpZXcpXG4gICAgICAgICAgICAgICAgc2VsZi5wcmV2aWV3X2FjdGl2ZSA9IHRydWU7XG5cbiAgICAgICAgICAgIH0sIHByZXZpZXdfY2FudmFzKTtcbiAgICAgICAgfSxcblxuICAgICAgICB1bmZyZWV6ZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgLy8gY2FuY2VsIHByZXZpZXcgYW5kIHJlc3VtZSBsaXZlIHZpZGVvIGZlZWRcbiAgICAgICAgICAgIGlmICh0aGlzLnByZXZpZXdfYWN0aXZlKSB7XG4gICAgICAgICAgICAgICAgLy8gcmVtb3ZlIHByZXZpZXcgY2FudmFzXG4gICAgICAgICAgICAgICAgdGhpcy5jb250YWluZXIucmVtb3ZlQ2hpbGQodGhpcy5wcmV2aWV3X2NhbnZhcyk7XG4gICAgICAgICAgICAgICAgZGVsZXRlIHRoaXMucHJldmlld19jb250ZXh0O1xuICAgICAgICAgICAgICAgIGRlbGV0ZSB0aGlzLnByZXZpZXdfY2FudmFzO1xuXG4gICAgICAgICAgICAgICAgLy8gdW5mbGFnXG4gICAgICAgICAgICAgICAgdGhpcy5wcmV2aWV3X2FjdGl2ZSA9IGZhbHNlO1xuXG4gICAgICAgICAgICAgICAgLy8gcmUtZmxpcCBpZiB3ZSB1bmZsaXBwZWQgYmVmb3JlXG4gICAgICAgICAgICAgICAgdGhpcy5mbGlwKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgZmxpcDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgLy8gZmxpcCBjb250YWluZXIgaG9yaXogKG1pcnJvciBtb2RlKSBpZiBkZXNpcmVkXG4gICAgICAgICAgICBpZiAodGhpcy5wYXJhbXMuZmxpcF9ob3Jpeikge1xuICAgICAgICAgICAgICAgIHZhciBzdHkgPSB0aGlzLmNvbnRhaW5lci5zdHlsZTtcbiAgICAgICAgICAgICAgICBzdHkud2Via2l0VHJhbnNmb3JtID0gJ3NjYWxlWCgtMSknO1xuICAgICAgICAgICAgICAgIHN0eS5tb3pUcmFuc2Zvcm0gPSAnc2NhbGVYKC0xKSc7XG4gICAgICAgICAgICAgICAgc3R5Lm1zVHJhbnNmb3JtID0gJ3NjYWxlWCgtMSknO1xuICAgICAgICAgICAgICAgIHN0eS5vVHJhbnNmb3JtID0gJ3NjYWxlWCgtMSknO1xuICAgICAgICAgICAgICAgIHN0eS50cmFuc2Zvcm0gPSAnc2NhbGVYKC0xKSc7XG4gICAgICAgICAgICAgICAgc3R5LmZpbHRlciA9ICdGbGlwSCc7XG4gICAgICAgICAgICAgICAgc3R5Lm1zRmlsdGVyID0gJ0ZsaXBIJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICB1bmZsaXA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIC8vIHVuZmxpcCBjb250YWluZXIgaG9yaXogKG1pcnJvciBtb2RlKSBpZiBkZXNpcmVkXG4gICAgICAgICAgICBpZiAodGhpcy5wYXJhbXMuZmxpcF9ob3Jpeikge1xuICAgICAgICAgICAgICAgIHZhciBzdHkgPSB0aGlzLmNvbnRhaW5lci5zdHlsZTtcbiAgICAgICAgICAgICAgICBzdHkud2Via2l0VHJhbnNmb3JtID0gJ3NjYWxlWCgxKSc7XG4gICAgICAgICAgICAgICAgc3R5Lm1velRyYW5zZm9ybSA9ICdzY2FsZVgoMSknO1xuICAgICAgICAgICAgICAgIHN0eS5tc1RyYW5zZm9ybSA9ICdzY2FsZVgoMSknO1xuICAgICAgICAgICAgICAgIHN0eS5vVHJhbnNmb3JtID0gJ3NjYWxlWCgxKSc7XG4gICAgICAgICAgICAgICAgc3R5LnRyYW5zZm9ybSA9ICdzY2FsZVgoMSknO1xuICAgICAgICAgICAgICAgIHN0eS5maWx0ZXIgPSAnJztcbiAgICAgICAgICAgICAgICBzdHkubXNGaWx0ZXIgPSAnJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBzYXZlUHJldmlldzogZnVuY3Rpb24gKHVzZXJfY2FsbGJhY2ssIHVzZXJfY2FudmFzKSB7XG4gICAgICAgICAgICAvLyBzYXZlIHByZXZpZXcgZnJlZXplIGFuZCBmaXJlIHVzZXIgY2FsbGJhY2tcbiAgICAgICAgICAgIHZhciBwYXJhbXMgPSB0aGlzLnBhcmFtcztcbiAgICAgICAgICAgIHZhciBjYW52YXMgPSB0aGlzLnByZXZpZXdfY2FudmFzO1xuICAgICAgICAgICAgdmFyIGNvbnRleHQgPSB0aGlzLnByZXZpZXdfY29udGV4dDtcblxuICAgICAgICAgICAgLy8gcmVuZGVyIHRvIHVzZXIgY2FudmFzIGlmIGRlc2lyZWRcbiAgICAgICAgICAgIGlmICh1c2VyX2NhbnZhcykge1xuICAgICAgICAgICAgICAgIHZhciB1c2VyX2NvbnRleHQgPSB1c2VyX2NhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuICAgICAgICAgICAgICAgIHVzZXJfY29udGV4dC5kcmF3SW1hZ2UoY2FudmFzLCAwLCAwKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gZmlyZSB1c2VyIGNhbGxiYWNrIGlmIGRlc2lyZWRcbiAgICAgICAgICAgIHVzZXJfY2FsbGJhY2soXG4gICAgICAgICAgICAgICAgdXNlcl9jYW52YXMgPyBudWxsIDogY2FudmFzLnRvRGF0YVVSTCgnaW1hZ2UvJyArIHBhcmFtcy5pbWFnZV9mb3JtYXQsIHBhcmFtcy5qcGVnX3F1YWxpdHkgLyAxMDApLFxuICAgICAgICAgICAgICAgIGNhbnZhcyxcbiAgICAgICAgICAgICAgICBjb250ZXh0XG4gICAgICAgICAgICApO1xuXG4gICAgICAgICAgICAvLyByZW1vdmUgcHJldmlld1xuICAgICAgICAgICAgaWYgKHRoaXMucGFyYW1zLnVuZnJlZXplX3NuYXApIHRoaXMudW5mcmVlemUoKTtcbiAgICAgICAgfSxcblxuICAgICAgICBzbmFwOiBmdW5jdGlvbiAodXNlcl9jYWxsYmFjaywgdXNlcl9jYW52YXMpIHtcbiAgICAgICAgICAgIC8vIHVzZSBnbG9iYWwgY2FsbGJhY2sgYW5kIGNhbnZhcyBpZiBub3QgZGVmaW5lZCBhcyBwYXJhbWV0ZXJcbiAgICAgICAgICAgIGlmICghdXNlcl9jYWxsYmFjaykgdXNlcl9jYWxsYmFjayA9IHRoaXMucGFyYW1zLnVzZXJfY2FsbGJhY2s7XG4gICAgICAgICAgICBpZiAoIXVzZXJfY2FudmFzKSB1c2VyX2NhbnZhcyA9IHRoaXMucGFyYW1zLnVzZXJfY2FudmFzO1xuXG4gICAgICAgICAgICAvLyB0YWtlIHNuYXBzaG90IGFuZCByZXR1cm4gaW1hZ2UgZGF0YSB1cmlcbiAgICAgICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgICAgIHZhciBwYXJhbXMgPSB0aGlzLnBhcmFtcztcblxuICAgICAgICAgICAgaWYgKCF0aGlzLmxvYWRlZCkgcmV0dXJuIHRoaXMuZGlzcGF0Y2goJ2Vycm9yJywgbmV3IFdlYmNhbUVycm9yKFwiV2ViY2FtIGlzIG5vdCBsb2FkZWQgeWV0XCIpKTtcbiAgICAgICAgICAgIC8vIGlmICghdGhpcy5saXZlKSByZXR1cm4gdGhpcy5kaXNwYXRjaCgnZXJyb3InLCBuZXcgV2ViY2FtRXJyb3IoXCJXZWJjYW0gaXMgbm90IGxpdmUgeWV0XCIpKTtcbiAgICAgICAgICAgIGlmICghdXNlcl9jYWxsYmFjaykgcmV0dXJuIHRoaXMuZGlzcGF0Y2goJ2Vycm9yJywgbmV3IFdlYmNhbUVycm9yKFwiUGxlYXNlIHByb3ZpZGUgYSBjYWxsYmFjayBmdW5jdGlvbiBvciBjYW52YXMgdG8gc25hcCgpXCIpKTtcblxuICAgICAgICAgICAgLy8gaWYgd2UgaGF2ZSBhbiBhY3RpdmUgcHJldmlldyBmcmVlemUsIHVzZSB0aGF0XG4gICAgICAgICAgICBpZiAodGhpcy5wcmV2aWV3X2FjdGl2ZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuc2F2ZVByZXZpZXcodXNlcl9jYWxsYmFjaywgdXNlcl9jYW52YXMpO1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBjcmVhdGUgb2Zmc2NyZWVuIGNhbnZhcyBlbGVtZW50IHRvIGhvbGQgcGl4ZWxzXG4gICAgICAgICAgICB2YXIgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gICAgICAgICAgICBjYW52YXMud2lkdGggPSB0aGlzLnBhcmFtcy5kZXN0X3dpZHRoO1xuICAgICAgICAgICAgY2FudmFzLmhlaWdodCA9IHRoaXMucGFyYW1zLmRlc3RfaGVpZ2h0O1xuICAgICAgICAgICAgdmFyIGNvbnRleHQgPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcblxuICAgICAgICAgICAgLy8gZmxpcCBjYW52YXMgaG9yaXpvbnRhbGx5IGlmIGRlc2lyZWRcbiAgICAgICAgICAgIGlmICh0aGlzLnBhcmFtcy5mbGlwX2hvcml6KSB7XG4gICAgICAgICAgICAgICAgY29udGV4dC50cmFuc2xhdGUocGFyYW1zLmRlc3Rfd2lkdGgsIDApO1xuICAgICAgICAgICAgICAgIGNvbnRleHQuc2NhbGUoLTEsIDEpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBjcmVhdGUgaW5saW5lIGZ1bmN0aW9uLCBjYWxsZWQgYWZ0ZXIgaW1hZ2UgbG9hZCAoZmxhc2gpIG9yIGltbWVkaWF0ZWx5IChuYXRpdmUpXG4gICAgICAgICAgICB2YXIgZnVuYyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAvLyByZW5kZXIgaW1hZ2UgaWYgbmVlZGVkIChmbGFzaClcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5zcmMgJiYgdGhpcy53aWR0aCAmJiB0aGlzLmhlaWdodCkge1xuICAgICAgICAgICAgICAgICAgICBjb250ZXh0LmRyYXdJbWFnZSh0aGlzLCAwLCAwLCBwYXJhbXMuZGVzdF93aWR0aCwgcGFyYW1zLmRlc3RfaGVpZ2h0KTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBjcm9wIGlmIGRlc2lyZWRcbiAgICAgICAgICAgICAgICBpZiAocGFyYW1zLmNyb3Bfd2lkdGggJiYgcGFyYW1zLmNyb3BfaGVpZ2h0KSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjcm9wX2NhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICAgICAgICAgICAgICAgICAgICBjcm9wX2NhbnZhcy53aWR0aCA9IHBhcmFtcy5jcm9wX3dpZHRoO1xuICAgICAgICAgICAgICAgICAgICBjcm9wX2NhbnZhcy5oZWlnaHQgPSBwYXJhbXMuY3JvcF9oZWlnaHQ7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjcm9wX2NvbnRleHQgPSBjcm9wX2NhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuXG4gICAgICAgICAgICAgICAgICAgIGNyb3BfY29udGV4dC5kcmF3SW1hZ2UoY2FudmFzLFxuICAgICAgICAgICAgICAgICAgICAgICAgTWF0aC5mbG9vcigocGFyYW1zLmRlc3Rfd2lkdGggLyAyKSAtIChwYXJhbXMuY3JvcF93aWR0aCAvIDIpKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIE1hdGguZmxvb3IoKHBhcmFtcy5kZXN0X2hlaWdodCAvIDIpIC0gKHBhcmFtcy5jcm9wX2hlaWdodCAvIDIpKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhcmFtcy5jcm9wX3dpZHRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgcGFyYW1zLmNyb3BfaGVpZ2h0LFxuICAgICAgICAgICAgICAgICAgICAgICAgMCxcbiAgICAgICAgICAgICAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXJhbXMuY3JvcF93aWR0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhcmFtcy5jcm9wX2hlaWdodFxuICAgICAgICAgICAgICAgICAgICApO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIHN3YXAgY2FudmFzZXNcbiAgICAgICAgICAgICAgICAgICAgY29udGV4dCA9IGNyb3BfY29udGV4dDtcbiAgICAgICAgICAgICAgICAgICAgY2FudmFzID0gY3JvcF9jYW52YXM7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gcmVuZGVyIHRvIHVzZXIgY2FudmFzIGlmIGRlc2lyZWRcbiAgICAgICAgICAgICAgICBpZiAodXNlcl9jYW52YXMpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHVzZXJfY29udGV4dCA9IHVzZXJfY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG4gICAgICAgICAgICAgICAgICAgIHVzZXJfY29udGV4dC5kcmF3SW1hZ2UoY2FudmFzLCAwLCAwKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBmaXJlIHVzZXIgY2FsbGJhY2sgaWYgZGVzaXJlZFxuICAgICAgICAgICAgICAgIHVzZXJfY2FsbGJhY2soXG4gICAgICAgICAgICAgICAgICAgIHVzZXJfY2FudmFzID8gbnVsbCA6IGNhbnZhcy50b0RhdGFVUkwoJ2ltYWdlLycgKyBwYXJhbXMuaW1hZ2VfZm9ybWF0LCBwYXJhbXMuanBlZ19xdWFsaXR5IC8gMTAwKSxcbiAgICAgICAgICAgICAgICAgICAgY2FudmFzLFxuICAgICAgICAgICAgICAgICAgICBjb250ZXh0XG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIC8vIGdyYWIgaW1hZ2UgZnJhbWUgZnJvbSB1c2VyTWVkaWEgb3IgZmxhc2ggbW92aWVcbiAgICAgICAgICAgIGlmICh0aGlzLnVzZXJNZWRpYSkge1xuICAgICAgICAgICAgICAgIC8vIG5hdGl2ZSBpbXBsZW1lbnRhdGlvblxuICAgICAgICAgICAgICAgIGNvbnRleHQuZHJhd0ltYWdlKHRoaXMudmlkZW8sIDAsIDAsIHRoaXMucGFyYW1zLmRlc3Rfd2lkdGgsIHRoaXMucGFyYW1zLmRlc3RfaGVpZ2h0KTtcblxuICAgICAgICAgICAgICAgIC8vIGZpcmUgY2FsbGJhY2sgcmlnaHQgYXdheVxuICAgICAgICAgICAgICAgIGZ1bmMoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKHRoaXMuaU9TKSB7XG4gICAgICAgICAgICAgICAgdmFyIGRpdiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHRoaXMuY29udGFpbmVyLmlkICsgJy1pb3NfZGl2Jyk7XG4gICAgICAgICAgICAgICAgdmFyIGltZyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHRoaXMuY29udGFpbmVyLmlkICsgJy1pb3NfaW1nJyk7XG4gICAgICAgICAgICAgICAgdmFyIGlucHV0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQodGhpcy5jb250YWluZXIuaWQgKyAnLWlvc19pbnB1dCcpO1xuICAgICAgICAgICAgICAgIC8vIGZ1bmN0aW9uIGZvciBoYW5kbGUgc25hcHNob3QgZXZlbnQgKGNhbGwgdXNlcl9jYWxsYmFjayBhbmQgcmVzZXQgdGhlIGludGVyZmFjZSlcbiAgICAgICAgICAgICAgICBpRnVuYyA9IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgICAgICAgICAgICBmdW5jLmNhbGwoaW1nKTtcbiAgICAgICAgICAgICAgICAgICAgaW1nLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBpRnVuYyk7XG4gICAgICAgICAgICAgICAgICAgIGRpdi5zdHlsZS5iYWNrZ3JvdW5kSW1hZ2UgPSAnbm9uZSc7XG4gICAgICAgICAgICAgICAgICAgIGltZy5yZW1vdmVBdHRyaWJ1dGUoJ3NyYycpO1xuICAgICAgICAgICAgICAgICAgICBpbnB1dC52YWx1ZSA9IG51bGw7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBpZiAoIWlucHV0LnZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIE5vIGltYWdlIHNlbGVjdGVkIHlldCwgYWN0aXZhdGUgaW5wdXQgZmllbGRcbiAgICAgICAgICAgICAgICAgICAgaW1nLmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBpRnVuYyk7XG4gICAgICAgICAgICAgICAgICAgIGlucHV0LnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xuICAgICAgICAgICAgICAgICAgICBpbnB1dC5mb2N1cygpO1xuICAgICAgICAgICAgICAgICAgICBpbnB1dC5jbGljaygpO1xuICAgICAgICAgICAgICAgICAgICBpbnB1dC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIEltYWdlIGFscmVhZHkgc2VsZWN0ZWRcbiAgICAgICAgICAgICAgICAgICAgaUZ1bmMobnVsbCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gZmxhc2ggZmFsbGJhY2tcbiAgICAgICAgICAgICAgICB2YXIgcmF3X2RhdGEgPSB0aGlzLmdldE1vdmllKCkuX3NuYXAoKTtcblxuICAgICAgICAgICAgICAgIC8vIHJlbmRlciB0byBpbWFnZSwgZmlyZSBjYWxsYmFjayB3aGVuIGNvbXBsZXRlXG4gICAgICAgICAgICAgICAgdmFyIGltZyA9IG5ldyBJbWFnZSgpO1xuICAgICAgICAgICAgICAgIGltZy5vbmxvYWQgPSBmdW5jO1xuICAgICAgICAgICAgICAgIGltZy5zcmMgPSAnZGF0YTppbWFnZS8nICsgdGhpcy5wYXJhbXMuaW1hZ2VfZm9ybWF0ICsgJztiYXNlNjQsJyArIHJhd19kYXRhO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfSxcblxuICAgICAgICBjb25maWd1cmU6IGZ1bmN0aW9uIChwYW5lbCkge1xuICAgICAgICAgICAgLy8gb3BlbiBmbGFzaCBjb25maWd1cmF0aW9uIHBhbmVsIC0tIHNwZWNpZnkgdGFiIG5hbWU6XG4gICAgICAgICAgICAvLyBcImNhbWVyYVwiLCBcInByaXZhY3lcIiwgXCJkZWZhdWx0XCIsIFwibG9jYWxTdG9yYWdlXCIsIFwibWljcm9waG9uZVwiLCBcInNldHRpbmdzTWFuYWdlclwiXG4gICAgICAgICAgICBpZiAoIXBhbmVsKSBwYW5lbCA9IFwiY2FtZXJhXCI7XG4gICAgICAgICAgICB0aGlzLmdldE1vdmllKCkuX2NvbmZpZ3VyZShwYW5lbCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZmxhc2hOb3RpZnk6IGZ1bmN0aW9uICh0eXBlLCBtc2cpIHtcbiAgICAgICAgICAgIC8vIHJlY2VpdmUgbm90aWZpY2F0aW9uIGZyb20gZmxhc2ggYWJvdXQgZXZlbnRcbiAgICAgICAgICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgICAgICAgICAgIGNhc2UgJ2ZsYXNoTG9hZENvbXBsZXRlJzpcbiAgICAgICAgICAgICAgICAgICAgLy8gbW92aWUgbG9hZGVkIHN1Y2Nlc3NmdWxseVxuICAgICAgICAgICAgICAgICAgICB0aGlzLmxvYWRlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZGlzcGF0Y2goJ2xvYWQnKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICBjYXNlICdjYW1lcmFMaXZlJzpcbiAgICAgICAgICAgICAgICAgICAgLy8gY2FtZXJhIGlzIGxpdmUgYW5kIHJlYWR5IHRvIHNuYXBcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5saXZlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kaXNwYXRjaCgnbGl2ZScpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgIGNhc2UgJ2Vycm9yJzpcbiAgICAgICAgICAgICAgICAgICAgLy8gRmxhc2ggZXJyb3JcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kaXNwYXRjaCgnZXJyb3InLCBuZXcgRmxhc2hFcnJvcihtc2cpKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICAvLyBjYXRjaC1hbGwgZXZlbnQsIGp1c3QgaW4gY2FzZVxuICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhcIndlYmNhbSBmbGFzaF9ub3RpZnk6IFwiICsgdHlwZSArIFwiOiBcIiArIG1zZyk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIGI2NFRvVWludDY6IGZ1bmN0aW9uIChuQ2hyKSB7XG4gICAgICAgICAgICAvLyBjb252ZXJ0IGJhc2U2NCBlbmNvZGVkIGNoYXJhY3RlciB0byA2LWJpdCBpbnRlZ2VyXG4gICAgICAgICAgICAvLyBmcm9tOiBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9KYXZhU2NyaXB0L0Jhc2U2NF9lbmNvZGluZ19hbmRfZGVjb2RpbmdcbiAgICAgICAgICAgIHJldHVybiBuQ2hyID4gNjQgJiYgbkNociA8IDkxID8gbkNociAtIDY1XG4gICAgICAgICAgICAgICAgOiBuQ2hyID4gOTYgJiYgbkNociA8IDEyMyA/IG5DaHIgLSA3MVxuICAgICAgICAgICAgICAgICAgICA6IG5DaHIgPiA0NyAmJiBuQ2hyIDwgNTggPyBuQ2hyICsgNFxuICAgICAgICAgICAgICAgICAgICAgICAgOiBuQ2hyID09PSA0MyA/IDYyIDogbkNociA9PT0gNDcgPyA2MyA6IDA7XG4gICAgICAgIH0sXG5cbiAgICAgICAgYmFzZTY0RGVjVG9BcnI6IGZ1bmN0aW9uIChzQmFzZTY0LCBuQmxvY2tzU2l6ZSkge1xuICAgICAgICAgICAgLy8gY29udmVydCBiYXNlNjQgZW5jb2RlZCBzdHJpbmcgdG8gVWludGFycmF5XG4gICAgICAgICAgICAvLyBmcm9tOiBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9KYXZhU2NyaXB0L0Jhc2U2NF9lbmNvZGluZ19hbmRfZGVjb2RpbmdcbiAgICAgICAgICAgIHZhciBzQjY0RW5jID0gc0Jhc2U2NC5yZXBsYWNlKC9bXkEtWmEtejAtOVxcK1xcL10vZywgXCJcIiksIG5JbkxlbiA9IHNCNjRFbmMubGVuZ3RoLFxuICAgICAgICAgICAgICAgIG5PdXRMZW4gPSBuQmxvY2tzU2l6ZSA/IE1hdGguY2VpbCgobkluTGVuICogMyArIDEgPj4gMikgLyBuQmxvY2tzU2l6ZSkgKiBuQmxvY2tzU2l6ZSA6IG5JbkxlbiAqIDMgKyAxID4+IDIsXG4gICAgICAgICAgICAgICAgdGFCeXRlcyA9IG5ldyBVaW50OEFycmF5KG5PdXRMZW4pO1xuXG4gICAgICAgICAgICBmb3IgKHZhciBuTW9kMywgbk1vZDQsIG5VaW50MjQgPSAwLCBuT3V0SWR4ID0gMCwgbkluSWR4ID0gMDsgbkluSWR4IDwgbkluTGVuOyBuSW5JZHgrKykge1xuICAgICAgICAgICAgICAgIG5Nb2Q0ID0gbkluSWR4ICYgMztcbiAgICAgICAgICAgICAgICBuVWludDI0IHw9IHRoaXMuYjY0VG9VaW50NihzQjY0RW5jLmNoYXJDb2RlQXQobkluSWR4KSkgPDwgMTggLSA2ICogbk1vZDQ7XG4gICAgICAgICAgICAgICAgaWYgKG5Nb2Q0ID09PSAzIHx8IG5JbkxlbiAtIG5JbklkeCA9PT0gMSkge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKG5Nb2QzID0gMDsgbk1vZDMgPCAzICYmIG5PdXRJZHggPCBuT3V0TGVuOyBuTW9kMysrLCBuT3V0SWR4KyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRhQnl0ZXNbbk91dElkeF0gPSBuVWludDI0ID4+PiAoMTYgPj4+IG5Nb2QzICYgMjQpICYgMjU1O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIG5VaW50MjQgPSAwO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0YUJ5dGVzO1xuICAgICAgICB9LFxuXG4gICAgICAgIHVwbG9hZDogZnVuY3Rpb24gKGltYWdlX2RhdGFfdXJpLCB0YXJnZXRfdXJsLCBjYWxsYmFjaykge1xuICAgICAgICAgICAgLy8gc3VibWl0IGltYWdlIGRhdGEgdG8gc2VydmVyIHVzaW5nIGJpbmFyeSBBSkFYXG4gICAgICAgICAgICB2YXIgZm9ybV9lbGVtX25hbWUgPSB0aGlzLnBhcmFtcy51cGxvYWRfbmFtZSB8fCAnd2ViY2FtJztcblxuICAgICAgICAgICAgLy8gZGV0ZWN0IGltYWdlIGZvcm1hdCBmcm9tIHdpdGhpbiBpbWFnZV9kYXRhX3VyaVxuICAgICAgICAgICAgdmFyIGltYWdlX2ZtdCA9ICcnO1xuICAgICAgICAgICAgaWYgKGltYWdlX2RhdGFfdXJpLm1hdGNoKC9eZGF0YVxcOmltYWdlXFwvKFxcdyspLykpXG4gICAgICAgICAgICAgICAgaW1hZ2VfZm10ID0gUmVnRXhwLiQxO1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHRocm93IFwiQ2Fubm90IGxvY2F0ZSBpbWFnZSBmb3JtYXQgaW4gRGF0YSBVUklcIjtcblxuICAgICAgICAgICAgLy8gZXh0cmFjdCByYXcgYmFzZTY0IGRhdGEgZnJvbSBEYXRhIFVSSVxuICAgICAgICAgICAgdmFyIHJhd19pbWFnZV9kYXRhID0gaW1hZ2VfZGF0YV91cmkucmVwbGFjZSgvXmRhdGFcXDppbWFnZVxcL1xcdytcXDtiYXNlNjRcXCwvLCAnJyk7XG5cbiAgICAgICAgICAgIC8vIGNvbnRydWN0IHVzZSBBSkFYIG9iamVjdFxuICAgICAgICAgICAgdmFyIGh0dHAgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcbiAgICAgICAgICAgIGh0dHAub3BlbihcIlBPU1RcIiwgdGFyZ2V0X3VybCwgdHJ1ZSk7XG5cbiAgICAgICAgICAgIC8vIHNldHVwIHByb2dyZXNzIGV2ZW50c1xuICAgICAgICAgICAgaWYgKGh0dHAudXBsb2FkICYmIGh0dHAudXBsb2FkLmFkZEV2ZW50TGlzdGVuZXIpIHtcbiAgICAgICAgICAgICAgICBodHRwLnVwbG9hZC5hZGRFdmVudExpc3RlbmVyKCdwcm9ncmVzcycsIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlLmxlbmd0aENvbXB1dGFibGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBwcm9ncmVzcyA9IGUubG9hZGVkIC8gZS50b3RhbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIFdlYmNhbS5kaXNwYXRjaCgndXBsb2FkUHJvZ3Jlc3MnLCBwcm9ncmVzcywgZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LCBmYWxzZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGNvbXBsZXRpb24gaGFuZGxlclxuICAgICAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICAgICAgaHR0cC5vbmxvYWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaWYgKGNhbGxiYWNrKSBjYWxsYmFjay5hcHBseShzZWxmLCBbaHR0cC5zdGF0dXMsIGh0dHAucmVzcG9uc2VUZXh0LCBodHRwLnN0YXR1c1RleHRdKTtcbiAgICAgICAgICAgICAgICBXZWJjYW0uZGlzcGF0Y2goJ3VwbG9hZENvbXBsZXRlJywgaHR0cC5zdGF0dXMsIGh0dHAucmVzcG9uc2VUZXh0LCBodHRwLnN0YXR1c1RleHQpO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgLy8gY3JlYXRlIGEgYmxvYiBhbmQgZGVjb2RlIG91ciBiYXNlNjQgdG8gYmluYXJ5XG4gICAgICAgICAgICB2YXIgYmxvYiA9IG5ldyBCbG9iKFt0aGlzLmJhc2U2NERlY1RvQXJyKHJhd19pbWFnZV9kYXRhKV0sIHsgdHlwZTogJ2ltYWdlLycgKyBpbWFnZV9mbXQgfSk7XG5cbiAgICAgICAgICAgIC8vIHN0dWZmIGludG8gYSBmb3JtLCBzbyBzZXJ2ZXJzIGNhbiBlYXNpbHkgcmVjZWl2ZSBpdCBhcyBhIHN0YW5kYXJkIGZpbGUgdXBsb2FkXG4gICAgICAgICAgICB2YXIgZm9ybSA9IG5ldyBGb3JtRGF0YSgpO1xuICAgICAgICAgICAgZm9ybS5hcHBlbmQoZm9ybV9lbGVtX25hbWUsIGJsb2IsIGZvcm1fZWxlbV9uYW1lICsgXCIuXCIgKyBpbWFnZV9mbXQucmVwbGFjZSgvZS8sICcnKSk7XG5cbiAgICAgICAgICAgIC8vIHNlbmQgZGF0YSB0byBzZXJ2ZXJcbiAgICAgICAgICAgIGh0dHAuc2VuZChmb3JtKTtcbiAgICAgICAgfVxuXG4gICAgfTtcblxuICAgIFdlYmNhbS5pbml0KCk7XG5cbiAgICBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG4gICAgICAgIGRlZmluZShmdW5jdGlvbiAoKSB7IHJldHVybiBXZWJjYW07IH0pO1xuICAgIH1cbiAgICBlbHNlIGlmICh0eXBlb2YgbW9kdWxlID09PSAnb2JqZWN0JyAmJiBtb2R1bGUuZXhwb3J0cykge1xuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IFdlYmNhbTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHdpbmRvdy5XZWJjYW0gPSBXZWJjYW07XG4gICAgfVxuXG59KHdpbmRvdykpOyJdfQ==