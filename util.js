// Standalone helper functions.

function dom(parent, className, content) {
  const el = document.createElement('div');
  parent.appendChild(el);
  el.className = className;
  if (content) el.textContent = content;
  return el;
}

function setMapTo(oldMap, newMap) {
  oldMap.clear();
  for (let [key, value] of newMap) {
    if (Array.isArray(value)) {
      oldMap.set(key, value.slice());
    } else {
      oldMap.set(key, value);
    }
  }
  return oldMap;
}

function copyMap(map) {
  const newMap = new Map(map);
  for (let [key, value] of newMap) {
    if (Array.isArray(value)) {
      newMap.set(key, value.slice());
    }
  }
  return newMap;
}
