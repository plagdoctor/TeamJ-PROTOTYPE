const screens = document.querySelectorAll(".screen");
const navItems = document.querySelectorAll(".nav-item");
const toast = document.querySelector("#toast");
const score = document.querySelector("#safetyScore");
const eventTimeline = document.querySelector("#eventTimeline");
const modeToggle = document.querySelector("#modeToggle");
const modeToggleLabel = document.querySelector("#modeToggleLabel");
const planToggle = document.querySelector("#planToggle");
const planToggleLabel = document.querySelector("#planToggleLabel");
const zoomButtons = document.querySelectorAll(".zoom-button");
const modeTextNodes = document.querySelectorAll("[data-child][data-parent]");
const parentFamilyPhoto = document.querySelector("#parentFamilyPhoto");
const childFamilyPhotoPreview = document.querySelector("#childFamilyPhotoPreview");
const familyPhotoInput = document.querySelector("#familyPhotoInput");
const parentFamilyMessage = document.querySelector("#parentFamilyMessage");
const familyMessageInput = document.querySelector("#familyMessageInput");

let toastTimer;
let currentMode = "child";
let currentPlan = "free";
let parentZoom = "2";
const familyFrameKey = "ansim-family-frame";

function showToast(message) {
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("visible");
  toastTimer = window.setTimeout(() => {
    toast.classList.remove("visible");
  }, 2200);
}

function setScreen(name) {
  screens.forEach((screen) => {
    screen.classList.toggle("active", screen.dataset.screen === name);
  });

  navItems.forEach((item) => {
    item.classList.toggle("active", item.dataset.target === name);
  });
}

function renderMode() {
  document.body.classList.toggle("parent-mode", currentMode === "parent");
  document.body.classList.toggle("child-mode", currentMode === "child");
  document.body.classList.toggle("child-free-mode", currentMode === "child" && currentPlan === "free");
  document.body.classList.toggle("child-paid-mode", currentMode === "child" && currentPlan === "paid");
  document.body.classList.toggle("parent-zoom-2", currentMode === "parent" && parentZoom === "2");
  document.body.classList.toggle("parent-zoom-3", currentMode === "parent" && parentZoom === "3");
  document.body.classList.toggle("parent-zoom-4", currentMode === "parent" && parentZoom === "4");
  modeToggleLabel.textContent = currentMode === "parent" ? "부모" : "자녀";
  planToggleLabel.textContent = currentPlan === "paid" ? "유료" : "무료";

  zoomButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.zoom === parentZoom);
  });

  modeTextNodes.forEach((node) => {
    node.textContent = node.dataset[currentMode];
  });

  const activeScreen = document.querySelector(".screen.active")?.dataset.screen;
  if (currentMode === "parent" && activeScreen === "partners") {
    setScreen("home");
  }
}

function toggleMode() {
  currentMode = currentMode === "child" ? "parent" : "child";
  renderMode();
  showToast(currentMode === "parent" ? "부모 버전으로 전환했습니다." : "자녀 버전으로 전환했습니다.");
}

function togglePlan() {
  if (currentMode !== "child") return;
  currentPlan = currentPlan === "free" ? "paid" : "free";
  renderMode();
  showToast(currentPlan === "paid" ? "자녀 유료 버전으로 전환했습니다." : "자녀 무료 버전으로 전환했습니다.");
}

function applyFamilyPhoto(dataUrl) {
  [parentFamilyPhoto, childFamilyPhotoPreview].forEach((frame) => {
    if (!frame) return;
    if (dataUrl) {
      frame.style.backgroundImage = `url("${dataUrl}")`;
      frame.classList.add("has-photo");
    } else {
      frame.style.backgroundImage = "";
      frame.classList.remove("has-photo");
    }
  });
}

function saveFamilyFrame() {
  const message = familyMessageInput.value.trim() || "오늘도 천천히 안전하게 다녀오세요.";
  parentFamilyMessage.textContent = message;

  const currentPhoto = parentFamilyPhoto.style.backgroundImage;
  const photoMatch = currentPhoto.match(/^url\("(.+)"\)$/);
  localStorage.setItem(
    familyFrameKey,
    JSON.stringify({
      message,
      photo: photoMatch?.[1] ?? "",
    }),
  );
  showToast("부모 화면의 사진과 한마디를 업데이트했습니다.");
}

function loadFamilyFrame() {
  try {
    const saved = JSON.parse(localStorage.getItem(familyFrameKey) || "{}");
    if (saved.message) {
      parentFamilyMessage.textContent = saved.message;
      familyMessageInput.value = saved.message;
    }
    if (saved.photo) {
      applyFamilyPhoto(saved.photo);
    }
  } catch {
    localStorage.removeItem(familyFrameKey);
  }
}

function simulateRiskEvent() {
  const nextScore = Math.max(68, Number(score.textContent) - 4);
  score.textContent = String(nextScore);

  const event = document.createElement("article");
  event.className = "event-card critical";
  event.innerHTML = `
    <span>방금 전</span>
    <h2>급가속 이벤트</h2>
    <p>교차로 출발 구간에서 평소보다 높은 가속 패턴이 감지됐습니다.</p>
    <button class="inline-button" data-action="call">전화하기</button>
  `;
  eventTimeline.prepend(event);
  showToast("새 위험 이벤트가 추가됐습니다.");
}

function bindActions() {
  modeToggle.addEventListener("click", toggleMode);
  planToggle.addEventListener("click", togglePlan);
  zoomButtons.forEach((button) => {
    button.addEventListener("click", () => {
      parentZoom = button.dataset.zoom;
      renderMode();
      showToast(`부모 버전 글자를 ${parentZoom}배 보기로 조정했습니다.`);
    });
  });

  familyPhotoInput.addEventListener("change", () => {
    const file = familyPhotoInput.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      applyFamilyPhoto(String(reader.result));
      saveFamilyFrame();
    });
    reader.readAsDataURL(file);
  });

  navItems.forEach((item) => {
    item.addEventListener("click", () => setScreen(item.dataset.target));
  });

  document.addEventListener("click", (event) => {
    const actionTarget = event.target.closest("[data-action]");
    if (!actionTarget) return;

    const action = actionTarget.dataset.action;

    if (action === "open-alerts" || action === "notify") {
      setScreen("alerts");
      return;
    }

    if (action === "open-report") {
      setScreen("report");
      return;
    }

    if (action === "simulate") {
      simulateRiskEvent();
      return;
    }

    if (action === "share") {
      showToast("카카오톡 가족 채팅방에 공유했습니다.");
      return;
    }

    if (action === "call") {
      setScreen("report");
      showToast("카카오톡 확인 메시지를 준비했습니다.");
      return;
    }

    if (action === "soft-talk") {
      showToast("칭찬으로 시작하는 카카오톡 문안을 선택했습니다.");
      return;
    }

    if (action === "direct-talk") {
      showToast("네이버지도 위험 구간을 포함한 문안을 선택했습니다.");
      return;
    }

    if (action === "apply") {
      showToast("보험 할인 신청 프로토타입 흐름입니다.");
      return;
    }

    if (action === "subscribe") {
      currentMode = "child";
      currentPlan = "paid";
      renderMode();
      showToast("자녀 유료 버전으로 전환했습니다. 월별 리포트가 열렸습니다.");
      return;
    }

    if (action === "cognition-report") {
      showToast("인지도 추세 리포트는 구독 시 월별로 제공됩니다.");
      return;
    }

    if (action === "parent-score") {
      showToast("무료 버전에서는 오늘의 안전 운전 점수만 제공합니다.");
      return;
    }

    if (action === "emergency") {
      showToast("자녀에게 긴급 연락과 현재 위치를 보냈습니다.");
      return;
    }

    if (action === "save-family-frame") {
      saveFamilyFrame();
    }
  });
}

loadFamilyFrame();
renderMode();
bindActions();
