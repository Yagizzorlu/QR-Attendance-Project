"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type ValidateResult = {
  eventId: string;
  eventTitle: string;
  slot: string;
  expiresAt: string;
  distanceMeters: number;
  allowedMeters: number;
};

type ResolveResult =
  | { found: true; participantId: string; fullName: string }
  | { found: false };

type Step =
  | "loading"
  | "qr-error"
  | "identify"
  | "found"
  | "not-found"
  | "completing"
  | "completed"
  | "complete-error";

const QR_ERROR_MESSAGES: Record<string, string> = {
  INVALID_REQUEST:      "Geçersiz QR kodu.",
  EVENT_NOT_FOUND:      "Etkinlik bulunamadı.",
  INVALID_QR:           "Bu QR kod tanınmıyor.",
  QR_EXPIRED:           "Bu QR kod artık geçerli değil.",
  LOCATION_UNAVAILABLE: "Konum doğrulanamadı.",
  OUT_OF_RANGE:         "Etkinlik alanı dışındasınız.",
};

const inputCls =
  "w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-3 text-base text-slate-100 placeholder-slate-500 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";

export default function CheckInPage() {
  const params  = useSearchParams();
  const eventId = params.get("eventId");
  const slot    = params.get("slot");
  const sig     = params.get("sig");

  const [step, setStep]                   = useState<Step>("loading");
  const [qrError, setQrError]             = useState<string | null>(null);
  const [validated, setValidated]         = useState<ValidateResult | null>(null);
  const [contact, setContact]             = useState("");
  const [resolving, setResolving]         = useState(false);
  const [resolveError, setResolveError]   = useState<string | null>(null);
  const [found, setFound]                 = useState<Extract<ResolveResult, { found: true }> | null>(null);
  const [completeError, setCompleteError]         = useState<string | null>(null);
  const [completeErrorCode, setCompleteErrorCode] = useState<string | null>(null);
  const [regFirstName, setRegFirstName]           = useState("");
  const [regLastName, setRegLastName]             = useState("");
  const [registering, setRegistering]             = useState(false);
  const [registerError, setRegisterError]         = useState<string | null>(null);

  useEffect(() => {
    if (!eventId || !slot || !sig) {
      setQrError("INVALID_REQUEST");
      setStep("qr-error");
      return;
    }

    async function validate() {
      let latitude: number;
      let longitude: number;

      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10_000,
          })
        );
        latitude  = pos.coords.latitude;
        longitude = pos.coords.longitude;
      } catch {
        setQrError("LOCATION_UNAVAILABLE");
        setStep("qr-error");
        return;
      }

      try {
        const res = await fetch("/api/check-in/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventId, slot, sig, latitude, longitude }),
        });
        const data = await res.json();
        if (!res.ok) { setQrError(data.code ?? "INVALID_QR"); setStep("qr-error"); return; }
        setValidated(data.data);
        setStep("identify");
      } catch {
        setQrError("INVALID_REQUEST");
        setStep("qr-error");
      }
    }

    validate();
  }, [eventId, slot, sig]);

  useEffect(() => {
    if (step !== "found" || !found || !validated || !sig) return;

    setStep("completing");

    const v = validated;
    const f = found;

    async function complete() {
      try {
        const res = await fetch("/api/check-in/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventId: v.eventId,
            participantId: f.participantId,
            qrSlot: v.slot,
            qrSignatureHash: sig,
          }),
        });
        const data = await res.json();

        if (!res.ok) {
          setCompleteErrorCode(data.code ?? "UNKNOWN");
          setCompleteError(
            data.code === "DUPLICATE_ATTENDANCE"
              ? "Yoklamanız zaten alınmış."
              : "Yoklama kaydedilemedi."
          );
          setStep("complete-error");
          return;
        }

        setStep("completed");
      } catch {
        setCompleteErrorCode("NETWORK_ERROR");
        setCompleteError("Sunucuya ulaşılamadı.");
        setStep("complete-error");
      }
    }

    complete();
  }, [step, found, validated, sig]);

  async function handleIdentify(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validated || !contact.trim()) return;
    setResolving(true);
    setResolveError(null);

    const isEmail = contact.includes("@");
    const body = {
      eventId: validated.eventId,
      ...(isEmail ? { email: contact.trim() } : { phone: contact.trim() }),
    };

    try {
      const res = await fetch("/api/check-in/resolve-participant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setResolveError(data.message ?? "Bir hata oluştu."); return; }

      const result: ResolveResult = data.data;
      if (result.found) {
        setFound(result);
        setStep("found");
      } else {
        setStep("not-found");
      }
    } catch {
      setResolveError("Sunucuya ulaşılamadı.");
    } finally {
      setResolving(false);
    }
  }

  async function handleRegister(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validated || !sig) return;
    setRegistering(true);
    setRegisterError(null);

    const isEmail = contact.includes("@");
    const body = {
      eventId: validated.eventId,
      firstName: regFirstName.trim(),
      lastName: regLastName.trim(),
      ...(isEmail ? { email: contact.trim() } : { phone: contact.trim() }),
      qrSlot: validated.slot,
      qrSignatureHash: sig,
    };

    try {
      const res = await fetch("/api/check-in/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setCompleteErrorCode(data.code ?? "UNKNOWN");
        setCompleteError(
          data.code === "DUPLICATE_ATTENDANCE"
            ? "Yoklamanız zaten alınmış."
            : "Kayıt tamamlanamadı."
        );
        setStep("complete-error");
        return;
      }
      setFound({ found: true, participantId: data.data.participantId, fullName: data.data.fullName });
      setStep("completed");
    } catch {
      setRegisterError("Sunucuya ulaşılamadı.");
    } finally {
      setRegistering(false);
    }
  }

  if (step === "loading" || step === "completing") {
    const label = step === "completing" ? "Yoklama kaydediliyor..." : "Konum ve QR doğrulanıyor...";
    return (
      <FullScreen>
        <div className="flex flex-col items-center gap-4">
          <span className="h-10 w-10 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">{label}</p>
        </div>
      </FullScreen>
    );
  }

  if (step === "qr-error") {
    const message = qrError ? (QR_ERROR_MESSAGES[qrError] ?? "Bir hata oluştu.") : "Bir hata oluştu.";
    return (
      <FullScreen>
        <div className="flex flex-col items-center gap-4 text-center max-w-xs">
          <span className="text-5xl">⚠️</span>
          <div>
            <p className="text-lg font-semibold text-white">QR Geçersiz</p>
            <p className="mt-1 text-sm text-slate-400">{message}</p>
            {qrError === "QR_EXPIRED" && (
              <p className="mt-2 text-xs text-slate-500">
                Lütfen ekrandaki güncel QR kodu tekrar okutun.
              </p>
            )}
          </div>
        </div>
      </FullScreen>
    );
  }

  if (step === "identify") {
    return (
      <FullScreen>
        <div className="w-full max-w-sm flex flex-col gap-6">
          <div className="text-center">
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">{validated?.eventTitle}</p>
            <h1 className="text-2xl font-semibold text-white">Kimliğinizi Doğrulayın</h1>
            <p className="mt-1 text-sm text-slate-400">
              Kayıtlı e-posta veya telefon numaranızı girin.
            </p>
          </div>
          <form onSubmit={handleIdentify} className="flex flex-col gap-3">
            <input
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="E-posta veya telefon"
              required
              autoFocus
              className={inputCls}
            />
            {resolveError && <p className="text-sm text-red-400">{resolveError}</p>}
            <button
              type="submit"
              disabled={resolving}
              className="inline-flex items-center justify-center gap-2 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium transition-colors"
            >
              {resolving ? (
                <>
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Aranıyor...
                </>
              ) : (
                "Devam Et"
              )}
            </button>
          </form>
        </div>
      </FullScreen>
    );
  }

  if (step === "completed" && found) {
    return (
      <FullScreen>
        <div className="flex flex-col items-center gap-4 text-center max-w-xs">
          <span className="text-6xl">✅</span>
          <div>
            <p className="text-xl font-semibold text-white">Yoklamanız Alındı</p>
            <p className="mt-1 text-base text-slate-300">{found.fullName}</p>
            <p className="mt-0.5 text-sm text-slate-500">{validated?.eventTitle}</p>
          </div>
        </div>
      </FullScreen>
    );
  }

  if (step === "complete-error") {
    return (
      <FullScreen>
        <div className="flex flex-col items-center gap-4 text-center max-w-xs">
          <span className="text-5xl">⚠️</span>
          <div>
            <p className="text-lg font-semibold text-white">
              {completeErrorCode === "DUPLICATE_ATTENDANCE" ? "Zaten Kayıtlısınız" : "Hata Oluştu"}
            </p>
            <p className="mt-1 text-sm text-slate-400">{completeError}</p>
          </div>
        </div>
      </FullScreen>
    );
  }

  if (step === "not-found") {
    return (
      <FullScreen>
        <div className="w-full max-w-sm flex flex-col gap-6">
          <div className="text-center">
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">{validated?.eventTitle}</p>
            <h1 className="text-2xl font-semibold text-white">Kayıt Ol</h1>
            <p className="mt-1 text-sm text-slate-400">
              Sisteme kayıtlı değilsiniz. Bilgilerinizi girerek devam edin.
            </p>
          </div>
          <form onSubmit={handleRegister} className="flex flex-col gap-3">
            <input
              value={regFirstName}
              onChange={(e) => setRegFirstName(e.target.value)}
              placeholder="Ad"
              required
              autoFocus
              className={inputCls}
            />
            <input
              value={regLastName}
              onChange={(e) => setRegLastName(e.target.value)}
              placeholder="Soyad"
              required
              className={inputCls}
            />
            <input
              value={contact}
              readOnly
              className={`${inputCls} opacity-50 cursor-not-allowed`}
            />
            {registerError && <p className="text-sm text-red-400">{registerError}</p>}
            <button
              type="submit"
              disabled={registering}
              className="inline-flex items-center justify-center gap-2 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium transition-colors"
            >
              {registering ? (
                <>
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Kaydediliyor...
                </>
              ) : (
                "Yoklamayı Tamamla"
              )}
            </button>
          </form>
        </div>
      </FullScreen>
    );
  }

  return null;
}

function FullScreen({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      {children}
    </main>
  );
}
