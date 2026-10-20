const config = require("../config")
module.exports = {
  command: ["restart", "reboot"],
  execute: async (sock, m) => {
    if(!m.key.remoteJid.includes(config.owner[0])) return
    await sock.sendMessage(m.key.remoteJid, { text: "Restarting HEHE MD BOT2..." }, { quoted: m })
    process.exit(1)
  }
}
