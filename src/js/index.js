let restaurants;
let map;
var markers = [];
let lazyImageObserver;

/**
 * Lazy image lod observer.
 */
if ('IntersectionObserver' in window) {
	lazyImageObserver = new IntersectionObserver(function (entries) {
		entries.forEach(function (entry) {
			if (entry.isIntersecting) {
				let lazyImage = entry.target;
				if (lazyImage.nodeName !== 'SOURCE') {
					lazyImage.src = lazyImage.dataset.src;
				}
				lazyImage.srcset = lazyImage.dataset.srcset;
				lazyImage.classList.remove('lazy');
				lazyImageObserver.unobserve(lazyImage);
			}
		});
	});
} else {
	// Possibly fall back to a more compatible method here
}

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
	let loc = {
		lat: 40.722216,
		lng: -73.987501
	};
	self.map = new google.maps.Map(document.getElementById('map'), {
		zoom: 12,
		center: loc,
		scrollwheel: false
	});
	google.maps.event.addListener(self.map, 'tilesloaded', function () {
		document.querySelectorAll('#map iframe').forEach(function (item) {
			item.setAttribute('title', 'Google Maps');
		});
		document.querySelectorAll('#map *').forEach(function (item) {
			item.setAttribute('tabindex', '-1');
		});
		document.querySelectorAll('#map [rel="noopener"]').forEach(function (item) {
			item.removeAttribute('rel');
		});
	});
	addMarkersToMap();
};

/**
 * Update page and map for current restaurants.
 */
let updateRestaurants = (restaurantsList, neighborhoodsSelect, cuisinesSelect, callback) => {
	DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisinesSelect.value, neighborhoodsSelect.value, (error, restaurants) => {
		if (!error) {
			resetRestaurants(restaurantsList, restaurants);
			fillRestaurantsHTML(restaurantsList);
			fillNeighborhoodsHTML(neighborhoodsSelect, restaurants);
			fillCuisinesHTML(cuisinesSelect, restaurants);
			callback();
		}
	});
};

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
let resetRestaurants = (restaurantsList, restaurants) => {
	// Remove all restaurants
	self.restaurants = [];
	restaurantsList.innerHTML = '';
	// Remove all map markers
	self.markers.forEach(m => m.setMap(null));
	self.markers = [];
	self.restaurants = restaurants;
};

/**
 * Create all restaurants HTML and add them to the web page.
 */
let fillRestaurantsHTML = (restaurantsList, restaurants = self.restaurants) => {
	restaurants.forEach(restaurant => {
		restaurantsList.append(createRestaurantHTML(restaurant));
	});
};

/**
 * Create restaurant HTML.
 */
let createRestaurantHTML = (restaurant) => {
	let picture = undefined;
	const imgSrc = DBHelper.imageUrlForRestaurant(restaurant);
	if (imgSrc) {
		const webp = document.createElement('source');
		webp.className = 'lazy-image';
		webp.type = 'image/webp';
		webp.srcset = '';
		webp.setAttribute('data-srcset', DBHelper.webpSrcsetForRestaurant(restaurant));

		const img = document.createElement('source');
		img.className = 'lazy-image';
		img.type = 'image/jpeg';
		img.srcset = '';
		img.setAttribute('data-srcset', DBHelper.imageSrcsetForRestaurant(restaurant));

		const image = document.createElement('img');
		image.className = 'restaurant-img lazy-image';
		image.setAttribute('data-src', imgSrc);
		image.setAttribute('data-srcset', DBHelper.imageSrcsetForRestaurant(restaurant));
		image.sizes = '100vw';
		image.alt = `Image of restaurant ${restaurant.name}`;

		picture = document.createElement('picture');
		picture.appendChild(webp);
		picture.appendChild(img);
		picture.appendChild(image);

		if (lazyImageObserver) {
			lazyImageObserver.observe(webp);
			lazyImageObserver.observe(img);
			lazyImageObserver.observe(image);
		}
	}

	const mdCardMedia = document.createElement('div');
	mdCardMedia.className = 'mdc-card__media mdc-card__media--square';
	if (picture) {
		mdCardMedia.append(picture);
	}

	const mdCardTitle = document.createElement('h4');
	mdCardTitle.className = 'mdc-card__title mdc-typography--headline4';
	mdCardTitle.innerHTML = restaurant.name;

	const mdCardSubTitle = document.createElement('h4');
	mdCardSubTitle.className = 'mdc-card__subtitle mdc-typography--subtitle1';
	mdCardSubTitle.innerHTML = restaurant.neighborhood;

	const mdCardPrimary = document.createElement('div');
	mdCardPrimary.className = 'mdc-card__primary';
	mdCardPrimary.append(mdCardTitle);
	mdCardPrimary.append(mdCardSubTitle);

	const mdCardSecondary = document.createElement('div');
	mdCardSecondary.className = 'mdc-card__secondary mdc-typography--body1';
	mdCardSecondary.innerHTML = restaurant.address;

	const mdCardPrimaryAction = document.createElement('div');
	mdCardPrimaryAction.className = 'mdc-card__primary-action mdc-ripple-upgraded';
	mdCardPrimaryAction.append(mdCardMedia);
	mdCardPrimaryAction.append(mdCardPrimary);
	mdCardPrimaryAction.append(mdCardSecondary);

	const mdCardActionButtons = document.createElement('div');
	mdCardActionButtons.className = 'mdc-card__action-buttons';

	const viewDetailsButton = document.createElement('a');
	viewDetailsButton.className = 'mdc-button mdc-card__action mdc-card__action--button mdc-ripple-upgraded';
	viewDetailsButton.innerHTML = 'View Details';
	viewDetailsButton.href = DBHelper.urlForRestaurant(restaurant);
	mdCardActionButtons.append(viewDetailsButton);

	const favoriteIcon = document.createElement('i');
	favoriteIcon.className = 'mdc-favorite-icons mdc-icon-toggle material-icons mdc-card__action mdc-card__action--icon mdc-ripple-upgraded mdc-ripple-upgraded--unbounded';
	favoriteIcon.innerHTML = 'favorite_border';
	favoriteIcon.setAttribute('tabindex', 0);
	favoriteIcon.setAttribute('role', 'button');
	favoriteIcon.setAttribute('aria-pressed', restaurant.is_favorite);
	favoriteIcon.setAttribute('aria-label', 'Add to favorites');
	favoriteIcon.setAttribute('title', 'Add to favorites');
	favoriteIcon.setAttribute('data-toggle-on', '{"content": "favorite", "label": "Remove from favorites"}');
	favoriteIcon.setAttribute('data-toggle-off', '{"content": "favorite_border", "label": "Add to favorites"}');
	favoriteIcon.setAttribute('restaurant-id', restaurant.id);

	MDCIconToggle.attachTo(favoriteIcon);
	favoriteIcon.addEventListener('MDCIconToggle:change', (event) => {
		const target = event.target || event.srcElement;
		const restaurantId = target.getAttribute('restaurant-id');
		if (target.getAttribute('aria-pressed') === 'true') {
			DBHelper.favoritesRestaurant(restaurantId);
		} else {
			DBHelper.unFavoritesRestaurant(restaurantId);
		}
	});

	const mdCardActionIcons = document.createElement('div');
	mdCardActionIcons.className = 'mdc-card__action-icons';
	mdCardActionIcons.append(favoriteIcon);

	const mdCardActions = document.createElement('div');
	mdCardActions.className = 'mdc-card__actions';
	mdCardActions.append(mdCardActionButtons);
	mdCardActions.append(mdCardActionIcons);

	const mdCard = document.createElement('div');
	mdCard.className = 'mdc-card mdc-layout-grid__cell mdc-layout-grid__cell--span-4';
	mdCard.append(mdCardPrimaryAction);
	mdCard.append(mdCardActions);

	return mdCard;
};

/**
 * Set neighborhoods HTML.
 */
let fillNeighborhoodsHTML = (neighborhoodsSelect = document.getElementById('neighborhoods-select'), restaurants = self.restaurants) => {
	// Get all neighborhoods from all restaurants
	const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood);
	// Remove duplicates from neighborhoods
	const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) === i);
	uniqueNeighborhoods.forEach(neighborhood => {
		const id = neighborhood.replace(/ /g, '');
		if (!neighborhoodsSelect.namedItem(id)) {
			const option = document.createElement('option');
			option.innerHTML = neighborhood;
			option.value = neighborhood;
			option.id = id;
			neighborhoodsSelect.append(option);
		}
	});
};

/**
 * Fetch all cuisines and set their HTML.
 */
let fillCuisinesHTML = (cuisinesSelect = document.getElementById('cuisines-select'), restaurants = self.restaurants) => {
	// Get all cuisines from all restaurants
	const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
	// Remove duplicates from cuisines
	const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) === i);
	uniqueCuisines.forEach(cuisine => {
		const id = cuisine.replace(/ /g, '');
		if (!cuisinesSelect.namedItem(id)) {
			const option = document.createElement('option');
			option.innerHTML = cuisine;
			option.value = cuisine;
			option.id = id;
			cuisinesSelect.append(option);
		}
	});
};

/**
 * Add markers for current restaurants to the map.
 */
let addMarkersToMap = () => {
	const mapElement = document.getElementById('map');
	if (mapElement.classList.contains('hidden')) {
		return;
	}

	self.restaurants.forEach(restaurant => {
		// Add marker to the map
		const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
		google.maps.event.addListener(marker, 'click', () => {
			window.location.href = marker.url;
		});
		self.markers.push(marker);
	});
};

/**
 * Initialize filter container and update restaurants.
 */
(function () {
	const neighborhoodsSelect = document.createElement('select');
	neighborhoodsSelect.className = 'mdc-select__native-control';
	neighborhoodsSelect.id = 'neighborhoods-select';
	neighborhoodsSelect.innerHTML = `<option value="All Neighborhoods" selected>All Neighborhoods</option>`;
	neighborhoodsSelect.setAttribute('aria-labelledby', 'neighborhood-label');

	const neighborhoodsSelectLabel = document.createElement('label');
	neighborhoodsSelectLabel.className = 'mdc-floating-label';
	neighborhoodsSelectLabel.id = 'neighborhood-label';
	neighborhoodsSelectLabel.innerHTML = 'Choose a neighborhood';

	const neighborhoodsSelectRipple = document.createElement('div');
	neighborhoodsSelectRipple.className = 'mdc-line-ripple';

	const neighborhoodsSelectBox = document.createElement('div');
	neighborhoodsSelectBox.className = 'mdc-select mdc-select--box mdc-ripple-upgraded';
	neighborhoodsSelectBox.appendChild(neighborhoodsSelect);
	neighborhoodsSelectBox.appendChild(neighborhoodsSelectLabel);
	neighborhoodsSelectBox.appendChild(neighborhoodsSelectRipple);

	const filterLayoutNeighborhoodsCell = document.createElement('div');
	filterLayoutNeighborhoodsCell.className = 'mdc-layout-grid__cell mdc-layout-grid__cell--span-3';
	filterLayoutNeighborhoodsCell.appendChild(neighborhoodsSelectBox);

	const cuisinesSelect = document.createElement('select');
	cuisinesSelect.className = 'mdc-select__native-control';
	cuisinesSelect.id = 'cuisines-select';
	cuisinesSelect.innerHTML = `<option value="All Cuisines" selected>All Cuisines</option>`;
	cuisinesSelect.setAttribute('aria-labelledby', 'cuisines-label');

	const cuisinesSelectLabel = document.createElement('label');
	cuisinesSelectLabel.className = 'mdc-floating-label';
	cuisinesSelectLabel.id = 'cuisine-label';
	cuisinesSelectLabel.innerHTML = 'Choose a neighborhood';

	const cuisinesSelectRipple = document.createElement('div');
	cuisinesSelectRipple.className = 'mdc-line-ripple';

	const cuisinesSelectBox = document.createElement('div');
	cuisinesSelectBox.className = 'mdc-select mdc-select--box mdc-ripple-upgraded';
	cuisinesSelectBox.appendChild(cuisinesSelect);
	cuisinesSelectBox.appendChild(cuisinesSelectLabel);
	cuisinesSelectBox.appendChild(cuisinesSelectRipple);

	const filterLayoutCuisinesCell = document.createElement('div');
	filterLayoutCuisinesCell.className = 'mdc-layout-grid__cell mdc-layout-grid__cell--span-3';
	filterLayoutCuisinesCell.appendChild(cuisinesSelectBox);

	const filterTittle = document.createElement('h2');
	filterTittle.className = 'mdc-typography--headline5';
	filterTittle.innerHTML = 'Filter Results';

	const filterLayoutCell = document.createElement('div');
	filterLayoutCell.className = 'mdc-layout-grid__cell mdc-layout-grid__cell--span-4';
	filterLayoutCell.appendChild(filterTittle);

	const filterLayout = document.createElement('div');
	filterLayout.className = 'mdc-layout-grid__inner';
	filterLayout.appendChild(filterLayoutCell);
	filterLayout.appendChild(filterLayoutNeighborhoodsCell);
	filterLayout.appendChild(filterLayoutCuisinesCell);

	const filterContainer = document.createElement('div');
	filterContainer.className = 'mdc-layout-grid filter-container';
	filterContainer.id = 'filters';
	filterContainer.setAttribute('tabindex', -1);
	filterContainer.appendChild(filterLayout);

	new MDCFloatingLabel(neighborhoodsSelectLabel);
	new MDCFloatingLabel(cuisinesSelectLabel);
	const mdcNeighborhoodsSelectBox = new MDCSelect(neighborhoodsSelectBox);
	mdcNeighborhoodsSelectBox.listen('change', updateRestaurants);
	const mdcCuisinesSelectBox = new MDCSelect(cuisinesSelectBox);
	mdcCuisinesSelectBox.listen('change', updateRestaurants);

	const restaurantsList = document.createElement('div');
	restaurantsList.className = 'mdc-layout-grid__inner';
	restaurantsList.id = 'restaurants-list';

	const restaurantListContainer = document.createElement('div');
	restaurantListContainer.className = 'restaurants-list-container mdc-layout-grid';
	restaurantListContainer.appendChild(restaurantsList);

	const restaurantContainer = document.createElement('div');
	restaurantContainer.id = 'restaurant-container';
	restaurantContainer.appendChild(restaurantListContainer);

	updateRestaurants(restaurantsList, neighborhoodsSelect, cuisinesSelect, function () {
		const mainContent = document.getElementById('maincontent');
		mainContent.removeChild(document.getElementById('progressbar'));
		mainContent.appendChild(filterContainer);
		mainContent.appendChild(restaurantContainer);
	});
})();