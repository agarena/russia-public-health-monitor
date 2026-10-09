import { useEffect } from "react";
import { SITE_NAME } from "@/lib/constants";

/** 每个路由更新 document.title 与 meta description（基础 SEO） */
export function usePageMeta(title: string, description?: string): void {
  useEffect(() => {
    document.title = `${title}｜${SITE_NAME}`;
    if (description) {
      let tag = document.querySelector<HTMLMetaElement>('meta[name="description"]');
      if (!tag) {
        tag = document.createElement("meta");
        tag.name = "description";
        document.head.appendChild(tag);
      }
      tag.content = description;
    }
  }, [title, description]);
}
