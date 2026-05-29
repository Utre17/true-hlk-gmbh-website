import { animate, inView, scroll, stagger } from "motion";

const body = document.body;
const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const isReducedMotion = reducedMotionQuery.matches;
const smoothEase = [0.16, 1, 0.3, 1];

body.classList.add("motion-ready");

if (isReducedMotion) {
  body.classList.add("motion-reduced");
  document.querySelectorAll(".reveal").forEach((item) => item.classList.add("is-visible"));
}

const qs = (selector, root = document) => root.querySelector(selector);
const qsa = (selector, root = document) => Array.from(root.querySelectorAll(selector));

function finishVisible(element, controls) {
  controls.finished
    .then(() => element.classList.add("is-visible"))
    .catch(() => element.classList.add("is-visible"));
}

function stageElements(elements, options = {}) {
  const { x = 0, y = 0, scale = 1, blur = 0 } = options;
  const transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`;

  elements.filter(Boolean).forEach((element) => {
    element.style.opacity = "0";
    element.style.transform = transform;
    element.style.willChange = blur ? "transform, opacity, filter" : "transform, opacity";

    if (blur) {
      element.style.filter = `blur(${blur}px)`;
    }
  });
}

function clearStagedElements(elements) {
  elements.filter(Boolean).forEach((element) => {
    element.style.opacity = "";
    element.style.transform = "";
    element.style.filter = "";
    element.style.willChange = "";
  });
}

function startAfterPaint(callback, delay = 0) {
  const run = () => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.setTimeout(callback, delay);
      });
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run, { once: true });
    return;
  }

  run();
}

function initHeaderEntry() {
  if (isReducedMotion) return;

  const header = qs(".site-header");
  if (!header) return;

  const pieces = [
    qs(".brand", header),
    ...qsa(".desktop-nav .nav-link", header),
    qs(".menu-toggle", header),
  ].filter(Boolean);

  if (!pieces.length) return;

  stageElements(pieces, { y: -10 });

  startAfterPaint(() => {
    animate(
      pieces,
      { opacity: [0, 1], y: [-10, 0] },
      { duration: 0.72, delay: stagger(0.045, { startDelay: 0.06 }), ease: smoothEase }
    ).finished.finally(() => clearStagedElements(pieces));
  }, 80);
}

function initScrollProgress() {
  if (isReducedMotion) return;

  const progress = document.createElement("div");
  progress.className = "motion-progress";
  progress.setAttribute("aria-hidden", "true");
  document.body.appendChild(progress);

  scroll((value) => {
    progress.style.transform = `scaleX(${value})`;
  });
}

function initPageEntry() {
  if (isReducedMotion) return;

  const hero = qs(".hero, .page-hero");
  if (!hero) return;

  const copy = qs(".hero-copy, .page-hero__copy", hero);
  const media = qs(".hero-media, .page-hero__media", hero);

  const copyPieces = [
    qs(".eyebrow", copy),
    ...qsa(".display-title span", copy),
    qs(".page-title", copy),
    qs(".lead", copy),
    ...qsa(".button-row .btn", copy),
    qs(".hero-note", copy),
    ...qsa(".pill-list .pill", copy),
  ].filter(Boolean);

  if (copyPieces.length) {
    stageElements(copyPieces, { y: 34, blur: 8 });
  }

  if (media) {
    stageElements([media], { x: 44, scale: 0.985 });
  }

  if (copy) copy.classList.add("is-visible");
  if (media) media.classList.add("is-visible");

  if (copyPieces.length) {
    startAfterPaint(() => {
      animate(
        copyPieces,
        { opacity: [0, 1], y: [40, 0], filter: ["blur(8px)", "blur(0px)"] },
        { duration: 1.12, delay: stagger(0.095, { startDelay: 0.16 }), ease: smoothEase }
      ).finished.finally(() => clearStagedElements(copyPieces));
    }, 140);
  }

  if (media) {
    startAfterPaint(() => {
      animate(
        media,
        { opacity: [0, 1], x: [54, 0], scale: [0.975, 1] },
        { duration: 1.24, delay: 0.28, ease: smoothEase }
      ).finished.finally(() => clearStagedElements([media]));
    }, 140);

    const image = qs("img", media);
    if (image) {
      image.style.willChange = "transform";
      startAfterPaint(() => {
        animate(image, { scale: [1.085, 1] }, { duration: 1.72, delay: 0.18, ease: smoothEase }).finished.finally(() => {
          image.style.willChange = "";
        });
      }, 140);
    }
  }
}

function childrenForReveal(element) {
  if (element.matches(".feature-grid")) return qsa(".feature-block", element);
  if (element.matches(".process-grid")) return qsa(".process-step", element);
  if (element.matches(".trust-grid")) return qsa(".trust-title, .trust-item", element);
  if (element.matches(".scope-list")) return qsa(".scope-item", element);
  if (element.matches(".trade-accordion")) return qsa(".trade-card", element);
  if (element.matches(".gallery-strip")) return qsa("figure", element);
  if (element.matches(".service-card")) return qsa(".service-icon, h3, p, li, .text-link, .service-card__media", element);
  if (element.matches(".section-head")) return qsa(".eyebrow, .section-title, .lead", element);
  if (element.matches(".contact-form")) return qsa(".eyebrow, .section-title, .field, button, .form-status", element);
  if (element.matches(".contact-card")) return qsa(".eyebrow, .section-title, h3, p, .contact-detail", element);
  return [];
}

function initScrollReveals() {
  const revealItems = qsa(".reveal").filter((item) => !item.classList.contains("is-visible"));

  if (!revealItems.length) return;

  if (isReducedMotion) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
    return;
  }

  revealItems.forEach((element) => {
    inView(
      element,
      () => {
        const controls = animate(
          element,
          { opacity: [0, 1], y: [30, 0] },
          { duration: 0.78, ease: smoothEase }
        );
        finishVisible(element, controls);

        const children = childrenForReveal(element);
        if (children.length) {
          animate(
            children,
            { opacity: [0, 1], y: [16, 0] },
            { duration: 0.7, delay: stagger(0.045, { startDelay: 0.08 }), ease: smoothEase }
          );
        }
      },
      { amount: 0.18, margin: "0px 0px -12% 0px" }
    );
  });
}

function initFocusBandMotion() {
  if (isReducedMotion) return;

  const focusBand = qs(".focus-band");
  if (!focusBand) return;

  const grid = qs(".focus-grid", focusBand);
  const items = qsa(".focus-item", focusBand);

  inView(
    focusBand,
    () => {
      if (grid) {
        animate(
          grid,
          { borderColor: ["rgba(255, 254, 249, 0)", "rgba(255, 254, 249, 0.16)"] },
          { duration: 0.9, ease: smoothEase }
        );
      }

      if (items.length) {
        items.forEach((item) => {
          item.style.willChange = "transform, opacity";
        });

        animate(
          items,
          { opacity: [0, 1], y: [22, 0] },
          { duration: 0.72, delay: stagger(0.08, { startDelay: 0.14 }), ease: smoothEase }
        ).finished.finally(() => {
          items.forEach((item) => {
            item.style.willChange = "";
          });
        });
      }
    },
    { amount: 0.28 }
  );
}

function initParallaxImages() {
  if (isReducedMotion || window.innerWidth < 900) return;

  const frames = qsa(".hero-media, .page-hero__media:not(.page-hero__media--portrait), .focus-media, .image-panel");
  if (!frames.length) return;

  body.classList.add("motion-parallax");

  frames.forEach((frame) => {
    const image = qs("img", frame);
    if (!image) return;

    image.dataset.parallaxEnhanced = "true";
    image.style.willChange = "transform";

    scroll(
      (progress) => {
        const y = (progress - 0.5) * -30;
        image.style.transform = `scale(1.055) translate3d(0, ${y.toFixed(2)}px, 0)`;
      },
      { target: frame, offset: ["start end", "end start"] }
    );
  });
}

function initTradeAccordion() {
  const accordions = qsa("[data-trade-accordion]");
  if (!accordions.length) return;

  accordions.forEach((accordion) => {
    const cards = qsa("[data-trade-card]", accordion);
    if (!cards.length) return;

    let activeIndex = Math.max(0, cards.findIndex((card) => card.classList.contains("is-active")));

    const setActive = (index, force = false) => {
      if (!force && index === activeIndex) return;

      activeIndex = index;

      cards.forEach((card, cardIndex) => {
        const isActive = cardIndex === index;
        const isAdjacent = !isActive && Math.abs(cardIndex - index) === 1;

        card.classList.toggle("is-active", isActive);
        card.classList.toggle("is-adjacent", isAdjacent);
        card.classList.toggle("is-dimmed", !isActive && !isAdjacent);
        card.setAttribute("aria-expanded", String(isActive));
      });

      if (isReducedMotion || window.innerWidth < 1180) return;

      const activeCard = cards[index];
      const details = qs(".trade-card__details", activeCard);
      const image = qs(".trade-card__media img", activeCard);

      if (details) {
        animate(details, { opacity: [0, 1], y: [10, 0] }, { duration: 0.36, ease: smoothEase });
      }

      if (image) {
        animate(image, { scale: [1.04, 1.01] }, { duration: 0.62, ease: smoothEase });
      }
    };

    cards.forEach((card, index) => {
      card.addEventListener("pointerenter", () => setActive(index));
      card.addEventListener("focus", () => setActive(index));
      card.addEventListener("click", () => setActive(index));
      card.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        setActive(index);
      });
    });

    setActive(activeIndex, true);
  });
}

function animateInteractiveElement(element, hoverState, restState = { y: 0, scale: 1 }) {
  let isPointerInside = false;

  const toHover = () => {
    isPointerInside = true;
    element.style.willChange = "transform";
    animate(element, hoverState, { duration: 0.34, ease: smoothEase });
  };

  const toRest = () => {
    isPointerInside = false;
    animate(element, restState, { duration: 0.38, ease: smoothEase }).finished.finally(() => {
      if (!isPointerInside) element.style.willChange = "";
    });
  };

  element.addEventListener("pointerenter", toHover);
  element.addEventListener("pointerleave", toRest);
  element.addEventListener("focus", toHover);
  element.addEventListener("blur", toRest);
  element.addEventListener("pointerdown", () => {
    animate(element, { y: 1, scale: 0.985 }, { duration: 0.16, ease: smoothEase });
  });
  element.addEventListener("pointerup", () => {
    animate(element, isPointerInside ? hoverState : restState, { duration: 0.22, ease: smoothEase });
  });
}

function initInteractions() {
  if (isReducedMotion) return;

  qsa(".btn").forEach((button) => {
    animateInteractiveElement(button, { y: -2, scale: 1.015 });

    const icon = qs(".btn-icon", button);
    if (!icon) return;

    button.addEventListener("pointerenter", () => {
      animate(icon, { x: 3, scale: 1.08 }, { duration: 0.3, ease: smoothEase });
    });
    button.addEventListener("pointerleave", () => {
      animate(icon, { x: 0, scale: 1 }, { duration: 0.3, ease: smoothEase });
    });
  });

  qsa(".service-card, .feature-block, .contact-card, .image-panel, .gallery-strip figure").forEach((card) => {
    animateInteractiveElement(card, { y: -5, scale: 1.006 });
  });
}

function initMobileMenu() {
  const menuButton = qs("[data-menu-toggle]");
  const mobilePanel = qs("[data-mobile-panel]");

  if (!menuButton || !mobilePanel) return;

  const links = qsa("a", mobilePanel);
  let isAnimating = false;

  const openMenu = () => {
    if (body.classList.contains("menu-open")) return;

    body.classList.add("menu-open");
    menuButton.setAttribute("aria-expanded", "true");

    if (isReducedMotion) return;

    isAnimating = true;
    animate(mobilePanel, { opacity: [0, 1], y: [-16, 0] }, { duration: 0.34, ease: smoothEase }).finished.finally(() => {
      isAnimating = false;
    });
    animate(links, { opacity: [0, 1], y: [12, 0] }, { duration: 0.36, delay: stagger(0.045), ease: smoothEase });
  };

  const closeMenu = () => {
    if (!body.classList.contains("menu-open")) return;

    menuButton.setAttribute("aria-expanded", "false");

    if (isReducedMotion) {
      body.classList.remove("menu-open");
      return;
    }

    isAnimating = true;
    animate(links, { opacity: 0, y: -6 }, { duration: 0.18, ease: smoothEase });
    animate(mobilePanel, { opacity: 0, y: -14 }, { duration: 0.24, ease: smoothEase }).finished.finally(() => {
      body.classList.remove("menu-open");
      mobilePanel.style.opacity = "";
      mobilePanel.style.transform = "";
      links.forEach((link) => {
        link.style.opacity = "";
        link.style.transform = "";
      });
      isAnimating = false;
    });
  };

  menuButton.addEventListener("click", () => {
    if (body.classList.contains("menu-open")) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  links.forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });
}

function initContactForm() {
  const contactForm = qs("[data-contact-form]");
  if (!contactForm) return;

  const status = qs("[data-form-status]", contactForm);

  const setFieldError = (field, message) => {
    const wrapper = field.closest(".field");
    const error = wrapper?.querySelector(".field-error");
    if (!wrapper || !error) return;

    if (message) {
      wrapper.classList.add("has-error");
      error.textContent = message;
    } else {
      wrapper.classList.remove("has-error");
      error.textContent = "";
    }
  };

  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(contactForm);
    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const topic = String(formData.get("topic") || "").trim();
    const message = String(formData.get("message") || "").trim();
    const emailField = contactForm.querySelector("[name='email']");
    const nameField = contactForm.querySelector("[name='name']");
    const messageField = contactForm.querySelector("[name='message']");
    let valid = true;

    setFieldError(nameField, "");
    setFieldError(emailField, "");
    setFieldError(messageField, "");

    if (!name) {
      setFieldError(nameField, "Bitte geben Sie Ihren Namen an.");
      valid = false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFieldError(emailField, "Bitte geben Sie eine gültige E-Mail-Adresse an.");
      valid = false;
    }

    if (message.length < 12) {
      setFieldError(messageField, "Bitte beschreiben Sie Ihr Anliegen etwas genauer.");
      valid = false;
    }

    if (!valid) {
      status.textContent = "Bitte prüfen Sie die markierten Felder.";
      status.classList.add("is-error");
      if (!isReducedMotion) {
        animate(contactForm, { x: [0, -5, 5, -3, 3, 0] }, { duration: 0.32, ease: smoothEase });
      }
      return;
    }

    const subject = encodeURIComponent(`Anfrage TRUE HLK: ${topic || "Kontakt"}`);
    const bodyText = encodeURIComponent(
      `Name: ${name}\nE-Mail: ${email}\nThema: ${topic || "Allgemein"}\n\n${message}`
    );

    status.textContent = "Ihre Nachricht wird im Mailprogramm vorbereitet.";
    status.classList.remove("is-error");
    window.location.href = `mailto:info@true-hlk.com?subject=${subject}&body=${bodyText}`;
  });
}

initMobileMenu();
initContactForm();
initScrollProgress();
initHeaderEntry();
initPageEntry();
initScrollReveals();
initFocusBandMotion();
initParallaxImages();
initTradeAccordion();
initInteractions();
