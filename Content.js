// content.js
// Define text-containing elements we want to process
const TEXT_ELEMENTS = [
  'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'li', 'td', 'th', 'div', 'span', 'label',
  'a'
];

// Function to check if an element contains meaningful text
function hasVisibleText(element) {
  // Skip elements with only whitespace or empty text
  if (!element.textContent.trim()) return false;
  
  // Skip elements that are hidden
  const style = window.getComputedStyle(element);
  if (style.display === 'none' || style.visibility === 'hidden') return false;
  
  // Skip elements that only contain other text elements
  const hasOnlyTextElements = Array.from(element.children).every(child => 
    TEXT_ELEMENTS.includes(child.tagName.toLowerCase())
  );
  
  return !hasOnlyTextElements || element.childNodes.length === 1;
}

// Function to get all text elements that need processing
function getTextElements() {
  const elements = [];
  
  TEXT_ELEMENTS.forEach(tag => {
    const tagElements = document.getElementsByTagName(tag);
    Array.from(tagElements).forEach(element => {
      if (hasVisibleText(element) && !elements.includes(element)) {
        elements.push(element);
      }
    });
  });
  
  return elements;
}

// Listen for messages from popup or background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "changeTone" && request.tone) {
    // Immediately acknowledge receipt of message
    sendResponse({ status: "processing" });
    
    const elements = getTextElements();
    if (elements.length === 0) {
      console.log("No text elements found");
      return false;
    }

    // Process elements in batches to avoid overwhelming the API
    const batchSize = 5;
    const batches = [];
    
    for (let i = 0; i < elements.length; i += batchSize) {
      batches.push(elements.slice(i, i + batchSize));
    }
    
    processBatches(batches, request.tone);
    return false;
  }
  return false;
});

// Process batches of elements sequentially
async function processBatches(batches, tone) {
  let successCount = 0;
  let errorCount = 0;
  
  for (const batch of batches) {
    const promises = batch.map(element => 
      processToneChange(element.textContent, tone, element)
    );
    
    try {
      const results = await Promise.allSettled(promises);
      results.forEach(result => {
        if (result.status === 'fulfilled') successCount++;
        else errorCount++;
      });
    } catch (error) {
      console.error("Error processing batch:", error);
      errorCount += batch.length;
    }
    
    // Small delay between batches to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Notify popup of completion
  chrome.runtime.sendMessage({
    action: "updateComplete",
    status: "complete",
    stats: {
      success: successCount,
      errors: errorCount,
      total: successCount + errorCount
    }
  });
}

// Process individual element tone change
async function processToneChange(originalText, tone, element) {
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
      element.textContent = response.modifiedText;
      console.log("Successfully updated element:", {
        original: originalText.slice(0, 50) + "...",
        modified: response.modifiedText.slice(0, 50) + "..."
      });
      return true;
    } else {
      throw new Error("No modified text received");
    }
  } catch (error) {
    console.error("Error processing tone change:", error, {
      element: element,
      originalText: originalText.slice(0, 50) + "..."
    });
    throw error;
  }
}

// Optional: Listen for direct text updates from background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "updateText" && message.modifiedText) {
    const elements = getTextElements();
    if (elements.length > 0) {
      elements.forEach(element => {
        element.textContent = message.modifiedText;
      });
      sendResponse({ status: "success" });
    } else {
      sendResponse({ status: "error", message: "No text elements found" });
    }
    return false;
  }
});