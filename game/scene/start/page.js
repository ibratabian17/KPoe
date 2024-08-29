var warningtext = ""
document.title = "KaraokePoe - Initializing";
var clicked = false
if (navigator.userAgent.includes('Electron')) {
    warningtext = "KPoe Love You"
    warningtext = "This game requires a song list from the user"
    document.querySelector('.txt-warning').innerHTML = warningtext
    setTimeout(function () { loadAnotherHTML('scene/title/page.html', 'scene/title/page.js') }, 2000)


} else {
    document.querySelector(".overlay-hi .shortcut").innerHTML = `<img class="key_textures" src="${getPlatformKey("VALIDATE")}"></img> Start Game`;
    warningtext = `${getLocalizedLang('songlist_warn')}`
    cacheFile()
}
document.querySelector('.txt-warning').innerHTML = warningtext

async function cacheFile() {
    try {
        cachedScene = {
            "scene/title/page.html": await a('scene/title/page.html'),
            "scene/title/page.js": await a('scene/title/page.js'),
            "scene/title/page.css": await a('scene/title/page.css'),
            "scene/songselection/page.html": await a('scene/songselection/page.html'),
            "scene/songselection/page.js": await a('scene/songselection/page.js'),
            "scene/songselection/page.css": await a('scene/songselection/page.css'),
            "scene/ingame/page.html": await a('scene/ingame/page.html'),
            "scene/ingame/page.js": await a('scene/ingame/page.js'),
            "scene/ingame/page.css": await a('scene/ingame/page.css')
        }
        document.querySelector('.txt-wait').innerHTML = `Fetching Done!`
        document.querySelector('.button--initgame').classList.add('readya')
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}
function initgame() {
    if (!clicked) {
        clicked = true
        globalfunc.startTransition(true, 'scene/title/page.html', 'scene/title/page.js')
        openFullscreen()
    }
}
async function a(url) {
    const ab = await fetch(url)
    document.querySelector('.txt-wait').innerHTML = `Please Wait\nFetched: ${url}`
    const data = await ab.text();
    return data;
}


