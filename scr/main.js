const app             = document.getElementById('app')
const themeBtn        = document.getElementById('themeBtn')
const iconSun         = document.getElementById('iconSun')
const iconMoon        = document.getElementById('iconMoon')
const greeting        = document.getElementById('greeting')
const toast           = document.getElementById('toast')
const themeMeta       = document.getElementById('themeColorMeta')
const novaConversaBtn = document.querySelector('.btn-nova-conversa')
const sidebar            = document.getElementById('sidebar')
const sidebarCloseBtn    = document.getElementById('sidebarCloseBtn')
const sidebarNovaConversa = document.getElementById('sidebarNovaConversa')
const menuBtn            = document.getElementById('menuBtn')
const chatHome        = document.getElementById('chatHome')
const inputHome       = document.getElementById('userInput')
const sendBtnHome     = document.getElementById('sendBtn')
const chatConversation = document.getElementById('chatConversation')
const chatMessages     = document.getElementById('chatMessages')
const inputChat        = document.getElementById('userInputChat')
const sendBtnChat      = document.getElementById('sendBtnChat')

let conversaAtual = null

function novaConversa() {
  conversaAtual = null
  chatConversation.style.display = 'none'
  chatHome.style.display = 'flex'
  chatMessages.innerHTML = ''
  inputHome.value = ''
  inputChat.value = ''
  syncBtn(sendBtnHome, false)
  syncBtn(sendBtnChat, false)
}

novaConversaBtn.addEventListener('click', novaConversa)
sidebarNovaConversa.addEventListener('click', novaConversa)
menuBtn.addEventListener('click', () => {
  sidebar.classList.toggle('closed')
})

sidebarCloseBtn.addEventListener('click', () => {
  sidebar.classList.add('closed')
})

function getSaudacao() {
  const h = new Date().getHours()
  if (h >= 5  && h < 12) return 'Bom dia'
  if (h >= 12 && h < 18) return 'Boa tarde'
  return 'Boa noite'
}
greeting.textContent = `${getSaudacao()}, Pedro.`

const DARK_COLORS  = { theme: '#161616' }
const LIGHT_COLORS = { theme: '#f2f1ee' }

function applyTheme(dark) {
  app.setAttribute('data-theme', dark ? 'dark' : 'light')
  iconSun.style.display  = dark ? 'none'  : 'block'
  iconMoon.style.display = dark ? 'block' : 'none'
  themeMeta.setAttribute('content', dark ? DARK_COLORS.theme : LIGHT_COLORS.theme)
  localStorage.setItem('maria-theme', dark ? 'dark' : 'light')
}

const saved = localStorage.getItem('maria-theme')
applyTheme(saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches)

themeBtn.addEventListener('click', () => {
  applyTheme(app.getAttribute('data-theme') !== 'dark')
})

function syncBtn(btn, hasText) {
  btn.disabled = !hasText
  btn.classList.toggle('active', hasText)
}

function autoResize(textarea) {
  textarea.style.height = 'auto'
  textarea.style.height = Math.min(textarea.scrollHeight, 140) + 'px'
}

inputHome.addEventListener('input', () => {
  autoResize(inputHome)
  syncBtn(sendBtnHome, inputHome.value.trim().length > 0)
})

inputChat.addEventListener('input', () => {
  autoResize(inputChat)
  syncBtn(sendBtnChat, inputChat.value.trim().length > 0)
})

document.querySelectorAll('.suggestion-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    inputHome.value = btn.textContent.trim()
    inputHome.dispatchEvent(new Event('input'))
    inputHome.focus()
  })
})

let toastTimer = null
function showToast(msg, duration = 3000) {
  toast.textContent = msg
  toast.classList.add('show')
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => toast.classList.remove('show'), duration)
}

const GROQ_API_KEY = localStorage.getItem('maria-groq-key') || ''

function setApiKey() {
  const key = prompt('Cole sua API key da Groq:')
  if (key && key.trim()) {
    localStorage.setItem('maria-groq-key', key.trim())
    location.reload()
  }
}

if (!GROQ_API_KEY) {
  setApiKey()
}

async function askMaria(userMessage) {
  if (!GROQ_API_KEY) {
    return 'API key não configurada. Recarregue a página para configurar.'
  }
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'Você é a MARIA, uma assistente jurídica inteligente e simpática do STF.' },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.7,
        max_tokens: 1024
      })
    })
    const data = await response.json()
    return data.choices[0].message.content
  } catch (err) {
    console.error('[MARIA] Erro na API:', err)
    return 'Desculpe, não consegui responder agora.'
  }
}

function addBubble(text, role) {
  const row = document.createElement('div')
  row.className = `msg-row ${role}`

  const av = document.createElement('div')
  av.className = `msg-avatar ${role}`
  av.setAttribute('aria-hidden', 'true')
  av.textContent = role === 'user' ? 'P' : 'M'

  const bubble = document.createElement('div')
  bubble.className = `msg-bubble ${role}`

  if (role === 'assistant') {
    bubble.innerHTML = marked.parse(text)
  } else {
    bubble.textContent = text
  }

  row.append(av, bubble)
  chatMessages.appendChild(row)
  chatMessages.scrollTop = chatMessages.scrollHeight
  return row
}

function addTyping() {
  const row = document.createElement('div')
  row.className = 'msg-row assistant'

  const av = document.createElement('div')
  av.className = 'msg-avatar assistant'
  av.setAttribute('aria-hidden', 'true')
  av.textContent = 'M'

  const bubble = document.createElement('div')
  bubble.className = 'msg-bubble assistant'
  bubble.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div>'

  row.append(av, bubble)
  chatMessages.appendChild(row)
  chatMessages.scrollTop = chatMessages.scrollHeight
  return row
}

function enterConversation() {
  chatHome.style.display = 'none'
  chatConversation.style.display = 'flex'
}

async function handleSend(inputEl, btn) {
  const text = inputEl.value.trim()
  if (!text) return

  if (chatConversation.style.display !== 'flex') {
    enterConversation()
  }

  addBubble(text, 'user')
  inputEl.value = ''
  inputEl.style.height = 'auto'
  syncBtn(btn, false)

  inputChat.focus()

  const typingRow = addTyping()
  const reply = await askMaria(text)
  typingRow.remove()
  addBubble(reply, 'assistant')

  salvarConversaAtual(text, reply)
}

sendBtnHome.addEventListener('click', () => handleSend(inputHome, sendBtnHome))
inputHome.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(inputHome, sendBtnHome) }
})

sendBtnChat.addEventListener('click', () => handleSend(inputChat, sendBtnChat))
inputChat.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(inputChat, sendBtnChat) }
})

function getConversas() {
  return JSON.parse(localStorage.getItem('maria-conversas') || '[]')
}

function saveConversas(conversas) {
  localStorage.setItem('maria-conversas', JSON.stringify(conversas))
}

function salvarConversaAtual(userText, assistantText) {
  let conversas = getConversas()

  if (!conversaAtual) {
    conversaAtual = {
      id: Date.now().toString(),
      title: userText.substring(0, 40),
      messages: []
    }
    conversas.unshift(conversaAtual)
  } else {
    const idx = conversas.findIndex(c => c.id === conversaAtual.id)
    if (idx !== -1) conversas[idx] = conversaAtual
  }

  conversaAtual.messages.push({ text: userText, role: 'user' })
  conversaAtual.messages.push({ text: assistantText, role: 'assistant' })

  saveConversas(conversas)
  renderSidebar()
}

function renderSidebar() {
  const lista = document.querySelector('.sidebar-list')
  lista.innerHTML = ''
  const conversas = getConversas()

  conversas.forEach(conv => {
    const li = document.createElement('li')

    const titleSpan = document.createElement('span')
    titleSpan.className = 'sidebar-item-title'
    titleSpan.textContent = conv.title
    titleSpan.addEventListener('click', () => carregarConversa(conv.id))

    const deleteBtn = document.createElement('button')
    deleteBtn.className = 'sidebar-item-delete'
    deleteBtn.textContent = '✕'
    deleteBtn.title = 'Excluir conversa'
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation()
      excluirConversa(conv.id)
    })

    li.appendChild(titleSpan)
    li.appendChild(deleteBtn)
    lista.appendChild(li)
  })
}

function excluirConversa(id) {
  let conversas = getConversas()
  conversas = conversas.filter(c => c.id !== id)
  saveConversas(conversas)

  if (conversaAtual && conversaAtual.id === id) {
    novaConversa()
  }

  renderSidebar()
}

function carregarConversa(id) {
  const conversas = getConversas()
  conversaAtual = conversas.find(c => c.id === id)

  chatHome.style.display = 'none'
  chatConversation.style.display = 'flex'
  chatMessages.innerHTML = ''

  conversaAtual.messages.forEach(msg => {
    addBubble(msg.text, msg.role)
  })

  sidebar.classList.add('closed')
}

renderSidebar()
