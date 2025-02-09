// content.js
// Listen for messages from popup or background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "changeTone" && request.tone) {
    // Immediately acknowledge receipt of message
    sendResponse({ status: "processing" });
    
    let paragraph = document.querySelector("p");
    if (!paragraph) {
      console.log("No paragraph found");
      return false;
    }

    let originalText = paragraph.textContent;
    console.log("Extracted text:", originalText);

    // Create a separate function for processing to handle the async operation
    processToneChange(originalText, request.tone, paragraph);
    
    // Return false since we already sent our initial response
    return false;
  }
  return false;
});

// Separate async function to handle the tone change processing
async function processToneChange(originalText, tone, paragraph) {
  try {
    const response = await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          action: "fetchTone",
          tone: tone,
          text: originalText
        },
        (response) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(response);
          }
        }
      );
    });

    if (response && response.modifiedText) {
      paragraph.textContent = response.modifiedText;
      console.log("Successfully updated text:", response.modifiedText);
      
      // Notify popup of success if needed
      chrome.runtime.sendMessage({
        action: "updateComplete",
        status: "success",
        modifiedText: response.modifiedText
      });
    } else {
      throw new Error("No modified text received");
    }
  } catch (error) {
    console.error("Error processing tone change:", error);
    
    // Notify popup of failure if needed
    chrome.runtime.sendMessage({
      action: "updateComplete",
      status: "error",
      message: error.message
    });
  }
}

// Optional: Listen for direct text updates from background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "updateText" && message.modifiedText) {
    const paragraph = document.querySelector("p");
    if (paragraph) {
      paragraph.textContent = message.modifiedText;
      sendResponse({ status: "success" });
    } else {
      sendResponse({ status: "error", message: "Paragraph not found" });
    }
    return false;
  }
});