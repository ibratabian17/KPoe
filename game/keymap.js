//Keymapping Place
let clickCooldown = {
    homejs: false
};
var keytask = {
    enter: (event) => {//Title Scene
        if (getState() == 'songselection') {
            document.querySelector('.button--sing').click();
        }
        if (getState() == 'start') {
            document.querySelector('.button--initgame').click()
        }
        if (getState() == 'title') {
            document.querySelector('#play').click()
        }
    },
    arrowLeft: (event) => {
        if (getState() == 'songselection') {
            if (!clickCooldown.homejs) { // Check if cooldown is active
                clickCooldown.homejs = true; // Activate cooldown
                const previousElement = document.querySelector('.selected').previousElementSibling;
                if (previousElement) previousElement.click()
                event.preventDefault()
                setTimeout(() => {
                    clickCooldown.homejs = false; // Deactivate cooldown after a certain time (e.g., 1 second)
                }, 100);
            }
        }
    },
    arrowRight: (event) => {
        if (getState() == 'songselection') {
            if (!clickCooldown.homejs) { // Check if cooldown is active
                clickCooldown.homejs = true; // Activate cooldown
                const previousElement = document.querySelector('.selected').nextElementSibling;
                if (previousElement) previousElement.click()
                event.preventDefault()
                setTimeout(() => {
                    clickCooldown.homejs = false; // Deactivate cooldown after a certain time (e.g., 1 second)
                }, 100);
            }
        }
    },
    F1: (event) => {
        if (getState() == 'songselection') {
            gamevar.refreshSongdb = true
            globalfunc.startTransition(true, 'scene/songselection/page.html', 'scene/songselection/page.js')
        }
    },
    ESC: (event) => {
        if (getState() == 'songselection') {
            event.preventDefault()
            globalfunc.startTransition(true, 'scene/title/page.html', 'scene/title/page.js')
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
document.addEventListener('keydown', keymap);

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
            try{
            keytask[keyMappings[index]]({ preventDefault: function () { } })
            } catch(err) {
                console.log(index)
            }
        }
    });
}


function getState() {
    const image = document.querySelector(".CurrentScene");
    const src = image.getAttribute('src');
    const pathParts = src.split('/');
    const lastPath = pathParts[pathParts.length - 2];
    return lastPath
}