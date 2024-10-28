// Global Variables
var selectedSong = -1;
document.title = "KaraokePoe - Selecting Song";
var songdb = localStorage.getItem('songdb');
var fetchUrl = songdb ? songdb : "/songdb.json";
var timer = 0

// Update UI elements
updateShortcutKeys();
document.querySelector('.song-metadata').classList.add('show');

// Fetch and Initialize Song List
initializeSongList();

function updateShortcutKeys() {
    document.querySelector(".overlay-hi .shortcut").innerHTML = `
        <img class="key_textures" src="${getPlatformKey("VALIDATE")}"></img> ${getLocalizedLang('sing')}  
        <img class="key_textures" src="${getPlatformKey("REFRESH")}"></img> ${getLocalizedLang('refresh_songlist')}    
        <img class="key_textures" src="${getPlatformKey("BACK")}"></img> ${getLocalizedLang('back')}`;
}

function initializeSongList() {
    if (shouldFetchSongList()) {
        console.log('Fetching Songdb: ' + fetchUrl)
        selectedSong = -1;
        fetch(fetchUrl, { cache: "no-cache" })
            .then(response => response.json())
            .then(data => {
                gamevar.songdb = data;
                gamevar.currentSongdb = fetchUrl
                gamevar.refreshSongdb = false;
                renderSongList(data);
            });
    } else {
        renderSongList(gamevar.songdb);
    }
}

function shouldFetchSongList() {
    return gamevar.currentSongdb !== songdb || gamevar.songdb === undefined || gamevar.refreshSongdb === true;
}

function renderSongList(data) {
    const listContainer = document.querySelector(".songlist-container");
    listContainer.innerHTML = "";  // Clear any existing content

    data.forEach((item, index) => {
        let listItem = createSongListItem(item, index);
        listContainer.appendChild(listItem);
    });

    // Automatically select the first song
    try {
        document.querySelectorAll('.itemsong')[gamevar.selectedSong].click();
    } catch (err) {
        document.querySelectorAll('.itemsong')[0].click();
    }
}

function createSongListItem(item, index) {
    let listItem = document.createElement("div");
    listItem.classList.add('itemsong', 'notranslate', item.id);
    listItem.innerHTML = `
        <div class="song--decoration"><img loading="lazy" src="${item.assets.cover}"></img></div>
        <span class="song-title">${item.title}</span>`;

    listItem.addEventListener('click', () => handleSongSelection(item, index));

    return listItem;
}

function handleSongSelection(item, index) {
    if (selectedSong !== index) {
        playSelectionSound(index);
        updateSelectedSong(item, index);
    }
}

function playSelectionSound(index) {
    if (selectedSong < index) {
        globalfunc.playSfx(23605, 23864);
    } else {
        globalfunc.playSfx(23892, 24137);
    }
}

function updateSelectedSong(item, index) {
    deselectCurrentSong();
    setSelectedItem(item.id, item, index);
    document.querySelector('#gamevar').style.setProperty('--song-codename', item.id);
    selectNewSong(index);
}

function deselectCurrentSong() {
    const currentSelected = document.querySelector('.itemsong.selected');
    if (currentSelected) {
        currentSelected.classList.remove('selected');
    }
}

function selectNewSong(index) {
    document.querySelectorAll('.itemsong')[index].classList.add('selected');
    document.querySelectorAll('.itemsong')[index].scrollIntoView({
        behavior: 'smooth'
    });
}

function setSelectedItem(cdn, item, index) {
    if (timer) clearInterval(timer);
    showLoadingIndicator();
    updatePreviewDetails(item);
    setupVideoPlayer(item);
    selectedSong = index;
    gamevar.selectedSong = index;
    gamevar.selectedBase = item;
}

function showLoadingIndicator() {
    document.querySelector('.video--preview-container .video-loading').style.display = "block";
    $("#preview").css('opacity', '0').animate({ "opacity": "1" }, 500);
    $('.song--details').removeClass('show');
    $('.song--details').width()
    $('.song--details').addClass('show')
}

function updatePreviewDetails(item) {
    const preview = document.querySelector("#preview");
    preview.querySelector('.song-title').innerHTML = item.title;
    preview.querySelector('.song-artist').innerHTML = item.artist;

    try {
        updateBackgroundImages(item.assets.banner);
    } catch (e) {
        console.log(e);
    }
}

function updateBackgroundImages(banner) {
    document.querySelector("#banner").style.background = `center / cover url(${banner})`;
    document.querySelector("#video-banner").style.background = `center / cover url(${banner})`;
    document.querySelector(".video--preview").removeAttribute('poster');
}

function setupVideoPlayer(item) {
    const videoplayer = document.querySelector("#preview .video--preview");
    videoplayer.src = "";
    videoplayer.load();

    if (item.previewOffset === 0 && item.video.preview !== item.video.path) {
        fetch(item.video.preview)
            .then(response => response.blob())
            .then(blob => {
                videoplayer.src = window.URL.createObjectURL(blob);
            });
    } else {
        videoplayer.src = item.video.preview;
    }

    videoplayer.currentTime = item.previewOffset / 1000;
    videoplayer.volume = 0;

    videoplayer.oncanplay = () => videoplayer.play();
    videoplayer.onplay = () => startVideoPlayer(videoplayer, item.assets.banner);
    setupVideoPlayerEvents(videoplayer);
    startPreviewGlowEffect(videoplayer);
}

function startVideoPlayer(videoplayer, banner) {
    $('.video--preview').stop(true, true).animate({ volume: 0.6 }, { duration: 500, queue: false });
    videoplayer.setAttribute('poster', banner);
}

function setupVideoPlayerEvents(videoplayer) {
    videoplayer.addEventListener('waiting', () => {
        document.querySelector('.video--preview-container .video-loading').style.display = "block";
    });
    videoplayer.addEventListener('playing', () => {
        document.querySelector('.video--preview-container .video-loading').style.display = "none";
    });
}

function startPreviewGlowEffect(videoplayer) {
    const canvas = document.querySelector(".preview--glow");
    const ctx = canvas.getContext("2d");

    timer = setInterval(() => {
        if (gamevar.UIBlur) {
            canvas.classList.add('show');
            ctx.drawImage(videoplayer, 0, 0, 20, 20);
        }
    }, 1);
}

function sing() {
    if (!$('.button--sing').hasClass('clicked')) {
        globalfunc.playSfx(63559, 63757);
        $('.button--sing').addClass('clicked');
        $('.itemsong.selected').addClass('choosed');

        setTimeout(() => {
            globalfunc.startTransition(true, 'scene/ingame/page.html', 'scene/ingame/page.js', 4);
            $('.video--preview').stop(true, true).animate({ volume: 0 }, 500);
        }, 1000);
    }
}

function startsWithNumber(str) {
    return /^\d/.test(str);
}
