document.addEventListener("DOMContentLoaded", function () {
    const loadingSpinner = document.getElementById("loading");
    const applyButton = document.getElementById("apply-tone");
    const applyCustomButton = document.getElementById("apply-custom");
    const tabs = document.querySelectorAll('.tab');
    const sections = document.querySelectorAll('.content-section');
    
    // Tab switching functionality
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        // Remove active class from all tabs and sections
        tabs.forEach(t => t.classList.remove('active'));
        sections.forEach(s => s.classList.remove('active'));
        
        // Add active class to clicked tab and corresponding section
        tab.classList.add('active');
        document.getElementById(`${tab.dataset.tab}-section`).classList.add('active');
      });
    });
  
    // Listen for completion message from content script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === "updateComplete") {
        loadingSpinner.classList.add("hidden");
        applyButton.disabled = false;
        applyCustomButton.disabled = false;
      }
    });
  
    // Website mode
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
  
    // Custom text mode
    applyCustomButton.addEventListener("click", function () {
      const customText = document.getElementById("custom-text").value;
      const selectedTone = document.getElementById("custom-tone-selector").value;
      const resultDiv = document.getElementById("result");
  
      if (!customText.trim()) {
        alert("Please enter some text first!");
        return;
      }
  
      // Show loading spinner and disable button
      loadingSpinner.classList.remove("hidden");
      applyCustomButton.disabled = true;
      resultDiv.style.display = "none";
  
      // Send directly to background script
      chrome.runtime.sendMessage(
        {
          action: "fetchTone",
          tone: selectedTone,
          text: customText
        },
        function(response) {
          loadingSpinner.classList.add("hidden");
          applyCustomButton.disabled = false;
  
          if (chrome.runtime.lastError) {
            resultDiv.textContent = "Error: " + chrome.runtime.lastError.message;
          } else if (response && response.modifiedText) {
            resultDiv.textContent = response.modifiedText;
          } else {
            resultDiv.textContent = "Error processing text";
          }
          
          resultDiv.style.display = "block";
        }
      );
    });
  });