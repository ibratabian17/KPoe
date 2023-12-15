const savedInput = localStorage.getItem('songdb');
if (savedInput) {
    document.querySelector('.songdb').value = savedInput;
}

function saveToLocalStorage() {
    const inputValue = document.querySelector('.songdb').value;
    localStorage.setItem('songdb', inputValue);
}

function startGame() {
    saveToLocalStorage()
    globalfunc.startTransition(true, 'scene/songselection/page.html', 'scene/songselection/page.js')
}