import { Outlet } from 'react-router-dom'
import JournalFooter from '../components/journal/JournalFooter'
import JournalHeader from '../components/journal/JournalHeader'

const JournalLayout = () => {
  return (
    <div className="min-h-screen bg-[#f3ede2] text-slate-950 dark:bg-[#08121d] dark:text-slate-100">
      <div className="pointer-events-none fixed inset-0 opacity-70 dark:opacity-40">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.8),_transparent_30%),radial-gradient(circle_at_80%_20%,_rgba(244,114,42,0.16),_transparent_26%),linear-gradient(180deg,_rgba(255,255,255,0)_0%,_rgba(255,255,255,0.55)_100%)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(15,23,42,0.7),_transparent_30%),radial-gradient(circle_at_80%_20%,_rgba(251,146,60,0.12),_transparent_26%),linear-gradient(180deg,_rgba(3,7,18,0)_0%,_rgba(3,7,18,0.5)_100%)]" />
        <div className="journal-noise absolute inset-0" />
      </div>

      <JournalHeader />

      <main className="relative min-h-screen pt-36 sm:pt-40 xl:pt-44">
        <Outlet />
      </main>

      <JournalFooter />
    </div>
  )
}

export default JournalLayout
