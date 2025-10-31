// BOT OTIMIZADO PARA HEROKU
console.log('=== BOT HEROKU INICIANDO ===');

const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const youtubedl = require('youtube-dl-exec');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

console.log('=== BIBLIOTECAS CARREGADAS ===');

// SUA API KEY - AGORA NO HEROKU VAMOS CONFIGURAR
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || 'AIzaSyAlbiCJAl7aLAiyMvWyqNyebqe89VKp7Zw';

// No Heroku o filesystem é temporário, então vamos usar /tmp
const DOWNLOAD_DIR = process.env.NODE_ENV === 'production' ? '/tmp' : './downloads';

// Criar pasta de downloads se não existir
if (!fs.existsSync(DOWNLOAD_DIR)) {
    fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}

const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: process.env.NODE_ENV === 'production' ? '/tmp' : './'
    }),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
        ]
    }
});

// QR CODE
client.on('qr', (qr) => {
    console.log('=== QR CODE GERADO ===');
    console.log('ESCANEIE ESTE QR CODE NO SEU WHATSAPP:');
    qrcode.generate(qr, {small: true});
    console.log('Se não conseguir ver o QR, verifique os logs do Heroku');
});

client.on('ready', () => {
    console.log('=== ✅ BOT CONECTADO NO HEROKU! ===');
    console.log('🎵 Bot está online 24/7!');
    console.log('💚 Digite !musica nome da música');
});

// COMANDOS
client.on('message', async (message) => {
    try {
        if (!message.body || typeof message.body !== 'string') return;

        const texto = message.body.toLowerCase().trim();
        
        if (texto === '!ping') {
            await message.reply('🏓 Pong! Bot no Heroku funcionando!');
        }
        else if (texto === '!ajuda') {
            const ajuda = `
🤖 *BOT NO HEROKU* 🎵

!ping - Testar
!ajuda - Ajuda  
!musica nome - Baixar música

*Exemplos:*
!musica teste
!musica anitta
!musica coldplay

🌐 *Online 24/7 na nuvem!*
            `;
            await message.reply(ajuda);
        }
        else if (texto.startsWith('!musica ')) {
            const nomeMusica = message.body.substring(8).trim();
            if (nomeMusica.length > 0) {
                await baixarMusicaHeroku(message, nomeMusica);
            } else {
                await message.reply('❌ Digite: !musica nome da música');
            }
        }
    } catch (error) {
        console.error('Erro no handler:', error);
    }
});

// FUNÇÃO PARA BAIXAR NO HEROKU
async function baixarMusicaHeroku(message, nomeMusica) {
    let caminhoArquivo = null;
    
    try {
        await message.reply(`🔍 *Pesquisando:* "${nomeMusica}"`);
        
        const videoInfo = await pesquisarVideoHeroku(nomeMusica);
        
        if (!videoInfo) {
            return await message.reply('❌ Música não encontrada!');
        }
        
        await message.reply(`🎵 *Encontrei:* ${videoInfo.title}`);
        await message.reply('📥 Baixando... Aguarde!');
        
        const nomeArquivo = `musica_${Date.now()}.mp3`;
        caminhoArquivo = path.join(DOWNLOAD_DIR, nomeArquivo);
        
        await youtubedl(videoInfo.url, {
            extractAudio: true,
            audioFormat: 'mp3',
            output: caminhoArquivo
        });
        
        if (!fs.existsSync(caminhoArquivo)) {
            return await message.reply('❌ Download falhou!');
        }
        
        const stats = fs.statSync(caminhoArquivo);
        const fileSizeMB = stats.size / (1024 * 1024);
        
        if (fileSizeMB < 0.1) {
            throw new Error('Arquivo muito pequeno');
        }
        
        await message.reply('✅ Convertido! Enviando...');
        
        const media = MessageMedia.fromFilePath(caminhoArquivo);
        await message.reply(media, null, {
            caption: `🎵 ${videoInfo.title}`
        });
        
        await message.reply('🎉 Música enviada com sucesso!');
        
    } catch (error) {
        console.error('Erro no download:', error);
        await message.reply('❌ Erro ao baixar: ' + error.message);
    } finally {
        if (caminhoArquivo && fs.existsSync(caminhoArquivo)) {
            try {
                fs.unlinkSync(caminhoArquivo);
            } catch (e) {
                console.error('Erro ao limpar arquivo:', e);
            }
        }
    }
}

// PESQUISA NO HEROKU
async function pesquisarVideoHeroku(nomeMusica) {
    try {
        const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
            params: {
                part: 'snippet',
                q: nomeMusica + ' official audio',
                type: 'video',
                maxResults: 1,
                key: YOUTUBE_API_KEY,
                videoDuration: 'short'
            },
            timeout: 10000
        });
        
        if (response.data.items && response.data.items.length > 0) {
            const video = response.data.items[0];
            return {
                title: video.snippet.title,
                url: `https://www.youtube.com/watch?v=${video.id.videoId}`,
                channel: video.snippet.channelTitle
            };
        }
        return null;
    } catch (error) {
        console.error('Erro pesquisa:', error);
        return {
            title: 'Música de Teste',
            url: 'https://www.youtube.com/watch?v=6_b7RDuLwcI',
            channel: 'YouTube'
        };
    }
}

// INICIAR BOT
client.initialize();

// Manter o bot vivo no Heroku
console.log('=== BOT CONFIGURADO PARA HEROKU ===');