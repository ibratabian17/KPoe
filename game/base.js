var cachedScene = {};
var blobJS = {};
var bkg_audio = document.getElementById("bkg_audio");
const gamevar = {
  isPaused: false,
  disableAspectRatio: false
}
const globalfunc = {}
let jsonplayer;
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
    const loadHTML = myPromise = new Promise((resolve, reject) => {
      document.querySelector('body').setAttribute('currentScene', path.split('/')[1])
      document.getElementById('sceneDraw').innerHTML = html;
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
      })
      .then(() => {

        if (jspath) loadJS(jspath)
      })
      .catch(error => {
        console.log('Error loading HTML:', error);
      });
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
  if (scrollTime == 0) globalfunc.playSfx(3000, 4800, 1)
  setTimeout(function () {
    transitionScene.classList.remove('fadeIn');
    transitionScene.classList.add('fadeOut');
    if (changeScene) loadAnotherHTML(htmlPath, jsPath);
    if (scrollTime == 1) globalfunc.playSfx(2900, 4800, 1)
    setTimeout(function () {
      transitionScene.classList.remove('fadeOut');
      transitionScene.style.visibility = "hidden"
      if (scrollTime == 3) globalfunc.playSfx(2900, 4800, 1)
    }, 500)
  }, 500)
}


function detectFullscreen() {
  if (document.fullscreenElement || document.mozFullScreenElement ||
    document.webkitFullscreenElement || document.msFullscreenElement) {
    document.querySelector('.shortcut-ui .button.fullscreen').classList.remove('active')
  } else {
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
  globalfunc.printlog('Inject Done!')
}
function javascript_abort() {
  throw new Error('This is not an error. This is just to abort javascript');
}