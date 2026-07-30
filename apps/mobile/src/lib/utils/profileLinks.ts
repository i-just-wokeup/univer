export type NormalizedProfileLink = {
  label: string;
  order_index: number;
  url: string;
};

export type SocialPlatform = "generic" | "instagram" | "youtube";

const SOCIAL_PLATFORM_DOMAINS: Record<Exclude<SocialPlatform, "generic">, string[]> = {
  instagram: ["instagram.com"],
  youtube: ["youtube.com", "youtu.be"],
};

const SOCIAL_PLATFORM_LABELS: Record<Exclude<SocialPlatform, "generic">, string> = {
  instagram: "Instagram",
  youtube: "YouTube",
};

function withProtocol(value: string) {
  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  return `https://${value}`;
}

export function normalizeProfileUrl(value: string): string | null {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  try {
    const url = new URL(withProtocol(trimmedValue));

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }

    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

export function getProfileLinkLabel(url: string): string {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function matchesDomain(hostname: string, domain: string) {
  return hostname === domain || hostname.endsWith(`.${domain}`);
}

export function getProfileLinkPlatform(url: string): SocialPlatform {
  try {
    const parsedUrl = new URL(withProtocol(url));
    const hostname = parsedUrl.hostname.toLowerCase().replace(/^www\./, "");
    const match = Object.entries(SOCIAL_PLATFORM_DOMAINS).find(
      ([, domains]) => domains.some((domain) => matchesDomain(hostname, domain)),
    );

    if (match) {
      return match[0] as Exclude<SocialPlatform, "generic">;
    }

    return "generic";
  } catch {
    return "generic";
  }
}

export function getSocialPlatformFromUrl(url: string): SocialPlatform {
  return getProfileLinkPlatform(url);
}

export function getProfileLinkDisplayLabel(url: string): string {
  const platform = getProfileLinkPlatform(url);

  if (platform !== "generic") {
    return SOCIAL_PLATFORM_LABELS[platform];
  }

  return getProfileLinkLabel(url);
}

export function normalizeProfileLinks(values: string[]): NormalizedProfileLink[] {
  return values.reduce<NormalizedProfileLink[]>((links, value) => {
    const normalizedUrl = normalizeProfileUrl(value);

    if (!normalizedUrl) {
      return links;
    }

    links.push({
      label: getProfileLinkLabel(normalizedUrl),
      order_index: links.length,
      url: normalizedUrl,
    });

    return links;
  }, []);
}
