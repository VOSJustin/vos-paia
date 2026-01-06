'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface UserData {
  name: string
  focusArea: string
  obstacles: string[]
}

interface FileInfo {
  name: string
  content: string
  path: string
}

const COLORS = {
  background: '#2D3339',
  surface: '#3D4449',
  surfaceLight: '#4A5158',
  userBubble: '#8B4513',
  userBubbleHover: '#A0522D',
  text: '#FFFFFF',
  textMuted: '#9CA3AF',
  accent: '#8B4513',
  border: '#4A5158',
}

const ONBOARDING_SCRIPT = [
  {
    id: 'welcome',
    message: "Hey there! 🌸 I'm FELICIA, your Personal AI Assistant. I live right here on your device — which means everything we talk about stays completely private. No cloud, no data harvesting, just you and me.\n\nBefore we dive in, I'd love to learn a bit about you. What's your name?",
    expectsInput: true,
    inputType: 'text' as const,
    placeholder: 'Enter your name...'
  },
  {
    id: 'greeting',
    message: (data: UserData) => `Nice to meet you, ${data.name}! 😊\n\nI'm here to help you think, learn, and get things done. Think of me as your personal thinking partner — one that actually remembers what matters to you.\n\nSo tell me, what's the main area you'd like to focus on? Pick one:`,
    expectsInput: true,
    inputType: 'choice' as const,
    choices: ['📚 Learning & Growth', '⚡ Productivity & Tasks', '💡 Creative Projects', '🎯 Goal Planning', '🔧 Something Else']
  },
  {
    id: 'focus_followup',
    message: (data: UserData) => `${data.focusArea.includes('Learning') ? 'A fellow learner!' : data.focusArea.includes('Productivity') ? 'Getting things done — I love it!' : data.focusArea.includes('Creative') ? 'Creativity is my favorite!' : data.focusArea.includes('Goal') ? 'Big picture thinking!' : 'Interesting!'} I'll keep that in mind.\n\nNow, what usually gets in your way? What makes it hard to make progress? (Pick all that apply)`,
    expectsInput: true,
    inputType: 'multi-choice' as const,
    choices: ['🤯 Too many distractions', '😵 Information overload', '🦥 Procrastination', '🤔 Not sure where to start', '⏰ Not enough time', '😰 Feeling overwhelmed']
  },
  {
    id: 'obstacles_response',
    message: (data: UserData) => `Got it — ${data.obstacles.length > 2 ? "you've got a few battles to fight" : "that's totally normal"}. Here's the good news: I'm designed to help with exactly these things.\n\nUnlike cloud AIs that forget you exist between sessions, I can actually learn your patterns, remember your projects, and help you build momentum over time.\n\nReady to see what I can do?`,
    expectsInput: true,
    inputType: 'choice' as const,
    choices: ['✨ Show me!', '🤔 Tell me more first']
  },
  {
    id: 'capabilities',
    message: `Here's what makes me different:\n\n🏠 **100% Local** — I run on YOUR device. Your thoughts never leave your computer.\n\n🧠 **I Remember** — Connect a knowledge folder and I'll actually learn from your notes, docs, and files.\n\n🔌 **Works Offline** — No internet? No problem. I'm always here.\n\n💰 **Free Forever** — No subscriptions, no token limits, no surprise bills.\n\nWant to connect a knowledge folder now, or just start chatting?`,
    expectsInput: true,
    inputType: 'choice' as const,
    choices: ['📁 Connect Knowledge Folder', '💬 Just Start Chatting']
  },
  {
    id: 'ready',
    message: (data: UserData) => `Perfect! You're all set, ${data.name}. 🎉\n\nFrom now on, just type whatever's on your mind. I'm here to help you think through problems, organize ideas, learn new things, or just chat.\n\nOh, and see that 📁 button in the top right? That's where you can connect your knowledge folder anytime.\n\nSo... what's on your mind?`,
    expectsInput: false,
    isComplete: true
  }
]

export default function ChatPage() {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [userData, setUserData] = useState<UserData>({ name: '', focusArea: '', obstacles: [] })
  const [onboardingStep, setOnboardingStep] = useState(0)
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false)
  const [aiStatus, setAiStatus] = useState<'checking' | 'connected' | 'offline'>('checking')
  const [selectedChoices, setSelectedChoices] = useState<string[]>([])
  const [folderConnected, setFolderConnected] = useState(false)
  const [folderName, setFolderName] = useState('')
  const [knowledgeFiles, setKnowledgeFiles] = useState<FileInfo[]>([])
  const [showFolderPanel, setShowFolderPanel] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const checkAI = async () => {
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: 'ping', conversationHistory: [] })
        })
        setAiStatus(response.ok ? 'connected' : 'offline')
      } catch { setAiStatus('offline') }
    }
    checkAI()
  }, [])

  useEffect(() => {
    const savedMessages = localStorage.getItem('paia-messages')
    const savedUserData = localStorage.getItem('paia-userData')
    const savedOnboardingComplete = localStorage.getItem('paia-onboardingComplete')
    const savedOnboardingStep = localStorage.getItem('paia-onboardingStep')
    if (savedMessages) setMessages(JSON.parse(savedMessages))
    if (savedUserData) setUserData(JSON.parse(savedUserData))
    if (savedOnboardingComplete === 'true') setIsOnboardingComplete(true)
    if (savedOnboardingStep) setOnboardingStep(parseInt(savedOnboardingStep))
  }, [])

  useEffect(() => { if (messages.length > 0) localStorage.setItem('paia-messages', JSON.stringify(messages)) }, [messages])
  useEffect(() => { if (userData.name) localStorage.setItem('paia-userData', JSON.stringify(userData)) }, [userData])
  useEffect(() => { localStorage.setItem('paia-onboardingComplete', String(isOnboardingComplete)) }, [isOnboardingComplete])
  useEffect(() => { localStorage.setItem('paia-onboardingStep', String(onboardingStep)) }, [onboardingStep])

  useEffect(() => {
    if (messages.length === 0 && !isOnboardingComplete) {
      const firstStep = ONBOARDING_SCRIPT[0]
      setMessages([{ id: 'onboarding-0', role: 'assistant', content: typeof firstStep.message === 'function' ? firstStep.message(userData) : firstStep.message, timestamp: new Date() }])
    }
  }, [])

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])
  useEffect(() => { inputRef.current?.focus() }, [onboardingStep, isLoading])

  const handleOnboardingInput = async (input: string) => {
    const currentStep = ONBOARDING_SCRIPT[onboardingStep]
    setMessages(prev => [...prev, { id: `user-${Date.now()}`, role: 'user', content: input, timestamp: new Date() }])
    setInputValue('')
    setSelectedChoices([])
    const newUserData = { ...userData }
    if (currentStep.id === 'welcome') newUserData.name = input
    else if (currentStep.id === 'greeting') newUserData.focusArea = input
    else if (currentStep.id === 'focus_followup') newUserData.obstacles = input.split(', ')
    setUserData(newUserData)
    const nextStepIndex = onboardingStep + 1
    if (nextStepIndex < ONBOARDING_SCRIPT.length) {
      setOnboardingStep(nextStepIndex)
      const nextStep = ONBOARDING_SCRIPT[nextStepIndex]
      setTimeout(() => {
        setMessages(prev => [...prev, { id: `onboarding-${nextStepIndex}`, role: 'assistant', content: typeof nextStep.message === 'function' ? nextStep.message(newUserData) : nextStep.message, timestamp: new Date() }])
        if (nextStep.isComplete) setIsOnboardingComplete(true)
      }, 500)
    }
  }

  const searchKnowledge = (query: string): string => {
    if (knowledgeFiles.length === 0) return ''
    const queryLower = query.toLowerCase()
    const keywords = queryLower.split(/\s+/).filter(w => w.length > 2)
    const relevantSnippets: { file: string; content: string; score: number }[] = []
    for (const file of knowledgeFiles) {
      const contentLower = file.content.toLowerCase()
      let score = 0
      for (const keyword of keywords) { if (contentLower.includes(keyword)) score += (contentLower.match(new RegExp(keyword, 'g')) || []).length }
      if (score > 0) {
        const paragraphs = file.content.split(/\n\n+/)
        for (const para of paragraphs) {
          const paraLower = para.toLowerCase()
          let paraScore = 0
          for (const keyword of keywords) { if (paraLower.includes(keyword)) paraScore++ }
          if (paraScore > 0) relevantSnippets.push({ file: file.name, content: para.slice(0, 500), score: paraScore })
        }
      }
    }
    relevantSnippets.sort((a, b) => b.score - a.score)
    const topSnippets = relevantSnippets.slice(0, 3)
    if (topSnippets.length === 0) return ''
    return topSnippets.map(s => `[From ${s.file}]: ${s.content}`).join('\n\n')
  }

  const handleChat = async (input: string) => {
    setMessages(prev => [...prev, { id: `user-${Date.now()}`, role: 'user', content: input, timestamp: new Date() }])
    setInputValue('')
    setIsLoading(true)
    try {
      const conversationHistory = messages.slice(-10).map(m => ({ role: m.role, content: m.content }))
      const knowledgeContext = searchKnowledge(input)
      const response = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: input, conversationHistory, userData, knowledgeContext }) })
      const data = await response.json()
      setMessages(prev => [...prev, { id: `assistant-${Date.now()}`, role: 'assistant', content: data.response || 'I had trouble processing that. Could you try again?', timestamp: new Date() }])
    } catch { setMessages(prev => [...prev, { id: `error-${Date.now()}`, role: 'assistant', content: "Hmm, I couldn't connect to my brain. Make sure Ollama is running! 🧠", timestamp: new Date() }]) }
    finally { setIsLoading(false) }
  }

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (!inputValue.trim() || isLoading) return; if (!isOnboardingComplete) handleOnboardingInput(inputValue.trim()); else handleChat(inputValue.trim()) }
  const handleChoiceSelect = (choice: string) => { const currentStep = ONBOARDING_SCRIPT[onboardingStep]; if (currentStep.inputType === 'multi-choice') setSelectedChoices(prev => prev.includes(choice) ? prev.filter(c => c !== choice) : [...prev, choice]); else handleOnboardingInput(choice) }
  const handleMultiChoiceSubmit = () => { if (selectedChoices.length > 0) handleOnboardingInput(selectedChoices.join(', ')) }
  const handleReset = () => { localStorage.removeItem('paia-messages'); localStorage.removeItem('paia-userData'); localStorage.removeItem('paia-onboardingComplete'); localStorage.removeItem('paia-onboardingStep'); window.location.reload() }

  const handleConnectFolder = async () => {
    if (!('showDirectoryPicker' in window)) { alert('Your browser does not support folder access. Please use Chrome, Edge, or Brave.'); return }
    try {
      // @ts-expect-error - showDirectoryPicker is not in TypeScript types yet
      const dirHandle = await window.showDirectoryPicker()
      const files: FileInfo[] = []
      const readDirectory = async (handle: FileSystemDirectoryHandle, path: string = '') => {
        for await (const entry of handle.values()) {
          if (entry.kind === 'file') {
            const fileHandle = entry as FileSystemFileHandle
            const file = await fileHandle.getFile()
            if (/\.(txt|md|markdown|json|csv)$/i.test(file.name)) {
              const content = await file.text()
              files.push({ name: file.name, content: content.slice(0, 50000), path: path ? `${path}/${file.name}` : file.name })
            }
          } else if (entry.kind === 'directory' && !entry.name.startsWith('.')) {
            const subDir = entry as FileSystemDirectoryHandle
            await readDirectory(subDir, path ? `${path}/${entry.name}` : entry.name)
          }
        }
      }
      await readDirectory(dirHandle)
      setKnowledgeFiles(files); setFolderName(dirHandle.name); setFolderConnected(true); setShowFolderPanel(false)
    } catch (error) { if ((error as Error).name !== 'AbortError') { console.error('Error accessing folder:', error); alert('Could not access the folder. Please try again.') } }
  }

  const currentStep = ONBOARDING_SCRIPT[onboardingStep]

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: COLORS.background }}>
      <header className="border-b px-4 py-3 flex items-center justify-between" style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border }}>
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/')} className="text-2xl hover:scale-110 transition-transform">🌸</button>
          <div>
            <h1 className="font-semibold" style={{ color: COLORS.text }}>FELICIA</h1>
            <div className="flex items-center gap-2 text-xs" style={{ color: COLORS.textMuted }}>
              <span className={`w-2 h-2 rounded-full ${aiStatus === 'connected' ? 'bg-green-500' : aiStatus === 'offline' ? 'bg-red-500' : 'bg-yellow-500'}`}></span>
              {aiStatus === 'connected' ? 'Local AI Connected' : aiStatus === 'offline' ? 'AI Offline' : 'Checking...'}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => folderConnected ? setShowFolderPanel(!showFolderPanel) : handleConnectFolder()} className="p-2 rounded-lg transition-colors flex items-center gap-2" style={{ backgroundColor: folderConnected ? COLORS.accent : COLORS.surfaceLight, color: COLORS.text }} title={folderConnected ? `Connected: ${folderName}` : 'Connect Knowledge Folder'}>
            📁{folderConnected && <span className="text-xs px-1.5 py-0.5 rounded text-white" style={{ backgroundColor: COLORS.userBubbleHover }}>{knowledgeFiles.length}</span>}
          </button>
          <button onClick={handleReset} className="p-2 rounded-lg transition-colors" style={{ backgroundColor: COLORS.surfaceLight, color: COLORS.textMuted }} title="Reset conversation">🔄</button>
        </div>
      </header>

      {showFolderPanel && folderConnected && (
        <div className="border-b p-4" style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border }}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium" style={{ color: COLORS.text }}>📁 {folderName}</h3>
            <button onClick={handleConnectFolder} className="text-xs px-2 py-1 rounded" style={{ backgroundColor: COLORS.surfaceLight, color: COLORS.textMuted }}>Change Folder</button>
          </div>
          <div className="text-sm" style={{ color: COLORS.textMuted }}>{knowledgeFiles.length} file(s) loaded:<div className="mt-1 max-h-20 overflow-y-auto">{knowledgeFiles.map((f, i) => <div key={i} className="text-xs py-0.5">📄 {f.path}</div>)}</div></div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${message.role === 'user' ? 'rounded-br-md' : 'rounded-bl-md'}`} style={{ backgroundColor: message.role === 'user' ? COLORS.userBubble : COLORS.surfaceLight, color: COLORS.text }}>
              <div className="whitespace-pre-wrap">{message.content}</div>
            </div>
          </div>
        ))}
        {isLoading && <div className="flex justify-start"><div className="rounded-2xl rounded-bl-md px-4 py-3" style={{ backgroundColor: COLORS.surfaceLight }}><div className="flex gap-1"><span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: COLORS.textMuted, animationDelay: '0ms' }}></span><span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: COLORS.textMuted, animationDelay: '150ms' }}></span><span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: COLORS.textMuted, animationDelay: '300ms' }}></span></div></div></div>}
        <div ref={messagesEndRef} />
      </div>

      {!isOnboardingComplete && currentStep?.inputType === 'choice' && (
        <div className="px-4 pb-2"><div className="flex flex-wrap gap-2 justify-center">{currentStep.choices?.map((choice) => <button key={choice} onClick={() => handleChoiceSelect(choice)} className="px-4 py-2 rounded-full text-sm transition-all hover:scale-105" style={{ backgroundColor: COLORS.surfaceLight, color: COLORS.text, border: `1px solid ${COLORS.border}` }}>{choice}</button>)}</div></div>
      )}

      {!isOnboardingComplete && currentStep?.inputType === 'multi-choice' && (
        <div className="px-4 pb-2">
          <div className="flex flex-wrap gap-2 justify-center mb-2">{currentStep.choices?.map((choice) => <button key={choice} onClick={() => handleChoiceSelect(choice)} className="px-4 py-2 rounded-full text-sm transition-all" style={{ backgroundColor: selectedChoices.includes(choice) ? COLORS.userBubble : COLORS.surfaceLight, color: COLORS.text, border: `1px solid ${selectedChoices.includes(choice) ? COLORS.userBubble : COLORS.border}` }}>{choice}</button>)}</div>
          {selectedChoices.length > 0 && <div className="flex justify-center"><button onClick={handleMultiChoiceSubmit} className="px-6 py-2 rounded-full text-sm font-medium transition-all hover:scale-105" style={{ backgroundColor: COLORS.userBubble, color: COLORS.text }}>Continue →</button></div>}
        </div>
      )}

      <div className="border-t p-4" style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border }}>
        <form onSubmit={handleSubmit} className="flex gap-3">
          <input ref={inputRef} type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder={!isOnboardingComplete && currentStep?.inputType !== 'text' ? 'Or type your response...' : isOnboardingComplete ? 'Message FELICIA...' : currentStep?.placeholder || 'Type here...'} className="flex-1 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 transition-all" style={{ backgroundColor: COLORS.background, color: COLORS.text, borderColor: COLORS.border }} disabled={isLoading} />
          <button type="submit" disabled={!inputValue.trim() || isLoading} className="px-6 py-3 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105" style={{ backgroundColor: COLORS.userBubble, color: COLORS.text }}>{isLoading ? '...' : 'Send'}</button>
        </form>
      </div>
    </div>
  )
}
