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
    else replaceClasses('card-status', 'gnfc-status--green', 'gnfc-status--red')
  })

  ipcRenderer.on('card_authenticated', (event, result) => {
    console.info(event, result, 'card_authenticated')
  })

  ipcRenderer.on('card_read', (event, result) => {
    console.info(event, result, 'card_read')
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
      ipcRenderer.once('actionReply', function(event, response){
          processResponse(response);
      })
      ipcRenderer.send('invokeAction', 'someData');
  });
})
