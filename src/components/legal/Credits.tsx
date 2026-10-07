"use client";

import { ASSET_ATTRIBUTIONS, type AssetAttribution } from "@/lib/assetCredits";

type Locale = "en" | "pt";

function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

function isSafeSourceLink(value: string): boolean {
  return isHttpUrl(value) || value === "/licenses/world-countries.json" || value === "/licenses/world-countries.md";
}

function checkedDate(value: string, locale: Locale): string {
  const dayMonthYear = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  const date = dayMonthYear
    ? new Date(`${dayMonthYear[3]}-${dayMonthYear[2]}-${dayMonthYear[1]}T00:00:00Z`)
    : new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale === "pt" ? "pt-PT" : "en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function Credits({ locale }: { locale: Locale }) {
  const pt = locale === "pt";
  const records: readonly AssetAttribution[] = ASSET_ATTRIBUTIONS;
  const verified = records.filter((record) => record.status === "VERIFIED").length;
  const tableLabels = pt
    ? ["Recurso", "Criador e atribuição", "Licença", "Estado"]
    : ["Asset", "Creator and attribution", "Licence", "Status"];
  const statusLabels: Record<string, string> = pt
    ? { VERIFIED: "Verificada", CONDITIONAL: "Condicional", UNKNOWN: "Desconhecida", REMOVE_OR_REPLACE: "Remover ou substituir" }
    : { VERIFIED: "Verified", CONDITIONAL: "Conditional", UNKNOWN: "Unknown", REMOVE_OR_REPLACE: "Remove or replace" };
  const permissionLabels: Record<string, string> = pt
    ? { PERMITTED: "Permitido", CONDITIONAL: "Condicional", UNKNOWN: "Por confirmar" }
    : { PERMITTED: "Permitted", CONDITIONAL: "Conditional", UNKNOWN: "To be confirmed" };
  const attributionRequired = (value: boolean | null) => {
    if (value === true) return pt ? "Sim" : "Yes";
    if (value === false) return pt ? "Não" : "No";
    return pt ? "Por confirmar" : "To be confirmed";
  };

  return (
    <>
      <section className="mb-6 border border-arcade-border bg-arcade-surface p-4">
        <p className="font-mono text-lg leading-6 text-gray-200 light:text-gray-700">
          {pt
            ? "O inventário indica a fonte e o estado de verificação de cada recurso. Os recursos com estado «condicional» só podem ser usados se forem cumpridas as condições indicadas. Os estados «desconhecida» e «remover ou substituir» não confirmam autorização para reutilização. Uma referência de crédito não concede direitos de utilização."
            : "The inventory lists each asset source and verification status. Assets marked “conditional” may only be used if their listed conditions are met. “Unknown” and “remove or replace” do not confirm permission to reuse. A credit entry does not grant permission to reuse an asset."}
        </p>
        <p className="mt-3 font-pixel text-[8px] leading-5 text-arcade-neon-cyan">
          {String(verified) + (pt ? " de " : " of ") + String(records.length) + (pt ? " recursos com estado verificado" : " assets have verified status")}
        </p>
      </section>
      <div
        role="region"
        aria-label={pt ? "Tabela de créditos. Desloque horizontalmente para consultar todas as colunas." : "Credits table. Scroll horizontally to view all columns."}
        tabIndex={0}
        className="overflow-x-auto border border-arcade-border focus-visible:outline focus-visible:outline-2 focus-visible:outline-arcade-neon-cyan"
      >
        <table className="w-full min-w-[760px] border-collapse text-left font-mono text-base">
          <thead className="bg-arcade-surface font-pixel text-[7px] leading-4 text-arcade-neon-cyan">
            <tr>{tableLabels.map((label) => <th key={label} scope="col" className="p-3">{label}</th>)}</tr>
          </thead>
          <tbody>
            {records.map((record) => {
              const useList = record.usedIn.join(", ");
              const assetUrls = [...new Set(record.assetUrls.filter(isHttpUrl))];
              const localAssetPaths = [...new Set([record.assetUrl, ...record.assetUrls].filter((value) => value && !isHttpUrl(value)))];
              const status = statusLabels[record.status] ?? record.status;
              const verifiedClass = record.status === "VERIFIED";
              return (
                <tr key={record.id} className="border-t border-arcade-border align-top text-gray-300 light:text-gray-700">
                  <td className="p-3">
                    <p className="mb-1 font-pixel text-[7px] leading-4 text-gray-400 light:text-gray-700">{record.kind}</p>
                    <p>{record.asset}</p>
                    {record.filename && record.filename !== record.asset && <p className="mt-1 break-all text-sm text-gray-400 light:text-gray-700">{record.filename}</p>}
                    {useList && <p className="mt-1 text-sm text-gray-400 light:text-gray-700">{useList}</p>}
                    {localAssetPaths.map((path) => <p key={path} className="mt-1 break-all text-sm text-gray-400 light:text-gray-700">{pt ? "Local no projeto: " : "Project path: "}{path}</p>)}
                    {assetUrls.map((url, index) => <a key={url} className="mt-1 mr-3 inline-block text-arcade-neon-cyan underline" href={url} target="_blank" rel="noreferrer">{pt ? `Abrir recurso ${index + 1}` : `Open asset ${index + 1}`}</a>)}
                    {isHttpUrl(record.sourceUrl) && <a className="mt-1 inline-block text-arcade-neon-cyan underline" href={record.sourceUrl} target="_blank" rel="noreferrer">{pt ? "Ver fonte" : "View source"}</a>}
                    {!!record.additionalSources?.length && (
                      <ul className="mt-1 space-y-1 text-sm">
                        {record.additionalSources.map((source) => (
                          <li key={source.url}>
                            {isSafeSourceLink(source.url)
                              ? <a className="text-arcade-neon-cyan underline" href={source.url} target="_blank" rel="noreferrer">{source.label}</a>
                              : <span>{source.label}<span className="text-gray-400 light:text-gray-700"> ({source.url})</span></span>}
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                  <td className="p-3">
                    <p>{record.creator || (pt ? "Não identificado" : "Not identified")}</p>
                    {record.attribution && <p className="mt-1 text-sm">{record.attribution}</p>}
                    <p className="mt-1 text-sm text-gray-400 light:text-gray-700">{pt ? "Atribuição obrigatória: " : "Attribution required: "}{attributionRequired(record.attributionRequired)}</p>
                  </td>
                  <td className="p-3">
                    <p>{record.license || (pt ? "Por confirmar" : "To be confirmed")}</p>
                    {record.sourceLicenseLabel && record.sourceLicenseLabel !== record.license && <p className="mt-1 text-sm text-gray-400 light:text-gray-700">{pt ? "Indicação da fonte: " : "Source label: "}{record.sourceLicenseLabel}</p>}
                    {record.licenseUrl && isHttpUrl(record.licenseUrl) && <a className="mt-1 inline-block text-arcade-neon-cyan underline" href={record.licenseUrl} target="_blank" rel="noreferrer">{pt ? "Ver licença" : "View licence"}</a>}
                    {record.commercialUse && <p className="mt-1 text-sm text-gray-400 light:text-gray-700">{pt ? "Uso comercial: " : "Commercial use: "}{permissionLabels[record.commercialUse] ?? record.commercialUse}</p>}
                    {record.modifications && <p className="mt-1 text-sm text-gray-400 light:text-gray-700">{pt ? "Alterações: " : "Modifications: "}{permissionLabels[record.modifications] ?? record.modifications}</p>}
                    {!!record.restrictions.length && <p className="mt-1 text-sm text-gray-400 light:text-gray-700">{pt ? "Restrições: " : "Restrictions: "}{record.restrictions.join("; ")}</p>}
                    {record.notes && <p className="mt-1 text-sm text-gray-400 light:text-gray-700">{record.notes}</p>}
                    {record.checkedOn && <p className="mt-1 text-sm text-gray-400 light:text-gray-700">{pt ? "Verificado em: " : "Checked on: "}{checkedDate(record.checkedOn, locale)}</p>}
                  </td>
                  <td className="p-3">
                    <span className={"inline-block border px-2 py-1 text-sm " + (verifiedClass ? "border-arcade-neon-green text-arcade-neon-green" : "border-arcade-neon-yellow text-arcade-neon-yellow")}>{status}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
