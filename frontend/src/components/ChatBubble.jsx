import { useState } from 'react'
import AIChatCard from '@/components/ui/ai-chat'
import { Sparkles, X } from 'lucide-react'

export default function ChatBubble() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 99999 }}>
      {isOpen && (
        <div style={{ marginBottom: '16px' }}>
          <AIChatCard onClose={() => setIsOpen(false)} />
        </div>
      )}

      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '28px',
          border: 'none',
          background: 'linear-gradient(135deg, #6366F1 0%, #A855F7 50%, #EC4899 100%)',
          color: '#FFFFFF',
          boxShadow: '0 8px 24px rgba(99, 102, 241, 0.5), 0 2px 6px rgba(0, 0, 0, 0.2)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
          transform: isOpen ? 'scale(0.92) rotate(90deg)' : 'scale(1)',
          marginLeft: 'auto'
        }}
        title="AI Timetable Assistant"
      >
        {isOpen ? <X className="w-6 h-6 text-white" /> : <Sparkles className="w-6 h-6 text-white" />}
      </button>
    </div>
  )
}
