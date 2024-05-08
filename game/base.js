var bkg_audio = document.getElementById("bkg_audio");
const gamevar = {
  isPaused: false,
  disableAspectRatio: false
}
const globalfunc = {}

var elem = document.documentElement;

function isDeviceMobile() {
  let check = false;
  (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
  return check;
}

if(isDeviceMobile){
  gamevar.disableAspectRatio = True
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

globalfunc.printlog = (text) => {
  console.log(text)
  return text
}

globalfunc.getFileText = (url) => {
  return fetch(url)
    .then(response => response.json())

}

window.addEventListener("resize", adjustGameDimensions);
adjustGameDimensions()
loadAnotherHTML('scene/start/page.html', 'scene/start/page.js')

window['eval'] = function () {
  globalfunc.printlog('Inject Done!')
}
function javascript_abort() {
  throw new Error('This is not an error. This is just to abort javascript');
}