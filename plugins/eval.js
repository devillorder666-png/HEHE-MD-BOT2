const config = require("../config")
module.exports = {
  command: ["eval", ">"],
  execute: async (sock, m, args) => {
    if(!config.owner.includes(m.key.participant?.replace(/@.*/, "") || m.key.remoteJid.replace(/@.*/, "")) && !m.key.remoteJid.includes(config.owner[0])) return
    try{
      let result = eval(args.join(" "))
      await sock.sendMessage(m.key.remoteJid, { text: String(result) }, { quoted: m })
    }catch(e){ await sock.sendMessage(m.key.remoteJid, { text: e.message }, { quoted: m }) }
  }
  }
