//Keymapping Place
let clickCooldown = {
    homejs: false,
    pausejs: false,
    ingame: false
};
var keytask = {
    enter: (event) => {//Title Scene
        if (getState() == 'songselection' || getState() == 'songinfo' ) {
            document.querySelector('.button--sing').click();
        }
        if (getState() == 'start') {
            document.querySelector('.button--initgame').click()
        }
        if (getState() == 'title') {
            document.querySelector('#play').click()
        }
        if (getState() == 'ingame') {
            if (gamevar.isPaused) document.querySelector('.selected').click()
        }
    },
    arrowLeft: (event) => {
        if (getState() == 'songselection') {
            if (!clickCooldown.homejs) { // Check if cooldown is active
                clickCooldown.homejs = true; // Activate cooldown
                try {
                    const previousElement = document.querySelector('.selected').previousElementSibling;
                    if (previousElement) previousElement.click()
                } catch (err) {
                    document.querySelectorAll('.itemsong')[0].click()
                }
                event.preventDefault()
                setTimeout(() => {
                    clickCooldown.homejs = false; // Deactivate cooldown after a certain time (e.g., 1 second)
                }, 100);
            }
        }
        if (getState() == 'ingame' && gamevar.isPaused) {
            if (!clickCooldown.pausejs) { // Check if cooldown is active
                clickCooldown.pausejs = true; // Activate cooldown
                const previousElement = document.querySelector('.selected').previousElementSibling;
                if (previousElement) previousElement.click()
                event.preventDefault()
                setTimeout(() => {
                    clickCooldown.pausejs = false; // Deactivate cooldown after a certain time (e.g., 1 second)
                }, 100);
            }
        }
    },
    arrowRight: (event) => {
        if (getState() == 'songselection') {
            if (!clickCooldown.homejs) { // Check if cooldown is active
                clickCooldown.homejs = true; // Activate cooldown
                try {
                    const previousElement = document.querySelector('.selected').nextElementSibling;
                    if (previousElement) previousElement.click()
                } catch (err) {
                    document.querySelectorAll('.itemsong')[document.querySelectorAll('.itemsong').length - 1].click()
                }
                event.preventDefault()
                setTimeout(() => {
                    clickCooldown.homejs = false; // Deactivate cooldown after a certain time (e.g., 1 second)
                }, 100);
            }
        }
        if (getState() == 'ingame' && gamevar.isPaused) {
            if (!clickCooldown.pausejs) { // Check if cooldown is active
                clickCooldown.pausejs = true; // Activate cooldown
                const previousElement = document.querySelector('.selected').nextElementSibling;
                if (previousElement) previousElement.click()
                event.preventDefault()
                setTimeout(() => {
                    clickCooldown.pausejs = false; // Deactivate cooldown after a certain time (e.g., 1 second)
                }, 100);
            }
        }
    },
    F1: (event) => {
        if (getState() == 'songselection') {
            event.preventDefault()
            gamevar.refreshSongdb = true
            globalfunc.startTransition(true, 'scene/songselection/page.html', 'scene/songselection/page.js')
        }
    },
    ESC: (event) => {
        if (getState() == 'songselection' || getState() == 'homescreen') {
            event.preventDefault()
            globalfunc.startTransition(true, 'scene/title/page.html', 'scene/title/page.js')
        }
        if (getState() == 'songinfo') {
            event.preventDefault()
            loadAnotherHTML('scene/homescreen/page.html', 'scene/homescreen/page.js')
        }
        if (getState() == 'ingame') {
            event.preventDefault()
            if (!clickCooldown.ingame) { // Check if cooldown is active
                clickCooldown.ingame = true; // Activate cooldown
                if (gamevar.isPaused) {
                    player.play();
                    document.querySelector('#pausescreen').style.opacity = 0;
                    document.querySelector('#pausescreen').style.transition = 'opacity .5s'
                    setTimeout(function () { document.querySelector('#pausescreen').style.display = 'none' }, 500)
                    document.querySelector(".overlay-hi .shortcut").innerHTML = ``;
                    document.querySelector('.hud').classList.remove('paused')
                }
                else {
                    player.pause();
                    document.querySelector('#pausescreen').style.display = 'block'
                    document.querySelector('#pausescreen').style.opacity = 1;
                    document.querySelector(".overlay-hi .shortcut").innerHTML = `<img class="key_textures" src="${getPlatformKey("VALIDATE")}"></img> ${getLocalizedLang('confirm')}  <img class="key_textures" src="${getPlatformKey("BACK")}"></img> ${getLocalizedLang('back')}`;
                    document.querySelector('.hud').classList.add('paused')
                }
                gamevar.isPaused = !gamevar.isPaused
                setTimeout(() => {
                    clickCooldown.ingame = false; // Deactivate cooldown after a certain time (e.g., 1 second)
                }, 500);
            }
        }
    }
}

function keymap(event) {
    gamevar.isGamepad = false
    if (event.key === 'Enter') {
        keytask.enter(event)
    }
    if (event.key === 'ArrowLeft') {
        keytask.arrowLeft(event)
    }
    if (event.key === 'ArrowRight') {
        keytask.arrowRight(event)
    }
    if (event.key === 'F1') {
        keytask.F1(event)
    }
    if (event.key === 'Escape') {
        keytask.ESC(event)
    }
}
setTimeout(function () {
    document.addEventListener('keydown', keymap);
    console.log('Keyboard Keymapping Initialized')
}, 200)


// Check for gamepad support
if (navigator.getGamepads) {
    // Set up an interval to check for gamepad input
    setInterval(checkGamepad, 100);
}

function checkGamepad() {
    // Get the list of connected gamepads
    const gamepads = navigator.getGamepads();

    // Iterate through each gamepad
    for (const gamepad of gamepads) {
        // Check if the gamepad is connected
        if (gamepad) {
            // Handle gamepad input
            handleGamepadInput(gamepad);
        }
    }
}

function handleGamepadInput(gamepad) {
    // Access the buttons and axes of the gamepad
    const buttons = gamepad.buttons;
    const axes = gamepad.axes;

    // Map gamepad input to keyboard keys
    // You can customize this based on your needs
    const keyMappings = {
        0: 'enter',
        1: 'ESC',
        4: 'F2',
        12: 'arrowUp',
        13: 'arrowDown',
        14: 'arrowLeft',
        15: 'arrowRight',
        // Add more mappings as needed
    };

    // Iterate through buttons
    buttons.forEach((button, index) => {
        if (button.pressed) {
            gamevar.isGamepad = true
            try {
                keytask[keyMappings[index]]({ preventDefault: function () { } })
            } catch (err) {
                console.log(index)
            }
        }
    });
}


function getState() {
    const lastPath = document.querySelector('body').getAttribute('currentscene');
    return lastPath
}

function getPlatformKey(key = "VALIDATE") {
    var keyTexture;
    if (!gamevar.isGamepad) {
        keyTexture = {
            "VALIDATE": "assets/textures/ui/key_enter.webp",
            "BACK": "assets/textures/ui/key_esc.webp",
            "REFRESH": "assets/textures/ui/key_f1.webp"
        }
    } else {
        keyTexture = {
            "VALIDATE": "assets/textures/ui/key_a.webp",
            "BACK": "assets/textures/ui/key_b.webp",
            "REFRESH": "assets/textures/ui/key_y.webp"
        }
    }
    return keyTexture[key]
}