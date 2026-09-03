import { Check, ShieldAlert, X } from "lucide-react";

import { PERMISSION_BITS, decodePermissions, groupPermissions } from "@/components/servers/constants";
import { Pill } from "@/components/servers/page-shell";

export function PermissionBreakdown({ value }: { value: string | number | null | undefined }) {
  const decoded = decodePermissions(value);
  const grouped = groupPermissions(decoded.granted);
  const grantedFlags = new Set(decoded.granted.map((permission) => permission.flag));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-xs text-channel">
        <span className="font-mono text-[12px] text-subhead">{decoded.raw}</span>
        <span>·</span>
        <span>
          {decoded.granted.length} of {PERMISSION_BITS.length} permissions
        </span>
        {decoded.unknownBits.length > 0 ? (
          <Pill tone="warning">unmapped bits {decoded.unknownBits.join(", ")}</Pill>
        ) : null}
      </div>

      {decoded.administrator ? (
        <div className="flex items-center gap-2 rounded bg-danger/15 px-3 py-2 text-sm text-danger">
          <ShieldAlert className="size-4" />
          Administrator — implicitly grants every permission.
        </div>
      ) : null}

      {grouped.length === 0 ? (
        <p className="text-sm text-faint">No permissions granted.</p>
      ) : (
        <div className="space-y-2">
          {grouped.map(([category, permissions]) => (
            <div key={category}>
              <div className="mb-1 text-[11px] font-semibold tracking-wide text-channel uppercase">{category}</div>
              <div className="flex flex-wrap gap-1.5">
                {permissions.map((permission) => (
                  <Pill key={permission.flag} tone="positive" title={`${permission.flag} · bit ${permission.bit}`}>
                    {permission.label}
                  </Pill>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <details className="rounded bg-surface-3/60">
        <summary className="cursor-pointer list-none px-3 py-1.5 text-[11px] font-semibold tracking-wide text-channel uppercase select-none hover:text-interactive-hover">
          All {PERMISSION_BITS.length} permission bits
        </summary>
        <ul className="grid grid-cols-1 gap-x-4 px-3 pb-2 sm:grid-cols-2">
          {PERMISSION_BITS.map((permission) => {
            const on = grantedFlags.has(permission.flag);
            return (
              <li
                key={permission.flag}
                className={`flex items-center gap-1.5 py-0.5 text-[12px] ${on ? "text-normal" : "text-faint"}`}
              >
                {on ? <Check className="size-3 text-positive" /> : <X className="size-3" />}
                <span className="truncate">{permission.label}</span>
                <span className="ml-auto shrink-0 font-mono text-[10px] text-faint">1&lt;&lt;{permission.bit}</span>
              </li>
            );
          })}
        </ul>
      </details>
    </div>
  );
}

export function OverwriteBreakdown({ allow, deny }: { allow: string; deny: string }) {
  const allowed = decodePermissions(allow).granted;
  const denied = decodePermissions(deny).granted;

  if (allowed.length === 0 && denied.length === 0) {
    return <p className="text-xs text-faint">No explicit allow or deny bits.</p>;
  }

  return (
    <div className="space-y-1.5">
      {allowed.length > 0 ? (
        <div className="flex flex-wrap items-baseline gap-1.5">
          <span className="text-[11px] font-semibold tracking-wide text-positive uppercase">Allow</span>
          {allowed.map((permission) => (
            <Pill key={permission.flag} tone="positive" title={permission.flag}>
              {permission.label}
            </Pill>
          ))}
        </div>
      ) : null}
      {denied.length > 0 ? (
        <div className="flex flex-wrap items-baseline gap-1.5">
          <span className="text-[11px] font-semibold tracking-wide text-danger uppercase">Deny</span>
          {denied.map((permission) => (
            <Pill key={permission.flag} tone="danger" title={permission.flag}>
              {permission.label}
            </Pill>
          ))}
        </div>
      ) : null}
      <div className="font-mono text-[10px] text-faint">
        allow {allow} · deny {deny}
      </div>
    </div>
  );
}
