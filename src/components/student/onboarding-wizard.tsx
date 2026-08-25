"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, GraduationCap, Wallet, Bed, ArrowRight, ArrowLeft, Check, Sparkles } from "lucide-react";

type Preferences = {
  university: string;
  budgetMin: number;
  budgetMax: number;
  preferredArea: string;
  roomType: string;
  moveInDate: string;
};

const STEPS = [
  { id: "university", label: "University", icon: GraduationCap },
  { id: "budget", label: "Budget", icon: Wallet },
  { id: "area", label: "Area", icon: MapPin },
  { id: "room", label: "Room type", icon: Bed },
];

const UNIVERSITIES = [
  "AruSHA University",
  "IST-Arusha",
  "KM-Arusha",
  "Arusha Technical College",
  "Mount Meru University",
  "Other",
];

const AREAS = [
  "Njiro",
  "Olorien",
  "Sakina",
  "Usa River",
  "Tengeru",
  "Krakatoa",
  "Any area",
];

const ROOM_TYPES = [
  { value: "self-contained", label: "Self-contained", desc: "Private bathroom & kitchen" },
  { value: "private-room", label: "Private room", desc: "Shared bathroom, private room" },
  { value: "shared-room", label: "Shared room", desc: "Shared with other students" },
  { value: "studio", label: "Studio", desc: "All-in-one room" },
  { value: "any", label: "Any type", desc: "Show me everything" },
];

const BUDGET_PRESETS = [
  { min: 50000, max: 100000, label: "Under 100K" },
  { min: 100000, max: 150000, label: "100K - 150K" },
  { min: 150000, max: 200000, label: "150K - 200K" },
  { min: 200000, max: 500000, label: "200K - 500K" },
  { min: 0, max: 999999, label: "Any budget" },
];

export function OnboardingWizard({ onComplete }: { onComplete?: () => void }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [prefs, setPrefs] = useState<Preferences>({
    university: "",
    budgetMin: 100000,
    budgetMax: 200000,
    preferredArea: "",
    roomType: "",
    moveInDate: "",
  });
  const [saving, setSaving] = useState(false);

  const currentStep = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const isFirst = step === 0;

  async function handleComplete() {
    setSaving(true);
    try {
      await fetch("/api/student/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          university: prefs.university,
          budgetMin: prefs.budgetMin,
          budgetMax: prefs.budgetMax,
          preferredArea: prefs.preferredArea === "Any area" ? "" : prefs.preferredArea,
          roomType: prefs.roomType === "any" ? "" : prefs.roomType,
        }),
      });
      // Save to localStorage for immediate use
      localStorage.setItem("onboarding_complete", "true");
      localStorage.setItem("student_prefs", JSON.stringify(prefs));
      onComplete?.();
      router.push("/student/dashboard");
    } catch {
      onComplete?.();
      router.push("/student/dashboard");
    }
    setSaving(false);
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center">
              <div
                className={`flex size-10 items-center justify-center rounded-full border-2 transition-all ${
                  i < step
                    ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                    : i === step
                    ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                    : "border-[var(--glass-border)] text-[var(--text-tertiary)]"
                }`}
              >
                {i < step ? <Check size={18} /> : <s.icon size={18} />}
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`ml-2 h-0.5 w-8 sm:w-12 ${
                    i < step ? "bg-[var(--accent)]" : "bg-[var(--glass-border)]"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <p className="mt-3 text-center text-sm font-medium text-[var(--text-secondary)]">
          Step {step + 1} of {STEPS.length}: {currentStep.label}
        </p>
      </div>

      {/* Step content */}
      <div className="glass-surface p-6 sm:p-8 animate-fade-in" key={step}>
        {step === 0 && (
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">
              Which university do you attend?
            </h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              We&apos;ll show listings closer to your campus.
            </p>
            <div className="mt-4 space-y-2">
              {UNIVERSITIES.map((uni) => (
                <button
                  key={uni}
                  onClick={() => setPrefs({ ...prefs, university: uni })}
                  className={`w-full rounded-xl border p-3 text-left text-sm font-medium transition ${
                    prefs.university === uni
                      ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                      : "border-[var(--glass-border)] hover:border-[var(--accent)]/30"
                  }`}
                >
                  🎓 {uni}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">
              What&apos;s your monthly budget?
            </h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              In Tanzanian Shillings (TZS).
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {BUDGET_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() =>
                    setPrefs({ ...prefs, budgetMin: preset.min, budgetMax: preset.max })
                  }
                  className={`rounded-xl border p-3 text-center text-sm font-medium transition ${
                    prefs.budgetMin === preset.min && prefs.budgetMax === preset.max
                      ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                      : "border-[var(--glass-border)] hover:border-[var(--accent)]/30"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-3">
              <div className="flex-1">
                <label className="text-xs text-[var(--text-tertiary)]">Min (TZS)</label>
                <input
                  type="number"
                  value={prefs.budgetMin}
                  onChange={(e) => setPrefs({ ...prefs, budgetMin: Number(e.target.value) })}
                  className="mt-1 w-full rounded-lg border border-[var(--glass-border)] bg-transparent px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                />
              </div>
              <span className="mt-4 text-[var(--text-tertiary)]">—</span>
              <div className="flex-1">
                <label className="text-xs text-[var(--text-tertiary)]">Max (TZS)</label>
                <input
                  type="number"
                  value={prefs.budgetMax}
                  onChange={(e) => setPrefs({ ...prefs, budgetMax: Number(e.target.value) })}
                  className="mt-1 w-full rounded-lg border border-[var(--glass-border)] bg-transparent px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">
              Preferred area in Arusha?
            </h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Where would you like to live?
            </p>
            <div className="mt-4 space-y-2">
              {AREAS.map((area) => (
                <button
                  key={area}
                  onClick={() => setPrefs({ ...prefs, preferredArea: area })}
                  className={`w-full rounded-xl border p-3 text-left text-sm font-medium transition ${
                    prefs.preferredArea === area
                      ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                      : "border-[var(--glass-border)] hover:border-[var(--accent)]/30"
                  }`}
                >
                  📍 {area}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">
              What type of room?
            </h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Choose your preferred room type.
            </p>
            <div className="mt-4 space-y-2">
              {ROOM_TYPES.map((room) => (
                <button
                  key={room.value}
                  onClick={() => setPrefs({ ...prefs, roomType: room.value })}
                  className={`w-full rounded-xl border p-3 text-left transition ${
                    prefs.roomType === room.value
                      ? "border-[var(--accent)] bg-[var(--accent)]/10"
                      : "border-[var(--glass-border)] hover:border-[var(--accent)]/30"
                  }`}
                >
                  <span className="text-sm font-medium text-[var(--text-primary)]">
                    {room.label}
                  </span>
                  <span className="mt-0.5 block text-xs text-[var(--text-tertiary)]">
                    {room.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="mt-6 flex items-center justify-between">
        {!isFirst ? (
          <button
            onClick={() => setStep(step - 1)}
            className="button button-glass flex items-center gap-2 px-4"
          >
            <ArrowLeft size={16} /> Back
          </button>
        ) : (
          <div />
        )}

        {isLast ? (
          <button
            onClick={handleComplete}
            disabled={saving}
            className="button button-primary flex items-center gap-2 px-6"
          >
            {saving ? (
              "Saving..."
            ) : (
              <>
                <Sparkles size={16} /> Find my home
              </>
            )}
          </button>
        ) : (
          <button
            onClick={() => setStep(step + 1)}
            className="button button-primary flex items-center gap-2 px-6"
          >
            Next <ArrowRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
