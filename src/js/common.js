/**
 * Register to service worker.
 */
SWHelper.registerServiceWorker();


/**
 * Load deferred assets
 */
let loadDeferredAssets = function (nodeId) {
	const noscript = document.getElementById(nodeId);
	const urls = noscript.textContent.split('\n').map(item => item.trim()).filter((val) => val);
	if (nodeId === 'deferred-styles') {
		for (const url of urls) {
			let link = document.createElement('link');
			link.rel = 'stylesheet';
			link.href = url;
			document.head.appendChild(link);
		}
	} else {
		for (const url of urls) {
			let script = document.createElement('script');
			script.async = false;
			script.src = url;
			document.body.appendChild(script);
		}
	}
	noscript.parentElement.removeChild(noscript);
};

/**
 * Load deferred styles on page load.
 */
let requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
if (requestAnimationFrame) {
	requestAnimationFrame(function () {
		window.setTimeout(loadDeferredAssets('deferred-styles'), 0);
	});
} else {
	window.addEventListener('load', loadDeferredAssets('deferred-styles'));
}

/**
 * Page load actions.
 */
window.addEventListener('load', () => {
	fadeOutPreLoader();
	loadDeferredAssets('deferred-scripts');
	// loadDeferredScripts();
	createMapContainer();
});

/**
 * Fade out pre loader.
 */
let fadeOutPreLoader = (el = document.getElementById('preloader')) => {
	el.style.opacity = 1;
	(function fade() {
		if ((el.style.opacity -= .05) < 0) {
			// el.classList.add('hidden');
			document.getElementById('header').classList.remove('hidden');
			document.getElementById('maincontent').classList.remove('hidden');
			document.getElementById('footer').classList.remove('hidden');
			document.body.removeChild(el);
		} else {
			requestAnimationFrame(fade);
		}
	})();
};

/**
 * Create map container and register show-map button click listener.
 */
let createMapContainer = () => {
	const map = document.createElement('div');
	map.className = 'hidden';
	map.id = 'map';

	const mapContainer = document.createElement('div');
	mapContainer.className = 'hidden';
	mapContainer.id = 'map-container';
	mapContainer.setAttribute('role', 'application');
	mapContainer.appendChild(map);

	const mainContent = document.getElementById('maincontent');
	mainContent.appendChild(mapContainer);

	document.getElementById('show-map').addEventListener('click', showHideMap);
};

/**
 * Show or hide map container.
 */
let showHideMap = (event) => {
	event.preventDefault();
	const mapContainer = document.getElementById('map-container');
	if (mapContainer.classList.contains('hidden')) {
		mapContainer.classList.remove('hidden');
		const mapElement = document.getElementById('map');
		if (mapElement.classList.contains('hidden')) {
			mapElement.classList.remove('hidden');
			const mapScript = document.createElement('script');
			mapScript.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyCn77VVsapalDcL4jdN_etwNX1o52r7yl4&libraries=places&callback=initMap';
			document.body.appendChild(mapScript);
		}
	} else {
		mapContainer.classList.add('hidden');
	}
};

window.addEventListener('beforeinstallprompt', function (e) {
	e.userChoice.then(function (choiceResult) {
		if (choiceResult.outcome === 'dismissed') {
			// User cancelled home screen install
		} else {
			// User added to home screen
		}
	});
});