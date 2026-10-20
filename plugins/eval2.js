const config = require("../config")
module.exports = {
  command: ["eval2", "=>"],
  execute: async (sock, m, args) => {
    if(!m.key.remoteJid.includes(config.owner[0]) && m.key.participant) return
    try{
      let result = await eval(`(async () => { ${args.join(" ")} })()`)
      await sock.sendMessage(m.key.remoteJid, { text: String(result) }, { quoted: m })
    }catch(e){ await sock.sendMessage(m.key.remoteJid, { text: e.message }, { quoted: m }) }
  }
            }
