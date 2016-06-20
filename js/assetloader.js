/*
 * Asset Loader
 */
export default {
  init: function(config) {
    this.basePath = config.basePath || '';
    this.images = {};
    this.sounds = {};
    config.images.forEach(imageSrc => this.loadImage(imageSrc));
    config.sounds.forEach(audioSrc => this.loadAudio(audioSrc));

    // why sound code here?
    this.audioContext = this.audioContext || new AudioContext();
  },
  audioSupport: (function() {
    var audio = new Audio();
    return {
      ogg: audio.canPlayType('audio/ogg; codecs="vorbis"'),
      wav: audio.canPlayType('audio/wav; codecs="1"'),
      mp3: audio.canPlayType('audio/mpeg;')
    };
  }()),
  loadImage: function(src, callback) {
    var image = new Image();
    image.onload = callback;
    image.src = this.basePath + src;
    this.images[src] = image;
  },
  loadAudio: function(src, callback) {
    if (location.protocol.indexOf('http') < 0) { return; }

    fetch(this.basePath + src).then(response => {
      response.arrayBuffer().then(arrayBuffer => {
        this.audioContext.decodeAudioData(arrayBuffer, buffer => {
          this.sounds[src] = buffer;
          if (typeof callback === 'function') callback(buffer);
        });
      });
    });
  },
  playSound: function(key) {
    if (this.sounds[key]) {
      let source = this.audioContext.createBufferSource();
        source.buffer = this.sounds[key];
        source.connect(this.audioContext.destination);
        source.start(0);
    }
  },
  loadFile: function(src, callback) {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4 && xhr.status === 200) {
        callback(xhr.responseText);
      }
    };
    xhr.open('GET', src, true);
    xhr.send();
  },
  loadJSON: function(src, callback) {
    this.loadFile(src, function(fileContents) {
      callback(JSON.parse(fileContents));
    });
  }
};
