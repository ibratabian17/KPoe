var selectedSong = -1;
var songdb = localStorage.getItem('songdb');
var fetchUrl = "/songdb.json"
if (songdb) {
    fetchUrl = songdb;
}

fetch(fetchUrl).then(response => response.json()).then(data => {
    let list = document.querySelector(".songlist-container");

    data.forEach((item, index) => {
        let li = document.createElement("div");
        li.classList.add('itemsong')
        li.classList.add(item.id)
        li.innerHTML = `<div class="song--decoration"><img src="${item.assets.cover}"></img></div>
      <span class="song-title">${item.title}</span>`;
        li.addEventListener('click', function () {
            if (selectedSong < index) {
                globalfunc.playSfx(23605, 23864);
            } else {
                globalfunc.playSfx(23892, 24137);
            }

            document.querySelector('.itemsong.selected') && document.querySelector('.itemsong.selected').classList.remove('selected')
            if (selectedSong != index) setSelectedItem(item.id, item, index)
            document.querySelector('#gamevar').style.setProperty('--song-codename', item.id)
        })
        list.appendChild(li);
    })
    document.querySelectorAll('.itemsong')[gamevar.selectedSong || 0].click()
})

function setSelectedItem(cdn, list, offset) {
    $("#preview").css('opacity', '0')
    $("#preview").animate({ "opacity": "1" }, 500)
    $('.song--details').removeClass('show');
    $('.song--details').width()
    $('.song--details').addClass('show')
    console.log(offset)
    gamevar.selectedSong = offset
    selectedSong = offset
    gamevar.selectedBase = list
    document.querySelectorAll(`.itemsong`)[offset].classList.add('selected')
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
    videoplayer.play()
    $('.video--preview').animate({ volume: 0.6 }, 500)
}
function startsWithNumber(str) {
    return /^\d/.test(str);
}
function sing() {
    if (!$('.button--sing').hasClass('clicked')) {
        globalfunc.playSfx(63559, 63757)
        $('.button--sing').addClass('clicked')
        setTimeout(function () {
            globalfunc.startTransition(true, 'scene/ingame/page.html', 'scene/ingame/page.js')
            $('.video--preview').animate({ volume: 0 }, 500);
        }, 1000)
    }

}