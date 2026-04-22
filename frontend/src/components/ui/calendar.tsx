import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"
import { enUS } from "react-day-picker/locale"
import "react-day-picker/style.css"

import { cn } from "@/lib/utils"

function Calendar({
  className,
  showOutsideDays = false,
  locale = enUS,
  ...props
}: React.ComponentProps<typeof DayPicker> & { locale?: typeof enUS }) {
  return (
    <div className={cn("w-full max-w-[280px] bg-white rounded-[12px] p-3 border border-border", className)} role="application" aria-label="Calendar">
      <DayPicker
        showOutsideDays={showOutsideDays}
        locale={locale}
        fixedWeeks
        components={{
          Chevron: ({ orientation }) => {
            if (orientation === "left") {
              return <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            }
            return <ChevronRight className="h-4 w-4" aria-hidden="true" />
          },
        }}
        classNames={{
          months: "flex flex-col gap-2",
          month: "flex flex-col gap-2",
          caption: "flex justify-center pt-1 relative items-center",
          caption_label: "text-sm font-semibold text-textPrimary",
          nav: "flex items-center justify-between w-full",
          nav_button: "h-7 w-7 inline-flex items-center justify-center rounded-[8px] border border-border bg-surface hover:bg-border p-0 cursor-pointer disabled:opacity-50",
          nav_button_previous: "absolute left-0 -translate-x-1",
          nav_button_next: "absolute right-0 translate-x-1",
          table: "w-full border-collapse text-center",
          head_row: "flex w-full justify-around",
          head_cell: "text-muted-foreground w-9 font-normal text-xs",
          row: "flex w-full justify-around mt-1",
          cell: "h-9 w-9 p-0 text-center text-sm relative",
          day: "h-9 w-9 p-0 text-sm font-normal hover:bg-muted rounded-[8px] cursor-pointer",
          day_selected: "bg-primary text-white hover:bg-primary/90 rounded-[8px]",
          day_today: "border-2 border-primary font-bold rounded-[8px]",
          day_outside: "text-muted-foreground opacity-50",
          day_disabled: "text-muted-foreground opacity-30 cursor-not-allowed",
          day_hidden: "invisible",
        }}
        {...props}
      />
    </div>
  )
}

Calendar.displayName = "Calendar"

export { Calendar }