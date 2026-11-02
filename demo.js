(() => {
  const video = document.querySelector('#fresh-video');
  document.addEventListener('visibilitychange', () => { if (document.hidden) video.pause(); });
  window.addEventListener('pagehide', () => video.pause());
})();
