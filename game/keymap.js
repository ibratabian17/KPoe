//Keymapping Place
let clickCooldown = {
    homejs: false
};
function keymap(event) {
    if (event.key === 'Enter') {
        //Title Scene
        if (getState() == 'title.js') {
            setAudiobkgVol(0)
            gfunc.startTransition(true, 'scene/ui/home.html', 'scene/act/home.js', 0)
            gfunc.onkeypressed = null;
            document.removeEventListener('keydown', dance);
        }
        if (getState() == 'songselection') {
            document.querySelector('.button--sing').click();
        }
    }
    if (event.key === 'ArrowLeft') {
        if (getState() == 'songselection') {
            if (!clickCooldown.homejs) { // Check if cooldown is active
                clickCooldown.homejs = true; // Activate cooldown
                const previousElement = document.querySelector('.selected').previousElementSibling;
                if(previousElement)previousElement.click()
                event.preventDefault()
                setTimeout(() => {
                    clickCooldown.homejs = false; // Deactivate cooldown after a certain time (e.g., 1 second)
                }, 100);
            }
        }
    }
    if (event.key === 'ArrowRight') {
        if (getState() == 'songselection') {
            if (!clickCooldown.homejs) { // Check if cooldown is active
                clickCooldown.homejs = true; // Activate cooldown
                const previousElement = document.querySelector('.selected').nextElementSibling;
                if(previousElement)previousElement.click()
                event.preventDefault()
                setTimeout(() => {
                    clickCooldown.homejs = false; // Deactivate cooldown after a certain time (e.g., 1 second)
                }, 100);
            }
        }
    }
}
document.addEventListener('keydown', keymap);

function getState() {
    const image = document.querySelector(".CurrentScene");
    const src = image.getAttribute('src');
    const pathParts = src.split('/');
    const lastPath = pathParts[pathParts.length - 2];
    return lastPath
}