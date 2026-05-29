const { test, expect } = require("@playwright/test");
const fs = require("node:fs");
const path = require("node:path");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:4173";
const pages = [
  "index.html",
  "heizung-waermepumpen.html",
  "gebaeudetechnik.html",
  "instandhaltung.html",
  "kontakt.html",
];
const detailPages = ["heizung-waermepumpen.html", "gebaeudetechnik.html", "instandhaltung.html", "kontakt.html"];
const auditWidths = [360, 390, 430, 768, 900, 1024, 1120, 1180, 1280, 1440, 1600, 1920, 2560];
const screenshotWidths = [390, 768, 1024, 1280, 1440, 1920];
const heroWidths = [900, 1024, 1120, 1180, 1280, 1440, 1600, 1920, 2560];
const detailContainmentWidths = [390, 552, 768, 900, 1024, 1120, 1180, 1280];
const screenshotDir = path.join(process.cwd(), "test-results", "responsive");
const auditStyle = ".reveal{opacity:1!important;transform:none!important;transition:none!important}";

test.describe("responsive static site audit", () => {
  test.beforeAll(() => {
    fs.mkdirSync(screenshotDir, { recursive: true });
  });

  for (const pageName of pages) {
    for (const width of auditWidths) {
      test(`${pageName} has no horizontal overflow at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 1100 });
        await page.goto(`${baseUrl}/${pageName}`, { waitUntil: "networkidle" });
        await page.addStyleTag({ content: auditStyle });

        const metrics = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
          bodyScrollWidth: document.body.scrollWidth,
          innerWidth: window.innerWidth,
          unloadedImages: Array.from(document.images)
            .filter((image) => !image.complete || image.naturalWidth === 0)
            .map((image) => image.getAttribute("src")),
        }));

        expect(metrics.unloadedImages).toEqual([]);
        expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.innerWidth + 1);
        expect(metrics.bodyScrollWidth).toBeLessThanOrEqual(metrics.innerWidth + 1);
      });
    }

    for (const width of screenshotWidths) {
      test(`${pageName} screenshot at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 1100 });
        await page.goto(`${baseUrl}/${pageName}`, { waitUntil: "networkidle" });
        await page.addStyleTag({ content: auditStyle });
        await page.waitForTimeout(1800);
        await page.screenshot({
          path: path.join(screenshotDir, `${pageName.replace(".html", "")}-${width}.png`),
          fullPage: true,
        });
      });
    }
  }

  for (const width of heroWidths) {
    test(`index hero text and image do not overlap at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1100 });
      await page.goto(`${baseUrl}/index.html`, { waitUntil: "networkidle" });
      await page.addStyleTag({ content: auditStyle });

      const overlap = await page.evaluate(() => {
        const text = document.querySelector(".hero-copy");
        const image = document.querySelector(".hero-media");
        const a = text.getBoundingClientRect();
        const b = image.getBoundingClientRect();
        const xOverlap = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
        const yOverlap = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
        return Math.round(xOverlap * yOverlap);
      });

      expect(overlap).toBe(0);
    });
  }

  for (const width of [1440, 1920, 2560]) {
    test(`index large desktop layout stays balanced at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1400 });
      await page.goto(`${baseUrl}/index.html`, { waitUntil: "networkidle" });
      await page.addStyleTag({ content: auditStyle });

      const metrics = await page.evaluate(() => {
        const hero = document.querySelector(".hero");
        const heroCopyInner = document.querySelector(".hero-copy__inner");
        const contact = document.querySelector(".contact-split");
        const title = document.querySelector(".display-title");

        return {
          heroHeight: hero.getBoundingClientRect().height,
          copyWidth: heroCopyInner.getBoundingClientRect().width,
          contactWidth: contact.getBoundingClientRect().width,
          titleLineHeight: Number.parseFloat(getComputedStyle(title).lineHeight),
          titleHeight: title.getBoundingClientRect().height,
          innerWidth: window.innerWidth,
        };
      });

      expect(metrics.heroHeight).toBeLessThanOrEqual(840);
      expect(metrics.copyWidth).toBeGreaterThanOrEqual(500);
      expect(metrics.contactWidth).toBeLessThanOrEqual(1422);
      expect(metrics.titleHeight / metrics.titleLineHeight).toBeLessThanOrEqual(3.35);
      expect(metrics.contactWidth).toBeLessThanOrEqual(metrics.innerWidth);
    });
  }

  for (const pageName of detailPages) {
    for (const width of detailContainmentWidths) {
      test(`${pageName} media stays contained at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 1200 });
        await page.goto(`${baseUrl}/${pageName}`, { waitUntil: "networkidle" });
        await page.addStyleTag({ content: auditStyle });

        const metrics = await page.evaluate(() => {
          const heroMedia = document.querySelector(".page-hero__media");
          const imagePanels = Array.from(document.querySelectorAll(".image-panel"));
          const galleryFigures = Array.from(document.querySelectorAll(".gallery-strip figure"));

          return {
            heroMediaHeight: heroMedia ? heroMedia.getBoundingClientRect().height : 0,
            imagePanelHeights: imagePanels.map((element) => element.getBoundingClientRect().height),
            galleryHeights: galleryFigures.map((element) => element.getBoundingClientRect().height),
            scrollWidth: document.documentElement.scrollWidth,
            innerWidth: window.innerWidth,
          };
        });

        const maxHeroMedia = pageName === "kontakt.html" ? 700 : 500;
        const maxPanel = width < 980 ? 480 : width < 1200 ? 460 : 530;
        const maxGallery = width < 680 ? 440 : width < 1200 ? 410 : 450;

        expect(metrics.heroMediaHeight).toBeLessThanOrEqual(maxHeroMedia);
        for (const height of metrics.imagePanelHeights) {
          expect(height).toBeLessThanOrEqual(maxPanel);
        }
        for (const height of metrics.galleryHeights) {
          expect(height).toBeLessThanOrEqual(maxGallery);
        }
        expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.innerWidth + 1);
      });
    }

    for (const width of [1440, 1920, 2560]) {
      test(`${pageName} large desktop media stays contained at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 1400 });
        await page.goto(`${baseUrl}/${pageName}`, { waitUntil: "networkidle" });
        await page.addStyleTag({ content: auditStyle });

        const metrics = await page.evaluate(() => {
          const pageHero = document.querySelector(".page-hero");
          const heroMedia = document.querySelector(".page-hero__media");
          const imagePanels = Array.from(document.querySelectorAll(".image-panel"));
          const galleryFigures = Array.from(document.querySelectorAll(".gallery-strip figure"));

          return {
            pageHeroHeight: pageHero ? pageHero.getBoundingClientRect().height : 0,
            heroMediaHeight: heroMedia ? heroMedia.getBoundingClientRect().height : 0,
            imagePanelHeights: imagePanels.map((element) => element.getBoundingClientRect().height),
            galleryHeights: galleryFigures.map((element) => element.getBoundingClientRect().height),
            scrollWidth: document.documentElement.scrollWidth,
            innerWidth: window.innerWidth,
          };
        });

        expect(metrics.pageHeroHeight).toBeLessThanOrEqual(760);
        expect(metrics.heroMediaHeight).toBeLessThanOrEqual(pageName === "kontakt.html" ? 660 : 500);
        for (const height of metrics.imagePanelHeights) {
          expect(height).toBeLessThanOrEqual(530);
        }
        for (const height of metrics.galleryHeights) {
          expect(height).toBeLessThanOrEqual(450);
        }
        expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.innerWidth + 1);
      });
    }
  }

  test("contact form shows inline validation", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto(`${baseUrl}/kontakt.html`, { waitUntil: "networkidle" });
    await page.click("[data-contact-form] button[type='submit']");

    await expect(page.locator("[data-form-status]")).toContainText("Bitte prüfen");
    await expect(page.locator(".field.has-error")).toHaveCount(3);
  });

  test("gebaeudetechnik trade accordion changes active card", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 1000 });
    await page.goto(`${baseUrl}/gebaeudetechnik.html`, { waitUntil: "networkidle" });
    await page.addStyleTag({ content: auditStyle });

    const cards = page.locator("[data-trade-card]");
    await expect(cards).toHaveCount(4);
    await expect(cards.nth(0)).toHaveAttribute("aria-expanded", "true");

    await cards.nth(2).hover();
    await expect(cards.nth(2)).toHaveAttribute("aria-expanded", "true");
    await expect(cards.nth(0)).toHaveAttribute("aria-expanded", "false");

    await cards.nth(3).focus();
    await expect(cards.nth(3)).toHaveAttribute("aria-expanded", "true");
  });

  test("mobile menu opens and closes with Motion wiring", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto(`${baseUrl}/index.html`, { waitUntil: "networkidle" });

    await page.click("[data-menu-toggle]");
    await expect(page.locator("body")).toHaveClass(/menu-open/);
    await expect(page.locator("[data-menu-toggle]")).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator("[data-mobile-panel] .nav-link").first()).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(page.locator("body")).not.toHaveClass(/menu-open/);
    await expect(page.locator("[data-menu-toggle]")).toHaveAttribute("aria-expanded", "false");
  });

  test("reduced motion keeps content visible and disables parallax", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 1280, height: 1100 });
    await page.goto(`${baseUrl}/index.html`, { waitUntil: "networkidle" });
    await page.waitForFunction(() => document.body.classList.contains("motion-ready"));
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));

    const metrics = await page.evaluate(() => ({
      hasReducedClass: document.body.classList.contains("motion-reduced"),
      parallaxImages: document.querySelectorAll("[data-parallax-enhanced='true']").length,
      progressCount: document.querySelectorAll(".motion-progress").length,
      hiddenReveals: Array.from(document.querySelectorAll(".reveal")).filter((element) => {
        const style = window.getComputedStyle(element);
        return style.opacity === "0" || style.visibility === "hidden";
      }).length,
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }));

    expect(metrics.hasReducedClass).toBe(true);
    expect(metrics.parallaxImages).toBe(0);
    expect(metrics.progressCount).toBe(0);
    expect(metrics.hiddenReveals).toBe(0);
    expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.innerWidth + 1);
  });
});
