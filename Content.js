chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Received message in content.js:", request.tone); // Debugging log

  if (request.tone) {
      replaceTextWithTone(document.body, request.tone);
  }
});

function replaceTextWithTone(node, tone) {
  if (node.nodeType === Node.TEXT_NODE && node.textContent.trim().length > 0) {
      let words = node.textContent.split(/\s+/); // Split text into words
      let indexedWords = words.map((word, index) => tone + index); // Append index number
      node.textContent = indexedWords.join(" "); // Reconstruct text
  } else if (node.nodeType === Node.ELEMENT_NODE) {
      for (let child of node.childNodes) {
          replaceTextWithTone(child, tone); //
      }
  }
}
