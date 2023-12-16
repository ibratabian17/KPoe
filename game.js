const { app, BrowserWindow, Menu, session } = require('electron');
const path = require('path');
const url = require('url');
const { ipcMain } = require('electron');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    fullscreen: true,
    autoHideMenuBar: true,
    width: 1066,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      sandbox: false,
    },
    icon: path.join(__dirname, 'game/assets/textures/ui/JD_Series.webp')
  });
   /*const emptyMenu = Menu.buildFromTemplate([]);
   mainWindow.setMenu(emptyMenu);*/

  const mainSession = mainWindow.webContents.session;
  mainSession.webRequest.onBeforeSendHeaders({ urls: ['*://*/*'] }, (details, callback) => {
    details.requestHeaders['Referer'] = 'https://ibratabian17.github.io';

    callback({ cancel: false, requestHeaders: details.requestHeaders });
  });

  mainWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, 'game/base.html'),
      protocol: 'file:',
      slashes: true
    })
  );

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
