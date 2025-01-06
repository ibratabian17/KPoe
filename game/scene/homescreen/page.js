// Global Variables
var selectedSong = -1;
document.title = "KaraokePoe - Home";
var fetchUrl = "https://kpoe.prjktla.workers.dev/carousel/data";
var songdb = localStorage.getItem('songdb');
var fetchSongdbUrl = songdb ? songdb : "/songdb.json";
var timer = 0;
var isClicked = false
var replaceTimeout;
var previewTimeout;
document.querySelector('.song-metadata').classList.add('show');
SpatialNavigation.uninit();
var

    // Generate the carousel dynamically
    generateCarousel = (data) => {
        const home = document.querySelector('#tab.home');

        // Hero section
        const hero = document.createElement('div');
        hero.className = 'hero';
        hero.innerHTML = `
<div class="overlay"></div>
<img alt="${data.bigPic.title} Banner" src="${data.bigPic.assets.poster || data.bigPic.assets.banner}" />
<div class="content">
<a class="btn focusable" href="#">
    <i class="fas fa-play"></i>
    Sing now
</a>
        <h1 class="title">${data.bigPic.title}</h1>
        <p class="artist">${data.bigPic.artist}</p>
</div>
    `;
        hero.querySelector('.btn').onclick = () => {
            if (!isClicked) {
                SpatialNavigation.uninit()
                gamevar.selectedSong = -1;
                gamevar.selectedBase = data.bigPic;
                document.querySelector('#gamevar').style.setProperty('--song-codename', data.bigPic.id);
                document.querySelector("#video-banner").style.background = `center / cover url(${data.bigPic.assets.banner})`;
                sing()
                gamevar.lastFocused = ".hero .btn"
                const previewHandCurrent = document.querySelector('.previewHand.current');
                if (previewHandCurrent) {
                    previewHandCurrent.src = ""; // Menghapus sumber video
                }

                const previewHandNext = document.querySelector('.previewHand.next');
                if (previewHandNext) {
                    previewHandNext.src = ""; // Menghapus sumber video
                }
            }
        }
        hero.querySelector('.btn').onfocus = () => {
            debounce(playPreview(data.bigPic), 500)
        }
        home.appendChild(hero);

        // Categories
        data.categories.forEach(category => {
            const categoryDiv = document.createElement('div');
            categoryDiv.className = `category ${category.name.replaceAll(" ", "")}`;
            categoryDiv.innerHTML = `<h2>${category.name}</h2>`;

            const itemsDiv = document.createElement('div');
            itemsDiv.className = 'items';

            category.items.forEach(item => {
                const itemDiv = document.createElement('div');
                itemDiv.className = `itemsong notranslate ${item.id}`;
                itemDiv.innerHTML = `
                <div class="song--decoration">
                    <img loading="lazy" onload="" src="${item.assets.cover}">
                </div>
                <button class="fakebutton" onclick="this.parentNode.click()"></button>
                <span class="song-title">${item.title}</span>
            `;
                itemDiv.onclick = () => {
                    if (!isClicked) {
                        SpatialNavigation.uninit()
                        gamevar.selectedSong = -1;
                        gamevar.selectedBase = item;
                        document.querySelector('#gamevar').style.setProperty('--song-codename', item.id);
                        document.querySelector("#video-banner").style.background = `center / cover url(${item.assets.banner})`;
                        sing()
                        gamevar.lastFocused = `.category.${category.name.replaceAll(" ", "")} .${item.id} .fakebutton`
                        const previewHandCurrent = document.querySelector('.previewHand.current');
                        if (previewHandCurrent) {
                            previewHandCurrent.src = ""; // Menghapus sumber video
                        }

                        const previewHandNext = document.querySelector('.previewHand.next');
                        if (previewHandNext) {
                            previewHandNext.src = ""; // Menghapus sumber video
                        }
                    }
                }
                itemDiv.querySelector('.fakebutton').onfocus = () => {
                    debounce(playPreview(item, itemDiv), 500)
                    gamevar.lastFocused = `.category.${category.name.replaceAll(" ", "")} .${item.id} .fakebutton`
                }
                itemsDiv.appendChild(itemDiv);
            });

            categoryDiv.appendChild(itemsDiv);
            home.appendChild(categoryDiv);
        });

        SpatialNavigation.init();
        SpatialNavigation.add({
            selector: '.focusable, .item, .fakebutton',
            straightOnly: false,
            straightOverlapThreshold: 0.1,
            rememberSource: true,
            disabled: false,
            defaultElement: gamevar.lastFocused || ".hero",
            enterTo: 'last-focused',
            leaveFor: null,
            restrict: 'self-first',
            tabIndexIgnoreList: 'a, input, select, textarea, button, iframe, [contentEditable=true]',
            navigableFilter: null
        })
        SpatialNavigation.makeFocusable();
        SpatialNavigation.focus(gamevar.lastFocused);
        try {
            document.querySelector(gamevar.lastFocused).focus()
        } catch (err) {
        }
        document.querySelector('.carousel').classList.add('loaded')
        document.querySelector('.carousel').classList.add('smooth')
    };

// Fetch and Initialize Song List
initializeCarouselWithCustomDatabase();
updateShortcutKeys();

function updateShortcutKeys() {
    document.querySelector(".overlay-hi .shortcut").innerHTML = `
        <img class="key_textures" src="${getPlatformKey("VALIDATE")}"></img> ${getLocalizedLang('sing')}     
        <img class="key_textures" src="${getPlatformKey("BACK")}"></img> ${getLocalizedLang('back')}`;
}

function initializeCarouselWithCustomDatabase() {
    const carouselPromise = shouldFetchCarousel()
        ? fetch(fetchUrl, { cache: "no-cache" }).then(response => response.json())
        : Promise.resolve(gamevar.recommendation);

    const songdbPromise = shouldFetchSongList()
        ? fetch(fetchSongdbUrl, { cache: "no-cache" }).then(response => response.json())
        : Promise.resolve(gamevar.songdb);

    Promise.allSettled([carouselPromise, songdbPromise])
        .then(results => {
            const [carouselResult, songdbResult] = results;

            if (carouselResult.status === "fulfilled") {
                const carouselData = carouselResult.value;
                gamevar.recommendation = carouselData;

                if (songdbResult.status === "fulfilled") {
                    const songdbData = songdbResult.value;
                    gamevar.songdb = songdbData;
                    gamevar.currentSongdb = fetchUrl
                    gamevar.refreshSongdb = false;

                    // Check if "From your custom database" already exists
                    const existingCategory = carouselData.categories.find(
                        category => category.name === "From your custom database"
                    );

                    if (!existingCategory) {
                        // Add new category if it doesn't already exist
                        const customCategory = {
                            name: "From your custom database",
                            items: songdbData.map(song => ({
                                owner: "You",
                                id: song.id,
                                artist: song.artist,
                                title: song.title,
                                credit: song.credit,
                                video: song.video,
                                previewOffset: song.previewOffset || 0,
                                assets: song.assets,
                                json: song.json || null
                            }))
                        };

                        carouselData.categories.push(customCategory);
                    }
                }

                // Generate the updated Carousel
                generateCarousel(carouselData);
            } else {
                console.error("Failed to fetch Carousel data.");
            }
        })
        .catch(error => console.error("Error initializing carousel with custom database:", error));
}


// Modify shouldFetchSongList and shouldFetchCarousel if necessary
function shouldFetchCarousel() {
    return !gamevar.recommendation || gamevar.refreshSongdb;
}

function shouldFetchSongList() {
    return gamevar.currentSongdb !== songdb || gamevar.songdb === undefined || gamevar.refreshSongdb === true;
}


function sing() {
    isClicked = true
    globalfunc.playSfx(63559, 63757);
    document.querySelector('.carousel').classList.add('outro')

    setTimeout(() => {
        loadAnotherHTML('scene/songinfo/page.html', 'scene/songinfo/page.js', 5);
        $('.previewHand').stop(true, true).animate({ volume: 0 }, 500);
    }, 400);
}

function playPreview(data, div) {
    const currentPreview = document.querySelector('.previewHand.current');
    const nextPreview = document.querySelector('.previewHand.next');
    const previewUrl = data.video.previewAudio || data.video.preview;
    const previewId = data.id; // Menggunakan data.id sebagai pengenal unik
    if (!currentPreview || !nextPreview) {
        return;
    }

    // Cegah reset jika preview sudah diputar dan tidak di-pause berdasarkan data-id
    if ((currentPreview.dataset.id === previewId && !currentPreview.paused) ||
        (nextPreview.dataset.id === previewId && !nextPreview.paused)) {
        console.log('Skipping preview audio', previewId);
        return;
    }

    // Set atribut data-id untuk elemen nextPreview
    nextPreview.dataset.id = previewId;
    nextPreview.src = previewUrl;
    nextPreview.currentTime = (data.previewOffset || 0) / 1000;
    nextPreview.volume = 0;

    nextPreview.oncanplay = () => {
        // Jika ada pergantian sebelum timeout selesai, batalkan perubahan
        if (replaceTimeout) clearTimeout(replaceTimeout);

        previewTimeout = setTimeout(() => {
            // Pastikan hanya satu audio yang diputar
            if (!currentPreview.paused) {
                $(currentPreview).stop(true, true).animate({ volume: 0 }, 500);
            }

            currentPreview.classList.remove('current');
            currentPreview.classList.add('next');

            setTimeout(() => {
                currentPreview.pause();

                nextPreview.classList.remove('next');
                nextPreview.classList.add('current');

                if (getState() === 'homescreen') {
                    nextPreview.play();
                }

                $(nextPreview).stop(true, true).animate({ volume: 0.1 }, 500);
            }, 500);
        }, 500); // Delay 500mili sebelum pergantian
    };

    nextPreview.load();
}



