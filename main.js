const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')

const { NFC, KEY_TYPE_A } = require('nfc-pcsc');
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
  win.webContents.openDevTools()

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


const encapsulate = (data, blockSize = 4) => {
  if (data.length > 0xfffe) {
    throw new Error('Maximal NDEF message size exceeded.');
  }

  const prefix = Buffer.allocUnsafe(16);
  prefix[0] = 0x03; // NDEF type
  if (data.length > 0xfe) {
    prefix[1] = 0xff;
    prefix.writeInt32BE(data.length, 0);
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

let readers = [];
nfc.on('reader', reader => {
  console.info(`device attached`, { reader: reader.name });
  setTimeout(()=> {
    win.webContents.send('device_detected', {
      status: true,
      message: 'CONECTADO'
    })
  }, 1000)

  readers.push(reader);

  // reader.aid = 'F222222222';

  reader.on('card', async card => {


    console.info(`card detected`, { reader: reader.name, card });
    win.webContents.send('card_detected', {
      status: true,
      message: 'CONECTADO'
    })

    const key = 'FFFFFFFFFFFF'; 
    const keyType = KEY_TYPE_A;

    try {
      await Promise.all([
        reader.authenticate(4, keyType, key),
      ]);

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



      ipcMain.on('invokeAction', async (event, dataprocess) => {
        console.log('invoke main')
          // var result = processData(dataprocess);
          // event.sender.send('actionReply', result);

          const textRecord = ndef.Utils.createUriRecord("gocase.me");
          const message = new ndef.Message([textRecord]);
          const bytes = message.toByteArray();
          const data = encapsulate(Buffer.from(bytes.buffer));
    
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
        message: 'Falha na autenticacao.'
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
    delete readers[readers.indexOf(reader)];

    console.log(readers);

  });
});