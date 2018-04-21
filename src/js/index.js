let restaurants, neighborhoods, cuisines;
let map;
var markers = [];

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', () => {
	fetchNeighborhoods();
	fetchCuisines();
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
let fetchNeighborhoods = () => {
	DBHelper.fetchNeighborhoods((error, neighborhoods) => {
		if (error) { // Got an error
			console.error(error);
		} else {
			self.neighborhoods = neighborhoods;
			fillNeighborhoodsHTML();
			var neighborhood = document.getElementById('neighborhood');
			var neighborhoodListBox = document.querySelector('.neighborhood-listbox');
			new ComboBox(neighborhood, neighborhoodListBox);
		}
	});
};

/**
 * Set neighborhoods HTML.
 */
let fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
	const ul = document.getElementById('neighborhoods-select');
	neighborhoods.forEach(neighborhood => {
		const li = document.createElement('li');
		li.innerHTML = neighborhood;
		li.value = neighborhood;
		li.setAttribute("role", "option");
		ul.append(li);
	});
};

/**
 * Fetch all cuisines and set their HTML.
 */
let fetchCuisines = () => {
	DBHelper.fetchCuisines((error, cuisines) => {
		if (error) { // Got an error!
			console.error(error);
		} else {
			self.cuisines = cuisines;
			fillCuisinesHTML();
			var cuisine = document.getElementById('cuisine');
			var cuisineListBox = document.getElementById('cuisine-listbox');
			new ComboBox(cuisine, cuisineListBox);
		}
	});
};

/**
 * Set cuisines HTML.
 */
let fillCuisinesHTML = (cuisines = self.cuisines) => {
	const ul = document.getElementById('cuisines-select');
	cuisines.forEach(cuisine => {
		const li = document.createElement('li');
		li.innerHTML = cuisine;
		li.value = cuisine;
		li.setAttribute('role', 'option');
		ul.append(li);
	});
};

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
	updateRestaurants();
};

/**
 * Update page and map for current restaurants.
 */
let updateRestaurants = () => {
	const cuisine = document.getElementById('cuisine');
	const neighborhood = document.getElementById('neighborhood');

	DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine.value, neighborhood.value, (error, restaurants) => {
		if (error) { // Got an error!
			console.error(error);
		} else {
			resetRestaurants(restaurants);
			fillRestaurantsHTML();
		}
	})
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
	const ul = document.getElementById('restaurants-list');
	restaurants.forEach(restaurant => {
		ul.append(createRestaurantHTML(restaurant));
	});
	addMarkersToMap();
};

/**
 * Create restaurant HTML.
 */
let createRestaurantHTML = (restaurant) => {
	const li = document.createElement('li');

	const imgSrc = DBHelper.imageUrlForRestaurant(restaurant);
	if (imgSrc) {
		const picture = document.createElement('picture');

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

		picture.appendChild(webp);
		picture.appendChild(img);
		picture.appendChild(image);
		li.append(picture);
	}

	const name = document.createElement('h3');
	name.innerHTML = restaurant.name;
	li.append(name);

	const neighborhood = document.createElement('p');
	neighborhood.innerHTML = restaurant.neighborhood;
	li.append(neighborhood);

	const address = document.createElement('p');
	address.innerHTML = restaurant.address;
	li.append(address);

	const more = document.createElement('a');
	more.innerHTML = 'View Details';
	more.href = DBHelper.urlForRestaurant(restaurant);
	li.append(more);

	return li;
};

/**
 * Add markers for current restaurants to the map.
 */
let addMarkersToMap = (restaurants = self.restaurants) => {
	restaurants.forEach(restaurant => {
		// Add marker to the map
		const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
		google.maps.event.addListener(marker, 'click', () => {
			window.location.href = marker.url
		});
		self.markers.push(marker);
	});
};