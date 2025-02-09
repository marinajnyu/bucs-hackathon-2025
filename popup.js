document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("apply-tone").addEventListener("click", function () {
      let selectedTone = document.getElementById("tone-selector").value;
      console.log("🎛️ Selected tone:", selectedTone);
  
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (!tabs || tabs.length === 0 || !tabs[0].id) {
          console.error("🚨 No active tab found.");
          return;
        }
  
        console.log("📩 Sending message to content script...");
        chrome.tabs.sendMessage(
          tabs[0].id,
          { action: "changeTone", tone: selectedTone },
          function (response) {
            if (chrome.runtime.lastError) {
              console.error("🚨 Error sending message:", chrome.runtime.lastError.message);
            } else {
              console.log("✅ Message sent successfully:", response);
            }
          }
        );
      });
    });
  });
  
