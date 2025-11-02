const toggle = document.querySelector(".theme-toggle");
if (toggle) {
  toggle.addEventListener("click", () => {
    document.body.classList.toggle("light");
  });
}
// Click to enlarge (simulate fullscreen)
const videoWrapper = document.querySelector('.video-wrapper');

if (videoWrapper) {
  videoWrapper.addEventListener('click', () => {
    videoWrapper.classList.add('expanded');
  });

  // Exit fullscreen when clicking outside or pressing Esc
  document.addEventListener('keydown', (e) => {
    if (e.key === "Escape") videoWrapper.classList.remove('expanded');
  });
}

