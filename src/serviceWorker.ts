interface SiteMetaData {
  message: string;
  time: number; // Total allowed time in seconds 
  blocked: boolean;
  unlocks: number;
  totalVisits: number;
  totalVisitsWhenBlocked: number; 
  unlockMsgs?: string[];
  startTime?: number; // Time when the user started the session
  accumulatedTime?: number; // Accumulated time spent on the site in seconds
  pattern?: string; // Regex pattern for the site
}

interface StorageData {
  sites: { [key: string]: SiteMetaData };
}

let timers: { [key: number]: NodeJS.Timeout } = {};
let currentSite: string = "";
let currentExpression: RegExp | null = null;
let currentMessage: string = "";


// Triggers before user enters the site 
chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {

  if (details.frameId === 0 && details.url) {

    const matchedSite = await findMatchingSite(details.url);

    if (matchedSite) {
      chrome.storage.local.get("sites", async (data) => {

        const siteData = data.sites[matchedSite];
        setGlobalVars(matchedSite, siteData.message); 
        currentExpression = new RegExp(siteData.pattern || generateRegexPattern(matchedSite));

        const today = new Date();
        const startTime = siteData.startTime || 0;

        await updateTotalVisits(matchedSite);

        if (!isSameDate(startTime, today) && siteData.blocked) {
          await updateBlockedStatus(matchedSite, false);
        } else if (siteData.blocked) {
          await updateTotalVisitsWhenBlocked(matchedSite); 
          redirectToBlockedPage(matchedSite, currentMessage, details.tabId);
        }
      });
    }
  }
}, { url: [{ schemes: ["http", "https"] }] });


// Triggers once site has finished loading 
chrome.webNavigation.onCompleted.addListener(async (details) => {

  if (details.frameId === 0 && details.url) {

    const matchedSite = await findMatchingSite(details.url);

    if (matchedSite) {

      chrome.storage.local.get("sites", async (data) => {

        const siteData = data.sites[matchedSite];
        setGlobalVars(matchedSite, siteData.message); 
        currentExpression = new RegExp(siteData.pattern || generateRegexPattern(matchedSite));

        const today = new Date();
        const startTime = siteData.startTime || 0;

        await updateTotalVisits(matchedSite);

        if (!isSameDate(startTime, today) && siteData.blocked) {
          await updateBlockedStatus(matchedSite, false);
          await startTimer(matchedSite, details.tabId, calculateRemainingTime(siteData));
        } else if (siteData.blocked) {
          await updateTotalVisitsWhenBlocked(matchedSite); 
          redirectToBlockedPage(matchedSite, currentMessage, details.tabId);
        } else {
          const remainingTime = calculateRemainingTime(siteData);
          if (remainingTime <= 0) {
            await updateBlockedStatus(matchedSite, true);
            redirectToBlockedPage(matchedSite, currentMessage, details.tabId);
          } else {
            await startTimer(matchedSite, details.tabId, remainingTime);
          }
        }
      });
    }
  }
}, { url: [{ schemes: ["http", "https"] }] });

chrome.tabs.onActivated.addListener(async (activeInfo) => {

  if (activeInfo.tabId) {

    chrome.tabs.get(activeInfo.tabId, async (tab) => {

      if (tab && tab.url) {

        const matchedSite = await findMatchingSite(tab.url);

        if (matchedSite) {

          chrome.storage.local.get("sites", async (data) => {

            const siteData = data.sites[matchedSite];
            currentSite = matchedSite;
            currentMessage = siteData.message;
            currentExpression = new RegExp(siteData.pattern || generateRegexPattern(matchedSite));


            const today = new Date();
            const startTime = siteData.startTime || 0;

            await updateTotalVisits(matchedSite);

            if (!isSameDate(startTime, today) && siteData.blocked) {
              await updateBlockedStatus(matchedSite, false);
              await startTimer(matchedSite, activeInfo.tabId, calculateRemainingTime(siteData));
            } else if (siteData.blocked) {
              await updateTotalVisitsWhenBlocked(matchedSite); 
              redirectToBlockedPage(matchedSite, currentMessage, activeInfo.tabId);
            } else {
              await startTimer(matchedSite, activeInfo.tabId, calculateRemainingTime(siteData));
            }
          });
        } else {
              // User has switched away from time-bound site; stop the timer and update accumulated time
              await cleanUp(activeInfo.tabId); 
        }
      }
    });
  }
});

// Triggers once user closes the tab 
chrome.tabs.onRemoved.addListener(async (tabId) => {
  await cleanUp(tabId); 
});


// Helper functions 

function calculateRemainingTime(siteData: SiteMetaData): number {
  const accumulatedTime = siteData.accumulatedTime || 0;
  return siteData.time - accumulatedTime;
}

async function startTimer(site: string, tabId: number, timeLimit: number) {

  if (timers[tabId]) {
    clearTimeout(timers[tabId]);
  }

  chrome.storage.local.get("sites", (data) => {
    const sites = data.sites || {};
    const siteData = sites[site] || {};
    siteData.startTime = Date.now();
    chrome.storage.local.set({ sites });
  });

  timers[tabId] = setTimeout(async () => {
    await handleTimeLimitReached(site, currentMessage, tabId);
  }, timeLimit * 1000);
}

function generateRegexPattern(site: string): string {
  const escapedSite = site.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  return `^${escapedSite}.*$`;
}

async function handleTimeLimitReached(site: string, message: string, tabId: number) {

  if (timers[tabId]) {
    await updateBlockedStatus(site, true);
    redirectToBlockedPage(site, message, tabId);
  }
}

function redirectToBlockedPage(site: string, message: string, tabId: number) {
  const urlAndMessage = { url: site, message: message };
  chrome.storage.local.set({ blockedSite: urlAndMessage }, () => {
    chrome.tabs.update(tabId, {
      url: chrome.runtime.getURL("blocked.html"),
    });
  });
}

function isSameDate(timestamp: number, date: Date): boolean {
  const givenDate = new Date(timestamp);
  return (
    givenDate.getFullYear() === date.getFullYear() &&
    givenDate.getMonth() === date.getMonth() &&
    givenDate.getDate() === date.getDate()
  );
}

async function findMatchingSite(url: string): Promise<string | null> {
  return new Promise((resolve) => {
    chrome.storage.local.get("sites", (data) => {
      const sites = data.sites || {};
      const siteKeys = Object.keys(sites);

      if (siteKeys.length === 0) {
        resolve(null);
        return;
      }

      for (const site of siteKeys) {
        if (!site) {
          continue;
        }

        const siteData = sites[site];
        const pattern = new RegExp(siteData.pattern || generateRegexPattern(site));

        if (pattern.test(url)) {
          resolve(site);
          return;
        }
      }

      resolve(null);
    });
  });
}

function setGlobalVars(site: string, message: string){
  currentSite = site;
  currentMessage = message;
}


// Chrome api helper functions 
function updateAccumulatedTime(tabId: number): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get("sites", (data) => {
      if (currentSite && data.sites && data.sites[currentSite]) {
        const siteData = data.sites[currentSite];
        const now = Date.now();
        const elapsedTime = siteData.startTime ? (now - siteData.startTime) / 1000 : 0;
        siteData.accumulatedTime = (siteData.accumulatedTime || 0) + elapsedTime;
        chrome.storage.local.set({ sites: data.sites }, () => {
          resolve();
        });
      } else {
        reject(new Error(`Site ${currentSite} not found in storage`));
      }
    });
  });
}

async function updateTotalVisits(site: string): Promise<void> {

  return new Promise<void>((resolve, reject) => {
    chrome.storage.local.get("sites", (data) => {
      const sites = data.sites || {};
      if (sites[site]) {
        sites[site].totalVisits = (sites[site].totalVisits || 0) + 1;
        chrome.storage.local.set({ sites }, () => {
          resolve();
        });
      } else {
        resolve();
      }
    });
  });
}

async function updateTotalVisitsWhenBlocked(site: string): Promise<void> {

  return new Promise<void>((resolve, reject) => {
    chrome.storage.local.get("sites", (data) => {
      const sites = data.sites || {};
      if (sites[site]) {
        sites[site].totalVisitsWhenBlocked = (sites[site].totalVisitsWhenBlocked || 0) + 1;
        chrome.storage.local.set({ sites }, () => {
          resolve();
        });
      } else {
        resolve(); 
      }
    });
  });
}

async function updateBlockedStatus(site: string, status: boolean) {
  console.log("Updating blocked status for:", site);
  const data = await getLocalStorageData("sites");
  const sites = data.sites || {};
  if (sites[site]) {
    sites[site].blocked = status;
    await setLocalStorageData({ sites });
  }
}

function getLocalStorageData(key: string): Promise<any> {
  return new Promise((resolve) => {
    chrome.storage.local.get(key, (data) => {
      resolve(data);
    });
  });
}

function setLocalStorageData(data: any): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set(data, () => {
      resolve();
    });
  });
}

async function cleanUp(tabId: number): Promise<void> {
  if (timers[tabId]) {
    setGlobalVars('', '');
    currentExpression = null;
    clearTimeout(timers[tabId]);
    await updateAccumulatedTime(tabId);
    delete timers[tabId];
  }
}

export {}