let restaurants;
let map;
var markers = [];

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', () => {
	initializeMaterialComponents();
	updateRestaurants();
});

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
	showMap();
	addMarkersToMap();
};

/**
 * Update page and map for current restaurants.
 */
let updateRestaurants = () => {
	const cuisine = document.getElementById('cuisines-select');
	const neighborhood = document.getElementById('neighborhoods-select');

	DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine.value, neighborhood.value, (error, restaurants) => {
		if (error) { // Got an error!
			console.error(error);
		} else {
			resetRestaurants(restaurants);
			fillRestaurantsHTML();
			initializeFavouriteIcons();
			fillNeighborhoodsHTML();
			fillCuisinesHTML();
			addMarkersToMap();
		}
	});
};

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
let resetRestaurants = (restaurants) => {
	// Remove all restaurants
	self.restaurants = [];
	const ul = document.getElementById('restaurants-list');
	ul.innerHTML = '';

	// Remove all map markers
	self.markers.forEach(m => m.setMap(null));
	self.markers = [];
	self.restaurants = restaurants;
};

/**
 * Create all restaurants HTML and add them to the webpage.
 */
let fillRestaurantsHTML = (restaurants = self.restaurants) => {
	const div = document.getElementById('restaurants-list');
	restaurants.forEach(restaurant => {
		div.append(createRestaurantHTML(restaurant));
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
		webp.type = 'image/webp';
		webp.srcset = DBHelper.webpSrcsetForRestaurant(restaurant);

		const img = document.createElement('source');
		img.type = 'image/jpeg';
		img.srcset = DBHelper.imageSrcsetForRestaurant(restaurant);

		const image = document.createElement('img');
		image.className = 'restaurant-img';
		image.src = imgSrc;
		image.srcset = DBHelper.imageSrcsetForRestaurant(restaurant);
		image.sizes = '100vw';
		image.alt = `Image of restaurant ${restaurant.name}`;

		picture = document.createElement('picture');
		picture.appendChild(webp);
		picture.appendChild(img);
		picture.appendChild(image);
	}

	const mdCardMedia = document.createElement('div');
	mdCardMedia.className = 'mdc-card__media mdc-card__media--square';
	if (picture) {
		mdCardMedia.append(picture);
	}

	const mdCardTitle = document.createElement('h2');
	mdCardTitle.className = 'mdc-card__title mdc-typography--headline4';
	mdCardTitle.innerHTML = restaurant.name;

	const mdCardSubTitle = document.createElement('h5');
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
	favoriteIcon.className = 'mdc-icon-toggle material-icons mdc-card__action mdc-card__action--icon mdc-ripple-upgraded mdc-ripple-upgraded--unbounded';
	favoriteIcon.innerHTML = 'favorite_border';
	favoriteIcon.setAttribute('tabindex', 0);
	favoriteIcon.setAttribute('role', 'button');
	favoriteIcon.setAttribute('aria-pressed', restaurant.is_favorite);
	favoriteIcon.setAttribute('aria-label', 'Add to favorites');
	favoriteIcon.setAttribute('title', 'Add to favorites');
	favoriteIcon.setAttribute('data-toggle-on', '{"content": "favorite", "label": "Remove from favorites"}');
	favoriteIcon.setAttribute('data-toggle-off', '{"content": "favorite_border", "label": "Add to favorites"}');
	favoriteIcon.setAttribute('restaurant-id', restaurant.id);

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
let fillNeighborhoodsHTML = (restaurants = self.restaurants) => {
	// Get all neighborhoods from all restaurants
	const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood);
	// Remove duplicates from neighborhoods
	const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) === i);
	const select = document.getElementById('neighborhoods-select');
	uniqueNeighborhoods.forEach(neighborhood => {
		const id = neighborhood.replace(/ /g, '');
		if (!select.namedItem(id)) {
			const option = document.createElement('option');
			option.innerHTML = neighborhood;
			option.value = neighborhood;
			option.id = id;
			select.append(option);
		}
	});
};

/**
 * Fetch all cuisines and set their HTML.
 */
let fillCuisinesHTML = (restaurants = self.restaurants) => {
	// Get all cuisines from all restaurants
	const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
	// Remove duplicates from cuisines
	const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) === i);
	const select = document.getElementById('cuisines-select');
	uniqueCuisines.forEach(cuisine => {
		const id = cuisine.replace(/ /g, '');
		if (!select.namedItem(id)) {
			const option = document.createElement('option');
			option.innerHTML = cuisine;
			option.value = cuisine;
			option.id = id;
			select.append(option);
		}
	});
};

/**
 * Add markers for current restaurants to the map.
 */
let addMarkersToMap = (restaurants = self.restaurants) => {
	restaurants.forEach(restaurant => {
		// Add marker to the map
		const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
		google.maps.event.addListener(marker, 'click', () => {
			window.location.href = marker.url;
		});
		self.markers.push(marker);
	});
};

/**
 * Initialize favourite icons for each restaurant.
 */
let initializeFavouriteIcons = () => {
	const mdcIcons = Array.prototype.slice.call(document.querySelectorAll('.mdc-icon-toggle'));
	for (const mdcIcon of mdcIcons) {
		MDCIconToggle.attachTo(mdcIcon);
		mdcIcon.addEventListener('MDCIconToggle:change', (event) => {
			const target = event.target || event.srcElement;
			const restaurantId = target.getAttribute('restaurant-id');
			if (target.getAttribute('aria-pressed') === 'true') {
				DBHelper.favoritesRestaurant(restaurantId);
			} else {
				DBHelper.unFavoritesRestaurant(restaurantId);
			}
		});
	}
};

/**
 * Initialize common material components.
 */
let initializeMaterialComponents = () => {
	const mdcSelects = Array.prototype.slice.call(document.querySelectorAll('.mdc-select'));
	for (const mdcSelect of mdcSelects) {
		const select = new MDCSelect(mdcSelect);
		select.listen('change', updateRestaurants);
	}

	const mdcFloatingLabels = Array.prototype.slice.call(document.querySelectorAll('.mdc-floating-label'));
	for (const mdcFloatingLabel of mdcFloatingLabels) {
		new MDCFloatingLabel(mdcFloatingLabel);
	}
};