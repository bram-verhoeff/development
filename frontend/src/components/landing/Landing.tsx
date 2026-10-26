"use client";

import { ArrowRight, CalendarDays, ImageIcon, Palette, Send, ShieldCheck, WandSparkles } from "lucide-react";
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform, type Variants } from "motion/react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRef, useState } from "react";

import { Aurora } from "@/components/motion/Aurora";
import { SpotlightCard } from "@/components/motion/SpotlightCard";
import { PlatformBadge } from "@/components/ui/Badges";
import { Logo } from "@/components/ui/Logo";
import { buttonClass } from "@/components/ui/styles";
import type { Platform } from "@/lib/types";

import { HeroMockup } from "./HeroMockup";

type Item = { title: string; body: string };

const FEATURE_ICONS = [Palette, WandSparkles, ShieldCheck, CalendarDays, Send, ImageIcon];
const PLATFORMS: Platform[] = ["linkedin", "instagram", "facebook", "x", "tiktok"];

const ease = [0.16, 1, 0.3, 1] as const;
const rise: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease } },
};
const group: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
// Onderdelen komen in beeld zodra je ernaartoe scrolt
const inView = { initial: "hidden", whileInView: "show", viewport: { once: true, margin: "-80px" } } as const;

export function Landing() {
  const t = useTranslations("landing");
  const features = t.raw("features.items") as Item[];
  const steps = t.raw("how.steps") as Item[];

  return (
    <div className="relative isolate min-h-screen overflow-x-clip">
      <Aurora />
      <Header />

      <main>
        <Hero />
        <PlatformStrip />

        {/* Functies */}
        <section id="features" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-24 sm:px-8">
          <motion.div {...inView} variants={group} className="mx-auto max-w-2xl text-center">
            <motion.h2 variants={rise} className="text-3xl font-extrabold sm:text-5xl">
              {t("features.title")}
            </motion.h2>
            <motion.p variants={rise} className="mt-4 text-lg text-muted">
              {t("features.subtitle")}
            </motion.p>
          </motion.div>

          <motion.div {...inView} variants={group} className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => {
              const Icon = FEATURE_ICONS[i % FEATURE_ICONS.length];
              return (
                <motion.div key={feature.title} variants={rise}>
                  <SpotlightCard className="h-full p-6">
                    <motion.span
                      whileHover={{ rotate: -8, scale: 1.1 }}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-accent"
                    >
                      <Icon size={20} />
                    </motion.span>
                    <h3 className="mt-4 text-lg font-bold">{feature.title}</h3>
                    <p className="mt-1.5 text-muted">{feature.body}</p>
                  </SpotlightCard>
                </motion.div>
              );
            })}
          </motion.div>
        </section>

        <HowItWorks steps={steps} />
        <FinalCta />
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-muted sm:flex-row sm:px-8">
          <p>
            © {new Date().getFullYear()} {t("footer.rights")}
          </p>
          <Link href="/privacy" className="hover:text-foreground hover:underline">
            {t("footer.privacy")}
          </Link>
        </div>
      </footer>
    </div>
  );
}

// Kopbalk die na een stukje scrollen een glazen achtergrond krijgt
function Header() {
  const t = useTranslations("landing.nav");
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 12));

  return (
    <motion.header
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease }}
      className={`sticky top-0 z-40 transition-[background-color,border-color,backdrop-filter] duration-300 ${
        scrolled ? "border-b border-line bg-background/75 backdrop-blur-xl" : "border-b border-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-8">
        <Link href="/" aria-label="PostPilot">
          <Logo />
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          <a href="#features" className={`${buttonClass.ghost} hidden sm:inline-flex`}>
            {t("features")}
          </a>
          <a href="#how" className={`${buttonClass.ghost} hidden sm:inline-flex`}>
            {t("how")}
          </a>
          <Link href="/login" className={buttonClass.primary}>
            {t("login")}
          </Link>
        </nav>
      </div>
    </motion.header>
  );
}

function Hero() {
  const t = useTranslations("landing.hero");
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  // Parallax: tekst en mockup schuiven met verschillende snelheid weg bij scrollen
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const textY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 80]);
  const mockY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -60]);
  const fade = useTransform(scrollYProgress, [0, 0.8], [1, reduce ? 1 : 0.2]);
  const words = t("title").split(" ");

  return (
    <section ref={ref} className="mx-auto grid max-w-6xl items-center gap-14 px-4 pt-12 pb-20 sm:px-8 lg:grid-cols-[1.1fr_1fr] lg:pt-20">
      <motion.div style={{ y: textY, opacity: fade }}>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
          className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/70 px-3 py-1 text-xs font-semibold text-accent backdrop-blur"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inset-0 animate-ping rounded-full bg-coral opacity-75" />
            <span className="relative h-2 w-2 rounded-full bg-coral" />
          </span>
          {t("eyebrow")}
        </motion.p>

        <h1 className="mt-5 text-5xl leading-[1.05] font-extrabold sm:text-6xl lg:text-7xl">
          {words.map((word, i) => (
            <motion.span
              key={i}
              className="mr-[0.25em] inline-block"
              initial={{ opacity: 0, y: 30, rotate: 4 }}
              animate={{ opacity: 1, y: 0, rotate: 0 }}
              transition={{ delay: 0.1 + i * 0.07, type: "spring", stiffness: 260, damping: 20 }}
            >
              {word}
            </motion.span>
          ))}
          <motion.span
            className="text-brand-animated inline-block"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 + words.length * 0.07, type: "spring", stiffness: 200, damping: 14 }}
          >
            {t("titleAccent")}
          </motion.span>
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6, ease }}
          className="mt-6 max-w-xl text-lg text-muted sm:text-xl"
        >
          {t("body")}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75, duration: 0.6, ease }}
          className="mt-8 flex flex-wrap items-center gap-3"
        >
          <Link href="/login" className={`${buttonClass.gradient} group px-6 py-3 text-base`}>
            {t("primary")}
            <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
          </Link>
          <Link href="/register" className={`${buttonClass.secondary} px-6 py-3 text-base`}>
            {t("secondary")}
          </Link>
        </motion.div>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="mt-4 text-sm text-muted">
          {t("invite")}
        </motion.p>
      </motion.div>

      <motion.div style={{ y: mockY }}>
        <HeroMockup />
      </motion.div>
    </section>
  );
}

// Oneindig doorlopende rij met platforms
function PlatformStrip() {
  const t = useTranslations("landing");
  const row = [...PLATFORMS, ...PLATFORMS, ...PLATFORMS];

  return (
    <section className="border-y border-line bg-surface/50 py-8 backdrop-blur">
      <p className="text-center text-xs font-semibold tracking-widest text-muted uppercase">{t("platforms")}</p>
      <div className="relative mt-5 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)]">
        <motion.div
          className="flex w-max gap-4"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
        >
          {[...row, ...row].map((platform, i) => (
            <span key={i} aria-hidden={i >= PLATFORMS.length} className="scale-110">
              <PlatformBadge platform={platform} />
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// Stappen met een lijn die meegroeit terwijl je scrolt
function HowItWorks({ steps }: { steps: Item[] }) {
  const t = useTranslations("landing.how");
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 75%", "end 55%"] });

  return (
    <section id="how" className="mx-auto max-w-3xl scroll-mt-24 px-4 py-24 sm:px-8">
      <motion.h2 {...inView} variants={rise} className="text-center text-3xl font-extrabold sm:text-5xl">
        {t("title")}
      </motion.h2>

      <div ref={ref} className="relative mt-16">
        <div aria-hidden className="absolute top-2 bottom-2 left-5 w-0.5 rounded-full bg-line" />
        <motion.div
          aria-hidden
          style={{ scaleY: scrollYProgress }}
          className="bg-brand-gradient absolute top-2 bottom-2 left-5 w-0.5 origin-top rounded-full"
        />

        <ol className="space-y-14">
          {steps.map((step, i) => (
            <motion.li key={step.title} {...inView} variants={group} className="relative flex gap-6">
              <motion.span
                variants={{ hidden: { scale: 0.4, opacity: 0 }, show: { scale: 1, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 16 } } }}
                className="bg-brand-gradient relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold text-white shadow-lg shadow-accent/30"
              >
                {i + 1}
              </motion.span>
              <motion.div variants={rise} className="pt-1">
                <h3 className="text-xl font-bold">{step.title}</h3>
                <p className="mt-1.5 text-muted">{step.body}</p>
              </motion.div>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function FinalCta() {
  const t = useTranslations("landing.cta");

  return (
    <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-8">
      <motion.div
        {...inView}
        variants={{ hidden: { opacity: 0, scale: 0.94, y: 30 }, show: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.7, ease } } }}
        className="relative overflow-hidden rounded-3xl bg-nav px-6 py-16 text-center text-white shadow-2xl shadow-accent/10 sm:px-12"
      >
        <div aria-hidden className="bg-dots absolute inset-0 opacity-50" />
        <motion.div
          aria-hidden
          className="bg-brand-gradient absolute -top-24 -right-16 h-72 w-72 rounded-full opacity-40 blur-3xl"
          animate={{ x: [0, -40, 0], y: [0, 30, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <div aria-hidden className="absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-teal-500/30 blur-3xl" />

        <div className="relative">
          <h2 className="text-3xl font-extrabold sm:text-5xl">{t("title")}</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-white/70">{t("body")}</p>
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} className="mt-8 inline-block">
            <Link href="/login" className={`${buttonClass.gradient} group px-7 py-3 text-base`}>
              {t("button")}
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
