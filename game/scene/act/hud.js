gamevar.gamevar = document.getElementById("gamevar")
var isWalking = false

gamevar.cdn = gamevar.gamevar.style.getPropertyValue("--song-codename");
fetch(`${gamevar.selectedBase}/${gamevar.cdn}.json`)
    .then(response => response.text()).then(jsona => {
        var data;
        try{
            data = JSON.parse(jsona)
        }catch(err){
            var a = jsona.substring(gamevar.cdn.length + 1, jsona.length - 1)
            a = a.substring(0, a.length - 2)
            console.log(a)
            data = JSON.parse(a)
        }
        fetch(`${gamevar.selectedBase}/assets/web/pictos-atlas.json`)
            .then(response => response.json()).then(pictosatlas => {
                globalfunc.playSong(gamevar.cdn, data, pictosatlas)
            }).catch(err => {
                globalfunc.playSong(gamevar.cdn, data, {})
            })
    })

globalfunc.generateLineLyrics = (data) => {
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

globalfunc.playSong = (cdn, data, pictoatlas) => {
    var hud = document.querySelector(".hud")
    var ui = {
        lyrics: hud.querySelector("#lyrics")
    }
    if (data.NumCoach > 1) {
        ui.pictos.classList.add('multi-coach')
    }
    if(!gamevar.nohudList){
        ui.pictos.style.display = "none"
    }
    let offset = {
        beat: 0,
        lyrics: 0,
        lyricsLine: 0,
        pictos: 0
    };
    const songVar = {
        Beat: data.beats,
        Odieven: false,
        Lyrics: data.lyrics,
        LyricsLine: globalfunc.generateLineLyrics(data.lyrics),
        Pictos: data.pictos,
        currentTime: 0,
        isDone: false,
        PictosSlideDur: 2100 + Math.round(globalfunc.calculateAverageTime(data.pictos, 'duration')),
        PictosHideDur: 200 + (Math.round(globalfunc.calculateAverageTime(data.pictos, 'duration')) / 5)
    }
    songVar.Lyrics.push({time: songVar.Beat[songVar.Beat.length - 1] + 2000, duration: "0", text: "", isLineEnding: 0})
    var video = document.querySelector(".videoplayer")
    if (false) {
        const hls = new Hls();
        hls.attachMedia(video);
        hls.on(Hls.Events.MEDIA_ATTACHED, () => {
            hls.loadSource(
                `/LilypadData/assets/maps/${cdn}/${cdn}.m3u8`
            );
        });
    }
    else {
        video.src = gamevar.selectedVideos || `/LilypadData/assets/maps/${cdn}/${cdn}.mp4`
    }
    video.play()

    try { globalfunc.LyricsScroll(songVar.LyricsLine[offset.lyricsLine].text) } catch(err){}
    var loopUI = setInterval(function () {
        songVar.currentTime = Math.round(video.currentTime * 1000);
        document.querySelector(".currentTimeV").innerHTML = songVar.currentTime;
        // Simple Beat Working
        if (songVar.Beat[offset.beat] < songVar.currentTime) {
            hud.classList.add("show")
            document.querySelector(".currentBeatV").innerHTML = songVar.Beat[offset.beat];
            document.querySelector("#beat").style.animationDuration = `${songVar.Beat[offset.beat + 1] - songVar.Beat[offset.beat]}ms`;
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
        if (songVar.Beat[songVar.Beat.length - 1] < songVar.currentTime || video.currentTime == video.duration) {
            if (!songVar.isDone) {
                songVar.isDone = true
                globalfunc.startTransition(true, 'scene/ui/home.html', 'scene/act/home.js', 0)
                clearInterval(loopUI)
                return
            }
        }
        // Debug Lyrics
        try {
            if (songVar.Lyrics[offset.lyrics].time < songVar.currentTime) {
                try {
                    if (songVar.LyricsLine[offset.lyricsLine] && songVar.LyricsLine[offset.lyricsLine].time < songVar.currentTime) {
                        document.querySelector(".currentLyricsLineV").innerHTML = songVar.LyricsLine[offset.lyricsLine].text;
                        globalfunc.LyricsScroll(songVar.LyricsLine[offset.lyricsLine + 1] ? songVar.LyricsLine[offset.lyricsLine + 1].text : "", 0, songVar.Lyrics[songVar.LyricsLine[offset.lyricsLine].offset + 1].time - (songVar.Lyrics[songVar.LyricsLine[offset.lyricsLine].offset].time + songVar.Lyrics[songVar.LyricsLine[offset.lyricsLine].offset].duration))
                        offset.lyricsLine++;
                    }
                } catch (err) { }
                var isLineEnding = false
                if(songVar.Lyrics[offset.lyrics].isLineEnding == 1)isLineEnding = true
                const isMore = songVar.Lyrics[offset.lyrics].isLineEnding == 1 && songVar.Lyrics[offset.lyrics + 1] && songVar.Lyrics[offset.lyrics].time >= songVar.Lyrics[offset.lyrics + 1].time;
                document.querySelector(".currentLyricsV").innerHTML = songVar.Lyrics[offset.lyrics].text;
                if (!isMore) globalfunc.LyricsFill(songVar.Lyrics[offset.lyrics].text, songVar.Lyrics[offset.lyrics].duration, 0, isLineEnding)
                offset.lyrics++;

            }
        } catch (err) { }
        //Pictos
        try {
            if (songVar.Pictos[offset.pictos].time - songVar.PictosSlideDur < songVar.currentTime) {
                globalfunc.ShowPictos(cdn, pictoatlas.images[songVar.Pictos[offset.pictos].name], songVar.PictosSlideDur, songVar.PictosHideDur, `${pictoatlas.imageSize.width}x${pictoatlas.imageSize.height}`)
                offset.pictos++;
            }
        } catch (err) { }
    }, 10)
}

//Pictos Area
globalfunc.ShowPictos = (cdn, atlas, SlideDuration, DisappearDuration, size) => {
    const pictos = document.createElement('div');
    pictos.className = "picto"
    pictos.innerHTML = '<canvas class="texture"></canvas>';
    const texture = pictos.querySelector('.texture')
    const width = size.split('x')
    texture.width = width[0];
    texture.height = width[1];
    const context = texture.getContext('2d');
    var image = new Image();
    image.src = `${gamevar.selectedBase}/assets/web/pictos-atlas.png`;
    image.onload = function () {
        context.drawImage(image, atlas[0] * -1, atlas[1] * -1, this.width, this.height);
    }
    if(width[0] == width[1])pictos.style.animation = `PictosScrollSolo ${SlideDuration}ms linear`
    else pictos.style.animation = `PictosScroll ${SlideDuration}ms linear`
    

    document.querySelector('#pictos').appendChild(pictos);
    setTimeout(function () {
        //Start Hide
        pictos.style.animation = `PictosHide ${DisappearDuration}ms`

        setTimeout(function () {
            //Remove
            pictos.remove()
        }, DisappearDuration)
    }, SlideDuration)
}

//Lyrics Area
globalfunc.LyricsScroll = (Next, isHide = false, timea) => {
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
        if(timeout.state){
            next.classList.remove("next")
            next.classList.add("current")
            next.classList.add("show")
            console.log(next.innerHTML + "Long")
            setTimeout(function(){
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
            if(timeout.state){
                setTimeout(() => {
                    div.classList.remove("hidden")
                }, timeout.timeshow)
            } else div.classList.remove("hidden")
            const lyrics = document.getElementById("lyrics");
            lyrics.appendChild(div);
        }, 10)
    } catch (err) { }
}
globalfunc.LyricsFill = (dat, duration, offset, Hide = false) => {
    try {
        var current = document.querySelector("#lyrics .line.current")
        var filler = current.querySelector("#lyrics .line.current .layer-top")
        filler.style.width = filler.scrollWidth + "px"
        if (isWalking) {
            filler.style.transitionDuration = 20 + "ms"
            filler.offsetHeight;
            isWalking = false;
        }
        isWalking = true
        const textNode = document.createTextNode(dat);
        filler.appendChild(textNode);
        filler.style.width = filler.scrollWidth + "px"
        filler.style.transitionDuration = duration + "ms"
        filler.addEventListener('transitionend', function () {
            filler.style.width = '';
            filler.classList.add("filled")
            isWalking = false;
            if(Hide){
                current.classList.add('previous')
                current.classList.remove('current')
            }
        });
    } catch (err) {
        console.log(dat + err)
    }
}
//Variable Area
globalfunc.calculateAverageTime = (array, key) => {
    // Extract the values for the specified key from the array
    const values = array.map(obj => obj[key]);

    // Calculate the sum of the values
    const sum = values.reduce((total, value) => total + value, 0);

    // Calculate the average
    const average = sum / array.length;

    return average;
}

//Keymapping Area
gamevar.ispaused = false
function pause(event) {
    if (event.key === 'Escape') {
        if (!gamevar.ispaused) {
            setAudiobkgVol(1)
            gamevar.ispaused = true
            document.querySelector(".videoplayer").pause()
        } else {
            setAudiobkgVol(0)
            gamevar.ispaused = false
            document.querySelector(".videoplayer").play()
        }
    }
}
document.addEventListener('keydown', pause);