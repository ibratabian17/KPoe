var selectedSong = -1;
var songdb = localStorage.getItem('songdb');
var fetchUrl = "/songdb.json"
if (songdb) {
    fetchUrl = songdb;
}
document.querySelector(".overlay-hi .shortcut").innerHTML = `⏎:Sing ←:Left →:Right`;

fetch(fetchUrl).then(response => response.json()).then(data => {
    let list = document.querySelector(".songlist-container");

    data.forEach((item, index) => {
        let li = document.createElement("div");
        li.classList.add('itemsong')
        li.classList.add(item.id)
        li.innerHTML = `<div class="song--decoration"><img loading="lazy" src="${item.assets.cover}"></img></div>
      <span class="song-title">${item.title}</span>`;
        li.addEventListener('click', function () {
            if (selectedSong < index) {
                globalfunc.playSfx(23605, 23864);
            } else {
                globalfunc.playSfx(23892, 24137);
            }

            if (selectedSong != index){
            document.querySelector('.itemsong.selected') && document.querySelector('.itemsong.selected').classList.remove('selected')
            setSelectedItem(item.id, item, index)
            document.querySelector('#gamevar').style.setProperty('--song-codename', item.id)
            }
        })
        list.appendChild(li);
    })
    document.querySelectorAll('.itemsong')[gamevar.selectedSong || 0].click()
})

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
        document.querySelector("#banner").style.background = `center / 100% 100% url(${list.assets.banner})`
    }
    catch (e) {
        console.log(e)
    }
    videoplayer.src = list.video.preview
    videoplayer.currentTime = list.previewOffset / 1000
    videoplayer.volume = 0
    videoplayer.oncanplay = function() {
        videoplayer.play()
        $('.video--preview').animate({ volume: 0.6 }, 500)
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
            globalfunc.startTransition(true, 'scene/ingame/page.html', 'scene/ingame/page.js')
            $('.video--preview').animate({ volume: 0 }, 500);
        }, 1000)
    }

}