/* ================================================================
   안심드라이브 LIVE — 현장 라이브 데모 (부모 입장 Zero-Touch 체험)
   DeviceMotion API로 사람 움직임 → 운전 패턴 시뮬
   ================================================================ */

(function () {
  "use strict";

  /* ---------- DOM ---------- */
  const $ = (s) => document.querySelector(s);
  const startGate = $("#startGate");
  const startBtn = $("#startBtn");
  const fallbackBtn = $("#fallbackBtn");
  const idleScreen = $("#idleScreen");
  const drivingScreen = $("#drivingScreen");
  const liveClock = $("#liveClock");
  const liveDate = $("#liveDate");
  const debugScore = $("#debugScore");
  const debugEvents = $("#debugEvents");
  const debugStatus = $("#debugStatus");
  const drivingSpeed = $("#drivingSpeed");
  const drivingActivity = $("#drivingActivity");
  const drivingEventCount = $("#drivingEventCount");
  const eventToast = $("#eventToast");
  const carMarker = $("#liveCarMarker");
  const fullscreenBtn = $("#fullscreenBtn");
  const resetBtn = $("#resetBtn");

  /* ---------- 상태 ---------- */
  const state = {
    score: 85,
    eventCount: 0,
    lastMag: 9.8,           // 정지 시 중력 magnitude
    activityWindow: [],     // 최근 N개 delta (활동량 평균)
    activityWindowSize: 30,
    motionStarted: false,
    fallbackMode: false,
    drivingMode: false,
    lastDrivingTransition: 0,
    drivingTimeout: null,
    scoreInterval: null,
    fallbackInterval: null,
    lastEventTime: 0,
    minEventGap: 1500,      // ms — 같은 이벤트 너무 자주 안 발생하게
    carPos: 0,
  };

  /* ---------- 유틸 ---------- */
  function vibrate(pattern) {
    if (!navigator.vibrate) return;
    try { navigator.vibrate(pattern); } catch (e) {}
  }

  function nowMs() { return performance.now(); }

  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

  /* ---------- 시계 ---------- */
  function updateClock() {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    if (liveClock) liveClock.textContent = `${hh}:${mm}`;
    if (liveDate) {
      const days = ["일", "월", "화", "수", "목", "금", "토"];
      liveDate.textContent = `${now.getMonth() + 1}월 ${now.getDate()}일 (${days[now.getDay()]})`;
    }
  }
  updateClock();
  setInterval(updateClock, 30 * 1000);

  /* ---------- 점수 표시 ---------- */
  function setScore(s) {
    state.score = clamp(s, 0, 100);
    if (debugScore) {
      debugScore.textContent = Math.round(state.score);
      debugScore.classList.remove("good", "warn", "bad");
      if (state.score >= 80) debugScore.classList.add("good");
      else if (state.score >= 60) debugScore.classList.add("warn");
      else debugScore.classList.add("bad");
    }
  }

  function setEventCount(n) {
    state.eventCount = n;
    if (debugEvents) debugEvents.textContent = String(n);
    if (drivingEventCount) drivingEventCount.textContent = String(n);
  }

  function setStatus(text) {
    if (debugStatus) debugStatus.textContent = text;
  }

  /* ---------- 화면 모드 전환 ---------- */
  function enterDrivingMode() {
    if (state.drivingMode) return;
    state.drivingMode = true;
    state.lastDrivingTransition = nowMs();
    if (drivingScreen) drivingScreen.classList.add("active");
    setStatus("운전 중 · 자동 분석");
    showToast("운전 시작 자동 감지 — 안심드라이브가 분석을 시작합니다");
  }

  function exitDrivingMode() {
    if (!state.drivingMode) return;
    state.drivingMode = false;
    if (drivingScreen) drivingScreen.classList.remove("active");
    setStatus("정차 · 백그라운드 모니터링");
  }

  /* ---------- 토스트 ---------- */
  let toastTimer;
  function showToast(message, isWarn) {
    clearTimeout(toastTimer);
    if (!eventToast) return;
    eventToast.textContent = message;
    eventToast.classList.toggle("warn", !!isWarn);
    eventToast.classList.add("show");
    toastTimer = setTimeout(() => eventToast.classList.remove("show"), 2800);
  }

  /* ---------- 위험 이벤트 발생 ---------- */
  function fireRiskEvent(type, label, scoreDelta, vibratePattern) {
    const t = nowMs();
    if (t - state.lastEventTime < state.minEventGap) return;
    state.lastEventTime = t;
    setScore(state.score + scoreDelta);
    setEventCount(state.eventCount + 1);
    showToast(label, true);
    vibrate(vibratePattern);
    enterDrivingMode();
    bumpDrivingSpeed(type);
  }

  function bumpDrivingSpeed(type) {
    if (!drivingSpeed) return;
    const speeds = { brake: 22, swerve: 58, accel: 78 };
    const s = speeds[type] || 50;
    drivingSpeed.textContent = String(s);
    drivingSpeed.classList.remove("warn", "danger");
    if (s > 70) drivingSpeed.classList.add("danger");
    else if (s > 50) drivingSpeed.classList.add("warn");
    setTimeout(() => {
      drivingSpeed.textContent = "44";
      drivingSpeed.classList.remove("warn", "danger");
    }, 2500);
  }

  /* ---------- 차량 마커 이동 ---------- */
  function moveCarMarker() {
    if (!carMarker || !state.drivingMode) return;
    state.carPos = (state.carPos + 1) % 100;
    const path = [
      [10, 90], [25, 90], [25, 50],
      [55, 50], [55, 18], [80, 18],
    ];
    const segments = path.length - 1;
    const t = (state.carPos / 100) * segments;
    const segIdx = Math.min(Math.floor(t), segments - 1);
    const local = t - segIdx;
    const [x1, y1] = path[segIdx];
    const [x2, y2] = path[segIdx + 1];
    const x = x1 + (x2 - x1) * local;
    const y = y1 + (y2 - y1) * local;
    carMarker.style.left = x + "%";
    carMarker.style.top = y + "%";
  }
  setInterval(moveCarMarker, 600);

  /* ---------- 주기적 점수 적립 ---------- */
  function startScoreLoop() {
    if (state.scoreInterval) return;
    state.scoreInterval = setInterval(() => {
      // 활동량 평균
      const sum = state.activityWindow.reduce((a, b) => a + b, 0);
      const avgDelta = state.activityWindow.length ? sum / state.activityWindow.length : 0;

      let delta = 0;
      if (avgDelta < 1.5) {
        delta = +0.5;  // 정차/정지
        setStatus(state.drivingMode ? "안전 운전 중" : "정차 · 백그라운드 모니터링");
      } else if (avgDelta < 5) {
        delta = +0.3;  // 안전 운전
        setStatus("안전 운전 중");
        enterDrivingMode();
      } else if (avgDelta < 12) {
        delta = -0.1; // 약간 위험
        setStatus("주의 — 운전 패턴 변동");
        enterDrivingMode();
      } else {
        delta = -0.2; // 격렬
        setStatus("위험 — 격한 운전 감지");
        enterDrivingMode();
      }
      setScore(state.score + delta);

      // 활동 표시 업데이트
      if (drivingActivity) {
        drivingActivity.textContent = avgDelta.toFixed(1);
      }

      // 운전 모드인데 한참 정지 상태면 종료
      if (state.drivingMode && avgDelta < 1.5) {
        if (nowMs() - state.lastDrivingTransition > 8000) {
          exitDrivingMode();
        }
      }
    }, 1000);
  }

  /* ---------- DeviceMotion 핸들러 ---------- */
  function onMotion(e) {
    const acc = e.accelerationIncludingGravity || e.acceleration;
    if (!acc || acc.x == null) return;

    const mag = Math.sqrt(
      (acc.x || 0) ** 2 + (acc.y || 0) ** 2 + (acc.z || 0) ** 2
    );
    const delta = Math.abs(mag - state.lastMag);
    state.lastMag = mag;

    // 활동 윈도우 업데이트
    state.activityWindow.push(delta);
    if (state.activityWindow.length > state.activityWindowSize) {
      state.activityWindow.shift();
    }

    // 위험 이벤트 임계값
    if (delta > 18) {
      // 매우 큰 jerk = 급가속/큰 충격
      fireRiskEvent("accel", "급가속 감지 · 점수 -5", -5, [40, 30, 80]);
    } else if (delta > 10) {
      // 중간 jerk = 급제동 또는 차선 급변경
      const rot = e.rotationRate;
      const isSwerve = rot && (Math.abs(rot.alpha) > 80 || Math.abs(rot.gamma) > 80);
      if (isSwerve) {
        fireRiskEvent("swerve", "차선 급변경 감지 · 점수 -3", -3, [30, 30, 30]);
      } else {
        fireRiskEvent("brake", "급제동 감지 · 점수 -4", -4, [60, 40]);
      }
    }
  }

  /* ---------- 권한 + 시작 ---------- */
  async function startMotion() {
    if (typeof DeviceMotionEvent === "undefined") {
      activateFallback("이 브라우저는 DeviceMotion을 지원하지 않습니다");
      return;
    }
    try {
      // iOS 13+ requires permission
      if (typeof DeviceMotionEvent.requestPermission === "function") {
        const perm = await DeviceMotionEvent.requestPermission();
        if (perm !== "granted") {
          activateFallback("센서 권한이 거부됨 — 자동 시뮬 모드");
          return;
        }
      }
      window.addEventListener("devicemotion", onMotion, { passive: true });
      state.motionStarted = true;
      hideStartGate();
      startScoreLoop();
      vibrate(80);
      setTimeout(() => showToast("폰을 들고 천천히 움직여보세요"), 800);
      tryWakeLock();
    } catch (err) {
      activateFallback("센서 활성화 실패 — 자동 시뮬 모드");
    }
  }

  function activateFallback(reason) {
    state.fallbackMode = true;
    hideStartGate();
    startScoreLoop();
    setStatus("자동 시뮬 모드 (" + reason + ")");
    showToast("자동 시뮬 모드로 진행합니다");
    // 5~10초마다 가짜 이벤트 발생
    state.fallbackInterval = setInterval(() => {
      if (Math.random() > 0.5) {
        const types = [
          ["brake", "급제동 감지 · 점수 -4", -4, [60, 40]],
          ["swerve", "차선 급변경 감지 · 점수 -3", -3, [30, 30, 30]],
          ["accel", "급가속 감지 · 점수 -5", -5, [40, 30, 80]],
        ];
        const t = types[Math.floor(Math.random() * types.length)];
        fireRiskEvent(t[0], t[1], t[2], t[3]);
      } else {
        // 활동량 인위적 증가 (운전 모드 트리거)
        for (let i = 0; i < 8; i++) {
          state.activityWindow.push(3 + Math.random() * 4);
          if (state.activityWindow.length > state.activityWindowSize) {
            state.activityWindow.shift();
          }
        }
        enterDrivingMode();
      }
    }, 6000 + Math.random() * 4000);
    tryWakeLock();
  }

  function hideStartGate() {
    if (startGate) startGate.classList.add("hidden");
    if (idleScreen) idleScreen.classList.add("ready");
  }

  /* ---------- WakeLock ---------- */
  async function tryWakeLock() {
    if (!("wakeLock" in navigator)) return;
    try {
      await navigator.wakeLock.request("screen");
    } catch (e) {}
  }

  /* ---------- 풀스크린 ---------- */
  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.();
    }
  }

  /* ---------- 리셋 ---------- */
  function resetDemo() {
    setScore(85);
    setEventCount(0);
    state.activityWindow = [];
    state.lastEventTime = 0;
    exitDrivingMode();
    showToast("데모 초기화");
    vibrate(50);
  }

  /* ---------- 이벤트 바인딩 ---------- */
  if (startBtn) startBtn.addEventListener("click", startMotion);
  if (fallbackBtn) fallbackBtn.addEventListener("click", () => activateFallback("사용자 선택"));
  if (fullscreenBtn) fullscreenBtn.addEventListener("click", toggleFullscreen);
  if (resetBtn) resetBtn.addEventListener("click", resetDemo);

  // 초기 표시
  setScore(85);
  setEventCount(0);
  setStatus("정차 · 백그라운드 모니터링");
})();
