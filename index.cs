using System;
using System.Windows.Forms;
using ACR122U_Helper;
using System.Drawing;
using System.Text;

namespace NFC_Software
{
    public partial class Form1 : Form
    {
        private ACR122U _reader;
        private bool _deviceConnected;

        public Form1()
        {
            InitializeComponent();
        }

        private void Form1_Load(object sender, EventArgs e)
        {
            _reader = new ACR122U();
            _reader.CardInserted += reader_CardInserted;
            _reader.CardRemoved += reader_CardRemoved;

            // Verifica se o dispositivo NFC está conectado
            if (_reader.IsConnected)
            {
                _deviceConnected = true;
                labelDeviceStatus.Text = "Conectado";
                labelDeviceStatus.ForeColor = Color.Green;
            }
            else
            {
                _deviceConnected = false;
                labelDeviceStatus.Text = "Desconectado";
                labelDeviceStatus.ForeColor = Color.Red;
            }
        }

        private void reader_CardInserted(object sender, EventArgs e)
        {
            labelCardStatus.Text = "Cartão Conectado";
            labelCardStatus.ForeColor = Color.Green;
        }

        private void reader_CardRemoved(object sender, EventArgs e)
        {
            labelCardStatus.Text = "Cartão Desconectado";
            labelCardStatus.ForeColor = Color.Red;
        }

        private void buttonFormat_Click(object sender, EventArgs e)
        {
            if (_deviceConnected)
            {
                // Formata o cartão conectado
                _reader.Format();
                MessageBox.Show("Cartão formatado com sucesso");
            }
            else
            {
                MessageBox.Show("Dispositivo NFC não conectado");
            }
        }

        private void buttonWrite_Click(object sender, EventArgs e)
        {
            if (_deviceConnected)
            {
                // Verifica se há um cartão conectado
                if (_reader.IsCardPresent)
                {
                    // Lê o QR Code da câmera
                    var qrCode = ReadQRCodeFromCamera();

                    // Escreve a URL no cartão
                    _reader.WriteUrl(qrCode);
                    MessageBox.Show("URL escrita com sucesso no cartão");
                }
                else
                {
                    MessageBox.Show("Nenhum cartão conectado");
                }
            }
            else
            {
                MessageBox.Show("Dispositivo NFC não conectado");
            }
        }

        private string ReadQRCodeFromCamera()
        {
            // Coloque aqui o código para ler o QR Code da câmera
            // Exemplo:
            string qrCode = "https://www.example.com";
            return qrCode;
        }
    }
}
