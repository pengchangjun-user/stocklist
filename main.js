const {
    app,
    BrowserWindow,
    ipcMain,
    Menu,
    dialog
} = require('electron')

const path = require("path")
const isDev = require('electron-is-dev')
const {
    autoUpdater
} = require("electron-updater")

let win;

// 利用electron-debug，添加和Chrome类似的快捷键
isDev && require('electron-debug')({
    enabled: true,
    showDevTools: false
});


function createWindow() {
    // 创建浏览器窗口。
    win = new BrowserWindow({
        width: 1440,
        height: 960,
        frame: false,
        webPreferences: {
            nodeIntegration: true,
        }
    });

    // 然后加载应用的 index.html, 因为对main.js打包了，main.js出现在build文件夹里面，所以直接写'./index.html'
    const localUrl = isDev ? 'http://localhost:3000' : `file://${path.join(__dirname, './index.html')}`
    win.loadURL(localUrl);
    // win.webContents.openDevTools()

    win.once('ready-to-show', () => {
        win.show()
    })

    // 当 window 被关闭，这个事件会被触发。
    win.on('closed', () => {
        win = null;
    });
}

app.on('ready', () => {
    // 因为release后会生成一个app-update.yml文件，但是在调试阶段，没法生成，所以手动写一个这样的文件，然后做一个判断是否在调试阶段还是生产阶段
    if (isDev) {
        autoUpdater.updateConfigPath = path.join(__dirname, 'dev-app-update.yml')
    }
    // 关闭自动下载，方便后面手动触发下载
    autoUpdater.autoDownload = false
    // 这个方法在生产环境中使用
    autoUpdater.checkForUpdatesAndNotify()
    // 这个方法在开发环境中使用，用于在开发环境中调试是否有跟新的版本
    // autoUpdater.checkForUpdates() 
    autoUpdater.on('error', (error) => {
        win.webContents.send("has-error")
        dialog.showErrorBox('Error: ', error == null ? "unknown" : (error.stack || error).toString())
    })
    // 正在检测是否有更新
    autoUpdater.on('checking-for-update', () => {
        console.log('Checking for update...')
    })
    autoUpdater.on('update-available', () => {
        win.webContents.send("hasNewVersion", 1)
        // dialog.showMessageBox({
        //     type: 'info',
        //     title: '应用有新的版本',
        //     message: '发现新版本，是否现在更新?',
        //     buttons: ['是', '否']
        // }, (buttonIndex) => {
        //     if (buttonIndex === 0) {
        //         autoUpdater.downloadUpdate()
        //     }
        // })
    })
    // 如果用户点击确定，那么就去下载
    ipcMain.on("canDownload", (e, arg) => {
        autoUpdater.downloadUpdate()
    })
    autoUpdater.on('update-not-available', () => {
        win.webContents.send("hasNewVersion", 0)
    })
    // 下载的进度条
    autoUpdater.on('download-progress', (progressObj) => {
        // 这里可以做一些逻辑，在渲染经常中显示进度条
        win.webContents.send("progress", progressObj)
    })
    // 下载成功后
    autoUpdater.on('update-downloaded', () => {
        win.webContents.send("finished-download")
        // dialog.showMessageBox({
        //   title: '安装更新',
        //   message: '更新下载完毕，应用将重启并进行安装'
        // }, () => {
        //   setImmediate(() => autoUpdater.quitAndInstall())
        // })
    })
    ipcMain.on("canUpdate", (e, arg) => {
        autoUpdater.quitAndInstall()
    })
    
    // 隐藏菜单栏
    Menu.setApplicationMenu(null);
    createWindow();
    win.webContents.on('did-finish-load', () => {
        
    })
    // 窗口事件
    ipcMain.on('window-event', (event, arg) => {
        win[arg]()
    })

});

// 当全部窗口关闭时退出。
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (win === null) {
        createWindow();
    }
});
