
var isWalking = false
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
        playSong("a", data)

    })

generateLineLyrics = (data) => {
    const mergedTexts = [];
    let currentText = "";
    let currentTime = 0;

    for (let i = 0; i < data.length; i++) {
        const textObj = data[i];

        if (textObj.isLineEnding === 1) {
            if (currentTime == 0) currentTime = textObj.time
            currentText += textObj.text;
            mergedTexts.push({ text: currentText, time: currentTime, offset: i });
            currentText = "";
            currentTime = 0;
        } else {
            if (currentTime === 0) {
                currentTime = textObj.time;
            }
            currentText += textObj.text;
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
    }
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





    songVar.Lyrics.push({ time: songVar.Beat[songVar.Beat.length - 1] + 2000, duration: "0", text: "", isLineEnding: 0 })
    var video = document.querySelector(".video")
    if (gamevar.selectedBase.isHls) {
        const hls = new Hls();
        hls.attachMedia(video);
        hls.on(Hls.Events.MEDIA_ATTACHED, () => {
            hls.loadSource(
                `/LilypadData/assets/maps/${cdn}/${cdn}.m3u8`
            );
        });
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
    });

    video.play()
    video.addEventListener('error', evt => {
        console.log(video.src)
        if (video.src !== "" || video.src == undefined || video.src == null) {
            alert('Can\'t Play this maps, reason: ' + evt.toString());
            globalfunc.startTransition(true, 'scene/songselection/page.html', 'scene/songselection/page.js')
            clearInterval(loopUI)
        }
    });

    try {
        setTimeout(function () { LyricsScroll(songVar.LyricsLine[offset.lyricsLine].text) }, (songVar.LyricsLine[offset.lyricsLine].time - 9000))
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
            document.querySelector("#beat").style.animationDuration = `${songVar.Beat[offset.beat + 1] - songVar.Beat[offset.beat]}.${0}ms`;
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
                video.pause()
                globalfunc.startTransition(true, 'scene/songselection/page.html', 'scene/songselection/page.js')
                clearInterval(loopUI)
                return
            }
        }
        // Debug Lyrics
        try {
            if ((songVar.Lyrics[offset.lyrics].time - songVar.gameOffset) < songVar.currentTime) {
                try {
                    if (songVar.LyricsLine[offset.lyricsLine] && songVar.LyricsLine[offset.lyricsLine].time < songVar.currentTime) {
                        document.querySelector(".currentLyricsLineV").innerHTML = songVar.LyricsLine[offset.lyricsLine].text;
                        LyricsScroll(songVar.LyricsLine[offset.lyricsLine + 1] ? songVar.LyricsLine[offset.lyricsLine + 1].text : "", 0, songVar.Lyrics[songVar.LyricsLine[offset.lyricsLine].offset + 1].time - (songVar.Lyrics[songVar.LyricsLine[offset.lyricsLine].offset].time + songVar.Lyrics[songVar.LyricsLine[offset.lyricsLine].offset].duration))
                        offset.lyricsLine++;
                    }
                } catch (err) { }
                var isLineEnding = false
                if (songVar.Lyrics[offset.lyrics].isLineEnding == 1) isLineEnding = true
                const isMore = songVar.Lyrics[offset.lyrics].isLineEnding == 1 && songVar.Lyrics[offset.lyrics + 1] && songVar.Lyrics[offset.lyrics].time >= songVar.Lyrics[offset.lyrics + 1].time;
                document.querySelector(".currentLyricsV").innerHTML = songVar.Lyrics[offset.lyrics].text;
                if (!isMore) LyricsFill(songVar.Lyrics[offset.lyrics].text, songVar.Lyrics[offset.lyrics].duration, 0, isLineEnding)
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
            console.log(next.innerHTML + "Long")
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
            const txt = document.createTextNode(Next);
            const top = document.createElement("span");
            const bottom = document.createElement("span");
            bottom.appendChild(txt);
            top.classList.add("layer-top");
            bottom.classList.add("layer-bottom");
            div.appendChild(top);
            div.appendChild(bottom);
            div.classList.add("line");
            div.classList.add("next");
            div.classList.add("hidden")
            if (timeout.state) {
                setTimeout(() => {
                    div.classList.remove("hidden")
                }, timeout.timeshow)
            } else div.classList.remove("hidden")
            const lyrics = document.getElementById("lyrics");
            lyrics.appendChild(div);
            document.querySelector("#beat").style.width = `${$(".line.current").width() / 1.2}px`
        }, 10)
    } catch (err) { }
}
LyricsFill = (dat, duration, offset, Hide = false) => {
    try {
        var current = document.querySelector("#lyrics .line.current")
        var filler = current.querySelector("#lyrics .line.current .layer-top")
        filler.style.width = filler.scrollWidth + "px"
        isWalking = true
        const textNode = document.createTextNode(dat);
        filler.appendChild(textNode);
        filler.style.width = filler.scrollWidth + "px"
        filler.style.transitionDuration = duration + "ms"
        filler.addEventListener('transitionend', function () {
            filler.style.width = '';
            filler.classList.add("filled")
            isWalking = false;
            if (Hide) {
                current.classList.add('previous')
                current.classList.remove('current')
            }
        });
    } catch (err) {
        console.log(dat + err)
    }
}

