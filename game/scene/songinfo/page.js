var youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;

getYoutubeId = (url) => {
    let VID_REGEX =
        /(?:youtube(?:-nocookie)?\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    return url.match(VID_REGEX)[1];
};

function setPreview(data) {
    const preview = document.querySelector('.video--preview');
    const previewYoutube = document.querySelector('.video--youtube');
    preview.addEventListener('waiting', () => {
        document.querySelector('.video--preview-container .video-loading').style.display = "block";
    });
    preview.addEventListener('playing', () => {
        document.querySelector('.video--preview-container .video-loading').style.display = "none";
    });

    if (youtubeRegex.test(data.video.preview)) {
        // Handle YouTube preview
        const videoId = getYoutubeId(data.video.preview);
        const startTime = data.previewOffset / 1000; // Convert ms to seconds

        // If iframe does not exist, create one
        if (!previewYoutube.src || !previewYoutube.src.includes(videoId)) {
            previewYoutube.src = `https://www.youtube-nocookie.com/embed/${videoId}?start=${Math.floor(startTime)}s&autoplay=1&controls=0&modestbranding=1&rel=0&showinfo=0&enablejsapi=1`;
        }
        previewYoutube.style.display = 'block'; // Show YouTube iframe
        preview.style.display = 'none'; // Hide regular video preview
        document.querySelector('.video--preview-container .video-loading').style.display = "none";
    } else {
        // Handle regular video preview
        if (data.video.preview && preview.src !== data.video.preview) {
            preview.src = data.video.preview; // Update video source
            preview.currentTime = data.previewOffset / 1000; // Set start time
            preview.volume = 0; // Start with low volume
            preview.oncanplay = () => {
                if (getState() == "songinfo") {
                    preview.play(); // Play video
                    $(preview).stop(true, true).animate({ volume: 0.5 }, 500);
                }
                else {
                    preview.src = ""
                    preview.load()
                }
            }
        }
        preview.style.display = 'block'; // Show regular video preview
        previewYoutube.style.display = 'none'; // Hide YouTube iframe
    }
    if(data.assets.titlecard && data.assets.titlecard.length > 0){
        document.querySelector('.song--details').classList.add('hastitle');
        document.querySelector('.song-logos').src = data.assets.titlecard;
    }

    updatePreviewDetails(data);
}

function updatePreviewDetails(item) {
    const banner = item.assets.poster || item.assets.cover;
    const preview = document.querySelector("#preview");
    const credit = item.credit || "NO CREDIT"
    preview.querySelector('.song-title').innerText = item.title;
    preview.querySelector('.song-artist').innerText = item.artist;
    document.querySelector('.song-credits').innerText = `Added By ${item.owner} || Last Updated at ${timeConverter(item.lastAdded || 0)}\n${credit}`;
    document.querySelector('.video--preview').setAttribute('poster', banner);

    try {
        updateBackgroundImages(item.assets.banner);
    } catch (e) {
        console.log(e);
    }
}

function updateBackgroundImages(banner) {
    document.querySelector("#banner").style.background = `center / cover url(${banner})`;
    document.querySelector("#video-banner").style.background = `center / cover url(${banner})`;
}

setPreview(gamevar.selectedBase);

function sing() {
    if (!$('.button--sing').hasClass('clicked')) {
        globalfunc.playSfx(63559, 63757);
        $('.button--sing').addClass('clicked');

        setTimeout(() => {
            const preview = document.querySelector('.video--preview');
            setTimeout(() => {
                preview.src = ""
                preview.load()
            }, 1000);
            globalfunc.startTransition(true, 'scene/ingame/page.html', 'scene/ingame/page.js', 4);
            $('.video--preview, .video--youtube').stop(true, true).animate({ volume: 0 }, 500);
        }, 1000);
    }
}

function timeConverter(UNIX_timestamp) {
    var a = new Date(UNIX_timestamp);
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var year = a.getFullYear();
    var month = months[a.getMonth()];
    var date = a.getDate();
    var time = date + ' ' + month + ' ' + year;
    return time;
}