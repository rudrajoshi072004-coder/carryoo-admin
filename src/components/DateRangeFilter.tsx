import { useEffect, useRef, useState } from 'react'
import { useAdminLanguage } from '../i18n/LanguageContext'
import { intlLocale } from '../i18n/formatLocale'
import { CalendarDays } from 'lucide-react'
import {
  DATE_PRESETS,
  customRange,
  formatRangeLabel,
  rangeForPreset,
  toInputDate,
  type DateRange,
} from '../lib/dateRange'
import './DateRangeFilter.css'

interface DateRangeFilterProps {
  value: DateRange
  onChange: (range: DateRange) => void
}

export default function DateRangeFilter({ value, onChange }: DateRangeFilterProps) {
  const { t, locale } = useAdminLanguage()
  const [open, setOpen] = useState(false)
  const [fromValue, setFromValue] = useState(toInputDate(value.from))
  const [toValue, setToValue] = useState(toInputDate(value.to))
  const [error, setError] = useState<string | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const today = toInputDate(new Date())

  useEffect(() => {
    if (!open) return
    setFromValue(toInputDate(value.from))
    setToValue(toInputDate(value.to))
    setError(null)
  }, [open, value.from, value.to])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const applyCustom = () => {
    if (!fromValue || !toValue) {
      setError(t('ui.chooseDates'))
      return
    }
    onChange(customRange(fromValue, toValue))
    setOpen(false)
  }

  return (
    <div className="date-range-filter" ref={rootRef}>
      <div className="date-range-filter__controls" role="group" aria-label={t('ui.dateRange')}>
        {DATE_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className={`date-range-filter__btn ${value.preset === preset.id ? 'is-active' : ''}`}
            aria-pressed={value.preset === preset.id}
            onClick={() => {
              setOpen(false)
              onChange(rangeForPreset(preset.id))
            }}
          >
            {t(`ui.${preset.id}`)}
          </button>
        ))}
        <button
          type="button"
          className={`date-range-filter__btn date-range-filter__btn--calendar ${value.preset === 'custom' || open ? 'is-active' : ''}`}
          aria-pressed={value.preset === 'custom'}
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
        >
          <CalendarDays size={15} strokeWidth={1.75} />
          {t('ui.calendar')}
        </button>
      </div>

      <p className="date-range-filter__label">
        {t('ui.showingFor')} <strong>{formatRangeLabel(value, intlLocale(locale))}</strong>
      </p>

      {open ? (
        <div className="date-range-filter__popover" role="dialog" aria-label={t('ui.customRange')}>
          <p className="date-range-filter__popover-title">{t('ui.customRange')}</p>
          <div className="date-range-filter__fields">
            <label>
              <span>{t('ui.from')}</span>
              <input
                type="date"
                max={toValue || today}
                value={fromValue}
                onChange={(event) => setFromValue(event.target.value)}
              />
            </label>
            <label>
              <span>{t('ui.to')}</span>
              <input
                type="date"
                min={fromValue}
                max={today}
                value={toValue}
                onChange={(event) => setToValue(event.target.value)}
              />
            </label>
          </div>
          {error ? <p className="date-range-filter__error">{error}</p> : null}
          <div className="date-range-filter__popover-actions">
            <button type="button" className="cy-btn cy-btn--ghost cy-btn--sm" onClick={() => setOpen(false)}>
              {t('ui.cancel')}
            </button>
            <button type="button" className="cy-btn cy-btn--primary cy-btn--sm" onClick={applyCustom}>
              {t('ui.apply')}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
