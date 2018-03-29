/**
 * Load deferred styles
 */
loadDeferredStyles = function () {
    const addStylesNode = document.getElementById("deferred-styles");
    const replacement = document.createElement("div");
    replacement.innerHTML = addStylesNode.textContent;
    document.body.appendChild(replacement);
    addStylesNode.parentElement.removeChild(addStylesNode);
};

/**
 * Fade out pre loader.
 */
fadeOutPreLoader = (el) => {
    el.style.opacity = 1;
    (function fade() {
        if ((el.style.opacity -= .05) < 0) {
            el.classList.add("hidden");
            document.getElementById("header").classList.remove("hidden");
            document.getElementById("maincontent").classList.remove("hidden");
            document.getElementById("footer").classList.remove("hidden");
        } else {
            requestAnimationFrame(fade);
        }
    })();
};

/**
 * Load deferred styles on page load.
 */
let raf = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
if (raf) {
    raf(function () {
        window.setTimeout(loadDeferredStyles, 0);
    });
} else {
    window.addEventListener('load', loadDeferredStyles);
}

/**
 * Fade out pre loader on page load.
 */
window.addEventListener('load', () => {
    fadeOutPreLoader(document.getElementById("preloader"));
});

window.addEventListener('beforeinstallprompt', function (e) {
    e.userChoice.then(function (choiceResult) {
        console.log(choiceResult.outcome);
        if (choiceResult.outcome == 'dismissed') {
            console.log('User cancelled home screen install');
        } else {
            console.log('User added to home screen');
        }
    });
});

/**
 * Register to service worker.
 */
SWHelper.registerServiceWorker();