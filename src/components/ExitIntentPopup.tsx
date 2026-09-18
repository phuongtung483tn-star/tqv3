import { useEffect, useMemo, useRef, useState } from "react";

import { useSiteConfig } from "@/lib/use-site-config";

const templateMap = {
  offer: {
    badge: "Ưu đãi đặc biệt",
    title: "Nhận tư vấn miễn phí + lộ trình học phù hợp",
    description:
      "Bạn đang quan tâm đến chương trình du học nghề. Nhận ngay lộ trình học, danh sách ngành hot, và ưu đãi học bổng phù hợp với mục tiêu của bạn.",
    cta: "Nhận tư vấn ngay",
  },
  urgency: {
    badge: "Sắp hết suất",
    title: "Còn ít suất ưu tiên cho học bổng và tư vấn 1:1",
    description:
      "Chúng tôi đang ưu tiên xét duyệt cho khách quan tâm trong 24h tới. Đăng ký ngay để nhận lịch tư vấn riêng và ưu đãi phù hợp.",
    cta: "Đăng ký nhận ưu đãi",
  },
  trust: {
    badge: "Bảo mật thông tin",
    title: "Tư vấn miễn phí, không ép mua, không lo rủi ro",
    description:
      "Hình thức tư vấn trực tiếp qua chuyên viên, rõ ràng, minh bạch và phù hợp với từng nhu cầu của học viên và gia đình.",
    cta: "Nhận tư vấn 1:1",
  },
} as const;

const TEMPLATE_ORDER = ["offer", "urgency", "trust"] as const;

export function ExitIntentPopup() {
  const { config } = useSiteConfig();
  const exitIntent = config.exitIntent;
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const launcherRef = useRef(false);

  const template = useMemo(() => {
    const selected = templateMap[exitIntent.templateId] ?? templateMap.offer;
    return {
      badge: exitIntent.badge || selected.badge,
      title: exitIntent.title || selected.title,
      description: exitIntent.description || selected.description,
      cta: exitIntent.ctaLabel || selected.cta,
    };
  }, [exitIntent]);

  useEffect(() => {
    if (!exitIntent.enabled || dismissed) return;
    if (
      exitIntent.respectReducedMotion &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const triggerDelayMs = Math.max(2_000, exitIntent.triggerDelaySec * 1000);
    const minimumTime = Math.max(5_000, exitIntent.minTimeOnPageSec * 1000);
    const minimumScroll = Math.max(0, Math.min(100, exitIntent.minScrollPercent));

    const show = () => {
      if (launcherRef.current) return;
      launcherRef.current = true;
      const elapsed = performance.now() - (window.__funnel_intent_start ?? performance.now());
      const currentScroll =
        document.documentElement.scrollHeight > window.innerHeight
          ? (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
          : 100;

      if (
        elapsed < minimumTime ||
        currentScroll < minimumScroll ||
        (!exitIntent.allowMobile && window.innerWidth < 768)
      ) {
        return;
      }

      setVisible(true);
    };

    const startStamp = performance.now();
    window.__funnel_intent_start = startStamp;

    const idleTimer = window.setTimeout(show, triggerDelayMs);
    const onMouseLeave = (event: MouseEvent) => {
      if (event.clientY <= 0) show();
    };
    const onScroll = () => {
      const scroll =
        document.documentElement.scrollHeight > window.innerHeight
          ? (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
          : 100;
      if (scroll >= minimumScroll) show();
    };

    window.addEventListener("mouseleave", onMouseLeave);
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.clearTimeout(idleTimer);
      window.removeEventListener("mouseleave", onMouseLeave);
      window.removeEventListener("scroll", onScroll);
    };
  }, [dismissed, exitIntent]);

  const positionClass =
    exitIntent.position === "bottom-left"
      ? "left-3 bottom-4 sm:left-6"
      : exitIntent.position === "bottom-right"
        ? "right-3 bottom-4 sm:right-6"
        : "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2";

  if (!exitIntent.enabled || !visible || dismissed) return null;

  return (
    <div
      className={`fixed z-50 w-[min(92vw,26rem)] ${positionClass}`}
      role="dialog"
      aria-modal="false"
      aria-live="polite"
    >
      <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-background/95 shadow-[0_25px_80px_rgba(15,23,42,0.3)] backdrop-blur-xl">
        <div className="bg-gradient-to-r from-primary to-[#d97706] px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-white">
          {template.badge}
        </div>
        <div className="p-4 sm:p-5">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-black leading-tight text-foreground sm:text-xl">
                {template.title}
              </h3>
            </div>
            {exitIntent.showCloseButton && (
              <button
                type="button"
                aria-label="Đóng popup"
                onClick={() => setDismissed(true)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-muted text-sm text-muted-foreground transition hover:text-foreground"
              >
                ×
              </button>
            )}
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {template.description}
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <a
              href="#dang-ky"
              onClick={() => setDismissed(true)}
              className="inline-flex flex-1 items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-black text-primary-foreground shadow-lg transition hover:brightness-110"
            >
              {template.cta}
            </a>
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="inline-flex items-center justify-center rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground"
            >
              Để sau
            </button>
          </div>
          <p className="mt-3 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            Tư vấn 1:1 · Miễn phí · Không bắt buộc mua
          </p>
        </div>
      </div>
    </div>
  );
}
