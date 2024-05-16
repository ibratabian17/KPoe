var selectedSong = -1;
document.title = "KaraokePoe - Selecting Song";
var songdb = localStorage.getItem('songdb');
var fetchUrl = "/songdb.json"
if (songdb) {
    fetchUrl = songdb;
}
document.querySelector(".overlay-hi .shortcut").innerHTML = `<img class="key_textures" src="assets/textures/ui/key_enter.webp"></img>:Sing <img class="key_textures" src="assets/textures/ui/key_f1.webp"></img>:Refresh Songlist <img class="key_textures" src="assets/textures/ui/key_esc.webp"></img>: Back`;
document.querySelector('.song-metadata').classList.add('show')

function initList(data) {
    let list = document.querySelector(".songlist-container");

    data.forEach((item, index) => {
        let li = document.createElement("div");
        li.classList.add('itemsong')
        li.classList.add('notranslate')
        li.classList.add(item.id)
        li.innerHTML = `<div class="song--decoration"><img loading="lazy" src="${item.assets.cover}"></img></div>
      <span class="song-title">${item.title}</span>`;
        li.addEventListener('click', function () {
            if (selectedSong < index) {
                globalfunc.playSfx(23605, 23864);
            } else {
                globalfunc.playSfx(23892, 24137);
            }

            if (selectedSong != index) {
                document.querySelector('.itemsong.selected') && document.querySelector('.itemsong.selected').classList.remove('selected')
                setSelectedItem(item.id, item, index)
                document.querySelector('#gamevar').style.setProperty('--song-codename', item.id)
            }
        })
        list.appendChild(li);
    })
    document.querySelectorAll('.itemsong')[gamevar.selectedSong || 0].click()
}
if (gamevar.songdb == undefined || gamevar.refreshSongdb == true) {
    fetch(fetchUrl, { cache: "no-cache" }).then(response => response.json()).then(data => {
        gamevar.songdb = data
        initList(data)
        gamevar.refreshSongdb = false
    })
} else {
    initList(gamevar.songdb)
}


function setSelectedItem(cdn, list, offset) {
    document.querySelector('.video--preview-container .video-loading').style.display = "block"
    $("#preview").css('opacity', '0')
    $("#preview").animate({ "opacity": "1" }, 500)
    $('.song--details').removeClass('show');
    $('.song--details').width()
    $('.song--details').addClass('show')
    gamevar.selectedSong = offset
    selectedSong = offset
    gamevar.selectedBase = list
    const preview = document.querySelector("#preview")
    const videoplayer = preview.querySelector('.video--preview')
    const songtitle = preview.querySelector('.song-title')
    const songartist = preview.querySelector('.song-artist')
    songtitle.innerHTML = list.title
    songartist.innerHTML = list.artist
    videoplayer.src = ""
    try {
        document.querySelector("#banner").style.background = `center / cover url(${list.assets.banner})`
        document.querySelector("#video-banner").style.background = `center / cover url(${list.assets.banner})`
        document.querySelector(".video--preview").removeAttribute('poster');
    }
    catch (e) {
        console.log(e)
    }
    if (list.previewOffset == 0 && list.video.preview != list.video.path) {
        //Make it sure it was a short video, 30s
        const videoRequest = fetch(list.video.preview)
            .then(response => response.blob());

        videoRequest.then(blob => {
            videoplayer.src = window.URL.createObjectURL(blob);
        });
    } else {
        //long video ...
        videoplayer.src = list.video.preview
    }
    videoplayer.currentTime = list.previewOffset / 1000
    videoplayer.volume = 0
    videoplayer.oncanplay = function () {
        videoplayer.play()
    }
    videoplayer.onplay = function () {
        $('.video--preview').stop(true, true).animate({ volume: 0.6 }, {
            duration: 500,
            queue: false
        })
        document.querySelector(".video--preview").setAttribute('poster', list.assets.banner);
    };
    videoplayer.addEventListener('waiting', () => {
        document.querySelector('.video--preview-container .video-loading').style.display = "block"
    });
    videoplayer.addEventListener('playing', () => {
        document.querySelector('.video--preview-container .video-loading').style.display = "none"
    });
    document.querySelectorAll(`.itemsong`)[offset].classList.add('selected')
}
function startsWithNumber(str) {
    return /^\d/.test(str);
}
function sing() {
    if (!$('.button--sing').hasClass('clicked')) {
        globalfunc.playSfx(63559, 63757)
        $('.button--sing').addClass('clicked')
        $('.itemsong.selected').addClass('choosed')
        setTimeout(function () {
            globalfunc.startTransition(true, 'scene/ingame/page.html', 'scene/ingame/page.js', 0)
            $('.video--preview').stop(true, true).animate({ volume: 0 }, 500);
        }, 1000)
    }

}