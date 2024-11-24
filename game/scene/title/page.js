var savedInput = localStorage.getItem('songdb');
document.title = "KaraokePoe - Edit Songdb";
var clicked = false
if (savedInput) {
    document.querySelector('.songdb').value = savedInput;
}

function saveToLocalStorage() {
    const inputValue = document.querySelector('.songdb').value;
    localStorage.setItem('songdb', inputValue);;
}

function startGame() {
    if (!clicked) {
        clicked = true
        saveToLocalStorage()
        globalfunc.startTransition(true, 'scene/songselection/page.html', 'scene/songselection/page.js')
        gamevar.isHomescreen = false
    }
}
function startHome() {
    if (!clicked) {
        clicked = true
        saveToLocalStorage()
        globalfunc.startTransition(true, 'scene/homescreen/page.html', 'scene/homescreen/page.js')
        gamevar.isHomescreen = true
    }
}
document.querySelector(".overlay-hi .shortcut").innerHTML = `<img class="key_textures" src="${getPlatformKey("VALIDATE")}"></img> ${getLocalizedLang('confirm')}`;
document.querySelector("#sceneDraw #play").innerHTML = `Press <img class="key_textures" src="${getPlatformKey("VALIDATE")}"></img> To Start`