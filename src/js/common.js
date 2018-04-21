/**
 * Register to service worker.
 */
SWHelper.registerServiceWorker();

/**
 * Load deferred styles on page load.
 */
let requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
if (requestAnimationFrame) {
	requestAnimationFrame(function () {
		window.setTimeout(loadDeferredStyles, 0);
	});
} else {
	window.addEventListener('load', loadDeferredStyles);
}

/**
 * Fade out pre loader on page load.
 */
window.addEventListener('load', () => {
	fadeOutPreLoader(document.getElementById('preloader'));
	addMouseOverEventToStaticMap(document.getElementById('static-map-img'));
});

/**
 * Load deferred styles
 */
let loadDeferredStyles = function () {
	const addStylesNode = document.getElementById('deferred-styles');
	const replacement = document.createElement('div');
	replacement.innerHTML = addStylesNode.textContent;
	document.body.appendChild(replacement);
	addStylesNode.parentElement.removeChild(addStylesNode);
};

/**
 * Fade out pre loader.
 */
let fadeOutPreLoader = (el) => {
	el.style.opacity = 1;
	(function fade() {
		if ((el.style.opacity -= .05) < 0) {
			el.classList.add('hidden');
			document.getElementById('header').classList.remove('hidden');
			document.getElementById('maincontent').classList.remove('hidden');
			document.getElementById('footer').classList.remove('hidden');
		} else {
			requestAnimationFrame(fade);
		}
	})();
};

/**
 * Add mouse-over event to static map.
 * When user interacts with map image real map will load.
 */
let addMouseOverEventToStaticMap = (el) => {
	el.addEventListener('mouseover', window.initMap);
	el.src = 'https://maps.googleapis.com/maps/api/staticmap?center=40.722216,-73.987501&zoom=12&size=2000x400&key=AIzaSyAqJavehmsKP0mlbTm-5OoG3FmL1MLB9KA';
};

/**
 * Enable user intractable map.
 */
let showMap = () => {
	document.getElementById('map').classList.remove('hidden');
	document.getElementById('static-map-img').classList.add('hidden');
};

window.addEventListener('beforeinstallprompt', function (e) {
	e.userChoice.then(function (choiceResult) {
		if (choiceResult.outcome === 'dismissed') {
			console.error('User cancelled home screen install');
		} else {
			console.log('User added to home screen');
		}
	});
});