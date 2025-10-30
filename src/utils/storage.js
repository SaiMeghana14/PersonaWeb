const storage = {
  async get(key) {
    return new Promise((res) => {
      chrome.storage.local.get([key], (items) => res(items[key]));
    });
  },
  async set(key, val) {
    return new Promise((res) => {
      chrome.storage.local.set({ [key]: val }, () => res(true));
    });
  },
  async remove(key) {
    return new Promise((res) => {
      chrome.storage.local.remove([key], () => res(true));
    });
  },
  async clearAll() {
    return new Promise((res) => {
      chrome.storage.local.clear(() => res(true));
    });
  }
};
