module.exports = {
  command: ["alive", "bot"],
  execute: async (sock, m) => {
    const txt = `*HEHE MD BOT2 is Alive!*\n\nOwner: wa.me/256792930216\nBot: 256779997074\nUptime: ${process.uptime().toFixed(0)}s\n\nType .wordchain to play`
    await sock.sendMessage(m.key.remoteJid, { text: txt }, { quoted: m })
  }
}
