"use client";

import Image from "next/image";
import { upload } from "@vercel/blob/client";
import { useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  BENCH_ROLES,
  LIMITS,
  headshotPrefix,
  type SaveResult,
} from "@/lib/team-portal";

type Save = (formData: FormData) => Promise<SaveResult>;
type Remove = () => Promise<SaveResult>;
type Status = "idle" | "saved" | "invalid" | "upload" | "full";

const inputClass = "w-full border border-derby-ink/20 rounded-lg px-3 py-2";

async function uploadHeadshot(teamId: string, fd: FormData): Promise<FormData | null> {
  const file = fd.get("headshot");
  fd.delete("headshot");
  if (file instanceof File && file.size > 0) {
    try {
      const safeName = file.name.replace(/[^a-z0-9._-]+/gi, "_");
      const blob = await upload(`${headshotPrefix(teamId)}${safeName}`, file, {
        access: "public",
        handleUploadUrl: "/api/team-upload",
        clientPayload: teamId,
      });
      fd.set("headshotUrl", blob.url);
    } catch {
      return null;
    }
  }
  return fd;
}

function Headshot({ url, alt, fallback }: { url: string | null; alt: string; fallback: string }) {
  return url ? (
    <Image
      src={url}
      alt={alt}
      width={72}
      height={96}
      className="rounded-lg w-[72px] aspect-[3/4] object-cover object-top shrink-0"
    />
  ) : (
    <div className="w-[72px] aspect-[3/4] rounded-lg bg-derby-ink/10 shrink-0 flex items-center justify-center font-display text-xl text-derby-ink/40">
      {fallback}
    </div>
  );
}

function HeadshotField({ hasHeadshot }: { hasHeadshot: boolean }) {
  const t = useTranslations("TeamPortal");
  return (
    <label className="block">
      <span className="block text-sm mb-1">
        {hasHeadshot ? t("replaceHeadshot") : t("headshot")}
      </span>
      <input type="file" name="headshot" accept="image/*" className="block w-full text-sm" />
    </label>
  );
}

function useSubmit(save: Save, onSaved?: () => void) {
  const [status, setStatus] = useState<Status>("idle");
  const [pending, startTransition] = useTransition();

  function run(prepare: (fd: FormData) => Promise<FormData | null>, form: HTMLFormElement) {
    setStatus("idle");
    startTransition(async () => {
      const fd = await prepare(new FormData(form));
      if (!fd) {
        setStatus("upload");
        return;
      }
      const result = await save(fd);
      if (result.ok) {
        setStatus("saved");
        onSaved?.();
      } else {
        setStatus(result.error === "full" ? "full" : "invalid");
      }
    });
  }
  return { status, pending, run };
}

function StatusLine({ status }: { status: Status }) {
  const t = useTranslations("TeamPortal");
  if (status === "saved") {
    return (
      <p role="status" className="text-sm text-green-700">
        {t("saved")}
      </p>
    );
  }
  if (status === "invalid" || status === "upload" || status === "full") {
    const key = { invalid: "errorInvalid", upload: "errorUpload", full: "errorFull" } as const;
    return (
      <p role="alert" className="text-sm text-derby-accent">
        {t(key[status])}
      </p>
    );
  }
  return null;
}

function Buttons({
  pending,
  label,
  remove,
}: {
  pending: boolean;
  label: string;
  remove?: Remove;
}) {
  const t = useTranslations("TeamPortal");
  const [removing, startRemove] = useTransition();
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="submit"
        disabled={pending || removing}
        className="bg-derby-ink text-white rounded-full px-4 py-2 font-bold disabled:opacity-40"
      >
        {pending ? t("saving") : label}
      </button>
      {remove && (
        <button
          type="button"
          disabled={pending || removing}
          onClick={() => {
            if (!window.confirm(t("confirmDelete"))) return;
            startRemove(async () => {
              await remove();
            });
          }}
          className="bg-white border border-derby-accent text-derby-accent rounded-full px-4 py-2 font-bold disabled:opacity-40"
        >
          {t("delete")}
        </button>
      )}
    </div>
  );
}

export function PlayerForm({
  teamId,
  player,
  save,
  remove,
}: {
  teamId: string;
  player?: {
    derbyName: string;
    number: string;
    pronouns: string | null;
    headshotUrl: string | null;
  };
  save: Save;
  remove?: Remove;
}) {
  const t = useTranslations("TeamPortal");
  const formRef = useRef<HTMLFormElement>(null);
  const { status, pending, run } = useSubmit(save, () => {
    if (!player) formRef.current?.reset();
  });

  return (
    <form
      ref={formRef}
      onSubmit={(e) => {
        e.preventDefault();
        run((fd) => uploadHeadshot(teamId, fd), e.currentTarget);
      }}
      className="bg-white rounded-2xl p-4 shadow space-y-3"
    >
      <div className="flex items-start gap-4">
        {player && (
          <Headshot url={player.headshotUrl} alt={player.derbyName} fallback={`#${player.number}`} />
        )}
        <div className="flex-1 grid gap-3 sm:grid-cols-[2fr_1fr]">
          <label className="block">
            <span className="block text-sm mb-1">{t("derbyName")}</span>
            <input
              name="derbyName"
              required
              maxLength={LIMITS.derbyName}
              defaultValue={player?.derbyName}
              className={inputClass}
            />
          </label>
          <label className="block">
            <span className="block text-sm mb-1">{t("number")}</span>
            <input
              name="number"
              required
              maxLength={LIMITS.number}
              defaultValue={player?.number}
              className={inputClass}
            />
          </label>
          <label className="block">
            <span className="block text-sm mb-1">{t("pronouns")}</span>
            <input
              name="pronouns"
              maxLength={LIMITS.pronouns}
              defaultValue={player?.pronouns ?? ""}
              className={inputClass}
            />
          </label>
          <HeadshotField hasHeadshot={!!player?.headshotUrl} />
        </div>
      </div>
      <Buttons pending={pending} label={player ? t("save") : t("add")} remove={remove} />
      <StatusLine status={status} />
    </form>
  );
}

export function BenchForm({
  teamId,
  member,
  save,
  remove,
}: {
  teamId: string;
  member?: { name: string; role: string; pronouns: string | null; headshotUrl: string | null };
  save: Save;
  remove?: Remove;
}) {
  const t = useTranslations("TeamPortal");
  const formRef = useRef<HTMLFormElement>(null);
  const { status, pending, run } = useSubmit(save, () => {
    if (!member) formRef.current?.reset();
  });

  return (
    <form
      ref={formRef}
      onSubmit={(e) => {
        e.preventDefault();
        run((fd) => uploadHeadshot(teamId, fd), e.currentTarget);
      }}
      className="bg-white rounded-2xl p-4 shadow space-y-3"
    >
      <div className="flex items-start gap-4">
        {member && (
          <Headshot
            url={member.headshotUrl}
            alt={member.name}
            fallback={member.name.charAt(0).toUpperCase()}
          />
        )}
        <div className="flex-1 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="block text-sm mb-1">{t("name")}</span>
            <input
              name="name"
              required
              maxLength={LIMITS.name}
              defaultValue={member?.name}
              className={inputClass}
            />
          </label>
          <label className="block">
            <span className="block text-sm mb-1">{t("role")}</span>
            <input
              name="role"
              required
              list="bench-roles"
              maxLength={LIMITS.role}
              defaultValue={member?.role}
              className={inputClass}
            />
          </label>
          <label className="block">
            <span className="block text-sm mb-1">{t("pronouns")}</span>
            <input
              name="pronouns"
              maxLength={LIMITS.pronouns}
              defaultValue={member?.pronouns ?? ""}
              className={inputClass}
            />
          </label>
          <HeadshotField hasHeadshot={!!member?.headshotUrl} />
        </div>
      </div>
      <Buttons pending={pending} label={member ? t("save") : t("add")} remove={remove} />
      <StatusLine status={status} />
    </form>
  );
}

export function BioForm({
  bioNl,
  bioEn,
  save,
}: {
  bioNl: string | null;
  bioEn: string | null;
  save: Save;
}) {
  const t = useTranslations("TeamPortal");
  const { status, pending, run } = useSubmit(save);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        run(async (fd) => fd, e.currentTarget);
      }}
      className="bg-white rounded-2xl p-4 shadow space-y-3"
    >
      <label className="block">
        <span className="block text-sm mb-1">{t("bioNl")}</span>
        <textarea
          name="bioNl"
          rows={5}
          maxLength={LIMITS.bio}
          defaultValue={bioNl ?? ""}
          className={inputClass}
        />
      </label>
      <label className="block">
        <span className="block text-sm mb-1">{t("bioEn")}</span>
        <textarea
          name="bioEn"
          rows={5}
          maxLength={LIMITS.bio}
          defaultValue={bioEn ?? ""}
          className={inputClass}
        />
      </label>
      <Buttons pending={pending} label={t("save")} />
      <StatusLine status={status} />
    </form>
  );
}

export function BenchRoleOptions() {
  return (
    <datalist id="bench-roles">
      {BENCH_ROLES.map((role) => (
        <option key={role} value={role} />
      ))}
    </datalist>
  );
}
