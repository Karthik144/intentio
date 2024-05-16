chrome.webNavigation.onCompleted.addListener(
  (details) => {
   
    // Ensure we're dealing with top-level documents
    if (details.frameId === 0) {
      console.log(details);

      // Retrieve the dictionary of sites from storage
      chrome.storage.local.get("sites", (data) => {
        if (data.sites) {
            
          // Extract all the keys into an array
          const savedSites = Object.keys(data.sites);
          console.log("SAVED SITES:", savedSites);

          // Check if the current tab's url matches any of the saved sites
          if (savedSites.includes(details.url)) {
            console.log("INSIDE IF STATEMENT");

            // Update the tab to display the blocked page
            chrome.tabs.update(details.tabId, {
              url: chrome.runtime.getURL("blocked.html"),
            });
          }
        }
      });
    }
  },
  { url: [{ schemes: ["http", "https"] }] } // Filter to only consider HTTP/HTTPS URLs
);

export {};
