
var isWalking = false
var selectedPause = 1
var songDebugger;
var instrument;
var isVocalEnabled = false;
// Video element references
var youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
var isYouTubeVideo =
    (gamevar.selectedBase.video.isYouTube &&
        (gamevar.selectedBase.video.youtubeId || gamevar.selectedBase.video.videoId)) ||
    youtubeRegex.test(gamevar.selectedBase.video.path);
var player; // player
micDb = -9999999999;
micPitch = 0


getYoutubeId = (url) => {
    let VID_REGEX =
        /(?:youtube(?:-nocookie)?\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    return url.match(VID_REGEX)[1]
}

updateLoadingState = () => {
    document.querySelector(".overlay-hi .shortcut").innerHTML = '';
    document.querySelector(".song-metadata .title").innerText = getLocalizedLang('loading_songdata');
    document.querySelector(".song-metadata .artist").innerText = getLocalizedLang('please_wait');
    document.querySelector(".song-metadata .time").innerText = '';
    document.querySelector(".song-metadata .cover .image").style.backgroundImage = `url(${gamevar.selectedBase.assets.cover})`;
    document.querySelector('.video').classList.add('showbanner');
};

// Update the UI with the loaded song data
updateSongMetadata = (title, artist) => {
    document.title = `KaraokePoe - Playing: ${title} by ${artist}`;
    document.querySelector(".song-metadata .title").innerText = title;
    document.querySelector(".song-metadata .artist").innerText = artist;
};

// Parse the JSON data, with a fallback to manually clean up the string if parsing fails
parseJsonData = (jsonString) => {
    try {
        return JSON.parse(jsonString);
    } catch (err) {
        const cleanedData = jsonString.slice(1, -2); // Remove the first and last character
        console.log(cleanedData);
        return JSON.parse(cleanedData);
    }
};

// Fetch the song data and handle it
fetchSongData = () => {
    fetch(gamevar.selectedBase.json)
        .then(response => response.text())
        .then(jsonString => {
            const data = parseJsonData(jsonString);
            updateSongMetadata(gamevar.selectedBase.title, gamevar.selectedBase.artist);
            playSong("a", data);
        })
        .catch(error => {
            alert('Failed to load map data, reason: ' + error);
            if (!gamevar.isHomescreen) { globalfunc.startTransition(true, 'scene/songselection/page.html', 'scene/songselection/page.js'); }
            else { globalfunc.startTransition(true, 'scene/homescreen/page.html', 'scene/homescreen/page.js') }
        });
};

// Check if a string contains any RTL (Right-to-Left) characters
isRTL = (str) => {
    const rtlChars = /[\u0600-\u06FF\u0750-\u077F\u0590-\u05FF\uFB50-\uFDFF\uFE70-\uFEFF\u2000-\u206F]/;
    return rtlChars.test(str);
};

// Generate line lyrics for display
generateLineLyrics = (data) => {
    const mergedTexts = [];
    let currentText = "";
    let currentTime = 0;
    let currentDuration = 0;
    let even = false;

    // Helper function to create a span element with specific attributes
    const createSpan = (text, duration, prevDuration, offset, element) => {
        let elementAttributes = "";
        if (element) {
            for (const [key, value] of Object.entries(element)) {
                elementAttributes += ` data-${key}="${value}"`;
            }
        }
        return `<span class="fill" offset="${offset}" style="--slideDuration:${duration}ms;--prevSlideDuration:${prevDuration}ms"${elementAttributes}>${text}<span class="filler" style="--slideDuration:${duration}ms;--prevSlideDuration:${prevDuration}ms">${text}</span></span>`;
    };

    // Helper function to add a text object to the current text line
    const addTextObject = (textObj, prevTextObj, i) => {
        if (currentTime === 0) currentTime = textObj.time;
        currentDuration += textObj.duration;

        const span = createSpan(textObj.text, textObj.duration, prevTextObj.duration, i, textObj.element);
        currentText = isRTL(textObj.text) ? span + currentText : currentText + span;

        if (textObj.isLineEnding === 1) {
            mergedTexts.push({ text: currentText, time: currentTime, duration: currentDuration, offset: i, even });
            currentText = "";
            currentTime = 0;
            currentDuration = 0;
            even = !even;
        }
    };

    data.forEach((textObj, i) => {
        const prevTextObj = data[i - 1] || { duration: 0 };
        addTextObject(textObj, prevTextObj, i);
    });

    console.log(mergedTexts);
    return mergedTexts;
};

playSong = (cdn, data) => {
    var slider = document.querySelector("#vocalsSlider");
    var vocals = document.querySelector(".vocals");
    var nativeVideo = document.querySelector(".video");
    var hud = document.querySelector(".hud");
    var debugVocal = document.querySelector('.VocalOffsetV')
    let offset = {
        beat: 0,
        lyrics: 0,
        lyricsLine: 0,
        vocalKeys: 0
    };
    const songVar = {
        Beat: data.beats,
        Odieven: false,
        Lyrics: data.lyrics,
        LyricsLine: generateLineLyrics(data.lyrics),
        currentTime: 0,
        isDone: false,
        gameOffset: data.gameOffset || 0,
        startVideo: data.startVideo || 0,
        lyricsStyle: gamevar.overrideLyricsStyle || data.lyricsStyle || "normal",
        style: data.css || "",
        isVocal: false,
        isRunning: false,
        vocalKeys: data.vocalKeys || [],
        score: 0,
        lastDiff: 0,
    };
    songDebugger = this;
    if (songVar.vocalKeys.length != 0) {
        startDetection()
        songVar.vocalKeys.push({
            time: 2 ^ 53,
            duration: 0,
            key: 0,
            pitch: 0
        })
    }
    console.log(songVar.vocalKeys)

    class VideoPlayer {
        constructor(videoElement, isYouTubeVideo) {
            this.videoElement = videoElement;
            this.isYouTubeVideo = isYouTubeVideo;
            this.ytPlayer = null;
            this.isYtPlayerReady = false
            this.songVar = { isRunning: false, isVocal: false };

            if (this.isYouTubeVideo) {
                this.loadYouTubeAPI();
            } else {
                this.setupNativeVideo();
            }
        }

        loadYouTubeAPI() {
            window.YTConfig = { host: 'https://www.youtube.com/iframe_api' }
            this.ytPlayer = new YT.Player('youtubeVideo', {
                host: "https://www.youtube-nocookie.com" || "https://www.youtube.com",
                videoId: gamevar.selectedBase.video.youtubeId || gamevar.selectedBase.video.videoId || getYoutubeId(gamevar.selectedBase.video.path),
                events: {
                    'onReady': this.onPlayerReady.bind(this),
                    'onStateChange': this.onPlayerStateChange.bind(this),
                },
                playerVars: { 'autoplay': 1, 'controls': 0, "rel": 0, "disablekb": 1, "fs": 0, "hd": 1, "start": Math.round(songVar.startVideo), 'mute': songVar.startVideo && songVar.startVideo !== 0 ? 0 : 0 },
            });
            document.querySelector('#youtubeVideo').classList.add('hidden');
            window.YTConfig = { host: 'https://www.youtube.com/iframe_api' }

        }


        onPlayerStateChange(event) {
            if (event.data == YT.PlayerState.PLAYING) {
                if (songVar.currentTime < songVar.startVideo) {
                    player.seekTo(songVar.startVideo / 1000, true)
                }
                this.isYtPlayerReady = true
                document.querySelector('.video').classList.remove('showbanner');
                document.querySelector('#youtubeVideo').classList.remove('hidden');
                document.querySelector('.video-loading').style.display = "none";
                document.querySelector('.song-metadata').classList.remove('show');
                document.querySelector('.metadata-layout').classList.add('playing');
                if (player.isMuted()) player.unMute()
            }
            if (event.data == YT.PlayerState.BUFFERING) {
                document.querySelector('.video-loading').style.display = "block";
            }
            if (event.data == YT.PlayerState.ENDED) {
                clearInterval(jsonplayer);
                this.unload()
                if (!gamevar.isHomescreen) { globalfunc.startTransition(true, 'scene/songselection/page.html', 'scene/songselection/page.js'); }
                else { globalfunc.startTransition(true, 'scene/homescreen/page.html', 'scene/homescreen/page.js') }
                document.querySelector('.metadata-layout').classList.remove('playing');
                slider.classList.remove('enabled')
            }
        }

        setupNativeVideo() {
            //Initial Videoplayer --
            this.videoElement.volume = 1
            const video = this.videoElement
            if (gamevar.selectedBase.video.isHls || gamevar.selectedBase.video.path.includes('.m3u8')) {
                if (Hls.isSupported()) {
                    const hls = new Hls();
                    hls.attachMedia(this.videoElement);
                    hls.on(Hls.Events.MEDIA_ATTACHED, () => {
                        hls.loadSource(gamevar.selectedBase.video.path);
                    });
                } else if (this.videoElement.canPlayType('application/vnd.apple.mpegurl')) {
                    this.videoElement.src = gamevar.selectedBase.video.path;
                }
            } else {
                this.videoElement.src = gamevar.selectedBase.video.path;
            }
            if (gamevar.selectedBase.video.vocals) {
                songVar.isVocal = true;
                vocals.src = gamevar.selectedBase.video.vocals;
                slider.classList.add('enabled')
            }
            slider.oninput = function () {
                vocals.volume = this.value / 100;
            }
            this.videoElement.currentTime = songVar.startVideo / 1000;

            // Flag to track readiness of video and vocals
            let videoReady = false;
            let vocalsReady = false;

            this.videoElement.addEventListener('waiting', () => {
                document.querySelector('.video-loading').style.display = "block";
            });
            this.videoElement.addEventListener('playing', () => {
                document.querySelector('.video-loading').style.display = "none";
                if (this.videoElement.videoWidth == 0) {
                    document.querySelector('.song-metadata').classList.add('show');
                    document.querySelector('.metadata-layout').classList.add('playing');
                } else {
                    document.querySelector('.song-metadata').classList.remove('show');
                    document.querySelector('.metadata-layout').classList.add('playing');
                }
            });
            this.videoElement.addEventListener("timeupdate", (event) => {
                document.querySelector(".song-metadata .time").innerHTML = getVideoTime(this.videoElement.currentTime - (songVar.startVideo / 1000), this.videoElement.duration - (songVar.startVideo / 1000));
            });
            this.videoElement.addEventListener("loadedmetadata", (event) => {
                document.querySelector(".song-metadata .time").innerHTML = getVideoTime(this.videoElement.currentTime - (songVar.startVideo / 1000), this.videoElement.duration - (songVar.startVideo / 1000));
                if (this.videoElement.videoWidth == 0) {
                    document.querySelector('.video').classList.add('showbanner');
                } else {
                    document.querySelector('.video').classList.remove('showbanner');
                }
            });



            // Check if both video and vocals are ready, then start playing
            function checkReadyAndPlay() {
                console.log(`videoReady: ${videoReady}\nisVocal: ${songVar.isVocal}\nvocalsReady: ${vocalsReady}`)
                if (videoReady && (!songVar.isVocal || vocalsReady)) {
                    setTimeout(function () {
                        songVar.isRunning = true
                        video.play();
                        if (songVar.isVocal) vocals.play();
                    }, 550)

                }
            }

            this.videoElement.oncanplaythrough = (event) => {
                videoReady = true;
                if (!songVar.isRunning) checkReadyAndPlay();
            };

            vocals.oncanplaythrough = (event) => {
                vocalsReady = true;
                if (!songVar.isRunning) checkReadyAndPlay();
            };

            this.videoElement.onplaying = (event) => {
                if (songVar.isVocal) {
                    vocals.currentTime = this.videoElement.currentTime;
                    vocals.play();
                }
            };
            this.videoElement.onpause = (event) => {
                if (songVar.isVocal) {
                    vocals.pause();
                    vocals.currentTime = this.videoElement.currentTime;
                }
            };
            this.videoElement.onerror = function (evt) {
                if (this.videoElement.src !== "" || this.videoElement.src == undefined || this.videoElement.src == null) {
                    alert('Can\'t Play this maps, reason: ' + evt.toString());
                    if (!gamevar.isHomescreen) { globalfunc.startTransition(true, 'scene/songselection/page.html', 'scene/songselection/page.js'); }
                    else { globalfunc.startTransition(true, 'scene/homescreen/page.html', 'scene/homescreen/page.js') }
                    clearInterval(jsonplayer);
                }
            };
            this.videoElement.load();
            if (songVar.isVocal) vocals.load();
        }

        onPlayerReady(event) {
            this.ytPlayer.setVolume(100); // You can make this dynamic based on controls
            this.ytPlayer.seekTo(this.songVar.startVideo / 1000, true);
            this.checkReadyAndPlay();
        }

        getVideoDuration() {
            if (this.isYouTubeVideo) {
                try {
                    return this.ytPlayer.getDuration() || NaN;
                } catch (error) {
                    return NaN;
                }
            } else {
                return this.videoElement.duration;
            }
        }

        getCurrentTime() {
            if (this.isYouTubeVideo && this.isYtPlayerReady) {
                try {
                    return this.ytPlayer.getCurrentTime() || 0;
                } catch (error) {
                    return 0;
                }
            } else {
                return this.videoElement.currentTime;
            }
        }

        isPlayingAds() {
            return (this.getCurrentTime() || 0) > 0.2 && !this.isYtPlayerReady;
        }

        checkReadyAndPlay() {
            if (this.isYouTubeVideo) {
                if (this.ytPlayer && this.ytPlayer.getPlayerState() === YT.PlayerState.PLAYING) {
                    this.songVar.isRunning = true;
                } else {
                    this.ytPlayer.playVideo();
                }
            } else {
                if (this.videoElement.readyState >= 2 && (!this.songVar.isVocal || this.vocalsReady)) {
                    this.songVar.isRunning = true;
                    this.videoElement.play();
                    if (this.songVar.isVocal) this.vocals.play();
                }
            }
        }

        play() {
            if (this.isYouTubeVideo) {
                if (this.ytPlayer) {
                    try {
                        this.ytPlayer.playVideo();
                    } catch (err) {
                        console.log(err)
                    }
                }
            } else {
                this.videoElement.play();
            }
            this.songVar.isRunning = true;
        }

        seekTo(time) {
            if (this.isYouTubeVideo) {
                if (this.ytPlayer) {
                    try {
                        this.ytPlayer.seekTo(time);
                    } catch (err) {
                        console.log(err)
                    }
                }
            } else {
                this.videoElement.currentTime = time;
            }
        }

        pause() {
            if (this.isYouTubeVideo) {
                this.ytPlayer.pauseVideo();
            } else {
                this.videoElement.pause();
            }
            this.songVar.isRunning = false;
        }

        unload() {
            this.songVar.isDone = true;

            if (this.isYouTubeVideo && this.ytPlayer) {
                this.ytPlayer.stopVideo();
                this.ytPlayer.destroy();
                this.ytPlayer = null;
            } else {
                this.videoElement.pause();
                this.videoElement.removeAttribute('src');
                this.videoElement.load();

                if (this.songVar.isVocal) {
                    const vocals = document.querySelector('.vocals');
                    vocals.pause();
                    vocals.removeAttribute('src');
                    vocals.load();
                }
            }
        }
    }



    //Add CSS
    try {
        var nade = document.createElement("style");
        nade.type = "text/css";
        nade.innerText = songVar.style;
        document.querySelector('#lyrics').appendChild(nade);
        document.querySelector('#lyrics').classList.add(songVar.lyricsStyle);
    } catch (err) { }

    player = new VideoPlayer(nativeVideo, isYouTubeVideo, songVar);
    var vocals = document.querySelector(".vocals");
    setTimeout(player.play(), 550)

    //Initial Hud
    songVar.Lyrics.push({ time: songVar.Beat[songVar.Beat.length - 1] + 2000, duration: "0", text: "", isLineEnding: 0 });
    hud.style.setProperty("--menu-color", data.lyricsColor);
    hud.style.setProperty("--menu-color-2", data.lyricsColor2 || data.lyricsColor);
    if (songVar.vocalKeys.length == 0) document.querySelector('#players').style.display = 'none'
    if (gamevar.DebugMode) document.querySelector('#debugger').style.display = 'block'
    try {
        setTimeout(function () { LyricsScroll(songVar.LyricsLine[offset.lyricsLine]) }, (songVar.LyricsLine[offset.lyricsLine].time - 1000 - songVar.startVideo));
    } catch (err) {
        console.log(err);
    }

    // Lyrics Scoring System with Average Pitch Check
    let pitchSamples = []; // History of recent micPitch values
    const feedbackClasses = {
        0: "feedback-bad",
        25: "feedback-ok",
        75: "feedback-good",
        91: "feedback-perfect",
    };

    function getFeedbackClass(percentage) {
        if (percentage >= 91) return feedbackClasses[91];
        if (percentage >= 60) return feedbackClasses[75];
        if (percentage >= 25) return feedbackClasses[25];
        return feedbackClasses[0];
    }

    // Set the update intervals for specific tasks to reduce CPU usage
    const DOM_UPDATE_INTERVAL = 20; // Throttle DOM updates to every 50ms
    const DEBUG_UPDATE_INTERVAL = 50; // Throttle debug updates if enabled
    let lastDomUpdate = 0;
    let lastDebugUpdate = 0;

    const totalScore = 200000, scorePerKey = totalScore / songVar.vocalKeys.length - 1;
    let MAX_SCORE_FRAME = 4
    let currentScoreFrame = 0

    jsonplayer = setInterval(function () {
        const currentTime = Date.now();

        songVar.currentTime = Math.round(player.getCurrentTime() * 1000);
        songVar.duration = Math.round(player.getVideoDuration() * 1000);

        if (isYouTubeVideo && player.isPlayingAds()) {
            player.unload();
            player = new VideoPlayer(document.querySelector('.video'), isYouTubeVideo, songVar);
            console.log('Ads Detected');
        }

        // Simple Beat Detection
        if (songVar.Beat[offset.beat] - songVar.gameOffset < songVar.currentTime) {
            if (gamevar.DebugMode && currentTime - lastDebugUpdate >= DEBUG_UPDATE_INTERVAL) {
                document.querySelector(".currentBeatV").innerHTML = songVar.Beat[offset.beat];
                lastDebugUpdate = currentTime;
            }

            const beatInterval = Math.round(songVar.Beat[offset.beat + 1] - songVar.Beat[offset.beat]) || 0;
            if (currentTime - lastDomUpdate >= DOM_UPDATE_INTERVAL) {
                hud.classList.toggle("show", true);
                document.querySelector("#beat").style.animationDuration = `${beatInterval}ms`;
                hud.classList.remove("beat", "even", "odd"); hud.offsetWidth; // trigger reflow
                hud.classList.add("beat", songVar.Odieven ? "even" : "odd");
                songVar.Odieven = !songVar.Odieven;
                lastDomUpdate = currentTime;
            }
            offset.beat++;
        }

        // Self-stop condition
        if (songVar.Beat[songVar.Beat.length - 1] - songVar.gameOffset < songVar.currentTime || songVar.currentTime >= songVar.duration) {
            if (!songVar.isDone) {
                songVar.isDone = true;
                player.unload();
                if (!gamevar.isHomescreen) { globalfunc.startTransition(true, 'scene/songselection/page.html', 'scene/songselection/page.js'); }
                else { globalfunc.startTransition(true, 'scene/homescreen/page.html', 'scene/homescreen/page.js') }
                clearInterval(jsonplayer);
                document.querySelector('.metadata-layout').classList.remove('playing');
                slider.classList.remove('enabled');
                if (songVar.vocalKeys.length) stopDetection();
                return;
            }
        }

        // Vocal Sync and Scoring
        if (songVar.isVocal) {
            const SYNC_THRESHOLD = 0.005;
            const MAX_DIFF = 0.2, BASE_FACTOR = 10, MIN_RATE = -0.05, MAX_RATE = 1.15, DAMP_FACTOR = 0.9;
            const timeDifference = vocals.currentTime - nativeVideo.currentTime;
            const absDiff = Math.abs(timeDifference);

            if (absDiff > SYNC_THRESHOLD) {
                if (absDiff > MAX_DIFF) {
                    vocals.currentTime = nativeVideo.currentTime;
                    console.log(`Sync issue: ${timeDifference.toFixed(2)}s. Seeking.`);
                } else {
                    let adjustRate = 1 - (timeDifference * BASE_FACTOR * absDiff);
                    adjustRate = Math.max(MIN_RATE, Math.min(MAX_RATE, adjustRate));
                    vocals.playbackRate = vocals.playbackRate * DAMP_FACTOR + adjustRate * (1 - DAMP_FACTOR);
                }
            } else if (Math.abs(vocals.playbackRate - 1) > 0.01) {
                vocals.playbackRate += (1 - vocals.playbackRate) * 0.1;
            } else {
                vocals.playbackRate = 1;
            }
        }

        try {
            // Score calculation per vocal key (only if vocalKeys are present)
            if (songVar.vocalKeys.length != 0 && currentScoreFrame > MAX_SCORE_FRAME) {
                currentScoreFrame = 0
                const vocalKey = songVar.vocalKeys[offset.vocalKeys];
                if (vocalKey.time - songVar.gameOffset < songVar.currentTime) {
                    const keyEnd = vocalKey.time - songVar.gameOffset + vocalKey.duration;
                    if (keyEnd < songVar.currentTime) {
                        const avgPitch = Math.round(pitchSamples.reduce((sum, pitch) => sum + pitch, 0) / (pitchSamples.length || 1));
                        const diff = Math.abs(avgPitch - vocalKey.key);
                        let match = "x", score = 0;
                        if (diff < 20) { match = "perfect"; score = scorePerKey; }
                        else if (diff < 75) { match = "good"; score = scorePerKey * 0.75; }
                        else if (diff < 150) { match = "ok"; score = scorePerKey * 0.25; }

                        // Calculate the feedback percentage (based on the score out of the possible max score)
                        const percentageFeedback = (score / scorePerKey) * 100;  // Calculate percentage based on score per key
                        const feedbackClass = getFeedbackClass(percentageFeedback);  // Get feedback class based on percentage


                        songVar.score += score;
                        if (currentTime - lastDomUpdate >= DOM_UPDATE_INTERVAL) {
                            document.querySelector('.scores').innerText = Math.round(songVar.score);
                            document.querySelector(".MicStats").innerHTML = `${vocalKey.key} = ${avgPitch} (${Math.round(score)} pts) - ${match}`;
                            document.querySelector('.player-color').style.backgroundSize = `${(songVar.score / 200000) * 100}% 100%`;
                            lastDomUpdate = currentTime;
                        }
                        // Handle animation or feedback effects
                        const feedbackElement = document.querySelector('.' + feedbackClass);
                        feedbackElement.classList.remove('animate');
                        feedbackElement.offsetHeight; // trigger reflow
                        feedbackElement.classList.add('animate');
                        feedbackElement.classList.add(feedbackClass);  // Add the feedback class for visual feedback

                        offset.vocalKeys++;
                        pitchSamples = [];
                    } else if (songVar.currentTime >= vocalKey.time - songVar.gameOffset) {
                        pitchSamples.push(micPitch);
                    }
                }
            } else {
                currentScoreFrame++
            }
        } catch (err) { console.error(err.stack); }

        // Update Lyrics (throttled)
        try {
            if (songVar.LyricsLine[offset.lyricsLine] && songVar.LyricsLine[offset.lyricsLine].time - songVar.gameOffset - 150 < songVar.currentTime) {
                if (gamevar.DebugMode) document.querySelector(".currentLyricsLineV").innerHTML = songVar.LyricsLine[offset.lyricsLine].text;
                LyricsScroll(
                    songVar.LyricsLine[offset.lyricsLine + 1] ? songVar.LyricsLine[offset.lyricsLine + 1] : { text: "" },
                    0,
                    songVar.Lyrics[songVar.LyricsLine[offset.lyricsLine].offset + 1].time -
                    (songVar.Lyrics[songVar.LyricsLine[offset.lyricsLine].offset].time +
                        songVar.Lyrics[songVar.LyricsLine[offset.lyricsLine].offset].duration),
                    (songVar.LyricsLine[offset.lyricsLine - 1] && songVar.LyricsLine[offset.lyricsLine - 1].time + songVar.LyricsLine[offset.lyricsLine - 1].duration > songVar.LyricsLine[offset.lyricsLine].time + 150)
                );
                offset.lyricsLine++;
            }
        } catch (err) { }

        try {
            songVar.Lyrics.forEach((lyric, i) => {
                if (!lyric.finished && lyric.time - songVar.gameOffset < songVar.currentTime) {
                    if (gamevar.DebugMode) document.querySelector(".currentLyricsV").innerText = lyric.text;
                    LyricsFill(lyric.text, lyric.duration, i, lyric.isLineEnding === 1);
                    lyric.finished = true;
                    if (offset.lyrics <= i) offset.lyrics++;
                }
            });
        } catch (err) { }

        // Debug updates
        if (gamevar.DebugMode && currentTime - lastDebugUpdate >= DEBUG_UPDATE_INTERVAL) {
            document.querySelector(".currentTimeV").innerText = songVar.currentTime;
            debugVocal.innerText = `${(vocals.currentTime - nativeVideo.currentTime).toFixed(4)}ms, ${vocals?.playbackRate * 100}`;
            document.querySelector('.MicPitchV').innerText = micPitch;
            lastDebugUpdate = currentTime;
        }
    }, 2);

};

//Lyrics Area
LyricsScroll = (Next, isHide = false, timea = 0, isOverlap = false) => {
    var timeout = {
        state: timea > 6000,
        timeshow: timea - 500,
        hidetime: 1000
    };

    try {
        var lyrics = document.querySelector("#lyrics");

        if (isOverlap) {
            const currentLine = document.querySelector('#lyrics .line.current');
            if (currentLine) {
                currentLine.classList.add('overlap');
            }
        }

        const previous2 = document.querySelector("#lyrics .line.previous2");
        if (previous2) {
            previous2.remove();
        }

        const previous = document.querySelector("#lyrics .line.previous");
        if (previous) {
            previous.classList.remove("previous");
            previous.classList.add("previous2");
        }

        const current = document.querySelector("#lyrics .line.current");
        if (current) {
            current.classList.remove("current");
            current.classList.add("previous");
        }

        const next = document.querySelector("#lyrics .line.next");
        if (next) {
            next.classList.remove("next");
            next.classList.add("current");
            if (timeout.state) {
                next.classList.add("show");
                setTimeout(() => {
                    next.classList.remove("show");
                }, timeout.hidetime);
            }
        }

        const div = document.createElement("div");
        div.innerHTML = Next.text;
        if (isRTL(Next.text)) {
            div.classList.add("rtl");
        }
        div.classList.add("line", "next", "hidden");
        div.setAttribute("even", Next.even);

        if (timeout.state) {
            setTimeout(() => {
                div.classList.remove("hidden");
            }, timeout.timeshow);
        } else {
            div.classList.remove("hidden");
        }

        lyrics.appendChild(div);
    } catch (err) {
        console.log('Unable To Generate A New Line' + err.stack);
    }
};

LyricsFill = (dat, duration, offset, hide = false) => {
    try {
        const current = document.querySelector("#lyrics .line.current");
        const previous = document.querySelector("#lyrics .line.previous");
        const filler = document.querySelector(`#lyrics .fill[offset="${offset}"]`);
        const fillercurrent = document.querySelector(`#lyrics .line.current .fill[offset="${offset}"]`);
        const next = filler?.nextElementSibling;

        filler.classList.remove('preanim');
        filler.classList.add("filled");

        if (next) next.classList.add('preanim');

        const onAnimationEnd = () => {
            filler.classList.add("done");
            isWalking = false;

            if (hide) {
                setTimeout(() => {
                    if (previous && !previous.classList.contains('previous2')) {
                        previous.classList.add('previous2');
                        previous.classList.remove('previous');
                    }

                    if (current && fillercurrent) {
                        current.classList.add('previous');
                        current.classList.remove('current');
                    }
                }, 2000);
            }
        };

        const slideDuration = parseInt(filler.style.getPropertyValue('--slideDuration').replace('ms', ''), 10);
        setTimeout(onAnimationEnd, slideDuration);
        isWalking = true;
    } catch (err) {
        console.error('Skipping Missing Word:', err);
    }
};


function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function getVideoTime(currentTime, duration) {
    const currentTimea = formatTime(currentTime);
    const durationa = formatTime(duration);
    const formattedTime = `${currentTimea} - ${durationa}`;
    return formattedTime
}

document.querySelectorAll('.itempause').forEach((item, index) => {
    item.addEventListener('click', function () {
        if (selectedPause < index) {
            globalfunc.playSfx(23605, 23864);
        } else if (selectedPause == index) { globalfunc.playSfx(63559, 63757) }
        else {
            globalfunc.playSfx(23892, 24137);
        }

        if (selectedPause != index) {
            document.querySelector('.itempause.selected') && document.querySelector('.itempause.selected').classList.remove('selected')
            document.querySelectorAll(`.itempause`)[index].classList.add('selected')
            selectedPause = index
            return
        }
        if (selectedPause == index) {
            setTimeout(() => {
                if (index == 0) {
                    player.seekTo(player.getVideoDuration() || player.getCurrentTime() + 200000000000)
                }
                if (index == 1) {
                    player.play();
                    document.querySelector('#pausescreen').style.opacity = 0;
                    document.querySelector('#pausescreen').style.transition = 'opacity .5s'
                    setTimeout(function () { document.querySelector('#pausescreen').style.display = 'none' }, 500)
                    document.querySelector(".overlay-hi .shortcut").innerHTML = ``;
                    document.querySelector('.hud').classList.remove('paused')
                    gamevar.isPaused = false
                }
            }, 200)
        }
    })
})

// Initiate the process
updateLoadingState();
fetchSongData();