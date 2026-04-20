"use client"

import * as React from "react"
import { format, isValid } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  value?: string | Date
  onChange?: (date: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function DatePicker({ value, onChange, placeholder = "Pick a date", className, disabled }: DatePickerProps) {
  const dateValue = React.useMemo(() => {
    if (!value) return undefined
    const d = typeof value === 'string' ? new Date(value) : value
    return isValid(d) ? d : undefined
  }, [value])
  
  const handleSelect = (date: Date | undefined) => {
    if (date && onChange) {
      // Return as ISO string or YYYY-MM-DD
      onChange(format(date, "yyyy-MM-dd"))
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal bg-muted/30 border-border/50 h-12 rounded-xl hover:bg-muted/50 transition-colors",
            !dateValue && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {dateValue ? format(dateValue, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={dateValue}
          onSelect={handleSelect}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}
