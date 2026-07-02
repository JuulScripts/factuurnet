// =========================
// BASIC NOTIFICATION
// =========================
function createNotification(message = "This is a notification!", type = "success") {
  const colors = {
    success: "#22c55e",
    error: "#dc2626",
    warning: "#f59e0b",
    info: "#2563eb"
  };

  const container = document.getElementById("notification-container");
  if (!container) return;

  const notification = document.createElement("div");
  notification.classList.add("notification");
  notification.textContent = message;
  notification.style.setProperty("--notif-color", colors[type] || colors.success);

  const closeBtn = document.createElement("button");
  closeBtn.classList.add("close-btn");
  closeBtn.innerHTML = "&times;";
  closeBtn.onclick = (e) => {
    e.stopPropagation();
    removeNotification(notification);
  };
  notification.appendChild(closeBtn);

  notification.onclick = () => {
    console.log("Notification clicked:", message);
  };

  container.appendChild(notification);

  setTimeout(() => notification.classList.add("show"), 50);
  setTimeout(() => removeNotification(notification), 10000);

  function removeNotification(el) {
    el.classList.remove("show");
    setTimeout(() => {
      if (container.contains(el)) container.removeChild(el);
    }, 250);
  }
}

// =========================
// CONFIRM NOTIFICATION
// =========================
function createConfirmNotification(message = "Are you sure?") {
  return new Promise((resolve) => {
    const container = document.getElementById("notification-container");
    if (!container) return resolve(false);

    const notification = document.createElement("div");
    notification.classList.add("notification");
    notification.textContent = message;
    notification.style.setProperty("--notif-color", "#1e3a8a");

    const closeBtn = document.createElement("button");
    closeBtn.classList.add("close-btn");
    closeBtn.innerHTML = "&times;";
    closeBtn.onclick = (e) => {
      e.stopPropagation();
      removeNotification(false);
    };
    notification.appendChild(closeBtn);

    // Confirm popup
    const popup = document.createElement("div");
    popup.classList.add("confirm-popup");
    popup.innerHTML = `
      <button class="confirm-btn">Confirm</button>
      <button class="cancel-btn">Cancel</button>
    `;
    notification.appendChild(popup);

    container.appendChild(notification);

    // Animate notification
    setTimeout(() => notification.classList.add("show"), 50);
    setTimeout(() => popup.classList.add("show"), 200);

    // Button events
    popup.querySelector(".confirm-btn").onclick = (e) => {
      e.stopPropagation();
      removeNotification(true);
    };

    popup.querySelector(".cancel-btn").onclick = (e) => {
      e.stopPropagation();
      removeNotification(false);
    };

    notification.onclick = () => {
      popup.classList.toggle("show"); // toggle popup on click
    };

    function removeNotification(result) {
      popup.classList.remove("show");
      notification.classList.remove("show");
      setTimeout(() => {
        if (container.contains(notification)) container.removeChild(notification);
        resolve(result);
      }, 250);
    }
  });
}
