interface SiteMetaData {
  message: string;
  time: number; // Total allowed time in seconds
  blocked: boolean;
  unlocks: number;
  totalVisits: number;
  unlockMsgs?: string[];
  startTime?: number; // Time when the user started the session
  accumulatedTime?: number; // Accumulated time spent on the site in seconds
}

interface StorageData {
  sites: { [key: string]: SiteMetaData };
}

let timers: { [key: number]: NodeJS.Timeout } = {};
let currentSite: string | "";
let currentMessage: string | "";

chrome.webNavigation.onBeforeNavigate.addListener((details) => {
  if (details.frameId === 0) {
    chrome.storage.local.get("sites", (data) => {
      console.log("BEFORE IF STATEMENT"); 
      if (data.sites && data.sites[details.url]) {
        const siteData = data.sites[details.url];
        currentSite = details.url;
        currentMessage = siteData.message;
        console.log("CURRENT SITE IN BEFORE NAVIGATE:", currentSite); 
        if (siteData.blocked) {
          console.log("INSIDE FIRST IF - SITE BLOCKED (BEFORE NAVIGATE)")
          updateTotalVisits(details.url);
          redirectToBlockedPage(details.url, currentMessage, details.tabId);
        } 
      }
    });
  }
}, { url: [{ schemes: ["http", "https"] }] });


chrome.webNavigation.onCompleted.addListener(

  (details) => {
    console.log("INSIDE ON COMPLETED"); 
    if (details.frameId === 0) {
      chrome.storage.local.get("sites", (data) => {
        console.log("BEFORE IF STATEMENT"); 
        if (data.sites && data.sites[details.url]) {
          const siteData = data.sites[details.url];
          currentSite = details.url;
          currentMessage = siteData.message;
          console.log("CURRENT SITE:", currentSite); 
          if (siteData.blocked) {
            console.log("INSIDE FIRST IF - SITE BLOCKED")
            updateTotalVisits(details.url);
            redirectToBlockedPage(details.url, currentMessage, details.tabId);
          } else {
            console.log("INSIDE ELSE IF - SITE NOT BLOCKED")
            const remainingTime = calculateRemainingTime(siteData);
            console.log("REMAINING TIME:", remainingTime); 
            if (remainingTime <= 0) {
              updateBlockedStatus(details.url);
              redirectToBlockedPage(details.url, currentMessage, details.tabId);
            } else {
              startTimer(details.url, details.tabId, remainingTime);
            }
          }
        }
      });
    }
  },
  { url: [{ schemes: ["http", "https"] }] }
);

chrome.tabs.onActivated.addListener(activeInfo => {
  console.log("INSIDE ON ACTIVATED");

  // Check if the newly activated tab matches the current site being monitored
  if (activeInfo.tabId && currentSite) {
    chrome.tabs.get(activeInfo.tabId, tab => {
      if (tab && tab.url === currentSite) {
        // Retrieve the sites data from storage
        chrome.storage.local.get("sites", (data) => {
          const sites = data.sites || {};
          if (sites[currentSite]) {
            // The user has switched back to the monitored site
            startTimer(currentSite, activeInfo.tabId, calculateRemainingTime(sites[currentSite]));
          }
        });
      } else {
        // The user has switched away from the monitored site
        // Stop the timer or pause tracking
        if (timers[activeInfo.tabId]) {
          currentSite = ''; 
          clearTimeout(timers[activeInfo.tabId]);
          updateAccumulatedTime(activeInfo.tabId);
          delete timers[activeInfo.tabId];
        }
      }
    });
  }
});


chrome.tabs.onRemoved.addListener((tabId) => {
  console.log("INSIDE ON REMOVED"); 
  if (timers[tabId]) {
    console.log("INSIDE ON REMOVED IF STATEMENT"); 
    currentSite = ''; 
    clearTimeout(timers[tabId]);
    updateAccumulatedTime(tabId);
    delete timers[tabId];
  }
});


function calculateRemainingTime(siteData: SiteMetaData): number {
  const now = Date.now();
  console.log("SITE DATA:", siteData); 
  // const elapsedTime = siteData.startTime ? (now - siteData.startTime) / 1000 : 0;
  const accumulatedTime = siteData.accumulatedTime || 0;
  // const totalTimeSpent = accumulatedTime + elapsedTime;
  return siteData.time - accumulatedTime;
}

function startTimer(site: string, tabId: number, timeLimit: number) {

  console.log("INSIDE START TIMER METHOD"); 

  if (timers[tabId]) {
    clearTimeout(timers[tabId]);
  }

  chrome.storage.local.get("sites", (data) => {
    const sites = data.sites || {};
    const siteData = sites[site] || {};
    siteData.startTime = Date.now();
    chrome.storage.local.set({ sites });
  });

  const timeLimitInMilliseconds = timeLimit * 60 * 1000; // Convert timeLimit from minutes to milliseconds

  // If time limit reached, update the status and redirect the user 
  timers[tabId] = setTimeout(() => {
    handleTimeLimitReached(site, currentMessage, tabId);
  }, timeLimitInMilliseconds);

}

function handleTimeLimitReached(site: string, message: string, tabId: number) {

  console.log("HANDLE TIME LIMIT REACHED"); 
  console.log("TIMERS:", timers[tabId]); 
  
  if (timers[tabId]) {

    updateBlockedStatus(site);
    redirectToBlockedPage(site, message, tabId);
  }

}

function redirectToBlockedPage(site: string, message: string, tabId: number) {
  console.log("REDIRECT TO BLOCKED PAGE CALLED"); 
  const urlAndMessage = { url: site, message: message };
  chrome.storage.local.set({ blockedSite: urlAndMessage }, () => {
    chrome.tabs.update(tabId, {
      url: chrome.runtime.getURL("blocked.html"),
    });
  });
}

function updateTotalVisits(site: string) {
  console.log("UPDATE TOTAL VISITS CALLED ON:", site); 
  chrome.storage.local.get("sites", (data) => {
    const sites = data.sites || {};
    if (sites[site]) {
      sites[site].totalVisits = (sites[site].totalVisits || 0) + 1;
      chrome.storage.local.set({ sites });
    }
  });
}

function updateBlockedStatus(site: string) {
  console.log("UPDATE BLOCKED STATUS CALLED ON:", site); 
  chrome.storage.local.get("sites", (data) => {
    const sites = data.sites || {};
    if (sites[site]) {
      sites[site].blocked = true;
      chrome.storage.local.set({ sites });
    }
  });
}

function updateAccumulatedTime(tabId: number) {
  console.log("UPDATE ACCUMULATED TIME"); 
  chrome.storage.local.get("sites", (data) => {
    if (currentSite && data.sites[currentSite]) {
      const siteData = data.sites[currentSite];
      const now = Date.now();
      const elapsedTime = siteData.startTime ? (now - siteData.startTime) / 1000 : 0;
      console.log("ELAPSED TIMES:", elapsedTime); 
      siteData.accumulatedTime = (siteData.accumulatedTime || 0) + elapsedTime;
      siteData.startTime = undefined;
      chrome.storage.local.set({ sites: data.sites });
    }
  });
}

export {};
