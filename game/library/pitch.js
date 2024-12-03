function init() {
    let source;
    let audioContext;
    let analyser;
    let running = false;
    let intervalId;

    function startDetection() {
        if (running) return; // Hindari memulai ulang

        // Inisialisasi AudioContext dan Analyzer jika belum diinisialisasi
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            analyser = audioContext.createAnalyser();
            analyser.minDecibels = -100;
            analyser.maxDecibels = 100;
            analyser.smoothingTimeConstant = 0.85;
        }

        var constraints = { audio: true };
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia(constraints)
            .then(function (stream) {
                source = audioContext.createMediaStreamSource(stream);
                source.connect(analyser);
                running = true;
                detectPitch(); // Mulai mendeteksi pitch
            })
            .catch(function (err) {
                console.warn('Mic Denied', err);
                // Lakukan fallback jika perlu, seperti memberikan notifikasi ke pengguna
            });
        } else {
            console.log('getUserMedia() is not supported in this browser.');
        }
    }

    function stopDetection() {
        if (!running) return; // Hindari menghentikan jika tidak berjalan

        // Putuskan sumber dan hentikan loop deteksi pitch
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
        var smoothingCount = 0;
        var smoothingThreshold = 5;
        var smoothingCountThreshold = 5;
        var previousValueToDisplay = 0;
        var alpha = 0.2; // Smoothing factor (0 < alpha <= 1, lebih kecil lebih halus)

        function smoothPitch(newValue) {
            previousValueToDisplay = alpha * newValue + (1 - alpha) * previousValueToDisplay;
            return Math.round(previousValueToDisplay);
        }

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
            micPitch = smoothPitch(midiNumber)

            // Deteksi Desibel
            const frequencyData = new Float32Array(analyser.frequencyBinCount);
            analyser.getFloatFrequencyData(frequencyData);

            let sum = 0;
            let count = 0;

            for (let i = 0; i < frequencyData.length; i++) {
                if (frequencyData[i] > analyser.minDecibels) {
                    sum += frequencyData[i];
                    count++;
                }
            }

            micDb = count > 0 ? sum / count : analyser.minDecibels;
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

        intervalId = setInterval(detectFrequency, 15);
    }

    // Expose start and stop functions for external use
    window.startDetection = startDetection;
    window.stopDetection = stopDetection;
}

// Initialize the app but do not start detection automatically
init();
