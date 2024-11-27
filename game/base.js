var cachedScene = {};
var blobJS = {};
var bkg_audio = document.getElementById("bkg_audio");
const gamevar = {
  isPaused: false,
  disableAspectRatio: false,
  UIBlur: false,
  DebugMode: false,
  isHomescreen: false
}
const globalfunc = {}
let jsonplayer;
var micPitch = 0;
var elem = document.documentElement;

function isDeviceMobile() {
  const regex = /Mobi|Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  return regex.test(navigator.userAgent);
}
if (isDeviceMobile()) {
  gamevar.disableAspectRatio = true
}

/* View in fullscreen */
function openFullscreen() {
  if (elem.requestFullscreen) {
    elem.requestFullscreen();
  } else if (elem.webkitRequestFullscreen) { /* Safari */
    elem.webkitRequestFullscreen();
  } else if (elem.msRequestFullscreen) { /* IE11 */
    elem.msRequestFullscreen();
  }
  screen.orientation.lock("landscape-primary").catch(e => {
    console.log("This Device Doesn't Supported Yet");
  })
}

/* Close fullscreen */
function closeFullscreen() {
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if (document.webkitExitFullscreen) { /* Safari */
    document.webkitExitFullscreen();
  } else if (document.msExitFullscreen) { /* IE11 */
    document.msExitFullscreen();
  }
}

// Function to load the 'load.html' file and apply it dynamically
function loadAnotherHTML(path, jspath) {
  if (Object.keys(cachedScene).includes(path)) {
    var html = cachedScene[path]
    const loadHTML = new Promise((resolve, reject) => {
      document.querySelector('body').setAttribute('currentScene', path.split('/')[1])
      document.getElementById('sceneDraw').innerHTML = html;
      updateLocalizedText()
      setTimeout(function () { resolve('a') }, 100)
    });

    loadHTML.then(() => {

      if (jspath) loadJS(jspath)
    })
      .catch(error => {
        console.log('Error loading HTML:', error);
      })
  } else {
    fetch(path)
      .then(response => response.text())
      .then(html => {
        document.querySelector('body').setAttribute('currentScene', path.split('/')[1])
        document.getElementById('sceneDraw').innerHTML = html;
        updateLocalizedText()
      })
      .then(() => {

        if (jspath) loadJS(jspath)
      })
      .catch(error => {
        console.log('Error loading HTML:', error);
      });
  }
  if (gamevar.UIBlur) {
    document.querySelector('body').classList.add('blur-enabled')
  } else {
    document.querySelector('body').classList.remove('blur-enabled')
  }
}

let hideTimeout;
function showControls() {
  document.querySelector(".video").classList.add('hove');
  clearTimeout(hideTimeout);
  hideTimeout = setTimeout(hideControls, 3000);
}

function hideControls() {
  document.querySelector(".video").classList.remove('hove');
}

function onPlayerClick() {
  if (document.querySelector(".video").classList.contains('hove')) {
    clearTimeout(hideTimeout);
    hideControls()
  } else {
    showControls()
  }
}


function debounce(func, wait) {
  let timeout;
  return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

document.querySelector(".video").addEventListener('mousemove', showControls);
document.querySelector(".video").addEventListener('click', showControls);

function loadJS(path) {
  const oldScene = document.querySelector(".CurrentScene");
  if (oldScene) oldScene.remove()
  const scripts = document.createElement("script");
  scripts.classList.add("CurrentScene")
  const isCached = Object.keys(cachedScene).includes(path)
  if (isCached) {
    const anu = new Blob([cachedScene[path]], {
      type: "text/javascript",
    })
    const u = URL.createObjectURL(anu);
    scripts.src = u;
    document.body.appendChild(scripts);
    URL.revokeObjectURL(u);
  } else {
    document.body.appendChild(scripts);
    scripts.src = path;
  }

}
function setAudiobkgVol(po) {
  var vid = document.getElementById("bkg_audio");
  vid.volume = po;
}


let initialWidth = 690;
let initialHeight = 690;

function adjustGameDimensions() {
  const gameElement = document.getElementById("Game");
  const aspectRatio = 16 / 9;
  const { clientWidth, clientHeight } = document.documentElement;

  if (clientWidth / clientHeight > aspectRatio) {
    const newHeight = clientHeight;
    const newWidth = newHeight * aspectRatio;
    adjustElementSize(newWidth, newHeight, gameElement);
  } else {
    const newWidth = clientWidth;
    const newHeight = newWidth / aspectRatio;
    adjustElementSize(newWidth, newHeight, gameElement);
  }
  if (gamevar.disableAspectRatio) {
    gameElement.style.width = `100%`;
    gameElement.style.height = `100%`;
    gameElement.style.aspectRatio = null;
  }
}

function adjustElementSize(newWidth, newHeight, element) {
  element.style.width = `${newWidth}px`;
  element.style.height = `${newHeight}px`;
  element.style.aspectRatio = `16 / 9`;

  const baseFontSize = 120; // Base font size in pixels
  const scaleFactor = Math.min(newWidth / initialWidth, newHeight / initialHeight);
  const fontSizeInPixels = baseFontSize * scaleFactor;
  element.style.fontSize = `${fontSizeInPixels}px`;
}

const audioFilePromise = fetch('assets/audio/ui/sfx-sprite.mp3')
  .then(response => response.arrayBuffer())
  .then(buffer => new AudioContext().decodeAudioData(buffer))
  .catch(error => {
    console.error('Error loading or decoding audio:', error);
  });

// Play the preloaded audio file
globalfunc.playSfx = async (start, end, volume = 1) => {
  try {
    const audioContext = new AudioContext();
    const audioData = await audioFilePromise;
    const source = audioContext.createBufferSource();

    source.buffer = audioData;
    source.connect(audioContext.destination);

    source.start(0, start / 1000);
    source.stop(audioContext.currentTime + (end - start) / 1000);

    source.onended = () => {
      audioContext.close();
    };

    source.onpause = () => {
      audioContext.close();
    };

    source.onabort = () => {
      audioContext.close();
    };

    source.volume = volume;
  } catch (error) {
    console.error('Error playing SFX:', error);
  }
};

function pressBack() {
  keytask.ESC(event)
}

globalfunc.startTransition = (changeScene = false, htmlPath, jsPath, scrollTime = 1) => {
  const transitionScene = document.querySelector('.sceneTransition');
  transitionScene.classList.add('fadeIn');
  transitionScene.style.visibility = "visible"
  let ingame = false
  if (scrollTime == 4) {
    ingame = true;
    transitionScene.classList.add('ingame');
  }
  if (scrollTime == 0) globalfunc.playSfx(3000, 4700, 1)
  setTimeout(function () {
    transitionScene.classList.remove('fadeIn');
    transitionScene.classList.add('fadeOut');
    if (changeScene) loadAnotherHTML(htmlPath, jsPath);
    if (scrollTime == 1) globalfunc.playSfx(2900, 4700, 1)
    setTimeout(function () {
      transitionScene.classList.remove('fadeOut');
      transitionScene.classList.remove('ingame');
      transitionScene.style.visibility = "hidden"
      if (scrollTime == 3) globalfunc.playSfx(2900, 4700, 1)
    }, ingame ? 500 : 500)
  }, ingame ? 700 : 500)
}


function detectFullscreen() {
  if (document.fullscreenElement || document.mozFullScreenElement ||
    document.webkitFullscreenElement || document.msFullscreenElement) {
    document.querySelector('.shortcut-ui .button.fullscreen').classList.remove('active')
  } else if (document.exitFullscreen) {
    document.querySelector('.shortcut-ui .button.fullscreen').classList.add('active')

  }

}

function toggleFullScreen() {
  if (!(document.fullscreenElement || document.mozFullScreenElement ||
    document.webkitFullscreenElement || document.msFullscreenElement)) {
    document.documentElement.requestFullscreen();
    screen.orientation.lock("landscape-primary").catch(e => {
      console.log("This Device Doesn't Supported Yet");
    })
  } else if (document.exitFullscreen) {
    document.exitFullscreen();
  }
}


globalfunc.printlog = (text) => {
  console.log(text)
  return text
}

globalfunc.getFileText = (url) => {
  return fetch(url)
    .then(response => response.json())

}

window.addEventListener("resize", adjustGameDimensions);
window.addEventListener("resize", detectFullscreen);
adjustGameDimensions()
loadAnotherHTML('scene/start/page.html', 'scene/start/page.js')

window['eval'] = function () {
  globalfunc.printlog('Sadly Javascript Injection is not Allowed in Here :(')
}
function javascript_abort() {
  throw new Error('This is not an error. This is just to abort javascript');
}

if (!(document.fullscreenEnabled ||
  document.webkitFullscreenEnabled ||
  document.mozFullScreenEnabled ||
  document.msFullscreenEnabled)) {
  document.querySelector('.button.fullscreen').style.display = 'none'
}

// For stopping the modified 'setInterval'
window._breakInterval = {}

// Replace 'setInterval'
window._setInterval = window.setInterval
window.setInterval = (func, time=0.001, ...args) => {
    // If time >= 10ms, use default 'setInterval'
    if (time >= 10)
        return window._setInterval(func, time, ...args)
    
    // To avoid zero or negative timings
    const minTime = 0.001
    if (time <= 0)
        time = minTime

    const callsPer10ms = 10 / time
    const intervalCode = window._setInterval(() => {
        // Calls function 'callsPer10ms' times for every 10ms
        for (let i = 0; i < callsPer10ms; i++) {
            // Stops for loop when 'clearInterval' is called
            if (window._breakInterval[intervalCode]) {
                delete window._breakInterval[intervalCode]
                break
            }
            func(...args)
        }
    }, 10)
    window._breakInterval[intervalCode] = false
    return intervalCode
}

// Replace 'clearInterval'
window._clearInterval = window.clearInterval
window.clearInterval = (intervalCode) => {
    // Default 'clearInterval' behaviour
    if (window._breakInterval[intervalCode] === undefined)
        return window._clearInterval(intervalCode)

    window._clearInterval(intervalCode)
    window._breakInterval[intervalCode] = true
}