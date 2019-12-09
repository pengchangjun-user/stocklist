const {
    app,
    BrowserWindow,
    ipcMain,
    Menu
} = require('electron');

const path = require("path")
const isDev = require('electron-is-dev');

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
    const localUrl = isDev ? 'http://localhost:3000' :  `file://${path.join(__dirname, './index.html')}`
    win.loadURL(localUrl);
    win.webContents.openDevTools()

    win.once('ready-to-show', () => {
        win.show()
    })

    // 当 window 被关闭，这个事件会被触发。
    win.on('closed', () => {
        win = null;
    });
}

app.on('ready', () => {
    // 隐藏菜单栏
    Menu.setApplicationMenu(null);
    createWindow();
    // 当首次渲染介绍的时候操作
    win.webContents.on('did-finish-load',() => {
        
    })

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
