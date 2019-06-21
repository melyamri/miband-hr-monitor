// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

function updateHRValue(value){
  document.getElementById('hr-value').innerText = value
}
window.onload = (() => {
  document.getElementById('start').addEventListener("click", initHRMonitor);
})