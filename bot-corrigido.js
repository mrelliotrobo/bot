// BOT CORRIGIDO - SEM ERROS DE ENCODING
console.log('=== BOT CORRIGIDO INICIANDO ===');

const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const youtubedl = require('youtube-dl-exec');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

console.log('=== BIBLIOTECAS CARREGADAS ===');

// SUA API KEY
const YOUTUBE_API_KEY = 'AIzaSyAlbiCJAl7aLAiyMvWyqNyebqe89VKp7Zw';

// Criar pasta de downloads
if (!fs.existsSync('downloads')) {
    fs.mkdirSync('downloads');
    console.log('=== PASTA DOWNLOADS CRIADA ===');
}

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

// QR CODE
client.on('qr', (qr) => {
    console.log('=== QR CODE GERADO ===');
    qrcode.generate(qr, {small: true});
    console.log('Escaneie com WhatsApp: ⋮ → Aparelhos conectados → Conectar');
});

client.on('ready', () => {
    console.log('=== ✅ BOT CONECTADO! ===');
    console.log('🎵 Digite !musica nome da música');
});

// COMANDOS - VERSÃO CORRIGIDA
client.on('message', async (message) => {
    try {
        // Verificar se a mensagem tem corpo válido
        if (!message.body || typeof message.body !== 'string') {
            return;
        }

        const texto = message.body.toLowerCase().trim();
        
        if (texto === '!ping') {
            await message.reply('🏓 Pong! Bot corrigido funcionando!');
        }
        else if (texto === '!ajuda') {
            const ajuda = `
🤖 *BOT CORRIGIDO* 🎵

!ping - Testar
!ajuda - Ajuda  
!musica nome - Baixar música

*Exemplos:*
!musica teste
!musica anitta
!musica coldplay
            `;
            await message.reply(ajuda);
        }
        else if (texto.startsWith('!musica ')) {
            const nomeMusica = message.body.substring(8).trim();
            if (nomeMusica.length > 0) {
                await baixarMusicaCorrigido(message, nomeMusica);
            } else {
                await message.reply('❌ Digite: !musica nome da música');
            }
        }
    } catch (error) {
        console.error('Erro no handler:', error);
    }
});

// FUNÇÃO CORRIGIDA PARA BAIXAR
async function baixarMusicaCorrigido(message, nomeMusica) {
    let caminhoArquivo = null;
    
    try {
        await message.reply(`🔍 *Pesquisando:* "${nomeMusica}"`);
        
        // Pesquisar com API
        const videoInfo = await pesquisarVideoCorrigido(nomeMusica);
        
        if (!videoInfo) {
            return await message.reply('❌ Música não encontrada!');
        }
        
        await message.reply(`🎵 *Encontrei:* ${videoInfo.title}`);
        await message.reply('📥 Baixando... Aguarde!');
        
        // Nome do arquivo seguro
        const nomeArquivo = `musica_${Date.now()}.mp3`;
        caminhoArquivo = path.join(__dirname, 'downloads', nomeArquivo);
        
        // Download simplificado
        await youtubedl(videoInfo.url, {
            extractAudio: true,
            audioFormat: 'mp3',
            output: caminhoArquivo
        });
        
        // Verificar se arquivo foi criado
        if (!fs.existsSync(caminhoArquivo)) {
            return await message.reply('❌ Download falhou!');
        }
        
        // Verificar tamanho
        const stats = fs.statSync(caminhoArquivo);
        const fileSizeMB = stats.size / (1024 * 1024);
        
        if (fileSizeMB < 0.1) {
            throw new Error('Arquivo muito pequeno');
        }
        
        await message.reply('✅ Convertido! Enviando...');
        
        // Criar media de forma segura
        const media = MessageMedia.fromFilePath(caminhoArquivo);
        
        // Enviar áudio
        await message.reply(media, null, {
            caption: `🎵 ${videoInfo.title}`
        });
        
        await message.reply('🎉 Música enviada com sucesso!');
        
    } catch (error) {
        console.error('Erro no download:', error);
        await message.reply('❌ Erro ao baixar: ' + error.message);
    } finally {
        // Sempre limpar o arquivo
        if (caminhoArquivo && fs.existsSync(caminhoArquivo)) {
            try {
                fs.unlinkSync(caminhoArquivo);
            } catch (e) {
                console.error('Erro ao limpar arquivo:', e);
            }
        }
    }
}

// PESQUISA CORRIGIDA
async function pesquisarVideoCorrigido(nomeMusica) {
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
        // Fallback seguro
        return {
            title: 'Música de Teste',
            url: 'https://www.youtube.com/watch?v=6_b7RDuLwcI',
            channel: 'YouTube'
        };
    }
}

// INICIAR BOT
client.initialize();
console.log('=== AGUARDANDO CONEXÃO ===');