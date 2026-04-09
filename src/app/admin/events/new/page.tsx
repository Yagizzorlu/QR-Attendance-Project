"use client";

import { useState } from "react";

type FormState = {
  title: string;
  description: string;
  startsAt: string;
  endsAt: string;
  latitude: string;
  longitude: string;
  allowedRadiusMeters: string;
  qrRotationSeconds: string;
};

const initialState: FormState = {
  title: "",
  description: "",
  startsAt: "",
  endsAt: "",
  latitude: "",
  longitude: "",
  allowedRadiusMeters: "100",
  qrRotationSeconds: "60",
};

export default function NewEventPage() {
  const [form, setForm] = useState<FormState>(initialState);
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description || undefined,
          startsAt: new Date(form.startsAt).toISOString(),
          endsAt: new Date(form.endsAt).toISOString(),
          latitude: parseFloat(form.latitude),
          longitude: parseFloat(form.longitude),
          allowedRadiusMeters: parseInt(form.allowedRadiusMeters, 10),
          qrRotationSeconds: parseInt(form.qrRotationSeconds, 10),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message ?? "Bir hata oluştu.");
        return;
      }

      alert("Event created");
      setForm(initialState);
    } catch (err) {
      console.error("[NewEventPage] submit error:", err);
      alert("Bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10">
      <div className="max-w-4xl mx-auto">

        {/* Breadcrumb */}
        <p className="text-xs text-slate-500 tracking-wide uppercase mb-4">
          Admin &rsaquo; Events &rsaquo; New
        </p>

        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-white tracking-tight">
            Create New Event
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Define event details, location and QR rotation settings.
          </p>
        </div>

        {/* Form card */}
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-800 bg-slate-900 shadow-xl divide-y divide-slate-800"
        >
          {/* Section 1 — Basic Information */}
          <Section
            title="Basic Information"
            description="Name and description visible to admins."
          >
            <Field label="Title" required>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                required
                placeholder="e.g. Software Engineering — Week 3"
                className={inputCls}
              />
            </Field>
            <Field label="Description">
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={4}
                placeholder="Optional event description..."
                className={`${inputCls} resize-none`}
              />
            </Field>
          </Section>

          {/* Section 2 — Schedule */}
          <Section
            title="Schedule"
            description="Start and end times define the active check-in window."
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="Starts At" required>
                <input
                  type="datetime-local"
                  name="startsAt"
                  value={form.startsAt}
                  onChange={handleChange}
                  required
                  className={inputCls}
                />
              </Field>
              <Field label="Ends At" required>
                <input
                  type="datetime-local"
                  name="endsAt"
                  value={form.endsAt}
                  onChange={handleChange}
                  required
                  className={inputCls}
                />
              </Field>
            </div>
          </Section>

          {/* Section 3 — Location & Attendance Rules */}
          <Section
            title="Location & Attendance Rules"
            description="GPS coordinates and allowed check-in radius."
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="Latitude" required>
                <input
                  type="number"
                  name="latitude"
                  value={form.latitude}
                  onChange={handleChange}
                  step="any"
                  required
                  placeholder="e.g. 38.4192"
                  className={inputCls}
                />
              </Field>
              <Field label="Longitude" required>
                <input
                  type="number"
                  name="longitude"
                  value={form.longitude}
                  onChange={handleChange}
                  step="any"
                  required
                  placeholder="e.g. 27.1288"
                  className={inputCls}
                />
              </Field>
              <Field label="Allowed Radius (meters)" required>
                <input
                  type="number"
                  name="allowedRadiusMeters"
                  value={form.allowedRadiusMeters}
                  onChange={handleChange}
                  min={1}
                  required
                  className={inputCls}
                />
              </Field>
              <Field label="QR Rotation (seconds)" required>
                <input
                  type="number"
                  name="qrRotationSeconds"
                  value={form.qrRotationSeconds}
                  onChange={handleChange}
                  min={10}
                  required
                  className={inputCls}
                />
              </Field>
            </div>

            {/* Info box */}
            <div className="mt-5 flex items-start gap-2.5 rounded-lg border border-slate-700 bg-slate-800/60 px-4 py-3">
              <span className="mt-0.5 text-slate-400 text-sm">ℹ</span>
              <p className="text-sm text-slate-400">
                QR rotation controls how frequently the attendance QR code changes.
                Shorter intervals improve security but require participants to scan quickly.
              </p>
            </div>
          </Section>

          {/* Actions */}
          <div className="flex items-center justify-between px-6 py-5">
            <a
              href="/admin/events"
              className="text-sm text-slate-400 hover:text-slate-200 transition-colors"
            >
              ← Back to Events
            </a>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                "Create Event"
              )}
            </button>
          </div>
        </form>

      </div>
    </main>
  );
}

const inputCls =
  "w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50";

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="px-6 py-6 flex flex-col gap-5">
      <div>
        <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wide">
          {title}
        </h2>
        <p className="mt-0.5 text-xs text-slate-500">{description}</p>
      </div>
      {children}
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-slate-300">
        {label}
        {required && <span className="ml-1 text-blue-400">*</span>}
      </label>
      {children}
    </div>
  );
}
