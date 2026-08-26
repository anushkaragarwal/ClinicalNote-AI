'use client'

import { useEffect, useRef, useState } from 'react'
import { api, type ClinicalNote, type Patient } from '@/services/api'
import { Button } from '@/components/ui/button'
import {
  Activity, ArrowLeft, Bell, CalendarDays, Check, ChevronRight,
  ClipboardList, Clock3, Download, FileText, HeartPulse, Home, LogOut,
  Menu, MessageSquareText, Mic, Pencil, Play, Plus, Search, Send,
  Settings, ShieldCheck, Sparkles, StopCircle, Stethoscope, UserRound,
  Users, Volume2, X
} from 'lucide-react'

type Screen =
  | 'login' | 'dashboard' | 'patients' | 'patient' | 'start'
  | 'consultation' | 'transcript' | 'note' | 'assistant' | 'notes'
  | 'profile' | 'settings' | 'icd' | 'referrals' | 'reports' | 'notifications'

type GeneratedNote = {
  history: string
  examination: string
  investigations: string
  assessment: string
  plan: string
}

function Logo() {
  return <div className="flex items-center gap-3">
    <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
      <HeartPulse className="size-5" />
    </div>
    <div>
      <div className="font-semibold tracking-tight">ClinicalNote <span className="text-primary">AI</span></div>
      <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Clinical co-pilot</div>
    </div>
  </div>
}

function Status({ status }: { status: string }) {
  return <span className={`status ${status === 'Completed' ? 'status-success' : status === 'Pending Review' ? 'status-warning' : 'status-info'}`}>
    <span className="size-1.5 rounded-full bg-current" />{status}
  </span>
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <section className={`surface ${className}`}>{children}</section>
}

function Header({ title, onMenu, onProfile }: { title: string; onMenu: () => void; onProfile: () => void }) {
  return <header className="flex h-[72px] items-center justify-between border-b border-border bg-background px-5 md:px-8">
    <div className="flex items-center gap-3">
      <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenu}><Menu /></Button>
      <div>
        <p className="text-xs font-medium text-muted-foreground">ClinicalNote AI</p>
        <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
      </div>
    </div>
    <button onClick={onProfile} className="flex items-center gap-2 rounded-lg p-1.5 text-left hover:bg-muted">
      <div className="avatar">DR</div>
      <div className="hidden text-sm md:block"><p className="font-medium">Dr. Rachel Kim</p><p className="text-xs text-muted-foreground">General Medicine</p></div>
    </button>
  </header>
}

function Sidebar({ screen, navigate, open, onClose, logout }: {
  screen: Screen; navigate: (s: Screen) => void; open: boolean; onClose: () => void; logout: () => void
}) {
  const items: [Screen, string, React.ReactNode][] = [
    ['dashboard', 'Dashboard', <Home key="home" />],
    ['patients', 'Patients', <Users key="users" />],
    ['consultation', 'Consultations', <CalendarDays key="calendar" />],
    ['notes', 'Clinical Notes', <FileText key="file" />],
    ['assistant', 'AI Assistant', <MessageSquareText key="msg" />],
    ['icd', 'ICD Coding', <ClipboardList key="icd" />],
    ['referrals', 'Referrals', <ChevronRight key="ref" />],
    ['reports', 'Reports', <Activity key="reports" />],
    ['notifications', 'Notifications', <Bell key="bell" />],
  ]
  return <>
    <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
      <div className="mb-10 flex items-center justify-between"><Logo /><Button variant="ghost" size="icon" className="md:hidden" onClick={onClose}><X /></Button></div>
      <nav className="flex flex-col gap-1">{items.map(([id, label, icon]) =>
        <button key={id} onClick={() => { navigate(id); onClose() }} className={`nav-item ${screen === id ? 'nav-item-active' : ''}`}>{icon}<span>{label}</span></button>
      )}</nav>
      <div className="mt-auto flex flex-col gap-1">
        <button className="nav-item" onClick={() => navigate('profile')}><UserRound /><span>Profile</span></button>
        <button className="nav-item" onClick={() => navigate('settings')}><Settings /><span>Settings</span></button>
        <button className="nav-item text-destructive" onClick={logout}><LogOut /><span>Logout</span></button>
      </div>
    </aside>
    {open && <button className="fixed inset-0 z-30 bg-foreground/20 md:hidden" onClick={onClose} />}
  </>
}

function Shell({ screen, title, children, navigate, logout }: {
  screen: Screen; title: string; children: React.ReactNode; navigate: (s: Screen) => void; logout: () => void
}) {
  const [open, setOpen] = useState(false)
  return <div className="min-h-screen bg-background">
    <Sidebar screen={screen} navigate={navigate} open={open} onClose={() => setOpen(false)} logout={logout} />
    <div className="md:pl-64"><Header title={title} onMenu={() => setOpen(true)} onProfile={() => navigate('profile')} />
      <main className="mx-auto max-w-[1440px] p-5 md:p-8">{children}</main>
    </div>
  </div>
}

function Back({ onClick, label = 'Back' }: { onClick: () => void; label?: string }) {
  return <Button variant="ghost" className="mb-5 -ml-3 text-muted-foreground" onClick={onClick}><ArrowLeft data-icon="inline-start" />{label}</Button>
}

function Login({ onLogin }: { onLogin: () => void }) {
  const [show, setShow] = useState(false)
  return <div className="flex min-h-screen items-center justify-center bg-muted/50 p-5">
    <div className="w-full max-w-[430px]"><div className="mb-8 flex justify-center"><Logo /></div>
      <Card className="p-7 md:p-9">
        <h1 className="text-2xl font-semibold">Welcome back</h1>
        <p className="mt-2 text-sm text-muted-foreground">Sign in to continue to your clinical workspace.</p>
        <form className="mt-7 flex flex-col gap-5" onSubmit={e => { e.preventDefault(); onLogin() }}>
          <label className="field-label">Email address<input className="field-input" type="email" defaultValue="doctor@clinicalnote.ai" required /></label>
          <label className="field-label">Password<div className="relative"><input className="field-input pr-12" type={show ? 'text' : 'password'} defaultValue="password" required />
            <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShow(!show)}>{show ? <X className="size-4" /> : <Volume2 className="size-4" />}</button>
          </div></label>
          <Button type="submit" size="lg" className="w-full">Sign in</Button>
        </form>
      </Card>
      <p className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="size-3.5" />Your clinical data is protected</p>
    </div>
  </div>
}

function Dashboard({ navigate, patients }: { navigate: (s: Screen) => void; patients: Patient[] }) {
  return <><div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
    <div><p className="eyebrow">Overview</p><h2 className="mt-1 text-2xl font-semibold">Good morning, Dr. Kim</h2><p className="mt-1 text-sm text-muted-foreground">Your clinical workspace.</p></div>
    <Button onClick={() => navigate('start')}><Plus data-icon="inline-start" />Start New Consultation</Button>
  </div>
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
    <Card className="p-5"><CalendarDays /><p className="mt-4 text-sm text-muted-foreground">Patients</p><p className="mt-1 text-2xl font-semibold">{patients.length}</p></Card>
    <Card className="p-5"><Clock3 /><p className="mt-4 text-sm text-muted-foreground">AI documentation</p><p className="mt-1 text-2xl font-semibold">Ready</p></Card>
    <Card className="p-5"><Check /><p className="mt-4 text-sm text-muted-foreground">Backend</p><p className="mt-1 text-2xl font-semibold">Connected</p></Card>
    <Card className="p-5"><Users /><p className="mt-4 text-sm text-muted-foreground">Total patients</p><p className="mt-1 text-2xl font-semibold">{patients.length}</p></Card>
  </div>
  <Card className="mt-7 overflow-hidden">
    <div className="border-b border-border p-5"><h3 className="font-semibold">Patients</h3><p className="mt-1 text-sm text-muted-foreground">Loaded from your FastAPI backend.</p></div>
    <div className="overflow-x-auto"><table className="data-table"><thead><tr><th>Patient</th><th>ID</th><th>Age</th><th>Gender</th><th /></tr></thead>
      <tbody>{patients.map(p => <tr key={String(p.id)}><td className="font-medium">{p.name}</td><td className="font-mono text-xs">{p.patient_id ?? p.id}</td><td>{p.age}</td><td>{p.gender}</td><td><Button size="sm" onClick={() => navigate('start')}>Start consultation</Button></td></tr>)}</tbody>
    </table></div>
  </Card></>
}

function Patients({ patients, navigate }: { patients: Patient[]; navigate: (s: Screen) => void }) {
  const [query, setQuery] = useState('')
  const filtered = patients.filter(p => `${p.name} ${p.patient_id ?? p.id}`.toLowerCase().includes(query.toLowerCase()))
  return <><div className="mb-7 flex justify-between"><div><p className="eyebrow">Directory</p><h2 className="mt-1 text-2xl font-semibold">Patients</h2></div></div>
    <Card className="overflow-hidden"><div className="border-b border-border p-5"><div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2" /><input className="field-input pl-10" placeholder="Search patients..." value={query} onChange={e => setQuery(e.target.value)} /></div></div>
      <div className="overflow-x-auto"><table className="data-table"><thead><tr><th>Patient</th><th>Patient ID</th><th>Age / Gender</th><th /></tr></thead><tbody>{filtered.map(p =>
        <tr key={String(p.id)}><td className="font-medium">{p.name}</td><td>{p.patient_id ?? p.id}</td><td>{p.age} · {p.gender}</td><td><Button size="sm" onClick={() => navigate('start')}>Start consultation</Button></td></tr>
      )}</tbody></table></div>
    </Card></>
}

function StartConsultation({ patients, navigate, selectedPatient, setSelectedPatient }: {
  patients: Patient[]; navigate: (s: Screen) => void; selectedPatient: Patient | null; setSelectedPatient: (p: Patient) => void
}) {
  return <><Back onClick={() => navigate('dashboard')} label="Dashboard" /><div className="mx-auto max-w-2xl"><p className="eyebrow">New encounter</p><h2 className="mt-1 text-2xl font-semibold">Start consultation</h2>
    <Card className="mt-7 p-6"><label className="field-label">Select patient<select className="field-input" value={String(selectedPatient?.id ?? '')} onChange={e => { const p = patients.find(x => String(x.id) === e.target.value); if (p) setSelectedPatient(p) }}>
      <option value="">Select a patient</option>{patients.map(p => <option key={String(p.id)} value={String(p.id)}>{p.name} · {p.patient_id ?? p.id}</option>)}</select></label>
      <Button className="mt-8 w-full" disabled={!selectedPatient} onClick={() => navigate('consultation')}><Stethoscope data-icon="inline-start" />Start Consultation</Button>
    </Card></div></>
}

function Consultation({ navigate, patient, onTranscript, onAudio }: {
  navigate: (s: Screen) => void; patient: Patient | null; onTranscript: (text: string) => void; onAudio: (url: string) => void
}) {
  const [recording, setRecording] = useState(false)
  const [transcribing, setTranscribing] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState('')
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  useEffect(() => {
    if (!recording) return
    const id = window.setInterval(() => setSeconds(s => s + 1), 1000)
    return () => window.clearInterval(id)
  }, [recording])

  const startRecording = async () => {
    try {
      setError('')
      setTranscript('')
      setSeconds(0)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm'
      const recorder = new MediaRecorder(stream, { mimeType: mime })
      chunksRef.current = []
      recorder.ondataavailable = e => { if (e.data.size) chunksRef.current.push(e.data) }
      recorderRef.current = recorder
      recorder.start()
      setRecording(true)
    } catch (e) {
      console.error(e)
      setError('Microphone permission was denied or is unavailable.')
    }
  }

  const stopRecording = () => {
    const recorder = recorderRef.current
    if (!recorder) return
    recorder.onstop = async () => {
      try {
        setRecording(false)
        setTranscribing(true)
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
        const file = new File([blob], `consultation-${Date.now()}.webm`, { type: blob.type })
        onAudio(URL.createObjectURL(blob))
        const result = await api.transcribeAudio(file)
        const text = result.transcript || ''
        setTranscript(text)
        onTranscript(text)
        if (!text) setError('No speech was detected in the recording.')
      } catch (e) {
        console.error(e)
        setError(e instanceof Error ? e.message : 'Transcription failed.')
      } finally {
        setTranscribing(false)
      }
    }
    recorder.stop()
    recorder.stream.getTracks().forEach(track => track.stop())
    recorderRef.current = null
  }

  const time = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`

  return <><Back onClick={() => navigate('start')} label="Start consultation" />
    <div className="mb-6"><p className="eyebrow">{patient?.name ?? 'Patient'}</p><h2 className="mt-1 text-2xl font-semibold">Voice consultation</h2></div>
    <div className="grid gap-5 lg:grid-cols-[1fr_1.05fr]">
      <Card className="flex min-h-[430px] flex-col items-center justify-center p-7 text-center">
        <div className={`mic-ring ${recording ? 'mic-recording' : ''}`}><button className="mic-button" onClick={recording ? stopRecording : startRecording}>{recording ? <StopCircle /> : <Mic />}</button></div>
        <p className="mt-7 text-lg font-semibold">{recording ? 'Recording consultation' : transcribing ? 'Transcribing...' : transcript ? 'Recording complete' : 'Ready to record'}</p>
        <p className="mt-2 font-mono text-sm text-muted-foreground">{time}</p>
        {recording && <Button variant="destructive" className="mt-7" onClick={stopRecording}><StopCircle data-icon="inline-start" />Stop Recording</Button>}
        {!recording && !transcribing && !transcript && <Button className="mt-7" size="lg" onClick={startRecording}><Mic data-icon="inline-start" />Start Recording</Button>}
        {error && <p className="mt-5 max-w-md text-sm text-destructive">{error}</p>}
      </Card>
      <Card className="flex min-h-[430px] flex-col overflow-hidden">
        <div className="border-b border-border p-5"><p className="eyebrow">Live transcript</p><h3 className="mt-1 font-semibold">Real consultation transcript</h3></div>
        <div className="flex-1 p-5">{transcribing ? <p className="text-sm text-muted-foreground">Sending recorded audio to FastAPI → Groq Whisper...</p> : transcript ? <p className="whitespace-pre-wrap text-sm leading-7">{transcript}</p> : <p className="text-sm text-muted-foreground">Start speaking to create the transcript.</p>}</div>
        <div className="border-t border-border p-5"><Button className="w-full" disabled={!transcript || transcribing} onClick={() => navigate('note')}><Sparkles data-icon="inline-start" />Generate Clinical Note</Button></div>
      </Card>
    </div>
  </>
}

function Transcript({ navigate, transcript, audioUrl }: { navigate: (s: Screen) => void; transcript: string; audioUrl: string }) {
  return <><Back onClick={() => navigate('consultation')} label="Voice consultation" /><div className="mb-7"><p className="eyebrow">AI transcription</p><h2 className="mt-1 text-2xl font-semibold">Consultation transcript</h2></div>
    <Card className="p-5">{audioUrl && <audio className="mb-6 w-full" controls src={audioUrl} />}<div className="max-w-3xl whitespace-pre-wrap text-sm leading-7">{transcript || 'No transcript available.'}</div>
      <div className="mt-7 border-t border-border pt-5"><Button onClick={() => navigate('note')} disabled={!transcript}><Sparkles data-icon="inline-start" />Generate Clinical Note</Button></div>
    </Card></>
}

function Note({ navigate, transcript, note, setNote }: {
  navigate: (s: Screen) => void; transcript: string; note: GeneratedNote | null; setNote: (n: GeneratedNote) => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const generate = async () => {
    try {
      setLoading(true); setError('')
      const result = await api.generateClinicalNote(transcript)
      const n = result.note ?? result
      setNote({
        history: n.history ?? 'Not documented',
        examination: n.examination ?? 'Not documented',
        investigations: n.investigations ?? 'Not documented',
        assessment: n.assessment ?? 'Not documented',
        plan: n.plan ?? 'Not documented',
      })
    } catch (e) {
      console.error(e); setError(e instanceof Error ? e.message : 'Clinical note generation failed.')
    } finally { setLoading(false) }
  }

  useEffect(() => { if (transcript && !note) void generate() }, [])

  return <><Back onClick={() => navigate('transcript')} label="Transcript" /><div className="mb-7"><p className="eyebrow">AI documentation</p><h2 className="mt-1 text-2xl font-semibold">Clinical note</h2><p className="mt-2 text-sm text-muted-foreground">Generated only from the recorded transcript. Clinician review required.</p></div>
    <Card className="p-6">
      {loading && <p className="text-sm text-muted-foreground">Generating clinical note with the backend AI...</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}
      {note && <div className="flex flex-col gap-6">{Object.entries(note).map(([key, value]) =>
        <div key={key}><h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{key}</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-7">{value}</p></div>
      )}</div>}
      {!loading && !note && !error && <Button onClick={generate} disabled={!transcript}><Sparkles data-icon="inline-start" />Generate Clinical Note</Button>}
    </Card>
  </>
}

function Assistant() {
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState<{from: string; text: string}[]>([])
  const [loading, setLoading] = useState(false)
  const ask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!question.trim()) return
    const q = question.trim(); setQuestion(''); setMessages(m => [...m, { from: 'Doctor', text: q }]); setLoading(true)
    try { const r = await api.askClinicalAssistant(q); setMessages(m => [...m, { from: 'AI', text: r.answer }]) }
    catch (err) { setMessages(m => [...m, { from: 'AI', text: err instanceof Error ? err.message : 'Assistant request failed.' }]) }
    finally { setLoading(false) }
  }
  return <div className="mx-auto max-w-3xl"><div className="mb-7"><p className="eyebrow">Clinical support</p><h2 className="mt-1 text-2xl font-semibold">ClinicalNote AI Assistant</h2></div>
    <Card className="overflow-hidden"><div className="min-h-[360px] p-6">{messages.length === 0 ? <p className="text-sm text-muted-foreground">Ask a question. The response will come from your backend AI assistant.</p> : messages.map((m, i) => <div key={i} className="mb-4"><p className="text-xs font-semibold text-muted-foreground">{m.from}</p><p className="mt-1 whitespace-pre-wrap text-sm leading-6">{m.text}</p></div>)}</div>
      <form className="flex gap-2 border-t border-border p-4" onSubmit={ask}><input className="field-input" placeholder="Ask a clinical support question..." value={question} onChange={e => setQuestion(e.target.value)} /><Button type="submit" size="icon" disabled={loading}><Send /></Button></form>
    </Card></div>
}

function SimplePage({ title, eyebrow, description, icon }: { title: string; eyebrow: string; description: string; icon: React.ReactNode }) {
  return <div className="mx-auto max-w-4xl"><div className="mb-7"><p className="eyebrow">{eyebrow}</p><h2 className="mt-1 text-2xl font-semibold">{title}</h2><p className="mt-1 text-sm text-muted-foreground">{description}</p></div><Card className="p-7"><div className="flex items-start gap-4"><div className="text-primary">{icon}</div><div><h3 className="font-semibold">Clinical workspace</h3><p className="mt-2 text-sm text-muted-foreground">This area is ready for the next backend integration.</p></div></div></Card></div>
}

export default function Page() {
  const [screen, setScreen] = useState<Screen>('login')
  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [transcript, setTranscript] = useState('')
  const [audioUrl, setAudioUrl] = useState('')
  const [note, setNote] = useState<GeneratedNote | null>(null)
  const [loadError, setLoadError] = useState('')

 useEffect(() => {
  if (screen === 'dashboard' || screen === 'patients' || screen === 'start') {
    api.getPatients()
      .then((data) => {
        setPatients(data)
      })
      .catch((e) => {
        setLoadError(
          e instanceof Error ? e.message : 'Failed to load patients'
        )
      })
  }
}, [screen])

  const navigate = (s: Screen) => setScreen(s)

  const titles: Partial<Record<Screen, string>> = {
    dashboard: 'Dashboard', patients: 'Patients', patient: 'Patient Profile', start: 'Start Consultation',
    consultation: 'Voice Consultation', transcript: 'Consultation Transcript', note: 'Clinical Note',
    assistant: 'AI Assistant', notes: 'Clinical Notes', profile: 'Profile', settings: 'Settings',
    icd: 'ICD Coding', referrals: 'Referrals', reports: 'Reports', notifications: 'Notifications'
  }

  if (screen === 'login') return <Login onLogin={() => navigate('dashboard')} />

  let content: React.ReactNode
  if (screen === 'dashboard') content = <Dashboard navigate={navigate} patients={patients} />
  else if (screen === 'patients') content = <Patients patients={patients} navigate={navigate} />
  else if (screen === 'start') content = <StartConsultation patients={patients} navigate={navigate} selectedPatient={selectedPatient} setSelectedPatient={setSelectedPatient} />
  else if (screen === 'consultation') content = <Consultation patient={selectedPatient} navigate={navigate} onTranscript={setTranscript} onAudio={setAudioUrl} />
  else if (screen === 'transcript') content = <Transcript navigate={navigate} transcript={transcript} audioUrl={audioUrl} />
  else if (screen === 'note') content = <Note navigate={navigate} transcript={transcript} note={note} setNote={setNote} />
  else if (screen === 'assistant') content = <Assistant />
  else if (screen === 'notes') content = <SimplePage title="Clinical notes" eyebrow="Documentation" description="Review saved clinical notes." icon={<FileText />} />
  else if (screen === 'profile') content = <SimplePage title="Dr. Rachel Kim" eyebrow="Your profile" description="General Medicine · ClinicalNote AI" icon={<UserRound />} />
  else if (screen === 'settings') content = <SimplePage title="Settings" eyebrow="Workspace" description="Manage your workspace settings." icon={<Settings />} />
  else content = <SimplePage title={titles[screen] ?? 'ClinicalNote AI'} eyebrow="Workspace" description="ClinicalNote AI workspace." icon={<Activity />} />

  return <><Shell screen={screen} title={titles[screen] ?? 'ClinicalNote AI'} navigate={navigate} logout={() => navigate('login')}>{loadError && <div className="mb-5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{loadError}</div>}{content}</Shell></>
}
