document.getElementById("changeToneButton").addEventListener("click", function() {
    const tone = document.getElementById("toneSelect").value;
  
    // Send a message to content.js to change the tone
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        func: changeTone,
        args: [tone]
      });
    });
  });
  
  function changeTone(tone) {
    // Extract the page's text content
    let pageContent = document.body.innerText;
  
    // Call the API to change the tone (example using OpenAI or any API)
    fetch('YOUR_API_ENDPOINT', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_API_KEY'
      },
      body: JSON.stringify({ text: pageContent, tone: tone })
    })
    .then(response => response.json())
    .then(data => {
      // Replace the content with the modified tone
      document.body.innerText = data.modifiedText;
    })
    .catch(error => console.error('Error:', error));
  }
