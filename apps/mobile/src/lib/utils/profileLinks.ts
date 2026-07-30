export type NormalizedProfileLink = {
  label: string;
  order_index: number;
  url: string;
};

export type SocialPlatform = "generic" | "instagram" | "tiktok" | "youtube";

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

export function getSocialPlatformFromUrl(url: string): SocialPlatform {
  try {
    const parsedUrl = new URL(withProtocol(url));
    const hostname = parsedUrl.hostname.toLowerCase().replace(/^www\./, "");

    if (matchesDomain(hostname, "instagram.com")) {
      return "instagram";
    }

    if (matchesDomain(hostname, "youtube.com") || matchesDomain(hostname, "youtu.be")) {
      return "youtube";
    }

    if (matchesDomain(hostname, "tiktok.com")) {
      return "tiktok";
    }

    return "generic";
  } catch {
    return "generic";
  }
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
