(function () {
  "use strict";

  // ─── CONFIG ────────────────────────────────────────────────
  const CONFIG = {
    TELEGRAM_URL: "https://s.salebot.pro/psi-game_1",
    MAX_URL: "https://s.salebot.pro/psi-game_20",
    YM_COUNTER_ID: 108656678,
  };

  // ─── ELEMENTS ──────────────────────────────────────────────
  const ctaLinks = document.querySelectorAll("[data-cta]");
  const diagnosticOptions = document.querySelectorAll("[data-recommendation]");
  const recommendationBox = document.querySelector(".recommendation-box");
  const recommendationTitle = recommendationBox ? recommendationBox.querySelector(".recommendation-title") : null;
  const recommendationCopy = recommendationBox ? recommendationBox.querySelector(".recommendation-copy") : null;
  const reviewsCarousel = document.querySelector("[data-carousel]");
  const reviewSlides = reviewsCarousel ? Array.from(reviewsCarousel.querySelectorAll(".review-slide")) : [];
  const carouselDots = Array.from(document.querySelectorAll("[data-carousel-dot]"));
  const carouselPrev = document.querySelector("[data-carousel-prev]");
  const carouselNext = document.querySelector("[data-carousel-next]");

  // ─── URL MAPPING ───────────────────────────────────────────
  const urlByCta = {
    telegram: CONFIG.TELEGRAM_URL,
    max: CONFIG.MAX_URL,
  };

  ctaLinks.forEach((link) => {
    const cta = link.getAttribute("data-cta");
    const url = urlByCta[cta];
    if (url) link.setAttribute("href", url);
  });

  // ─── YANDEX METRIKA GOALS ──────────────────────────────────
  function reachGoal(goalName) {
    if (typeof window.ym === "function") {
      window.ym(CONFIG.YM_COUNTER_ID, "reachGoal", goalName);
    }
  }

  ctaLinks.forEach((link) => {
    link.addEventListener("click", function () {
      const cta = link.getAttribute("data-cta");
      const placement = link.getAttribute("data-placement") || "unknown";
      reachGoal("click_" + cta);
      reachGoal("click_" + cta + "_" + placement);
    });
  });

  // ─── QUICK GAME PICKER ────────────────────────────────────
  const recommendations = {
    lila: {
      title: "Похоже, вам подойдёт Лила",
      copy: "Она лучше подходит для повторяющихся сценариев, отношений, кризиса, самоопределения и запроса «почему я снова в этом».",
    },
    money: {
      title: "Похоже, лучше начать с игры про деньги",
      copy: "Она сфокусирована на доходе, цене, тревоге про деньги и установках, которые влияют на финансовые решения.",
    },
    consult: {
      title: "Начните с короткого подбора в боте",
      copy: "Если запрос пока расплывчатый, это нормально. Бот задаст несколько вопросов, а дальше игру и формат подберём по ситуации.",
    },
  };

  diagnosticOptions.forEach((button) => {
    button.addEventListener("click", function () {
      const key = button.getAttribute("data-recommendation");
      const recommendation = recommendations[key];
      diagnosticOptions.forEach((option) => {
        option.classList.remove("is-selected");
        option.setAttribute("aria-pressed", "false");
      });
      button.classList.add("is-selected");
      button.setAttribute("aria-pressed", "true");

      if (recommendation && recommendationTitle && recommendationCopy) {
        recommendationTitle.textContent = recommendation.title;
        recommendationCopy.textContent = recommendation.copy;
      }

      if (key) reachGoal("quick_picker_" + key);
    });
  });

  // ─── REVIEWS CAROUSEL ─────────────────────────────────────
  function setActiveReview(index) {
    carouselDots.forEach((dot, dotIndex) => {
      const isActive = dotIndex === index;
      dot.classList.toggle("is-active", isActive);
      if (isActive) {
        dot.setAttribute("aria-current", "true");
      } else {
        dot.removeAttribute("aria-current");
      }
    });
  }

  function scrollToReview(index) {
    if (!reviewsCarousel || !reviewSlides[index]) return;
    reviewsCarousel.scrollTo({
      left: reviewSlides[index].offsetLeft - reviewsCarousel.offsetLeft,
      behavior: "smooth",
    });
    setActiveReview(index);
    reachGoal("review_slide_" + (index + 1));
  }

  function getCurrentReviewIndex() {
    if (!reviewsCarousel || reviewSlides.length === 0) return 0;
    const currentLeft = reviewsCarousel.scrollLeft + reviewsCarousel.offsetLeft;
    return reviewSlides.reduce((closestIndex, slide, index) => {
      const closestDistance = Math.abs(reviewSlides[closestIndex].offsetLeft - currentLeft);
      const distance = Math.abs(slide.offsetLeft - currentLeft);
      return distance < closestDistance ? index : closestIndex;
    }, 0);
  }

  if (reviewsCarousel && reviewSlides.length > 0) {
    carouselDots.forEach((dot) => {
      dot.addEventListener("click", function () {
        const index = Number(dot.getAttribute("data-carousel-dot"));
        scrollToReview(index);
      });
    });

    if (carouselPrev) {
      carouselPrev.addEventListener("click", function () {
        const index = getCurrentReviewIndex();
        scrollToReview(index === 0 ? reviewSlides.length - 1 : index - 1);
      });
    }

    if (carouselNext) {
      carouselNext.addEventListener("click", function () {
        const index = getCurrentReviewIndex();
        scrollToReview(index === reviewSlides.length - 1 ? 0 : index + 1);
      });
    }

    reviewsCarousel.addEventListener("scroll", function () {
      window.requestAnimationFrame(function () {
        setActiveReview(getCurrentReviewIndex());
      });
    });
  }

  // ─── STICKY BOTTOM CTA ────────────────────────────────────
  const stickyCta = document.querySelector("[data-sticky-cta]");
  const heroSection = document.querySelector(".hero");
  const finalSection = document.querySelector(".final-cta");

  if (stickyCta && heroSection && finalSection && "IntersectionObserver" in window) {
    let heroVisible = true;
    let finalVisible = false;
    let revealed = false;

    function updateStickyState() {
      const shouldShow = !heroVisible && !finalVisible;
      if (shouldShow && !revealed) {
        stickyCta.hidden = false;
        revealed = true;
      }
      stickyCta.classList.toggle("is-visible", shouldShow);
    }

    const heroObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          heroVisible = entry.isIntersecting;
        });
        updateStickyState();
      },
      { rootMargin: "0px 0px -40% 0px", threshold: 0 }
    );

    const finalObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          finalVisible = entry.isIntersecting;
        });
        updateStickyState();
      },
      { threshold: 0 }
    );

    heroObserver.observe(heroSection);
    finalObserver.observe(finalSection);
  }

  // ─── FAQ: закрытие других при открытии одного ─────────────
  const faqItems = document.querySelectorAll(".faq-item");
  faqItems.forEach((item) => {
    item.addEventListener("toggle", function () {
      if (item.open) {
        faqItems.forEach((other) => {
          if (other !== item) other.open = false;
        });
        const summary = item.querySelector(".faq-question");
        const label = summary ? summary.textContent.trim().slice(0, 40) : "";
        reachGoal("faq_open");
        if (label) reachGoal("faq_open_" + label.replace(/\s+/g, "_"));
      }
    });
  });
})();
