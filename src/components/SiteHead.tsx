import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useSiteSettings } from "@/lib/cms/hooks";

function setMeta(selector: string, attr: "content" | "href", value: string) {
  const el = document.head.querySelector<HTMLMetaElement | HTMLLinkElement>(selector);
  if (el && value) el.setAttribute(attr, value);
}

/** Applies CMS-managed SEO title/description and favicon to the public site's <head>. */
const SiteHead = () => {
  const { seo, brand } = useSiteSettings();
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith("/admin");

  useEffect(() => {
    if (isAdmin) return;
    if (seo.title) document.title = seo.title;
    setMeta('meta[name="description"]', "content", seo.description);
  }, [isAdmin, seo.title, seo.description]);

  useEffect(() => {
    if (!brand.favicon_url) return;
    let link = document.head.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = brand.favicon_url;
  }, [brand.favicon_url]);

  return null;
};

export default SiteHead;
