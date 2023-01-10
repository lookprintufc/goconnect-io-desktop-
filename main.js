const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')

const { NFC, KEY_TYPE_B } = require('nfc-pcsc');
const nfc = new NFC();
const ndef = require('@taptrack/ndef');

let win
const createWindow = () => {
  win = new BrowserWindow({
    width: 1270,
    height: 920,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })
  // win.webContents.openDevTools()

  win.loadFile('index.html')
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})


const encapsulate = (data, blockSize = 16) => {
  if (data.length > 0xfffe) {
    throw new Error('Maximal NDEF message size exceeded.');
  }

  const prefix = Buffer.allocUnsafe(data.length > 0xfe ? 4 : 2);
  prefix[0] = 0x03; // NDEF type
  if (data.length > 0xfe) {
    prefix[1] = 0xff;
    prefix.writeInt16BE(data.length, 2);
  } else {
    prefix[1] = data.length;
  }

  const suffix = Buffer.from([0xfe]);

  const totalLength = prefix.length + data.length + suffix.length;
  const excessLength = totalLength % blockSize;
  const rightPadding = excessLength > 0 ? blockSize - excessLength : 0;
  const newLength = totalLength + rightPadding;
	
  return Buffer.concat([prefix, data, suffix], newLength);

};

nfc.on('reader', reader => {
  console.info(`device attached`, { reader: reader.name });
  setTimeout(()=> {
    win.webContents.send('device_detected', {
      status: true,
      message: 'CONECTADO'
    })
  }, 1500)

  // reader.aid = 'F222222222';

  reader.on('card', async card => {
    // NPX - MIFARE CLASSIC 1K
    if (card.type !== 'TAG_ISO_14443_3') {
      win.webContents.send('card_detected', {
        status: false,
        message: 'NAO SUPORTADO'
      })
			return;
		}

    console.info(`card detected`, { reader: reader.name, card });
    win.webContents.send('card_detected', {
      status: true,
      message: 'CONECTADO'
    })

    const key = 'FFFFFFFFFFFF'; 
    const keyType = KEY_TYPE_B;

    try {
      await reader.authenticate(4, keyType, key),

      console.info(`blocks successfully authenticated`);
      win.webContents.send('card_authenticated', {
        status: true,
        message: 'Cartao Autenticado.'
      })

      try {
        const data4 = await reader.read(4, 16, 16);

        console.log('read data4', {
          data4
        })

        win.webContents.send('card_read', {
          status: true,
          message: 'Cartao lido com sucesso.'
        })
      } catch (err) {
        win.webContents.send('card_read', {
          status: false,
          message: 'Falha ao realizar a leitura do cartao.'
        })
        console.error(`error when reading data`, { reader: reader.name, card, err });
      }



    try {
      ipcMain.on('writeCartAction', async (event, dataAct) => {
        console.log(dataAct)
        console.log('invoke main')
        // var result = processData(dataprocess);
        // event.sender.send('actionReply', result);

        const textRecord = ndef.Utils.createUriRecord(dataAct);
        const message = new ndef.Message([textRecord]);
        const bytes = message.toByteArray();
        // convert the Uint8Array into to the Buffer and encapsulate it
        const data = encapsulate(Buffer.from(bytes.buffer));

        // data is instance of Buffer containing encapsulated NDEF message
        const res4 = await reader.write(4, data, 16);
        console.log('result', { res4 })
    
        win.webContents.send('card_write', {
          status: true,
          message: 'Cartao gravado com sucesso.'
        })
      });
    } catch (err) {
      win.webContents.send('card_write', {
        status: false,
        message: 'Falha na gravacao do cartao.'
      })
      console.error(`error when writing data`, { reader: reader.name, card, err });
    }

    } catch (err) {
      console.error('error on auth', {
        err
      })
      win.webContents.send('card_authenticated', {
        status: false,
        message: 'Falha na Autenticacao.'
      })
      return;
    }
  });

	reader.on('card.off', card => {
		console.log(`${reader.reader.name}  card removed`, card);
    win.webContents.send('card_detected', {
      status: false,
      message: 'DESCONECTADO'
    })

	});

	reader.on('error', err => {
		pretty.error(`an error occurred`, reader, err);
	});


  reader.on('end', () => {
    console.info(`device removed`, { reader: reader.name });
    win.webContents.send('device_detected', {
      status: false,
      message: 'DESCONECTADO'
    })
  });
});