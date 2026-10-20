const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, makeCacheableSignalKeyStore } = require("@whiskeysockets/baileys")
const pino = require("pino")
const fs = require("fs")
const path = require("path")
const express = require("express")
const config = require("./config")

const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// PAIRING LINK - shareable to others
app.get("/", (req, res) => {
  res.send(`
  <html><body style="font-family:sans-serif;text-align:center;padding:30px">
  <h1>HEHE MD BOT2 Pair Site</h1>
  <p>Enter your WhatsApp number with country code</p>
  <form action="/pair">
  <input name="number" placeholder="256779997074" style="padding:10px;width:200px" required>
  <button style="padding:10px">Get Pair Code</button>
  </form>
  <p>Owner: 256792930216</p></body></html>`)
})

app.get("/pair", async (req, res) => {
  let num = req.query.number?.replace(/[^0-9]/g, "")
  if(!num) return res.send("Add number ?number=2567...")
  const { state } = await useMultiFileAuthState("./tmp")
  const sock = makeWASocket({ auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, pino({level:"silent"})) }, logger: pino({level:"silent"}) })
  setTimeout(async () => {
    try {
      let code = await sock.requestPairingCode(num)
      res.send(`<h1>Your Code: ${code}</h1><p>Go to WhatsApp > Linked Devices > Link with Phone Number > Enter this code</p>`)
    } catch(e){ res.send("Error: "+e.message) }
  }, 3000)
})

app.listen(3000, () => console.log("Pair server on 3000"))

async function startBot(){
  const { state, saveCreds } = await useMultiFileAuthState("./session")
  const sock = makeWASocket({
    auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, pino({level:"silent"})) },
    logger: pino({level:"silent"}),
    browser: ["HEHE MD BOT2", "Chrome", "1.0"],
    printQRInTerminal: true
  })
  sock.ev.on("creds.update", saveCreds)
  
  // Load plugins
  sock.ev.on("messages.upsert", async ({ messages }) => {
    const m = messages[0]
    if(!m.message || m.key.fromMe) return
    const msg = m.message.conversation || m.message.extendedTextMessage?.text || ""
    if(!msg.startsWith(config.prefix)) return
    const args = msg.slice(1).trim().split(/ +/)
    const command = args.shift().toLowerCase()
    const pluginsPath = path.join(__dirname, "plugins")
    for(let file of fs.readdirSync(pluginsPath)){
      const plugin = require(path.join(pluginsPath, file))
      if(plugin.command && plugin.command.includes(command)){
        try{ await plugin.execute(sock, m, args, config) }catch(e){ console.log(e) }
      }
    }
  })

  sock.ev.on("connection.update", ({ connection, lastDisconnect }) => {
    if(connection === "close"){
      if(lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) startBot()
    } else if(connection === "open") console.log("HEHE MD BOT2 Connected!")
  })
}
startBot()
