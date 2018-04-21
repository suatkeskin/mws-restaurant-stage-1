let restaurant;
let map;

/**
 * Fetch restaurant as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', () => {
	fetchRestaurantFromURL();
});

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
	self.map = new google.maps.Map(document.getElementById('map'), {
		zoom: 16,
		center: restaurant.latlng,
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
	DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
};

/**
 * Get current restaurant from page URL.
 */
let fetchRestaurantFromURL = () => {
	if (self.restaurant) { // restaurant already fetched!
		fillBreadcrumb();
		return;
	}
	const id = getParameterByName('id');
	if (id) {
		DBHelper.fetchRestaurants(id, (error, restaurant) => {
			if (!error) {
				self.restaurant = restaurant;
				fillRestaurantHTML();
				fillBreadcrumb();
			}
		});
	}
};

/**
 * Create restaurant HTML and add it to the webpage
 */
let fillRestaurantHTML = (restaurant = self.restaurant) => {
	const name = document.getElementById('restaurant-name');
	name.innerHTML = restaurant.name;

	const address = document.getElementById('restaurant-address');
	address.innerHTML = restaurant.address;

	const webp = document.getElementById('restaurant-img-webp-src');
	webp.type = 'image/webp';
	webp.srcset = DBHelper.webpSrcsetForRestaurant(restaurant);

	const img = document.getElementById('restaurant-img-jpg-src');
	img.type = 'image/jpeg';
	img.srcset = DBHelper.imageSrcsetForRestaurant(restaurant);

	const imgSrc = DBHelper.imageUrlForRestaurant(restaurant);
	if (imgSrc) {
		const image = document.getElementById('restaurant-img');
		image.className = 'restaurant-img';
		image.src = imgSrc;
		image.srcset = DBHelper.imageSrcsetForRestaurant(restaurant);
		image.sizes = '100vw';
		image.alt = `Image of restaurant ${restaurant.name}`;
	} else {
		document.getElementById('restaurant-picture').remove();
	}

	const cuisine = document.getElementById('restaurant-cuisine');
	cuisine.innerHTML = restaurant.cuisine_type;

	// fill operating hours
	if (restaurant.operating_hours) {
		fillRestaurantHoursHTML();
	}
	// fill reviews
	fillReviewsHTML();
};

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
let fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
	const hours = document.getElementById('restaurant-hours');
	for (let key in operatingHours) {
		const times = operatingHours[key].split(',');
		for (let timeKey in times) {
			if (timeKey === '0') {
				addRestaurantHoursHTML(hours, key, times[timeKey]);
			} else {
				addRestaurantHoursHTML(hours, '', times[timeKey]);
			}
		}
	}
};

let addRestaurantHoursHTML = (hours, dayDetail, timeDetail) => {
	const row = document.createElement('tr');
	const day = document.createElement('td');
	day.innerHTML = dayDetail;
	row.appendChild(day);

	const time = document.createElement('td');
	time.innerHTML = timeDetail;
	row.appendChild(time);
	hours.appendChild(row);
};

/**
 * Create all reviews HTML and add them to the webpage.
 */
let fillReviewsHTML = (reviews = self.restaurant.reviews) => {
	const container = document.getElementById('reviews-container');
	const title = document.createElement('h4');
	title.innerHTML = 'Reviews';
	container.appendChild(title);

	if (!reviews) {
		const noReviews = document.createElement('p');
		noReviews.innerHTML = 'No reviews yet!';
		container.appendChild(noReviews);
		return;
	}
	const ul = document.getElementById('reviews-list');
	reviews.forEach(review => {
		ul.appendChild(createReviewHTML(review));
	});
	container.appendChild(ul);
};

/**
 * Create review HTML and add it to the web page.
 */
let createReviewHTML = (review) => {
	const li = document.createElement('li');

	const comments = document.createElement('p');
	comments.innerHTML = review.comments;
	li.appendChild(comments);

	const strong = document.createElement('strong');
	strong.innerHTML = review.name;
	const name = document.createElement('h5');
	name.appendChild(strong);
	li.appendChild(name);

	const date = document.createElement('p');
	date.classList.add('date');
	date.innerHTML = review.date;
	li.appendChild(date);

	const rating = document.createElement('div');
	rating.classList.add('rating');
	rating.classList.add(`rating-${review.rating}`);
	li.appendChild(rating);

	return li;
};

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
let fillBreadcrumb = (restaurant = self.restaurant) => {
	const breadcrumb = document.getElementById('breadcrumb');
	const currentPage = document.createElement('a');
	currentPage.innerHTML = restaurant.name;
	currentPage.href = `restaurant.html?id=${restaurant.id}`;
	currentPage.setAttribute('aria-current', 'page');
	const li = document.createElement('li');
	li.appendChild(currentPage);
	breadcrumb.appendChild(li);
};

/**
 * Get a parameter by name from page URL.
 */
let getParameterByName = (name, url) => {
	if (!url)
		url = window.location.href;
	name = name.replace(/[\[\]]/g, '\\$&');
	const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
		results = regex.exec(url);
	if (!results)
		return null;
	if (!results[2])
		return '';
	return decodeURIComponent(results[2].replace(/\+/g, ' '));
};
