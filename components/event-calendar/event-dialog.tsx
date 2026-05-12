/* eslint-disable react-hooks/set-state-in-effect */
// components/event-calendar/event-dialog.tsx
"use client";

import { format, isBefore } from "date-fns";
import { useCallback, useEffect, useMemo, useState } from "react";

import type {
  CalendarEvent,
  EventColor,
  EventRecurrence,
  EventVisibility,
} from "./types";
import {
  DefaultEndHour,
  DefaultStartHour,
  EndHour,
  StartHour,
} from "./constants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverPopup,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CalendarIcon, Trash2 } from "lucide-react";
import { de } from "date-fns/locale";

interface EventDialogProps {
  event: CalendarEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: CalendarEvent) => void;
  onDelete: (eventId: string) => void;
  availableOrgs: { id: string; name: string }[];
}

export function EventDialog({
  event,
  isOpen,
  onClose,
  onSave,
  onDelete,
  availableOrgs,
}: EventDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [startTime, setStartTime] = useState(`${DefaultStartHour}:00`);
  const [endTime, setEndTime] = useState(`${DefaultEndHour}:00`);
  const [allDay, setAllDay] = useState(false);
  const [location, setLocation] = useState("");
  const [color, setColor] = useState<EventColor>("sky");
  const [error, setError] = useState<string | null>(null);
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);
  const [recurrenceEndOpen, setRecurrenceEndOpen] = useState(false);

  const [recurrence, setRecurrence] = useState<EventRecurrence>("NONE");
  const [recurrenceEndDate, setRecurrenceEndDate] = useState<Date | undefined>(
    undefined,
  );
  const [organizationId, setOrganizationId] = useState<string>("");
  const [visibility, setVisibility] = useState<EventVisibility>("ORGANIZATION");

  const formatTimeForInput = useCallback((date: Date) => {
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = Math.floor(date.getMinutes() / 15) * 15;
    return `${hours}:${minutes.toString().padStart(2, "0")}`;
  }, []);

  const resetForm = useCallback(() => {
    setTitle("");
    setDescription("");
    setStartDate(new Date());
    setEndDate(new Date());
    setStartTime(`${DefaultStartHour}:00`);
    setEndTime(`${DefaultEndHour}:00`);
    setAllDay(false);
    setLocation("");
    setColor("sky");
    setRecurrence("NONE");
    setRecurrenceEndDate(undefined);
    // Default-Org: erste verfügbare wählen, falls vorhanden
    setOrganizationId(availableOrgs[0]?.id ?? "");
    setVisibility(availableOrgs.length > 0 ? "ORGANIZATION" : "PRIVATE");
    setError(null);
  }, [availableOrgs]);

  // Reset / Hydrate beim Öffnen
  useEffect(() => {
    if (!isOpen) return;

    if (event) {
      setTitle(event.title || "");
      setDescription(event.description || "");
      const start = new Date(event.start);
      const end = new Date(event.end);
      setStartDate(start);
      setEndDate(end);
      setStartTime(formatTimeForInput(start));
      setEndTime(formatTimeForInput(end));
      setAllDay(event.allDay || false);
      setLocation(event.location || "");
      setColor((event.color as EventColor) || "sky");
      setRecurrence((event.recurrence as EventRecurrence) ?? "NONE");
      setRecurrenceEndDate(
        event.recurrenceEndDate ? new Date(event.recurrenceEndDate) : undefined,
      );
      setOrganizationId(event.organizationId ?? availableOrgs[0]?.id ?? "");
      setVisibility((event.visibility as EventVisibility) ?? "ORGANIZATION");
      setError(null);
    } else {
      resetForm();
    }
  }, [event, isOpen, formatTimeForInput, resetForm, availableOrgs]);

  const timeOptions = useMemo(() => {
    const options = [];
    for (let hour = StartHour; hour <= EndHour; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const formattedHour = hour.toString().padStart(2, "0");
        const formattedMinute = minute.toString().padStart(2, "0");
        const value = `${formattedHour}:${formattedMinute}`;
        const date = new Date(2000, 0, 1, hour, minute);
        const label = format(date, "h:mm a");
        options.push({ label, value });
      }
    }
    return options;
  }, []);

  const handleSave = () => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (!allDay) {
      const [startHours = 0, startMinutes = 0] = startTime
        .split(":")
        .map(Number);
      const [endHours = 0, endMinutes = 0] = endTime.split(":").map(Number);

      if (
        startHours < StartHour ||
        startHours > EndHour ||
        endHours < StartHour ||
        endHours > EndHour
      ) {
        setError(
          `Selected time must be between ${StartHour}:00 and ${EndHour}:00`,
        );
        return;
      }

      start.setHours(startHours, startMinutes, 0);
      end.setHours(endHours, endMinutes, 0);
    } else {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    }

    if (isBefore(end, start)) {
      setError("End date cannot be before start date");
      return;
    }

    // Org-Validation
    if (visibility === "ORGANIZATION" && !organizationId) {
      setError("Bei Sichtbarkeit Organisation bitte eine Organisation wählen.");
      return;
    }

    const eventTitle = title.trim() ? title : "(no title)";

    onSave({
      ...event,
      allDay,
      color,
      description,
      end,
      id: event?.id || "",
      location,
      start,
      title: eventTitle,
      recurrence,
      recurrenceEndDate:
        recurrence !== "NONE" && recurrenceEndDate ? recurrenceEndDate : null,
      organizationId: visibility === "ORGANIZATION" ? organizationId : null,
      visibility,
    });
  };

  const handleDelete = () => {
    if (event?.id) onDelete(event.id);
  };

  const colorOptions: Array<{
    value: EventColor;
    label: string;
    bgClass: string;
    borderClass: string;
  }> = [
    {
      value: "sky",
      label: "Sky",
      bgClass: "bg-sky-400 data-[state=checked]:bg-sky-400",
      borderClass: "border-sky-400 data-[state=checked]:border-sky-400",
    },
    {
      value: "amber",
      label: "Amber",
      bgClass: "bg-amber-400 data-[state=checked]:bg-amber-400",
      borderClass: "border-amber-400 data-[state=checked]:border-amber-400",
    },
    {
      value: "violet",
      label: "Violet",
      bgClass: "bg-violet-400 data-[state=checked]:bg-violet-400",
      borderClass: "border-violet-400 data-[state=checked]:border-violet-400",
    },
    {
      value: "rose",
      label: "Rose",
      bgClass: "bg-rose-400 data-[state=checked]:bg-rose-400",
      borderClass: "border-rose-400 data-[state=checked]:border-rose-400",
    },
    {
      value: "emerald",
      label: "Emerald",
      bgClass: "bg-emerald-400 data-[state=checked]:bg-emerald-400",
      borderClass: "border-emerald-400 data-[state=checked]:border-emerald-400",
    },
    {
      value: "orange",
      label: "Orange",
      bgClass: "bg-orange-400 data-[state=checked]:bg-orange-400",
      borderClass: "border-orange-400 data-[state=checked]:border-orange-400",
    },
  ];

  const isRecurring = recurrence !== "NONE";

  return (
    <Dialog onOpenChange={(open) => !open && onClose()} open={isOpen}>
      <DialogPopup className="sm:max-w-[530px]">
        <DialogHeader>
          <DialogTitle>
            {event?.id ? "Termin bearbeiten" : "Neuer Termin"}
          </DialogTitle>
          <DialogDescription className="">
            {event?.id
              ? "Bearbeite die Details dieses Termin"
              : "Neuer Termin zum Kalender hinzufügen"}
          </DialogDescription>
        </DialogHeader>

        <DialogPanel>
          {error && (
            <div className="rounded-md bg-destructive/15 px-3 py-2 text-destructive text-sm">
              {error}
            </div>
          )}

          <div className="grid gap-4 py-4">
            {/* === Titel & Beschreibung === */}
            <div className="*:not-first:mt-1.5">
              <Label htmlFor="title">Titel</Label>
              <Input
                id="title"
                onChange={(e) => setTitle(e.target.value)}
                value={title}
                placeholder=""
              />
            </div>

            {/* === Sichtbarkeit (zuerst — bestimmt was du brauchst) === */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="*:not-first:mt-1.5">
                <Label>Sichtbarkeit</Label>
                <Select
                  value={visibility}
                  onValueChange={(v) => setVisibility(v as EventVisibility)}
                  items={[
                    { label: "Organisation", value: "ORGANIZATION" },
                    { label: "Alle Mitglieder", value: "PUBLIC" },
                    { label: "Nur ich", value: "PRIVATE" },
                  ]}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ORGANIZATION">Organisation</SelectItem>
                    <SelectItem value="PUBLIC">Alle Mitglieder</SelectItem>
                    <SelectItem value="PRIVATE">Nur ich</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {visibility === "ORGANIZATION" ? (
                <div className="*:not-first:mt-1.5">
                  <Label>Organisation</Label>
                  {availableOrgs.length === 0 ? (
                    <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                      Du bist keiner Organisation zugeordnet.
                    </div>
                  ) : (
                    <Select
                      items={availableOrgs.map((o) => ({
                        label: o.name,
                        value: o.id,
                      }))}
                      value={organizationId}
                      onValueChange={(v) => setOrganizationId(v ?? "")}>
                      <SelectTrigger>
                        <SelectValue placeholder="wählen…" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableOrgs.map((o) => (
                          <SelectItem key={o.id} value={o.id}>
                            {o.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              ) : null}
            </div>
            <div className="*:not-first:mt-1.5">
              <Label htmlFor="description">Beschreibung</Label>
              <Textarea
                id="description"
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                value={description}
              />
            </div>
            {/*! === All-day Toggle === */}
            <div className="flex items-center gap-2 pt-6">
              <Checkbox
                checked={allDay}
                id="all-day"
                onCheckedChange={(checked) => setAllDay(checked === true)}
              />
              <Label htmlFor="all-day">Ist der Termin ganztägig ?</Label>
            </div>
            {/* === Wiederholung === */}
            <div className="grid gap-4 sm:grid-cols-2 pt-4">
              <div className="*:not-first:mt-1.5 ">
                <Label>Wiederholung</Label>
                <Select
                  items={[
                    { label: "Einmalig", value: "NONE" },
                    { label: "Wöchentlich", value: "WEEKLY" },
                    { label: "Alle 2 Wochen", value: "BIWEEKLY" },
                    { label: "Monatlich", value: "MONTHLY" },
                  ]}
                  value={recurrence}
                  onValueChange={(v) => setRecurrence(v as EventRecurrence)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">Einmalig</SelectItem>
                    <SelectItem value="WEEKLY">Wöchentlich</SelectItem>
                    <SelectItem value="BIWEEKLY">Alle 2 Wochen</SelectItem>
                    <SelectItem value="MONTHLY">Monatlich</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {isRecurring ? (
                <div className="*:not-first:mt-1.5 flex flex-col ">
                  <Label className="mt-1.5 mb-0.5">Wiederholt sich bis</Label>
                  <Popover
                    onOpenChange={setRecurrenceEndOpen}
                    open={recurrenceEndOpen}>
                    <PopoverTrigger
                      render={
                        <Button
                          className={cn(
                            "group w-full justify-between border-input bg-background px-3 font-normal hover:bg-background",
                          )}
                          variant="outline"
                        />
                      }>
                      <span className="truncate">
                        {recurrenceEndDate
                          ? format(recurrenceEndDate, "PPP")
                          : "Endlos"}
                      </span>
                      <CalendarIcon
                        className="shrink-0 text-muted-foreground/80"
                        size={16}
                      />
                    </PopoverTrigger>
                    <PopoverPopup align="start" className="w-auto p-2">
                      <Calendar
                        defaultMonth={recurrenceEndDate ?? startDate}
                        disabled={{ before: startDate }}
                        mode="single"
                        onSelect={(date) => {
                          setRecurrenceEndDate(date ?? undefined);
                          setRecurrenceEndOpen(false);
                        }}
                        selected={recurrenceEndDate}
                      />
                      {recurrenceEndDate ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full mt-1"
                          onClick={() => {
                            setRecurrenceEndDate(undefined);
                            setRecurrenceEndOpen(false);
                          }}>
                          Endlos (Datum entfernen)
                        </Button>
                      ) : null}
                    </PopoverPopup>
                  </Popover>
                </div>
              ) : null}
            </div>

            {/* === Start === */}
            <div
              className={cn(
                " gap-4 grid  sm:grid-cols-2",
                allDay && "sm:grid-cols-1",
              )}>
              <div className="flex-1 *:not-first:mt-1.5 flex-col flex">
                <Label htmlFor="start-date">Start</Label>
                <Popover onOpenChange={setStartDateOpen} open={startDateOpen}>
                  <PopoverTrigger
                    render={
                      <Button
                        className={cn(
                          "group w-full justify-between border-input bg-background px-3 font-normal hover:bg-background",
                          !startDate && "text-muted-foreground",
                        )}
                        id="start-date"
                        variant="outline"
                      />
                    }>
                    <span className="truncate">
                      {startDate
                        ? format(startDate, "PPPP", { locale: de })
                        : "Datum wählen"}
                    </span>
                    <CalendarIcon
                      className="shrink-0 text-muted-foreground/80"
                      size={16}
                    />
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-auto p-2">
                    <Calendar
                      defaultMonth={startDate}
                      mode="single"
                      onSelect={(date) => {
                        if (date) {
                          setStartDate(date);
                          if (isBefore(endDate, date)) setEndDate(date);
                          setError(null);
                          setStartDateOpen(false);
                        }
                      }}
                      selected={startDate}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {!allDay && (
                <div className="min-w-28 *:not-first:mt-1.5 flex flex-col">
                  <Label htmlFor="start-time">Uhrzeit</Label>
                  <Input
                    id="start-time"
                    type="time"
                    value={startTime}
                    onValueChange={(value) => setStartTime(value || "")}
                  />
                </div>
              )}
            </div>

            {/* === Ende === Nur bei einmaligen Events sichtbar */}
            {!isRecurring ? (
              <div
                className={cn(
                  "grid sm:grid-cols-2 gap-4 ",
                  allDay && "sm:grid-cols-1",
                )}>
                <div className="flex-1 *:not-first:mt-1.5 flex-col flex">
                  <Label htmlFor="end-date">Ende</Label>
                  <Popover onOpenChange={setEndDateOpen} open={endDateOpen}>
                    <PopoverTrigger
                      render={
                        <Button
                          className={cn(
                            "group w-full justify-between border-input bg-background px-3 font-normal hover:bg-background",
                            !endDate && "text-muted-foreground",
                          )}
                          id="end-date"
                          variant="outline"
                        />
                      }>
                      <span className="truncate">
                        {endDate
                          ? format(endDate, "PPPP", { locale: de })
                          : "Datum wählen"}
                      </span>
                      <CalendarIcon
                        className="shrink-0 text-muted-foreground/80"
                        size={16}
                      />
                    </PopoverTrigger>
                    <PopoverContent align="start" className="w-auto p-2">
                      <Calendar
                        defaultMonth={endDate}
                        disabled={{ before: startDate }}
                        mode="single"
                        onSelect={(date) => {
                          if (date) {
                            setEndDate(date);
                            setError(null);
                            setEndDateOpen(false);
                          }
                        }}
                        selected={endDate}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {!allDay && (
                  <div className="min-w-28 *:not-first:mt-1.5 flex-col flex">
                    <Label htmlFor="end-time">Uhrzeit</Label>
                    <Input
                      id="end-time"
                      type="time"
                      value={endTime}
                      onValueChange={(value) => setEndTime(value || "")}
                    />
                  </div>
                )}
              </div>
            ) : (
              // Bei Recurrence: nur Uhrzeit-Ende für die einzelne Instanz
              !allDay && (
                <div className="*:not-first:mt-1.5 max-w-48 flex flex-col">
                  <Label htmlFor="end-time-rec">Endet um</Label>
                  <Input
                    id="end-time-rec"
                    type="time"
                    value={endTime}
                    onValueChange={(value) => setEndTime(value || "")}
                  />
                </div>
              )
            )}

            {/* === Ort === */}
            <div className="*:not-first:mt-1.5">
              <Label htmlFor="location">Ort</Label>
              <Input
                id="location"
                onChange={(e) => setLocation(e.target.value)}
                value={location}
              />
            </div>

            {/* === Farbe === */}
            <fieldset className="space-y-2">
              <legend className="font-medium text-foreground text-sm">
                Farbe ({" "}
                <span className="text-muted-foreground text-sm">
                  {colorOptions.find((c) => c.value === color)?.label}
                </span>
                )
              </legend>
              <RadioGroup
                className="flex gap-1.5 flex-row"
                onValueChange={(value: EventColor) => setColor(value)}
                value={color}>
                {colorOptions.map((c) => (
                  <RadioGroupItem
                    aria-label={c.label}
                    className={cn(
                      "size-6 shadow-none",
                      c.bgClass,
                      c.borderClass,
                    )}
                    id={`color-${c.value}`}
                    key={c.value}
                    value={c.value}
                  />
                ))}
              </RadioGroup>
            </fieldset>
          </div>
        </DialogPanel>

        <DialogFooter className="flex-row sm:justify-between">
          {event?.id && (
            <Button
              aria-label="Event löschen"
              onClick={handleDelete}
              size="icon"
              variant="outline">
              <Trash2 size={16} />
            </Button>
          )}
          <div className="flex flex-1 justify-end gap-2">
            <Button onClick={onClose} variant="outline">
              Abbrechen
            </Button>
            <Button onClick={handleSave}>Speichern</Button>
          </div>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
