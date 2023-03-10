const { ipcRenderer } = require('electron')
window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
  }

  const replaceClasses = (selector, classOne, classTwo) => {
    const element = document.getElementById(selector)
    if (element) {
      element.classList.remove(classOne)
      element.classList.add(classTwo)
    }
  }

  for (const dependency of ['chrome', 'node', 'electron']) {
    replaceText(`${dependency}-version`, process.versions[dependency])
  }

  ipcRenderer.on('device_detected', (event, result) => {
    console.info(event, result, 'device_detected')
    replaceText('reader-status', result.message)
    if(result.status) replaceClasses('reader-status', 'gnfc-status--red', 'gnfc-status--green')
    else replaceClasses('reader-status', 'gnfc-status--green', 'gnfc-status--red')
  })

  ipcRenderer.on('card_detected', (event, result) => {
    console.info(event, result, 'card_detected')
    replaceText('card-status', result.message)
    if(result.status) replaceClasses('card-status', 'gnfc-status--red', 'gnfc-status--green')
    else {
      replaceClasses('card-status', 'gnfc-status--green', 'gnfc-status--red')
      replaceText("qrcode-content", '');
      replaceClasses('nfc-write-status', 'gnfc-status--green', 'gnfc-status--red')
      replaceClasses('qrcode-read-status', 'gnfc-status--green', 'gnfc-status--red')
      document.getElementById('write-nfc').disabled = true
    }
  })

  ipcRenderer.on('card_authenticated', (event, result) => {
    console.info(event, result, 'card_authenticated')
    if(!result.status) {
      alert(result.message)
      return
    }

    if(document.getElementById('qrcode-read-status').classList.contains('gnfc-status--green')) {
      document.getElementById('write-nfc').disabled = false
    }
  })

  ipcRenderer.on('card_read', (event, result) => {
    console.info(event, result, 'card_read')
    if(!result.status) alert(result.message)
  })

  ipcRenderer.on('card_write', (event, result) => {
    console.info(event, result, 'card_write')
    if(result.status) replaceClasses('nfc-write-status', 'gnfc-status--red', 'gnfc-status--green')
    else replaceClasses('nfc-write-status', 'gnfc-status--green', 'gnfc-status--red')
  })


  var writeNfcButton = document.getElementById('write-nfc');
  console.log('writeNfcButton', writeNfcButton)
  writeNfcButton.addEventListener('click', function(){
    console.log('write nfc front')
    ipcRenderer.send('writeCartAction', document.getElementById('qrcode-content').innerText);
  });
})
