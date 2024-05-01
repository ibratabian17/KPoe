
var isWalking = false
var selectedPause = 1
var songDebugger;
document.querySelector(".overlay-hi .shortcut").innerHTML = ``;
document.querySelector(".song-metadata .title").innerText = 'Loading Song Data.'
document.querySelector(".song-metadata .artist").innerText = 'Please Wait...'
document.querySelector(".song-metadata .time").innerText = ''
document.querySelector(".song-metadata .cover .image").style.backgroundImage = `url(${gamevar.selectedBase.assets.cover})`
fetch(gamevar.selectedBase.json)
    .then(response => response.text()).then(jsona => {
        var data;
        try {
            data = JSON.parse(jsona)
        } catch (err) {
            var a = jsona.substring(0 + 1, jsona.length - 1)
            a = a.substring(0, a.length - 2)
            console.log(a)
            data = JSON.parse(a)
        }
        document.title = `KaraokePoe - Playing: ${gamevar.selectedBase.title} by ${gamevar.selectedBase.artist}`;
        document.querySelector(".song-metadata .title").innerText = gamevar.selectedBase.title
        document.querySelector(".song-metadata .artist").innerText = gamevar.selectedBase.artist
        playSong("a", data)

    }).catch((error) => {
        alert('Failed to load map data, reason: ' + error)
        globalfunc.startTransition(true, 'scene/songselection/page.html', 'scene/songselection/page.js')
    })

generateLineLyrics = (data) => {
    const mergedTexts = [];
    let currentText = "";
    let currentTime = 0;
    var even = false

    for (let i = 0; i < data.length; i++) {
        const textObj = data[i];

        if (textObj.isLineEnding === 1) {
            if (currentTime == 0) currentTime = textObj.time
            currentText += `<span class="fill" offset="${i}">${textObj.text}<span class="filler" style="transition-duration:${textObj.duration}ms">${textObj.text}</span></span>`;
            mergedTexts.push({ text: currentText, time: currentTime, offset: i, even });
            currentText = "";
            currentTime = 0;
            even = !even
        } else {
            if (currentTime === 0) {
                currentTime = textObj.time;
            }
            currentText += `<span class="fill" offset="${i}">${textObj.text}<span class="filler" style="transition-duration:${textObj.duration}ms">${textObj.text}</span></span>`;
        }
    }
    console.log(mergedTexts)
    return mergedTexts;
}
playSong = (cdn, data) => {
    var hud = document.querySelector(".hud")
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
        lyricsStyle: data.lyricsStyle || "normal",
        style: data.css || "",
    }
    songDebugger = this
    /* const videoContainer = document.getElementById('camera-container');
     navigator.mediaDevices.getUserMedia({ video: true })
         .then((stream) => {
             const videoElement = document.createElement('video');
             videoElement.srcObject = stream;
             videoElement.autoplay = true;
             videoContainer.appendChild(videoElement);
         })
         .catch((error) => {
             console.error('Error accessing webcam:', error);
         });
     navigator.mediaDevices.getUserMedia({ audio: true })
         .then(function (stream) {
             const audioContext = new (window.AudioContext || window.webkitAudioContext)();
             const source = audioContext.createMediaStreamSource(stream);
 
             // Connect the audio source to the audio recorder or video player
             const audioRecorder = document.getElementById('audioRecorder');
             const videoPlayer = document.querySelector('#video-player .video');
             source.connect(audioContext.destination);
             source.connect(audioContext.createMediaStreamDestination().stream.getAudioTracks()[0]);
 
             // Connect the audio recorder or video player to the audio output
             audioRecorder.srcObject = audioContext.createMediaStreamDestination().stream;
             videoPlayer.srcObject = audioContext.createMediaStreamDestination().stream;
         })
         .catch(function (err) {
             console.error('Error accessing microphone: ', err);
         });*/



    try {
        var nade = document.createElement("style")
        nade.type = "text/css"
        nade.innerText = songVar.style
        document.querySelector('#lyrics').appendChild(nade);
        document.querySelector('#lyrics').classList.add(songVar.lyricsStyle)
    }
    catch (err) { }
    songVar.Lyrics.push({ time: songVar.Beat[songVar.Beat.length - 1] + 2000, duration: "0", text: "", isLineEnding: 0 })
    var video = document.querySelector(".video")
    console.log(gamevar.selectedBase.video.isHls)
    if (gamevar.selectedBase.video.isHls) {
        if (Hls.isSupported()) {
            const hls = new Hls();
            hls.attachMedia(video);
            hls.on(Hls.Events.MEDIA_ATTACHED, () => {
                hls.loadSource(
                    gamevar.selectedBase.video.path
                );
            });
        }
        else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = videoSrc;
        }
    }
    else {
        video.src = gamevar.selectedBase.video.path
    }
    video.currentTime = songVar.startVideo / 1000
    video.addEventListener('waiting', () => {
        document.querySelector('.video-loading').style.display = "block"
    });
    video.addEventListener('playing', () => {
        document.querySelector('.video-loading').style.display = "none"
        if (video.videoWidth == 0) {
            document.querySelector('.song-metadata').classList.add('show')
            document.querySelector('.metadata-layout').classList.add('playing')
        } else {
            document.querySelector('.song-metadata').classList.remove('show')
            document.querySelector('.metadata-layout').classList.add('playing')
        }
    });
    video.addEventListener("timeupdate", (event) => {
        document.querySelector(".song-metadata .time").innerHTML = getVideoTime(video.currentTime, video.duration);
    });
    video.addEventListener("loadedmetadata", (event) => {
        document.querySelector(".song-metadata .time").innerHTML = getVideoTime(video.currentTime, video.duration);
    });
    video.load()
    setTimeout(function () { video.play() }, 500)
    video.onerror = function (evt) {
        console.log(video.src)
        if (video.src !== "" || video.src == undefined || video.src == null) {
            alert('Can\'t Play this maps, reason: ' + evt.toString());
            globalfunc.startTransition(true, 'scene/songselection/page.html', 'scene/songselection/page.js')
            clearInterval(loopUI)
        }
    };
    gamevar.isPaused = false

    try {
        setTimeout(function () { LyricsScroll(songVar.LyricsLine[offset.lyricsLine]) }, (songVar.LyricsLine[offset.lyricsLine].time - 9000))
    } catch (err) {
        console.log(err)
    }
    var loopUI = setInterval(function () {
        songVar.currentTime = Math.round(video.currentTime * 1000);
        songVar.duration = Math.round(video.duration * 1000);
        document.querySelector(".currentTimeV").innerHTML = songVar.currentTime;
        // Simple Beat Working
        if ((songVar.Beat[offset.beat] - songVar.gameOffset) < songVar.currentTime) {
            hud.classList.add("show")
            document.querySelector(".currentBeatV").innerHTML = songVar.Beat[offset.beat];
            document.querySelector("#beat").style.animationDuration = `${Math.round(songVar.Beat[offset.beat + 1] - songVar.Beat[offset.beat])}.${0}ms`;
            hud.style.setProperty("--menu-color", data.lyricsColor);
            hud.classList.remove("beat")
            setTimeout(function () {
                hud.classList.remove("beat")
                hud.classList.add("beat")
                if (songVar.Odieven == true) {
                    hud.classList.remove("even")
                    hud.classList.add("odd")
                    songVar.Odieven = false
                } else {
                    hud.classList.remove("odd")
                    hud.classList.add("even")
                    songVar.Odieven = true
                }
            }, 15)
            offset.beat++;
        }
        //SelfStop
        if ((songVar.Beat[songVar.Beat.length - 1] - songVar.gameOffset) < songVar.currentTime || video.currentTime == video.duration) {
            if (!songVar.isDone) {
                songVar.isDone = true
                video.removeAttribute('src')
                video.load()
                globalfunc.startTransition(true, 'scene/songselection/page.html', 'scene/songselection/page.js')
                clearInterval(loopUI)
                document.querySelector('.metadata-layout').classList.remove('playing')
                return
            }
        }
        // Debug Lyrics
        try {
            if (songVar.LyricsLine[offset.lyricsLine] && songVar.LyricsLine[offset.lyricsLine].time - 150 < songVar.currentTime) {
                document.querySelector(".currentLyricsLineV").innerHTML = songVar.LyricsLine[offset.lyricsLine].text;
                LyricsScroll(songVar.LyricsLine[offset.lyricsLine + 1] ? songVar.LyricsLine[offset.lyricsLine + 1] : { text: "" }, 0, songVar.Lyrics[songVar.LyricsLine[offset.lyricsLine].offset + 1].time - (songVar.Lyrics[songVar.LyricsLine[offset.lyricsLine].offset].time + songVar.Lyrics[songVar.LyricsLine[offset.lyricsLine].offset].duration))
                offset.lyricsLine++;
            }
        } catch (err) { }
        try {
            if ((songVar.Lyrics[offset.lyrics].time - songVar.gameOffset) < songVar.currentTime) {

                var isLineEnding = false
                if (songVar.Lyrics[offset.lyrics].isLineEnding == 1) isLineEnding = true
                const isMore = songVar.Lyrics[offset.lyrics].isLineEnding == 1 && songVar.Lyrics[offset.lyrics + 1] && songVar.Lyrics[offset.lyrics].time >= songVar.Lyrics[offset.lyrics + 1].time;
                document.querySelector(".currentLyricsV").innerHTML = songVar.Lyrics[offset.lyrics].text;
                if (!isMore) LyricsFill(songVar.Lyrics[offset.lyrics].text, songVar.Lyrics[offset.lyrics].duration, offset.lyrics, isLineEnding)
                offset.lyrics++;
            }
        } catch (err) { }
    }, 5)
}
//Lyrics Area
LyricsScroll = (Next, isHide = false, timea) => {
    var timeout = {
        state: timea > 6000,
        timeshow: timea - 1000,
        hidetime: 2500
    }
    var lyrics = document.querySelector("#lyrics")

    try {
        var previous = document.querySelector("#lyrics .line.previous")
        previous.remove()
    } catch (err) { }
    try {
        var current = document.querySelector("#lyrics .line.current")
        current.classList.remove("current")
        current.classList.add("previous")
    } catch (err) { }
    try {
        var next = document.querySelector("#lyrics .line.next")
        next.classList.remove("next")
        next.classList.add("current")
        if (timeout.state) {
            next.classList.remove("next")
            next.classList.add("current")
            next.classList.add("show")
            setTimeout(function () {
                next.classList.remove("show")
            }, timeout.hidetime)
        } else {
            next.classList.remove("next")
            next.classList.add("current")
        }
    } catch (err) { }

    try {
        setTimeout(function () {
            try {
                //AVOID LYRIC BROKEN
                var next = document.querySelector("#lyrics .line.next")
                next.remove()
            }
            catch (err) { }
            const div = document.createElement("div");
            div.innerHTML = Next.text;
            div.classList.add("line");
            div.classList.add("next");
            div.classList.add("hidden")
            div.setAttribute("even", Next.even);
            if (timeout.state) {
                setTimeout(() => {
                    div.classList.remove("hidden")
                }, timeout.timeshow)
            } else div.classList.remove("hidden")
            const lyrics = document.getElementById("lyrics");
            lyrics.appendChild(div);
            document.querySelector("#beat").style.width = `${Math.round($(".line.current").width() / 1.2)}px`
        }, 10)
    } catch (err) { }
}
LyricsFill = (dat, duration, offset, Hide = false) => {
    try {
        var current = document.querySelector("#lyrics .line.current")
        var filler = current.querySelector(`#lyrics .line.current .fill[offset="${offset}"] .filler`)
        const textNode = document.createTextNode(dat);
        filler.parentNode.classList.add("filled")
        function ended(event) {
            if (event.propertyName == 'width') {
                filler.parentNode.classList.add("done")
                isWalking = false;
                if (Hide) {
                    setTimeout(() => {
                        current.classList.add('previous')
                        current.classList.remove('current')
                    }, 2000)

                }
            }
        }
        filler.addEventListener('transitionend', ended);
        isWalking = true;
    } catch (err) {
        console.log(dat + err)
    }
}

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
                    document.querySelector('.video').currentTime = document.querySelector('.video').duration || document.querySelector('.video').currentTime + 200000000000
                }
                if (index == 1) {
                    document.querySelector('.video').play()
                    document.querySelector('#pausescreen').style.opacity = 0;
                    document.querySelector('#pausescreen').style.transition = 'opacity .5s'
                    setTimeout(function () { document.querySelector('#pausescreen').style.display = 'none' }, 500)
                    document.querySelector(".overlay-hi .shortcut").innerHTML = ``;
                    gamevar.isPaused = false
                }
            }, 200)
        }
    })
})