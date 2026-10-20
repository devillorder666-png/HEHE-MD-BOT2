const axios = require("axios")
const games = new Map() // jid -> {players, words, turnIndex, timer}

module.exports = {
  command: ["wordchain", "wc", "wrchain"],
  execute: async (sock, m, args, config) => {
    const jid = m.key.remoteJid
    const sender = m.key.participant || m.key.remoteJid
    const senderNum = sender.split("@")[0]
    const sub = (args[0] || "").toLowerCase()

    if(sub === "join" || args.length === 0 && !games.has(jid)){
      if(!games.has(jid)) games.set(jid, { players: [], words: [], turnIndex: 0, active: false, timer: null })
      const g = games.get(jid)
      if(g.players.find(p => p.id === sender)) return sock.sendMessage(jid, { text: `@${senderNum} already joined`, mentions: [sender] }, { quoted: m })
      if(g.players.length >= 8) return sock.sendMessage(jid, { text: "Max 8 players reached! Type .wc start" }, { quoted: m })
      g.players.push({ id: sender, num: senderNum })
      return sock.sendMessage(jid, { text: `✅ @${senderNum} joined! (${g.players.length}/8)\n\nPlayers: ${g.players.map(p => "@"+p.num).join(", ")}\nType .wc join for others, .wc start to begin`, mentions: g.players.map(p => p.id) }, { quoted: m })
    }

    if(sub === "start"){
      const g = games.get(jid)
      if(!g || g.players.length < 2) return sock.sendMessage(jid, { text: "Need 2-8 players. Use .wc join" }, { quoted: m })
      g.active = true
      g.words = []
      g.turnIndex = 0
      const first = g.players[0]
      sock.sendMessage(jid, { text: `🎮 *WORDCHAIN STARTED!* 🎮\n\nFirst word can be anything!\n40 seconds per turn.\nFail = eliminated!\n\n👉 @${first.num} your turn!`, mentions: [first.id] })
      setTurnTimer(sock, jid)
      return
    }

    if(sub === "stop"){
      games.delete(jid)
      return sock.sendMessage(jid, { text: "Game stopped" }, { quoted: m })
    }

    // Playing a word
    const g = games.get(jid)
    if(!g || !g.active) return
    if(sender !== g.players[g.turnIndex].id) return // not his turn

    const word = args[0]?.toLowerCase().replace(/[^a-z]/g, "")
    if(!word || word.length < 2) return

    // Check dictionary via Google Dictionary API
    try{
      const res = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`, { timeout: 5000 })
      if(!res.data) throw new Error()
    }catch{
      return sock.sendMessage(jid, { text: `❌ @${senderNum} "${word}" is not a valid English word! Eliminated!`, mentions: [sender] }, { quoted: m }), eliminate(sock, jid)
    }

    // Check chain rule
    if(g.words.length > 0){
      const last = g.words[g.words.length-1]
      if(word[0] !== last[last.length-1]) {
        return sock.sendMessage(jid, { text: `❌ @${senderNum} must start with "${last[last.length-1].toUpperCase()}"! You said "${word}". Eliminated!`, mentions: [sender] }, { quoted: m }), eliminate(sock, jid)
      }
      if(g.words.includes(word)) {
        return sock.sendMessage(jid, { text: `❌ @${senderNum} "${word}" already used! Eliminated!`, mentions: [sender] }, { quoted: m }), eliminate(sock, jid)
      }
    }

    g.words.push(word)
    clearTimeout(g.timer)
    await sock.sendMessage(jid, { text: `✅ "${word}" accepted!` })
    
    // Next turn
    g.turnIndex = (g.turnIndex + 1) % g.players.length
    const next = g.players[g.turnIndex]
    await sock.sendMessage(jid, { text: `👉 @${next.num} your turn! Last: *${word}* → must start with *${word[word.length-1].toUpperCase()}* (40s)`, mentions: [next.id] })
    setTurnTimer(sock, jid)
  }
}

function setTurnTimer(sock, jid){
  const g = games.get(jid)
  if(!g) return
  clearTimeout(g.timer)
  g.timer = setTimeout(() => {
    const cur = g.players[g.turnIndex]
    sock.sendMessage(jid, { text: `⏰ Time's up! @${cur.num} eliminated! (40s)`, mentions: [cur.id] })
    eliminate(sock, jid)
  }, 40000)
}

async function eliminate(sock, jid){
  const g = games.get(jid)
  if(!g) return
  clearTimeout(g.timer)
  g.players.splice(g.turnIndex, 1)
  if(g.players.length === 1){
    const winner = g.players[0]
    await sock.sendMessage(jid, { text: `🏆 *WINNER!* 🏆\n\n@${winner.num} won the WordChain!\nWords: ${g.words.join(", ")}`, mentions: [winner.id] })
    games.delete(jid)
    return
  }
  if(g.players.length === 0){ games.delete(jid); return }
  if(g.turnIndex >= g.players.length) g.turnIndex = 0
  const next = g.players[g.turnIndex]
  await sock.sendMessage(jid, { text: `Next: @${next.num} your turn!`, mentions: [next.id] })
  setTurnTimer(sock, jid)
      }
