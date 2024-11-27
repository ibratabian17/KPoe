function init() {
  let source;
  let audioContext;
  let analyser;
  let running = false;
  let intervalId;

  function startDetection() {
      if (running) return; // Avoid starting multiple times

      // Initialize AudioContext and Analyzer if they haven't been initialized
      if (!audioContext) {
          audioContext = new (window.AudioContext || window.webkitAudioContext)();
          analyser = audioContext.createAnalyser();
          analyser.minDecibels = -100;
          analyser.maxDecibels = 1;
          analyser.smoothingTimeConstant = 0.85;
      }

      var constraints = { audio: true };
      navigator.mediaDevices.getUserMedia(constraints)
          .then(function (stream) {
              source = audioContext.createMediaStreamSource(stream);
              source.connect(analyser);
              running = true;
              detectPitch();  // Start detecting pitch
          })
          .catch(function (err) {
          });
  }

  function stopDetection() {
      if (!running) return; // Avoid stopping if not running

      // Disconnect source and stop the pitch detection loop
      if (source) {
          source.disconnect(analyser);
      }
      if (intervalId) {
          clearInterval(intervalId);
          intervalId = null;
      }
      running = false;
  }

  function detectPitch() {
      var previousValueToDisplay = 0;
      var smoothingCount = 0;
      var smoothingThreshold = 5;
      var smoothingCountThreshold = 5;

      // MIDI note mapping
      var noteStrings = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

      function noteFromPitch(frequency) {
          var noteNum = 12 * (Math.log(frequency / 440) / Math.log(2));
          return Math.round(noteNum) + 69;
      }

      function detectFrequency() {
          var bufferLength = analyser.fftSize;
          var buffer = new Float32Array(bufferLength);
          analyser.getFloatTimeDomainData(buffer);

          var autoCorrelateValue = autoCorrelate(buffer, audioContext.sampleRate);

          if (autoCorrelateValue === -1) {
              micPitch = -9999999999;
              return;
          }

          var midiNumber = noteFromPitch(autoCorrelateValue);
          micPitch = midiNumber;

          if (Math.abs(midiNumber - previousValueToDisplay) < smoothingThreshold) {
              if (smoothingCount < smoothingCountThreshold) {
                  smoothingCount++;
                  return;
              } else {
                  previousValueToDisplay = midiNumber;
                  smoothingCount = 0;
              }
          } else {
              previousValueToDisplay = midiNumber;
              smoothingCount = 0;
              return;
          }
      }

      function autoCorrelate(buffer, sampleRate) {
          var SIZE = buffer.length;
          var sumOfSquares = 0;
          for (var i = 0; i < SIZE; i++) {
              var val = buffer[i];
              sumOfSquares += val * val;
          }
          var rootMeanSquare = Math.sqrt(sumOfSquares / SIZE);
          if (rootMeanSquare < 0.000002) {
              return -1;
          }

          var r1 = 0;
          var r2 = SIZE - 1;
          var threshold = 0.2;

          for (var i = 0; i < SIZE / 2; i++) {
              if (Math.abs(buffer[i]) < threshold) {
                  r1 = i;
                  break;
              }
          }

          for (var i = 1; i < SIZE / 2; i++) {
              if (Math.abs(buffer[SIZE - i]) < threshold) {
                  r2 = SIZE - i;
                  break;
              }
          }

          buffer = buffer.slice(r1, r2);
          SIZE = buffer.length;

          var c = new Array(SIZE).fill(0);
          for (let i = 0; i < SIZE; i++) {
              for (let j = 0; j < SIZE - i; j++) {
                  c[i] = c[i] + buffer[j] * buffer[j + i];
              }
          }

          var d = 0;
          while (c[d] > c[d + 1]) {
              d++;
          }

          var maxValue = -1;
          var maxIndex = -1;
          for (var i = d; i < SIZE; i++) {
              if (c[i] > maxValue) {
                  maxValue = c[i];
                  maxIndex = i;
              }
          }

          var T0 = maxIndex;

          var x1 = c[T0 - 1];
          var x2 = c[T0];
          var x3 = c[T0 + 1];

          var a = (x1 + x3 - 2 * x2) / 2;
          var b = (x3 - x1) / 2;
          if (a) {
              T0 = T0 - b / (2 * a);
          }

          return sampleRate / T0;
      }

      intervalId = setInterval(detectFrequency, 10);
  }

  // Expose start and stop functions for external use
  window.startDetection = startDetection;
  window.stopDetection = stopDetection;
}

// Initialize the app but do not start detection automatically
init();
