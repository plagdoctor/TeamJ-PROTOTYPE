/* ================================================================
   안심드라이브 — MVP 데모 인터랙션
   투자자 데모용 split-screen 시연 로직
   ================================================================ */

(function () {
  "use strict";

  /* ---------------- DOM 레퍼런스 ---------------- */
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  const toast = $("#toast");
  const scoreHeroNum = $("#scoreHeroNum");
  const scoreHeroDelta = $("#scoreHeroDelta");
  const scoreHeroDistance = $("#scoreHeroDistance");
  const scoreHeroEvents = $("#scoreHeroEvents");
  const childEventList = $("#childEventList");
  const childNotifBanner = $("#childNotificationBanner");
  const trendPath = $("#trendPath");
  const trendFill = $("#trendFill");
  const trendDot = $("#trendDot");
  const trendPeriod = $("#trendPeriod");
  const decisionCard = $("#decisionCard");

  const parentClock = $("#parentClock");
  const parentDrivingOverlay = $("#parentDrivingOverlay");
  const drivingSpeed = $("#drivingSpeed");
  const drivingTime = $("#drivingTime");
  const drivingDistance = $("#drivingDistance");
  const drivingEvents = $("#drivingEvents");
  const carMarker = $("#carMarker");
  const timelapseOverlay = $("#timelapseOverlay");
  const timelapseMonth = $("#timelapseMonth");
  const timelapseScore = $("#timelapseScore");

  const btnAutoPlay = $("#btnAutoPlay");
  const btnTriggerEvent = $("#btnTriggerEvent");
  const btnOpenKakao = $("#btnOpenKakao");
  const btnTimelapse = $("#btnTimelapse");
  const btnReset = $("#btnReset");
  const autoProgressFill = $("#autoProgressFill");

  const kakaoModal = $("#kakaoModal");
  const kakaoBody = $("#kakaoBody");
  const kakaoClose = $("#kakaoClose");
  const kakaoSuggestions = $("#kakaoSuggestions");

  /* ---------------- 상태 ---------------- */
  const state = {
    autoPlayTimers: [],
    autoPlayRunning: false,
    eventCount: 2,
    score: 73,
    distance: 187,
    timelapseTimers: [],
    drivingTimer: null,
    carPosition: 0,
  };

  /* ---------------- 공통 유틸 ---------------- */
  let toastTimer;
  function showToast(message, duration) {
    clearTimeout(toastTimer);
    const isDemo = state.autoPlayRunning;
    const dur = duration ?? (isDemo ? 4800 : 2600);
    toast.textContent = message;
    toast.classList.toggle("demo-mode", isDemo);
    toast.classList.add("show");
    toastTimer = setTimeout(() => toast.classList.remove("show"), dur);
  }

  function formatNumber(value, format) {
    if (format === "krw") {
      const eok = value / 100000000;
      if (eok >= 1) return "₩" + eok.toFixed(2) + "억";
      const man = value / 10000;
      return "₩" + Math.round(man).toLocaleString() + "만";
    }
    if (format === "ratio") {
      return value.toFixed(2);
    }
    return Math.round(value).toLocaleString();
  }

  /* ---------------- 라이브 카운터 애니메이션 ---------------- */
  function animateCounter(el, target, duration = 1800) {
    const start = 0;
    const format = el.dataset.format || "num";
    const startTime = performance.now();

    function tick(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = start + (target - start) * eased;
      el.textContent = formatNumber(current, format);
      if (progress < 1) requestAnimationFrame(tick);
      else el.textContent = formatNumber(target, format);
    }
    requestAnimationFrame(tick);
  }

  function startBizCounters() {
    $$("[data-counter]").forEach((el) => {
      const target = parseFloat(el.dataset.counter);
      animateCounter(el, target, 2000);
    });
  }

  // 가입 가족 수 — 데모 중 천천히 +1씩
  function startSlowSubscriberGrowth() {
    const subscriberEl = $$("[data-counter]").find(
      (el) => el.dataset.format === "num" && el.dataset.counter === "5432"
    );
    if (!subscriberEl) return;
    let current = 5432;
    setInterval(() => {
      const inc = Math.floor(Math.random() * 3) + 1;
      current += inc;
      subscriberEl.textContent = current.toLocaleString();
      subscriberEl.classList.add("bump");
      setTimeout(() => subscriberEl.classList.remove("bump"), 600);
    }, 2800);
  }

  /* ---------------- 부모 시계 라이브 ---------------- */
  function updateParentClock() {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    parentClock.textContent = `${hh}:${mm}`;
  }
  updateParentClock();
  setInterval(updateParentClock, 30 * 1000);

  /* ---------------- 카카오톡 모달 ---------------- */
  function openKakaoModal() {
    kakaoBody.innerHTML = "";
    addKakaoBubble(
      "theirs",
      "(앱이 보여준 데이터: 안전 점수 73점 ▲5점)",
      null,
      0
    );
    kakaoModal.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  function closeKakaoModal() {
    kakaoModal.classList.remove("active");
    document.body.style.overflow = "";
  }

  function addKakaoBubble(side, text, time = null, delay = 0) {
    setTimeout(() => {
      const bubble = document.createElement("div");
      bubble.className = `kakao-bubble ${side}`;
      bubble.innerHTML = `${escapeHtml(text)}${time ? `<small>${time}</small>` : ""}`;
      kakaoBody.appendChild(bubble);
      kakaoBody.scrollTop = kakaoBody.scrollHeight;
    }, delay);
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function sendKakaoSuggestion(message) {
    addKakaoBubble("mine", message, "방금 · 1");
    // 1초 후 "1" 사라짐 (읽음)
    setTimeout(() => {
      const last = kakaoBody.querySelector(".kakao-bubble.mine:last-child small");
      if (last) last.textContent = "방금 · 읽음";
    }, 1400);
    // 2초 후 부모 답장
    setTimeout(() => {
      addKakaoBubble("theirs", "그래~ 고맙다 우리 딸 💛", "방금 전");
    }, 2600);
    setTimeout(() => {
      kakaoSuggestions.style.display = "none";
    }, 400);
  }

  /* ---------------- 점수 delta 헬퍼 ---------------- */
  function setScoreDelta(label, isDown) {
    const iconHref = isDown ? "#i-trending-down" : "#i-trending-up";
    scoreHeroDelta.innerHTML = `<svg class="icon icon-sm"><use href="${iconHref}"/></svg>${label}`;
    scoreHeroDelta.classList.toggle("down", !!isDown);
  }

  /* ---------------- 위험 이벤트 시뮬 ---------------- */
  function triggerRiskEvent() {
    state.eventCount += 1;
    state.score = Math.max(50, state.score - 4);
    bumpScore(state.score);
    setScoreDelta("-4", true);
    scoreHeroEvents.textContent = `${state.eventCount}건`;

    // 부모 화면: 운전 중 오버레이 표시 + 위험 모드
    activateParentDriving();
    triggerDrivingDanger();

    // 자녀 화면: 알림 배너 push
    showNotificationBanner();

    // 자녀 화면: 새 위험 이벤트 카드 prepend
    addRiskEventCard();

    showToast("⚡ 위험 이벤트 시뮬 발동 — 양쪽 화면 동기화 반응");
  }

  function bumpScore(newScore) {
    scoreHeroNum.textContent = newScore;
    scoreHeroNum.classList.remove("bump");
    void scoreHeroNum.offsetWidth;
    scoreHeroNum.classList.add("bump");
  }

  function showNotificationBanner() {
    childNotifBanner.classList.add("show");
    setTimeout(() => childNotifBanner.classList.remove("show"), 4500);
  }

  function addRiskEventCard() {
    const card = document.createElement("article");
    card.className = "event-card urgent shake";
    card.innerHTML = `
      <div class="event-icon">
        <svg class="icon"><use href="#i-alert"/></svg>
      </div>
      <div class="event-body">
        <span class="event-time">방금 전 · ${new Date().toLocaleTimeString("ko-KR", {
          hour: "2-digit",
          minute: "2-digit",
        })}</span>
        <span class="event-title">급가속 + 차선 급변경 감지</span>
        <span class="event-desc">월드컵북로 교차로 진입 구간. 안전 점수 -4점.</span>
      </div>
      <button class="event-action">전화하기</button>
    `;
    const titleEl = childEventList.querySelector(".event-list-title");
    titleEl.insertAdjacentElement("afterend", card);
    setTimeout(() => card.classList.remove("shake"), 700);
  }

  /* ---------------- 부모 화면 — 운전 중 오버레이 ---------------- */
  function activateParentDriving() {
    parentDrivingOverlay.classList.add("active");
    if (state.drivingTimer) return;
    state.carPosition = 0;
    moveCar();
    state.drivingTimer = setInterval(moveCar, 800);
  }

  function deactivateParentDriving() {
    parentDrivingOverlay.classList.remove("active");
    clearInterval(state.drivingTimer);
    state.drivingTimer = null;
    drivingSpeed.classList.remove("warn", "danger");
  }

  // 차량 마커가 경로를 따라 이동
  function moveCar() {
    // 경로 노드 (SVG 좌표): 280×320 — 경로의 7개 keypoint
    // M 30 290 → L 80 290 → L 80 160 → L 200 160 → L 200 60 → L 250 60
    const path = [
      [30, 290],
      [80, 290],
      [80, 160],
      [200, 160],
      [200, 60],
      [250, 60],
    ];
    const segments = 60; // 60 프레임에 걸쳐 전체 경로
    const total = path.length - 1;
    const t = state.carPosition / segments;
    if (t >= 1) {
      state.carPosition = 0;
      return;
    }
    const segIdx = Math.min(Math.floor(t * total), total - 1);
    const local = (t * total) - segIdx;
    const [x1, y1] = path[segIdx];
    const [x2, y2] = path[segIdx + 1];
    const x = x1 + (x2 - x1) * local;
    const y = y1 + (y2 - y1) * local;
    // SVG는 280×320 viewBox, 컨테이너 비율로 변환 (대략)
    const map = $("#drivingMap");
    const rect = map.getBoundingClientRect();
    const sx = rect.width / 280;
    const sy = rect.height / 320;
    carMarker.style.left = `${x * sx - 12}px`;
    carMarker.style.top = `${y * sy - 12}px`;
    state.carPosition += 1;

    // info row 업데이트
    const elapsedMin = Math.floor(t * 12) + 1;
    drivingTime.textContent = `${elapsedMin}분`;
    drivingDistance.textContent = `${Math.max(0, (8 - t * 8)).toFixed(1)} km`;
  }

  function triggerDrivingDanger() {
    // 속도 75km/h로 점프 (제한속도 50 초과)
    drivingSpeed.textContent = "78";
    drivingSpeed.classList.remove("warn");
    drivingSpeed.classList.add("danger");
    drivingEvents.textContent = "1";
    drivingEvents.style.color = "var(--score-bad)";

    setTimeout(() => {
      drivingSpeed.classList.remove("danger");
      drivingSpeed.classList.add("warn");
      drivingSpeed.textContent = "62";
    }, 2400);

    setTimeout(() => {
      drivingSpeed.classList.remove("warn");
      drivingSpeed.textContent = "44";
    }, 4500);
  }

  /* ---------------- Time-lapse 모드 ---------------- */
  function runTimelapse() {
    clearTimelapseTimers();
    timelapseOverlay.classList.add("show");
    decisionCard.classList.remove("reveal");
    trendPeriod.textContent = "Time-lapse 재생 중";

    const months = [
      { label: "10월", score: 85 },
      { label: "11월", score: 81 },
      { label: "12월", score: 73 },
      { label: "1월", score: 67 },
      { label: "2월", score: 60 },
      { label: "3월", score: 55 },
    ];

    months.forEach((m, idx) => {
      const t = setTimeout(() => {
        timelapseMonth.textContent = m.label;
        timelapseScore.textContent = m.score;
        timelapseScore.classList.remove("warn", "bad");
        if (m.score < 65) timelapseScore.classList.add("bad");
        else if (m.score < 75) timelapseScore.classList.add("warn");
        bumpScore(m.score);
        const deltaLabel = idx === 0 ? "추세 시작" : `${m.score - months[idx - 1].score}`;
        setScoreDelta(deltaLabel, true);
        updateTrendLine(idx, m.score);
      }, idx * 1100);
      state.timelapseTimers.push(t);
    });

    // 끝나고 면허 반납 카드 reveal
    const finalT = setTimeout(() => {
      timelapseOverlay.classList.remove("show");
      trendPeriod.textContent = "최근 6개월";
      revealDecisionCard();
      showToast("📊 6개월 추세: 85→55 — 면허 반납 상담 카드가 등장합니다");
    }, months.length * 1100 + 600);
    state.timelapseTimers.push(finalT);
  }

  function clearTimelapseTimers() {
    state.timelapseTimers.forEach((t) => clearTimeout(t));
    state.timelapseTimers = [];
  }

  function updateTrendLine(monthIdx, score) {
    // 6개월 = 7 keypoint (start + 6)
    // x = 0, 60, 120, 180, 240, 300
    // y = 100 - score (대략)
    const allScores = [85, 81, 73, 67, 60, 55];
    const visible = allScores.slice(0, monthIdx + 1);
    while (visible.length < 6) visible.push(visible[visible.length - 1]);
    const points = visible.map((s, i) => {
      const x = (i / 5) * 300;
      const y = 100 - (s - 40) * (100 / 60); // 40~100 점수 → 100~0 y
      return [x, Math.max(5, Math.min(95, y))];
    });
    const d = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
    trendPath.setAttribute("d", d);
    const fillD = d + ` L 300,100 L 0,100 Z`;
    trendFill.setAttribute("d", fillD);
    const last = points[monthIdx];
    if (last) {
      trendDot.setAttribute("cx", last[0].toFixed(1));
      trendDot.setAttribute("cy", last[1].toFixed(1));
    }
  }

  function revealDecisionCard() {
    decisionCard.classList.add("reveal");
    decisionCard.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  /* ---------------- 90초 자동 데모 ---------------- */
  function runAutoPlay() {
    if (state.autoPlayRunning) {
      stopAutoPlay();
      return;
    }
    state.autoPlayRunning = true;
    btnAutoPlay.innerHTML = "<span>■</span> 데모 정지";
    btnAutoPlay.classList.remove("primary");

    const totalDuration = 90000;
    const startTime = performance.now();
    function tickProgress(now) {
      if (!state.autoPlayRunning) return;
      const pct = Math.min(((now - startTime) / totalDuration) * 100, 100);
      autoProgressFill.style.width = pct + "%";
      if (pct < 100) requestAnimationFrame(tickProgress);
    }
    requestAnimationFrame(tickProgress);

    // 시퀀스
    schedule(0, () => showToast("▶ 90초 자동 데모 시작 — 양쪽 화면을 보세요"));
    schedule(800, () => activateParentDriving());
    schedule(2000, () => showToast("👴 부모님: 운전 시작 (자동 감지). 부모님은 아무것도 안 했어요"));
    schedule(8000, () => showToast("👧 자녀 화면: 운전 데이터가 실시간으로 분석되고 있습니다"));
    schedule(14000, () => triggerDrivingDanger());
    schedule(15500, () => addRiskEventCard());
    schedule(16500, () => showNotificationBanner());
    schedule(17500, () => {
      state.score -= 4;
      state.eventCount += 1;
      bumpScore(state.score);
      setScoreDelta("-4", true);
      scoreHeroEvents.textContent = `${state.eventCount}건`;
      showToast("⚡ 급가속 감지 → 자녀 폰에 즉시 알림. 점수 -4");
    });
    schedule(24000, () => {
      deactivateParentDriving();
      showToast("🏁 운전 종료 (자동 감지) → 데이터 클라우드 분석");
    });
    schedule(28000, () => {
      openKakaoModal();
      showToast("💬 앱이 자녀에게 데이터 기반 대화 메시지를 제안합니다");
    });
    schedule(31000, () => {
      sendKakaoSuggestion(
        "아빠~ 이번 주 점수 73점이래요! 5점이나 올랐어요 😊"
      );
    });
    schedule(38000, () => {
      closeKakaoModal();
      showToast("📊 6개월 누적 데이터로 추세를 보여드릴게요");
    });
    schedule(40000, () => runTimelapse());
    schedule(48000, () => {
      showToast("→ 점수 지속 하락. 면허 반납 대화 카드가 등장합니다");
    });
    schedule(54000, () => revealDecisionCard());
    schedule(58000, () => {
      showToast("🤝 자연스러운 대화로 면허 반납 → B2G 바우처 중개");
    });
    schedule(64000, () => {
      showToast("💎 핵심: 자녀가 결제, 부모는 아무것도 안 함 — Payer ≠ User");
    });
    schedule(72000, () => {
      showToast("📈 ARR Year 1 ₩3.27억 → Year 3 ₩60억 (B/C 3.35)");
    });
    schedule(82000, () => {
      showToast("✅ 데모 완료 — 직접 클릭하며 자유롭게 확인해보세요");
    });
    schedule(89500, () => stopAutoPlay());
  }

  function schedule(delay, fn) {
    const t = setTimeout(fn, delay);
    state.autoPlayTimers.push(t);
  }

  function stopAutoPlay() {
    state.autoPlayTimers.forEach((t) => clearTimeout(t));
    state.autoPlayTimers = [];
    state.autoPlayRunning = false;
    btnAutoPlay.innerHTML = "<span>▶</span> 90초 자동 데모";
    btnAutoPlay.classList.add("primary");
    autoProgressFill.style.width = "0%";
  }

  /* ---------------- 리셋 ---------------- */
  function resetDemo() {
    stopAutoPlay();
    clearTimelapseTimers();
    deactivateParentDriving();
    timelapseOverlay.classList.remove("show");
    closeKakaoModal();
    childNotifBanner.classList.remove("show");
    decisionCard.classList.remove("reveal");

    state.score = 73;
    state.eventCount = 2;
    state.distance = 187;
    bumpScore(state.score);
    setScoreDelta("+5", false);
    scoreHeroEvents.textContent = "2건";
    scoreHeroDistance.textContent = "187km";
    trendPeriod.textContent = "실시간";

    // 추세선 초기화
    trendPath.setAttribute("d", "M 0,30 L 60,40 L 120,50 L 180,55 L 240,68 L 300,85");
    trendFill.setAttribute("d", "M 0,30 L 60,40 L 120,50 L 180,55 L 240,68 L 300,85 L 300,100 L 0,100 Z");
    trendDot.setAttribute("cx", "300");
    trendDot.setAttribute("cy", "85");

    // 추가된 위험 이벤트 카드 제거
    childEventList.querySelectorAll(".event-card.urgent").forEach((el) => el.remove());

    // 카카오톡 제안 다시 보이게
    kakaoSuggestions.style.display = "";

    showToast("↺ 데모 초기 상태로 리셋되었습니다");
  }

  /* ---------------- 이벤트 바인딩 ---------------- */
  function bindEvents() {
    btnAutoPlay.addEventListener("click", runAutoPlay);
    btnTriggerEvent.addEventListener("click", triggerRiskEvent);
    btnOpenKakao.addEventListener("click", openKakaoModal);
    btnTimelapse.addEventListener("click", runTimelapse);
    btnReset.addEventListener("click", resetDemo);

    kakaoClose.addEventListener("click", closeKakaoModal);
    kakaoModal.addEventListener("click", (e) => {
      if (e.target === kakaoModal) closeKakaoModal();
    });

    // 카카오톡 제안 메시지 클릭
    document.addEventListener("click", (e) => {
      const sug = e.target.closest(".kakao-suggestion");
      if (sug) {
        sendKakaoSuggestion(sug.dataset.message);
        return;
      }
      const action = e.target.closest("[data-action]");
      if (action && action.dataset.action === "open-kakao") {
        openKakaoModal();
      }
    });

    // ESC로 모달 닫기
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        closeKakaoModal();
        closeQrModal();
      }
      if (e.key === " " && e.target === document.body) {
        e.preventDefault();
        runAutoPlay();
      }
    });

    // 차량 마커 위치 재계산 (윈도우 리사이즈)
    window.addEventListener("resize", () => {
      if (state.drivingTimer) {
        // 차량 위치 즉시 갱신
        moveCar();
      }
    });
  }

  /* ---------------- QR 모달 ---------------- */
  const qrTrigger = $("#qrTrigger");
  const qrModal = $("#qrModal");
  const qrCanvas = $("#qrCanvas");
  const qrUrl = $("#qrUrl");
  const qrClose = $("#qrClose");

  function openQrModal() {
    if (!qrModal) return;
    const url = window.location.origin + "/live";
    if (qrCanvas) {
      const apiUrl = "https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=0&data=" + encodeURIComponent(url);
      qrCanvas.innerHTML =
        '<img src="' + apiUrl + '" alt="QR Code: ' + url + '" ' +
        'style="width:100%;height:100%;display:block" loading="lazy"/>';
    }
    if (qrUrl) qrUrl.textContent = url;
    qrModal.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  function closeQrModal() {
    if (qrModal) qrModal.classList.remove("active");
    document.body.style.overflow = "";
  }

  if (qrTrigger) qrTrigger.addEventListener("click", openQrModal);
  if (qrClose) qrClose.addEventListener("click", closeQrModal);
  if (qrModal) qrModal.addEventListener("click", function (e) {
    if (e.target === qrModal) closeQrModal();
  });

  /* ---------------- 초기화 ---------------- */
  function init() {
    startBizCounters();
    startSlowSubscriberGrowth();
    bindEvents();

    // Parallax phone tilt — 마우스 추적
    bindParallax();

    setTimeout(() => {
      showToast("👋 데모를 자동 재생하려면 [▶ 90초 자동 데모] 버튼을 눌러주세요");
    }, 1800);
  }

  /* ---------------- Parallax phones ---------------- */
  function bindParallax() {
    const phones = document.querySelectorAll('[data-parallax]');
    if (!phones.length) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) return;
    let mouseX = 0, mouseY = 0;
    let targetX = 0, targetY = 0;
    let animating = false;

    function loop() {
      mouseX += (targetX - mouseX) * 0.06;
      mouseY += (targetY - mouseY) * 0.06;
      phones.forEach((p) => {
        const dir = p.dataset.parallax === 'right' ? -1 : 1;
        const ry = (mouseX * 4) * dir;
        const rx = -mouseY * 2;
        const ty = mouseY * 4;
        p.style.transform = `perspective(1400px) rotateY(${ry.toFixed(2)}deg) rotateX(${rx.toFixed(2)}deg) translateY(${ty.toFixed(2)}px)`;
      });
      if (Math.abs(targetX - mouseX) > 0.001 || Math.abs(targetY - mouseY) > 0.001) {
        requestAnimationFrame(loop);
      } else {
        animating = false;
      }
    }

    function update(e) {
      const w = window.innerWidth;
      const h = window.innerHeight;
      targetX = (e.clientX / w - 0.5) * 2;
      targetY = (e.clientY / h - 0.5) * 2;
      if (!animating) {
        animating = true;
        requestAnimationFrame(loop);
      }
    }

    document.addEventListener('mousemove', update, { passive: true });
    document.addEventListener('mouseleave', () => {
      targetX = 0;
      targetY = 0;
      if (!animating) {
        animating = true;
        requestAnimationFrame(loop);
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
