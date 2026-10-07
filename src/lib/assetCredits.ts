import attributionRecords from "../data/assetProvenance.json";

export type AssetAttributionStatus = "VERIFIED" | "CONDITIONAL" | "UNKNOWN" | "REMOVE_OR_REPLACE";
export type AssetAttributionValue = "PERMITTED" | "CONDITIONAL" | "UNKNOWN";
export type AssetAttribution = {
  id: string;
  kind: string;
  asset: string;
  filename?: string;
  assetUrl: string;
  assetUrls: string[];
  usedIn: string[];
  sourceUrl: string;
  additionalSources?: { label: string; url: string }[];
  license: string;
  sourceLicenseLabel?: string;
  licenseUrl: string | null;
  creator: string | null;
  attribution: string;
  attributionRequired: boolean | null;
  commercialUse: AssetAttributionValue;
  modifications: AssetAttributionValue;
  status: AssetAttributionStatus;
  restrictions: string[];
  notes: string;
  checkedOn: string;
};

export const ASSET_ATTRIBUTIONS: AssetAttribution[] = attributionRecords as AssetAttribution[];