import * as React from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

interface DateSelectProps {
  value?: Date
  onChange?: (date: Date | undefined) => void
  minDate?: Date
  className?: string
}

const MONTHS = [
  { value: 0, label: "Jan" },
  { value: 1, label: "Feb" },
  { value: 2, label: "Mar" },
  { value: 3, label: "Apr" },
  { value: 4, label: "May" },
  { value: 5, label: "Jun" },
  { value: 6, label: "Jul" },
  { value: 7, label: "Aug" },
  { value: 8, label: "Sep" },
  { value: 9, label: "Oct" },
  { value: 10, label: "Nov" },
  { value: 11, label: "Dec" },
]

function DateSelect({ value, onChange, minDate, className }: DateSelectProps) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const min = minDate || today

  const currentYear = today.getFullYear()
  const currentMonth = today.getMonth()
  const currentDay = today.getDate()

  // Local state for each selection component (null = not selected)
  const [localYear, setLocalYear] = React.useState<number | null>(null)
  const [localMonth, setLocalMonth] = React.useState<number | null>(null)
  const [localDay, setLocalDay] = React.useState<number | null>(null)

  // Sync local state when value prop changes (e.g., editing existing record)
  React.useEffect(() => {
    if (value) {
      setLocalYear(value.getFullYear())
      setLocalMonth(value.getMonth())
      setLocalDay(value.getDate())
    } else {
      setLocalYear(null)
      setLocalMonth(null)
      setLocalDay(null)
    }
  }, [value])

  const yearRange = React.useMemo(() => {
    const years = []
    for (let y = currentYear; y <= currentYear + 20; y++) {
      years.push(y)
    }
    return years
  }, [currentYear])

  const handleYearChange = (yearStr: string) => {
    const year = parseInt(yearStr, 10)
    setLocalYear(year)
    // If month and day already selected, attempt to emit a valid date
    if (localMonth !== null) {
      let day = localDay ?? 1
      const maxDay = new Date(year, localMonth, 0).getDate()
      if (day > maxDay) day = maxDay
      const newDate = new Date(year, localMonth, day)
      if (newDate >= min) {
        onChange?.(newDate)
      }
    }
  }

  const handleMonthChange = (monthStr: string) => {
    const month = parseInt(monthStr, 10)
    setLocalMonth(month)
    if (localYear !== null) {
      if (localDay !== null) {
        let day = localDay
        const maxDay = new Date(localYear, month + 1, 0).getDate()
        if (day > maxDay) day = maxDay
        const newDate = new Date(localYear, month, day)
        if (newDate >= min) {
          onChange?.(newDate)
        }
      } else {
        // User hasn't picked a day yet; no onChange
      }
    }
  }

  const handleDayChange = (dayStr: string) => {
    const day = parseInt(dayStr, 10)
    setLocalDay(day)
    if (localYear !== null && localMonth !== null) {
      const newDate = new Date(localYear, localMonth, day)
      if (newDate >= min) {
        onChange?.(newDate)
      }
    }
  }

  // Disabled predicates for each select's options
  const isYearDisabled = (year: number) => {
    // Disable if any date in that year before today? Simpler: if year < currentYear
    return year < currentYear
  }

  const isMonthDisabled = (month: number) => {
    if (localYear === null) return true // no year selected -> can't pick month (will be enabled once year selected)
    if (localYear === currentYear && month < currentMonth) return true
    return false
  }

  const maxDaysForMonth = localYear !== null && localMonth !== null
    ? new Date(localYear, localMonth + 1, 0).getDate()
    : 31

  const isDayDisabled = (day: number) => {
    if (localYear === null || localMonth === null) return true
    if (localYear === currentYear && localMonth === currentMonth && day < currentDay) return true
    return false
  }

  const yearValue = localYear?.toString() ?? ""
  const monthValue = localMonth !== null ? localMonth.toString() : ""
  const dayValue = localDay?.toString() ?? ""

  return (
    <div className={cn("flex gap-2", className)}>
      {/* Year Dropdown */}
      <Select value={yearValue} onValueChange={handleYearChange}>
        <SelectTrigger className="w-[100px]">
          <SelectValue placeholder="Year" />
        </SelectTrigger>
        <SelectContent className="max-h-[200px]">
          {yearRange.map((year) => (
            <SelectItem
              key={year}
              value={year.toString()}
              disabled={isYearDisabled(year)}
            >
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Month Dropdown */}
      <Select
        value={monthValue}
        onValueChange={handleMonthChange}
        disabled={localYear === null}
      >
        <SelectTrigger className="w-[90px]">
          <SelectValue placeholder="Month" />
        </SelectTrigger>
        <SelectContent>
          {MONTHS.map((m) => (
            <SelectItem
              key={m.value}
              value={m.value.toString()}
              disabled={isMonthDisabled(m.value)}
            >
              {m.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Day Dropdown */}
      <Select
        value={dayValue}
        onValueChange={handleDayChange}
        disabled={localMonth === null}
      >
        <SelectTrigger className="w-[70px]">
          <SelectValue placeholder="Day" />
        </SelectTrigger>
        <SelectContent className="max-h-[200px]">
          {Array.from({ length: maxDaysForMonth }, (_, i) => i + 1).map((d) => (
            <SelectItem
              key={d}
              value={d.toString()}
              disabled={isDayDisabled(d)}
            >
              {d}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

DateSelect.displayName = "DateSelect"

export { DateSelect }
