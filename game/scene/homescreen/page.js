
// Global Variables
var selectedSong = -1;
document.title = "KaraokePoe - Home";
var fetchUrl = "https://kpoe.prjktla.workers.dev/carousel/data";
var timer = 0;
var isClicked = false
console.log('Initing ...');
document.querySelector('.song-metadata').classList.add('show');
SpatialNavigation.uninit();

// Generate the carousel dynamically
const generateCarousel = (data) => {
    const carousel = document.querySelector('.carousel');

    // Hero section
    const hero = document.createElement('div');
    hero.className = 'hero';
    hero.innerHTML = `
<div class="overlay"></div>
<img alt="${data.bigPic.title} Banner" src="${data.bigPic.assets.banner}" />
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
        }
    }
    carousel.appendChild(hero);

    // Categories
    data.categories.forEach(category => {
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'category';
        categoryDiv.innerHTML = `<h2>${category.name}</h2>`;

        const itemsDiv = document.createElement('div');
        itemsDiv.className = 'items';

        category.items.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = `itemsong notranslate ${item.id}`;
            itemDiv.innerHTML = `
                <div class="song--decoration">
                    <img loading="lazy" src="${item.assets.cover}" alt="${item.title} Cover">
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
                }
            }
            itemsDiv.appendChild(itemDiv);
        });

        categoryDiv.appendChild(itemsDiv);
        carousel.appendChild(categoryDiv);
    });

    SpatialNavigation.init();
    SpatialNavigation.add({
        selector: '.focusable, .item, .fakebutton'
    });
    SpatialNavigation.makeFocusable();
    SpatialNavigation.focus();
};

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
                gamevar.recommendation = data;
                gamevar.refreshSongdb = false;
                generateCarousel(data);
            });
    } else {
        generateCarousel(gamevar.recommendation);
    }
}

function shouldFetchSongList() {
    return gamevar.recommendation === undefined || gamevar.refreshSongdb === true;
}

function sing() {
    isClicked = true
    globalfunc.playSfx(63559, 63757);

    setTimeout(() => {
        globalfunc.startTransition(true, 'scene/ingame/page.html', 'scene/ingame/page.js', 4);
    }, 1000);
}