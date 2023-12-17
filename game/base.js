var bkg_audio = document.getElementById("bkg_audio");
const gamevar = {
  "songlistUrl": "songlist.json"
}
const globalfunc = {}

var elem = document.documentElement;

/* View in fullscreen */
function openFullscreen() {
  if (elem.requestFullscreen) {
    elem.requestFullscreen();
  } else if (elem.webkitRequestFullscreen) { /* Safari */
    elem.webkitRequestFullscreen();
  } else if (elem.msRequestFullscreen) { /* IE11 */
    elem.msRequestFullscreen();
  }
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
  fetch(path)
    .then(response => response.text())
    .then(html => {
      document.getElementById('sceneDraw').innerHTML = html;
    })
    .then(() => {

      if (jspath) loadJS(jspath)
    })
    .catch(error => {
      console.log('Error loading HTML:', error);
    });
}
function loadJS(path) {
  const oldScene = document.querySelector(".CurrentScene");
  if (oldScene) oldScene.remove()
  const scripts = document.createElement("script");
  scripts.classList.add("CurrentScene")
  scripts.src = path;
  document.body.appendChild(scripts);
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

globalfunc.getFileText = (url) => {
  return fetch(url)
    .then(response => response.json())

}

window.addEventListener("resize", adjustGameDimensions);
adjustGameDimensions()
loadAnotherHTML('scene/start/page.html', 'scene/start/page.js')