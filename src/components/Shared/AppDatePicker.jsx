import { useState, useRef, useEffect } from 'react'
import DatePicker from 'react-datepicker'
import { createPortal } from 'react-dom'
import './AppDatePicker.css'

const pad = n => String(n).padStart(2, '0')

function toIsoString(d, showTime) {
  if (showTime) {
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  }
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`
}

function formatDisplay(d, showTime) {
  if (!d) return ''
  const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  if (!showTime) return date
  return date + ' · ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

export default function AppDatePicker({ value, onChange, showTime = false, placeholder }) {
  const [open, setOpen]   = useState(false)
  const [pos, setPos]     = useState({ top: 0, left: 0 })
  const inputRef          = useRef()
  const calRef            = useRef()
  const date              = value ? new Date(value) : null

  const openCalendar = () => {
    const rect = inputRef.current.getBoundingClientRect()
    const calWidth = showTime ? 380 : 310
    const left = Math.min(rect.left, window.innerWidth - calWidth - 8)
    setPos({ top: rect.bottom + 4, left: Math.max(8, left) })
    setOpen(v => !v)
  }

  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (!calRef.current?.contains(e.target) && !inputRef.current?.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const handleChange = (d) => {
    if (!d) return
    onChange(toIsoString(d, showTime))
    if (!showTime) setOpen(false)
  }

  return (
    <div className="app-datepicker-wrap">
      <input
        ref={inputRef}
        readOnly
        value={formatDisplay(date, showTime)}
        placeholder={placeholder ?? (showTime ? 'Select date & time' : 'Select date')}
        onClick={openCalendar}
        className="app-datepicker-input"
      />
      {open && createPortal(
        <div ref={calRef} className="app-calendar-portal" style={{ top: pos.top, left: pos.left }}>
          <DatePicker
            selected={date}
            onChange={handleChange}
            showTimeSelect={showTime}
            timeIntervals={15}
            inline
            calendarClassName="app-calendar"
          />
        </div>,
        document.body
      )}
    </div>
  )
}
