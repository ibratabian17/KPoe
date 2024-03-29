var warningtext = ""
document.title = "KaraokePoe - Initializing";
var clicked = false
if (navigator.userAgent.includes('Electron')) {
    loadAnotherHTML('scene/title/page.html', 'scene/title/page.js')
} else {
    document.querySelector(".overlay-hi .shortcut").innerHTML = `<img class="key_textures" src="assets/textures/ui/key_enter.webp"></img>:Start Game`;
    warningtext = "Downloading all files and caching them, may take some time"
    cacheFile()
}
document.querySelector('.txt-warning').innerHTML = warningtext

async function cacheFile() {
    try {
        const jquery = await a('library/jquery.min.js');
        const hlsjs = await a('library/hls.js');
        const titlehtml = await a('scene/title/page.html');
        const titlejs = await a('scene/title/page.js');
        const titlecss = await a('scene/title/page.css');
        const songselectionhtml = await a('scene/songselection/page.html');
        const songselectionjs = await a('scene/songselection/page.js');
        const songselectioncss = await a('scene/songselection/page.css');
        const ingamehtml = await a('scene/ingame/page.html');
        const ingamejs = await a('scene/ingame/page.js');
        const ingamecss = await a('scene/ingame/page.css');
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
}



