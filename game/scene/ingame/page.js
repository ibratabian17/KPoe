var isWalking = false
var selectedPause = 1
var songDebugger;
var instrument;
var isVocalEnabled = false
document.querySelector(".overlay-hi .shortcut").innerHTML = ``;
document.querySelector(".song-metadata .title").innerText = 'Loading Song Data.'
document.querySelector(".song-metadata .artist").innerText = 'Please Wait...'
document.querySelector(".song-metadata .time").innerText = ''
document.querySelector(".song-metadata .cover .image").style.backgroundImage = `url(${gamevar.selectedBase.assets.cover})`
document.querySelector('.video').classList.add('showbanner')
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

isRTL = (str) => {
    // Define a regular expression to match RTL characters
    const rtlChars = /[\u0600-\u06FF\u0750-\u077F\u0590-\u05FF\uFB50-\uFDFF\uFE70-\uFEFF\u2000-\u206F]/;

    // Check if the string contains RTL characters
    return rtlChars.test(str);
}

generateLineLyrics = (data) => {
    const mergedTexts = [];
    let currentText = "";
    let currentTime = 0;
    let currentDuration = 0;
    let even = false;

    const createSpan = (text, duration, prevDuration, offset, element) => {
        let elementAttributes = "";
        if (element) {
            for (const [key, value] of Object.entries(element)) {
                elementAttributes += ` data-${key}="${value}"`;
            }
        }

        return `<span class="fill" offset="${offset}" style="--slideDuration:${duration}ms;--prevSlideDuration:${prevDuration}ms"${elementAttributes}>${text}<span class="filler" style="--slideDuration:${duration}ms;--prevSlideDuration:${prevDuration}ms">${text}</span></span>`;
    };

    const addTextObject = (textObj, prevTextObj, i) => {
        if (currentTime === 0) currentTime = textObj.time;
        currentDuration += textObj.duration;

        const span = createSpan(textObj.text, textObj.duration, prevTextObj.duration, i, textObj.element);
        if (isRTL(textObj.text)) {
            currentText = span + currentText;
        } else {
            currentText += span;
        }

        if (textObj.isLineEnding === 1) {
            mergedTexts.push({ text: currentText, time: currentTime, duration: currentDuration, offset: i, even });
            currentText = "";
            currentTime = 0;
            currentDuration = 0
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
    var hud = document.querySelector(".hud");
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
        SyncerSleep: 100
    };
    songDebugger = this;

    try {
        var nade = document.createElement("style");
        nade.type = "text/css";
        nade.innerText = songVar.style;
        document.querySelector('#lyrics').appendChild(nade);
        document.querySelector('#lyrics').classList.add(songVar.lyricsStyle);
    } catch (err) { }

    songVar.Lyrics.push({ time: songVar.Beat[songVar.Beat.length - 1] + 2000, duration: "0", text: "", isLineEnding: 0 });
    var video = document.querySelector(".video");
    video.volume = 1
    var instrument = new Audio();

    if (gamevar.selectedBase.video.isHls) {
        if (Hls.isSupported()) {
            const hls = new Hls();
            hls.attachMedia(video);
            hls.on(Hls.Events.MEDIA_ATTACHED, () => {
                hls.loadSource(gamevar.selectedBase.video.path);
            });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = gamevar.selectedBase.video.path;
        }
    } else {
        video.src = gamevar.selectedBase.video.path;
    }

    if (gamevar.selectedBase.video.instrument) {
        songVar.isVocal = true;
        instrument.src = gamevar.selectedBase.video.instrument;
        document.querySelector('.vocalbutton').classList.add('enabled')
        document.querySelector('.vocalbutton').classList.remove('off')
        document.querySelector('.vocalbutton').classList.add('on')
        instrument.volume = 0
    }

    video.currentTime = songVar.startVideo / 1000;
    video.addEventListener('waiting', () => {
        document.querySelector('.video-loading').style.display = "block";
    });
    video.addEventListener('playing', () => {
        document.querySelector('.video-loading').style.display = "none";
        if (video.videoWidth == 0) {
            document.querySelector('.song-metadata').classList.add('show');
            document.querySelector('.metadata-layout').classList.add('playing');
        } else {
            document.querySelector('.song-metadata').classList.remove('show');
            document.querySelector('.metadata-layout').classList.add('playing');
        }
    });
    video.addEventListener("timeupdate", (event) => {
        document.querySelector(".song-metadata .time").innerHTML = getVideoTime(video.currentTime - (songVar.startVideo / 1000), video.duration - (songVar.startVideo / 1000));
    });
    video.addEventListener("loadedmetadata", (event) => {
        document.querySelector(".song-metadata .time").innerHTML = getVideoTime(video.currentTime - (songVar.startVideo / 1000), video.duration - (songVar.startVideo / 1000));
        if (video.videoWidth == 0) {
            document.querySelector('.video').classList.add('showbanner');
        } else {
            document.querySelector('.video').classList.remove('showbanner');
        }
    });

    video.load();
    if (songVar.isVocal) instrument.load();

    setTimeout(function () {
        video.play();
        if (songVar.isVocal) instrument.play();
    }, 500);

    video.onplaying = (event) => {
        if (songVar.isVocal) {
            instrument.currentTime = video.currentTime;
            instrument.play();
        }
    };

    video.onpause = (event) => {
        if (songVar.isVocal) {
            instrument.pause();
            instrument.currentTime = video.currentTime;
        }
    };

    video.onerror = function (evt) {
        if (video.src !== "" || video.src == undefined || video.src == null) {
            alert('Can\'t Play this maps, reason: ' + evt.toString());
            globalfunc.startTransition(true, 'scene/songselection/page.html', 'scene/songselection/page.js');
            jsonplayer = clearInterval(jsonplayer);
        }
    };

    gamevar.isPaused = false;

    try {
        setTimeout(function () { LyricsScroll(songVar.LyricsLine[offset.lyricsLine]) }, (songVar.LyricsLine[offset.lyricsLine].time - 1000 - songVar.startVideo));
    } catch (err) {
        console.log(err);
    }
    hud.style.setProperty("--menu-color", data.lyricsColor);
    hud.style.setProperty("--menu-color-2", data.lyricsColor2 || data.lyricsColor);
    window.pressSwapVocal = () => {
        if (isVocalEnabled) {
            instrument.currentTime = video.currentTime
            instrument.volume = 0
            video.volume = 1
            isVocalEnabled = false
            document.querySelector('.vocalbutton').classList.remove('off')
            document.querySelector('.vocalbutton').classList.add('on')
        } else {
            instrument.currentTime = video.currentTime
            instrument.volume = 1
            video.volume = 0
            isVocalEnabled = true
            document.querySelector('.vocalbutton').classList.remove('on')
            document.querySelector('.vocalbutton').classList.add('off')
        }
    }

    jsonplayer = setInterval(function () {
        songVar.currentTime = Math.round(video.currentTime * 1000);
        songVar.duration = Math.round(video.duration * 1000);

        // Simple Beat Working
        if ((songVar.Beat[offset.beat] - songVar.gameOffset) < songVar.currentTime) {
            hud.classList.add("show");
            document.querySelector(".currentBeatV").innerHTML = songVar.Beat[offset.beat];
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
        if ((songVar.Beat[songVar.Beat.length - 1] - songVar.gameOffset) < songVar.currentTime || video.currentTime == video.duration || video.currentTime > video.duration) {
            if (!songVar.isDone) {
                songVar.isDone = true;
                video.removeAttribute('src');
                video.load();
                instrument.removeAttribute('src');
                instrument.load();
                globalfunc.startTransition(true, 'scene/songselection/page.html', 'scene/songselection/page.js');
                jsonplayer = clearInterval(jsonplayer);
                document.querySelector('.metadata-layout').classList.remove('playing');
                document.querySelector('.vocalbutton').classList.remove('enabled')
                document.querySelector('.vocalbutton').classList.remove('on')
                document.querySelector('.vocalbutton').classList.remove('off')
                return;
            }
        }

        // Add Vocal Support
        if (songVar.isVocal) {
            const syncThreshold = 0.088; // Threshold for detecting out-of-sync
            const timeDifference = instrument.currentTime - video.currentTime;
            const timeDifF = timeDifference.toFixed(4);
            document.querySelector(".VocalOffsetV").innerHTML = timeDifF;
            if (songVar.SyncerSleep > 1000) {
                if (Math.abs(timeDifference) > syncThreshold) {
                    instrument.currentTime = video.currentTime + 0.034;
                    if (timeDifference > 0) {
                        console.log(`instrument are ahead by ${timeDifference.toFixed(2)}s. Adjusting...`);
                    } else {
                        console.log(`instrument are behind by ${timeDifference.toFixed(2)}s. Adjusting...`);
                    }
                    // Adjust the instrument to match the video's current time
                }
                songVar.SyncerSleep = 0
            }
            songVar.SyncerSleep++
        }

        // Debug Lyrics
        try {
            if (songVar.LyricsLine[offset.lyricsLine] && songVar.LyricsLine[offset.lyricsLine].time - songVar.gameOffset - 150 < songVar.currentTime) {
                document.querySelector(".currentLyricsLineV").innerHTML = songVar.LyricsLine[offset.lyricsLine].text;
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

                    document.querySelector(".currentLyricsV").innerHTML = lyric.text;
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
        document.querySelector(".currentTimeV").innerHTML = songVar.currentTime; //stop delay
    }, 1);
};

//Lyrics Area
LyricsScroll = (Next, isHide = false, timea, isOverlap = false) => {
    var timeout = {
        state: timea > 6000,
        timeshow: timea - 500,
        hidetime: 1000
    }
    var lyrics = document.querySelector("#lyrics")
    if (isOverlap) {
        try {
            document.querySelector('#lyrics .line.current').classList.add('overlap')
        } catch (err) { }
    }

    try {
        var previous2 = document.querySelector("#lyrics .line.previous2")
        previous2.remove()
    } catch (err) { }
    try {
        var previous = document.querySelector("#lyrics .line.previous")
        previous.classList.remove("previous")
        previous.classList.add("previous2")
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
        const div = document.createElement("div");
        div.innerHTML = Next.text;
        if (isRTL(Next.text)) {
            div.classList.add("rtl");
        }
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
    } catch (err) { }
}
LyricsFill = (dat, duration, offset, Hide = false) => {
    try {
        var current = document.querySelector("#lyrics .line.current");
        var previous = document.querySelector("#lyrics .line.previous");
        var filler = document.querySelector(`#lyrics .fill[offset="${offset}"]`);
        var fillercurrent = document.querySelector(`#lyrics .line.current .fill[offset="${offset}"]`);
        var next = filler.nextElementSibling;
        var parent = filler.parentElement;

        filler.classList.remove('preanim');
        filler.classList.add("filled");
        if (next) next.classList.add('preanim');

        function ended() {
            filler.classList.add("done");
            isWalking = false;
            if (Hide) {
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
        }

        setTimeout(ended, filler.style.getPropertyValue('--slideDuration').replace('ms', ''));
        isWalking = true;
    } catch (err) {
        console.log('Skipping Missing Word: ' + err);
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