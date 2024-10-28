
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
            globalfunc.startTransition(true, 'scene/songselection/page.html', 'scene/songselection/page.js');
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
        lyricsLine: 0
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
    };
    songDebugger = this;

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
            window.YTConfig = {host: 'https://www.youtube.com/iframe_api'}
            this.ytPlayer = new YT.Player('youtubeVideo', {
                host: "https://www.youtube-nocookie.com" || "https://www.youtube.com",
                videoId: gamevar.selectedBase.video.youtubeId ||  gamevar.selectedBase.video.videoId || getYoutubeId(gamevar.selectedBase.video.path),
                events: {
                    'onReady': this.onPlayerReady.bind(this),
                    'onStateChange': this.onPlayerStateChange.bind(this),
                },
                playerVars: { 'autoplay': 1, 'controls': 0, "rel": 0, "disablekb": 1, "fs": 0, "hd": 1, "start": Math.round(songVar.startVideo), },
            });
            document.querySelector('#youtubeVideo').classList.add('hidden');
            window.YTConfig = {host: 'https://www.youtube.com/iframe_api'}
              
        }


        onPlayerStateChange(event) {
            if (event.data == YT.PlayerState.PLAYING) {
                if(songVar.currentTime < songVar.startVideo){
                    player.seekTo(songVar.startVideo  / 1000, true)
                }
                this.isYtPlayerReady = true
                document.querySelector('.video').classList.remove('showbanner');
                document.querySelector('#youtubeVideo').classList.remove('hidden');
                document.querySelector('.video-loading').style.display = "none";
                    document.querySelector('.song-metadata').classList.remove('show');
                    document.querySelector('.metadata-layout').classList.add('playing');
            }
            if (event.data == YT.PlayerState.BUFFERING) {
                document.querySelector('.video-loading').style.display = "block";
            }
            if (event.data == YT.PlayerState.ENDED) {
                clearInterval(jsonplayer);
                this.unload()
                globalfunc.startTransition(true, 'scene/songselection/page.html', 'scene/songselection/page.js');
                document.querySelector('.metadata-layout').classList.remove('playing');
                slider.classList.remove('enabled')
            }
        }

        setupNativeVideo() {
            //Initial Videoplayer --
            this.videoElement.volume = 1
            const video = this.videoElement
            if (gamevar.selectedBase.video.isHls) {
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
                    globalfunc.startTransition(true, 'scene/songselection/page.html', 'scene/songselection/page.js');
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
                    } catch(err){
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
                    } catch(err){
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
    try {
        setTimeout(function () { LyricsScroll(songVar.LyricsLine[offset.lyricsLine]) }, (songVar.LyricsLine[offset.lyricsLine].time - 1000 - songVar.startVideo));
    } catch (err) {
        console.log(err);
    }

    jsonplayer = setInterval(function () {
        songVar.currentTime = Math.round(player.getCurrentTime() * 1000);
        songVar.duration = Math.round(player.getVideoDuration() * 1000);

        if(isYouTubeVideo && player.isPlayingAds()){
            player.unload()
            player = new VideoPlayer(document.querySelector('.video'), isYouTubeVideo, songVar);
            console.log('Ads Detected')
        } else {
            
        }
        
        

        // Simple Beat Working
        if ((songVar.Beat[offset.beat] - songVar.gameOffset) < songVar.currentTime) {
            hud.classList.add("show");
            if (gamevar.DebugMode) document.querySelector(".currentBeatV").innerHTML = songVar.Beat[offset.beat];
            document.querySelector("#beat").style.animationDuration = `${Math.round(songVar.Beat[offset.beat + 1] - songVar.Beat[offset.beat])}.${0}ms`;
            hud.classList.remove("beat");
            hud.classList.remove("beat");
            hud.offsetWidth; //redraw
            hud.classList.add("beat");
            if (songVar.Odieven == true) {
                hud.classList.remove("even");
                hud.classList.add("odd");
                songVar.Odieven = false;
            } else {
                hud.classList.remove("odd");
                hud.classList.add("even");
                songVar.Odieven = true;
            }
            offset.beat++;
        }

        // SelfStop
        if ((songVar.Beat[songVar.Beat.length - 1] - songVar.gameOffset) < songVar.currentTime || songVar.currentTime == songVar.duration || songVar.currentTime > songVar.duration) {
            if (!songVar.isDone) {
                songVar.isDone = true;
                player.unload()
                globalfunc.startTransition(true, 'scene/songselection/page.html', 'scene/songselection/page.js');
                clearInterval(jsonplayer);
                document.querySelector('.metadata-layout').classList.remove('playing');
                slider.classList.remove('enabled')
                return;
            }
        }

        if (songVar.isVocal) {
            const SYNC_THRESHOLD = 0.005;
            const MAX_ALLOWED_DIFFERENCE = 0.2;
            const BASE_ADJUSTMENT_FACTOR = 2;
            const MIN_PLAYBACK_RATE = -0.05;
            const MAX_PLAYBACK_RATE = 1.15;
            const DAMPING_FACTOR = 0.9;

            const timeDifference = vocals.currentTime - nativeVideo.currentTime;
            const absTimeDifference = Math.abs(timeDifference);

            if (absTimeDifference > SYNC_THRESHOLD) {
                if (absTimeDifference > MAX_ALLOWED_DIFFERENCE) {
                    // If difference is too large, directly seek to video position
                    vocals.currentTime = nativeVideo.currentTime;
                    console.log(`Too far out of sync: ${timeDifference.toFixed(2)}s. Seeking to match video.`);
                } else {
                    // Adjust playback rate dynamically based on time difference with more aggressive adjustment
                    const dynamicAdjustmentFactor = BASE_ADJUSTMENT_FACTOR * absTimeDifference;

                    // Calculate the adjustment rate based on the time difference
                    let adjustmentRate = 1 - (timeDifference * dynamicAdjustmentFactor);

                    // Clamp the adjustment rate within the allowable playback rate range
                    adjustmentRate = Math.max(MIN_PLAYBACK_RATE, Math.min(MAX_PLAYBACK_RATE, adjustmentRate));

                    // Smoothly transition to the new playback rate using a damping factor
                    vocals.playbackRate = (vocals.playbackRate * DAMPING_FACTOR) + (adjustmentRate * (1 - DAMPING_FACTOR));
                }
            } else if (Math.abs(vocals.playbackRate - 1) > 0.01) {
                // Gradually reset playback rate when sync is achieved
                vocals.playbackRate += (1 - vocals.playbackRate) * 0.1; // Increased reset speed
            } else {
                vocals.playbackRate = 1;
            }
        }




        // Debug Lyrics
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
            songVar.Lyrics.forEach((lyric, index) => {
                var isrunned = songVar.Lyrics[index].finished
                if ((!isrunned) && (lyric.time - songVar.gameOffset) < songVar.currentTime) {
                    let isLineEnding = lyric.isLineEnding === 1;
                    const isMore = lyric.isLineEnding === 1 && songVar.Lyrics[index + 1] && lyric.time >= songVar.Lyrics[index + 1].time;

                    if (gamevar.DebugMode) document.querySelector(".currentLyricsV").innerHTML = lyric.text;
                    if (true) {
                        LyricsFill(lyric.text, lyric.duration, index, isLineEnding);
                    }

                    try {
                        current.querySelector(`#debugger .fill[offset="${offset}"] .filler`).classList.add('show')
                    } catch (err) { }
                    songVar.Lyrics[index].finished = true

                    if (offset.lyrics > index || offset.lyrics == index) offset.lyrics++;
                }
            });
        } catch (err) { }

        //End Of Loop
        if (gamevar.DebugMode) {
            document.querySelector(".currentTimeV").innerHTML = songVar.currentTime; //stop delay
            debugVocal.innerText = `${(vocals.currentTime - video.currentTime).toFixed(4)}ms, ${vocals.playbackRate * 100}`
        }
    }, 1);
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