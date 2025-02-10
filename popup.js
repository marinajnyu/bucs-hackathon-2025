document.addEventListener("DOMContentLoaded", function () {
  const loadingSpinner = document.getElementById("loading");
  const applyButton = document.getElementById("apply-tone");

  // Listen for completion message from content script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "updateComplete") {
      loadingSpinner.classList.add("hidden");
      applyButton.disabled = false;
    }
  });

  applyButton.addEventListener("click", function () {
    let selectedTone = document.getElementById("tone-selector").value;
    console.log("🎛️ Selected tone:", selectedTone);

    // Show loading spinner and disable button
    loadingSpinner.classList.remove("hidden");
    applyButton.disabled = true;

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (!tabs || tabs.length === 0 || !tabs[0].id) {
        console.error("🚨 No active tab found.");
        loadingSpinner.classList.add("hidden");
        applyButton.disabled = false;
        return;
      }

      console.log("📩 Sending message to content script...");
      chrome.tabs.sendMessage(
        tabs[0].id,
        { action: "changeTone", tone: selectedTone },
        function (response) {
          if (chrome.runtime.lastError) {
            console.error("🚨 Error sending message:", chrome.runtime.lastError.message);
            loadingSpinner.classList.add("hidden");
            applyButton.disabled = false;
          } else {
            console.log("✅ Message sent successfully:", response);
          }
        }
      );
    });
  });
});