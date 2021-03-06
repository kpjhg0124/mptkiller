const { app, BrowserWindow, ipcMain, Tray } = require('electron')
const path = require('path')
const shell = require('shelljs')
const child_process = require('child_process')
const notifier = require('node-notifier')

// window 객체는 전역 변수로 유지. 이렇게 하지 않으면, 
// 자바스크립트 객체가 가비지 콜렉트될 때 자동으로 창이 닫힐 것입니다.

try {
  shell.config.execPath = shell.which('node').toString()
}
catch {}

let tray
let win
let stopperLoop

function createWindow () {
  // 브라우저 창을 생성합니다.
  win = new BrowserWindow({
    width: 250,
    height: 400,
    webPreferences: {
      nodeIntegration: true
    },
    resizable: false,
    fullscreenable: false
  })

  win.setMenu(null)

  // and load the index.html of the app.
  win.loadFile('index.html')

  // 창이 닫힐 때 발생합니다
  win.on('closed', () => {
    // window 객체에 대한 참조해제. 여러 개의 창을 지원하는 앱이라면 
    // 창을 배열에 저장할 수 있습니다. 이곳은 관련 요소를 삭제하기에 좋은 장소입니다.
    win = null
  })
}

function createTray () {
  tray = new Tray(path.join(__dirname, 'electron.ico'))
  tray.setToolTip('kill MyPcToast.exe')
  tray.on('click', () => {
    win.isVisible() ? win.hide() : win.show()
  })
}

function killLoop (args) {
    /*if (shell.exec('taskkill /f /im ' + args) == 0) {
        return true
    } else {
        return false
    }*/
    child_process.exec('taskkill /f /im ' + args)
    return true
}

function loopStart (args) {
  notify_alert()
  win.hide()
  stopperLoop = setInterval(() => {
  if (killLoop(args[0])) {
      /* 프로세스 종료 완료 */
    } else {
      /* 프로세스 종료 실패*/
    }
  }, args[1]*1000)
}

function loopStop () {
  clearInterval(stopperLoop)
}

function notify_alert () {
  notifier.notify(
    {
      title: '실행됨',
      message: '창을 다시 열려면 시스템 트레이의 아이콘을 누르세요.',
      icon: path.join(__dirname, 'electron.ico'), // Absolute path (doesn't work on balloons)
      sound: true, // Only Notification Center or Windows Toasters
      wait: false // Wait with callback, until user action is taken against notification, does not apply to Windows Toasters as they always wait or notify-send as it does not support the wait option
    },
    function(err, response) {
      // Response is response from notification
    }
  )
}

// 이 메서드는 Electron이 초기화를 마치고 
// 브라우저 창을 생성할 준비가 되었을 때  호출될 것입니다.
// 어떤 API는 이 이벤트가 나타난 이후에만 사용할 수 있습니다.
app.on('ready', createWindow)
app.on('ready', createTray)

// 모든 창이 닫혔을 때 종료.
app.on('window-all-closed', () => {
  // macOS에서는 사용자가 명확하게 Cmd + Q를 누르기 전까지는
  // 애플리케이션이나 메뉴 바가 활성화된 상태로 머물러 있는 것이 일반적입니다.
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // macOS에서는 dock 아이콘이 클릭되고 다른 윈도우가 열려있지 않았다면
  // 앱에서 새로운 창을 다시 여는 것이 일반적입니다.
  if (win === null) {
    createWindow()
  }
})

// 이 파일 안에 당신 앱 특유의 메인 프로세스 코드를 추가할 수 있습니다. 별도의 파일에 추가할 수도 있으며 이 경우 require 구문이 필요합니다.

ipcMain.on('loopStart', (event, args) => {
  loopStart(args)
  event.returnValue = true
})
ipcMain.on('loopStop', (event) => {
  loopStop()
  event.returnValue = false
})