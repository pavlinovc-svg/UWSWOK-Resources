import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

type Ctx = {
  openLink: (url: string, title?: string) => void;
};

const WebViewContext = createContext<Ctx>({ openLink: () => {} });

export function useWebView() {
  return useContext(WebViewContext);
}

function isHttp(url: string) {
  return /^https?:\/\//i.test(url);
}

export function WebViewProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState<{ url: string; title: string } | null>(null);
  const api = useMemo<Ctx>(
    () => ({
      openLink: (url, title) => {
        if (!isHttp(url)) {
          window.location.assign(url);
          return;
        }
        setOpen({ url, title: title || url });
      },
    }),
    []
  );
  const host = open
    ? (() => {
        try {
          return new URL(open.url).host;
        } catch {
          return open.url;
        }
      })()
    : "";
  const external = host && !/uwswok-resources|localhost|127\.0\.0\.1/i.test(host);

  return (
    <WebViewContext.Provider value={api}>
      {children}
      {open && (
        <div className="overlay" role="dialog" aria-label="In-app browser">
          <div className="overlay-panel">
            <div className="overlay-bar">
              <strong>{open.title}</strong>
              <button className="btn secondary" onClick={() => setOpen(null)}>
                Close
              </button>
            </div>
            {external && (
              <div className="caution">
                You are viewing an external website. Close to return to UWSWOK Resources. We cannot verify that site’s
                content.
              </div>
            )}
            <iframe title={open.title} src={open.url} sandbox="allow-scripts allow-same-origin allow-forms allow-popups" />
          </div>
        </div>
      )}
    </WebViewContext.Provider>
  );
}

export function AppLink({
  href,
  children,
  className,
  title,
}: {
  href: string;
  children: ReactNode;
  className?: string;
  title?: string;
}) {
  const { openLink } = useWebView();
  if (href.startsWith("tel:") || href.startsWith("sms:") || href.startsWith("mailto:")) {
    return (
      <a className={className} href={href}>
        {children}
      </a>
    );
  }
  return (
    <a
      className={className}
      href={href}
      onClick={(e) => {
        e.preventDefault();
        openLink(href, title);
      }}
    >
      {children}
    </a>
  );
}
