// content.js
// Define text-containing elements we want to process
const TEXT_ELEMENTS = [
  'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'li', 'td', 'th', 'div', 'span', 'label',
  'a'
];

// Function to check if an element contains meaningful text
function hasVisibleText(element) {
  const text = element.textContent.trim();
  if (!text) return false;
  
  const style = window.getComputedStyle(element);
  if (style.display === 'none' || style.visibility === 'hidden') return false;
  
  // Check if element has no child elements or only text nodes
  const hasOnlyText = Array.from(element.childNodes).every(node => 
    node.nodeType === Node.TEXT_NODE || 
    (node.nodeType === Node.ELEMENT_NODE && !node.children.length)
  );
  
  return hasOnlyText;
}

// Function to get text nodes from an element
function getTextNodes(element) {
  const textNodes = [];
  const walk = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: function(node) {
        return node.textContent.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    }
  );
  
  let node;
  while (node = walk.nextNode()) {
    textNodes.push(node);
  }
  return textNodes;
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
    sendResponse({ status: "processing" });
    
    const elements = getTextElements();
    if (elements.length === 0) {
      console.log("No text elements found");
      return false;
    }

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
      processToneChange(element, tone)
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
    
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
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
async function processToneChange(element, tone) {
  try {
    const textNodes = getTextNodes(element);
    
    for (const textNode of textNodes) {
      const originalText = textNode.textContent.trim();
      if (!originalText) continue;

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
        textNode.textContent = response.modifiedText;
        console.log("Successfully updated text node:", {
          original: originalText.slice(0, 50) + "...",
          modified: response.modifiedText.slice(0, 50) + "..."
        });
      } else {
        throw new Error("No modified text received");
      }
    }
    return true;
  } catch (error) {
    console.error("Error processing tone change:", error, {
      element: element,
      text: element.textContent.slice(0, 50) + "..."
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
        const textNodes = getTextNodes(element);
        textNodes.forEach(node => {
          node.textContent = message.modifiedText;
        });
      });
      sendResponse({ status: "success" });
    } else {
      sendResponse({ status: "error", message: "No text elements found" });
    }
    return false;
  }
});g