let restaurant;
let map;
let snackbar;
let chipSet;
const satisfactionMap = {1: 'sentiment_very_dissatisfied', 2: 'sentiment_dissatisfied', 3: 'sentiment_satisfied', 4: 'sentiment_satisfied_alt', 5: 'sentiment_very_satisfied'};
const satisfactionTitleMap = {1: 'Not Satisfied', 2: 'Slightly Satisfied', 3: 'Satisfied', 4: 'Very Satisfied', 5: 'Extremely Satisfied'};

/**
 * Fetch restaurant as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', () => {
	initializeMaterialComponents();
	fetchRestaurantFromURL();
	registerAddReviewButtonClickEvent();
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
	const picture = document.getElementById('restaurant-picture');
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

		picture.appendChild(webp);
		picture.appendChild(img);
		picture.appendChild(image);
	} else {
		picture.remove();
	}

	const name = document.getElementById('restaurant-name');
	name.innerHTML = `${restaurant.name} <span class="mdc-card__subtitle mdc-typography--subtitle1"> / ${restaurant.cuisine_type}</span>`;

	const address = document.getElementById('restaurant-address');
	address.innerHTML = restaurant.address;

	const favoriteIcon = document.getElementById('favorite-icon');
	favoriteIcon.setAttribute('aria-pressed', restaurant.is_favorite);
	favoriteIcon.setAttribute('restaurant-id', restaurant.id);
	initializeFavouriteIcons();

	// fill operating hours
	if (restaurant.operating_hours) {
		fillRestaurantHoursHTML();
	}
	// fetch reviews
	fetchReviewsFromURL();
};

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
let fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
	const hours = document.getElementById('restaurant-hours');
	for (let key in operatingHours) {
		if (operatingHours.hasOwnProperty(key)) {
			const times = operatingHours[key].split(',');
			for (let timeKey in times) {
				if (times.hasOwnProperty(timeKey)) {
					if (timeKey === '0') {
						addRestaurantHoursHTML(hours, key, times[timeKey]);
					} else {
						addRestaurantHoursHTML(hours, '', times[timeKey]);
					}
				}
			}
		}
	}
};

let addRestaurantHoursHTML = (hours, dayDetail, timeDetail) => {
	const day = document.createElement('span');
	day.className = 'mdc-list-item__text';
	day.innerHTML = dayDetail;

	const time = document.createElement('span');
	time.className = 'mdc-list-item__meta';
	time.innerHTML = timeDetail;

	const row = document.createElement('li');
	row.className = 'mdc-list-item mdc-ripple-upgraded';
	row.append(day);
	row.append(time);
	hours.append(row);
};

/**
 * Get all reviews by current restaurant id from remote server.
 */
let fetchReviewsFromURL = (restaurant = self.restaurant) => {
	DBHelper.fetchReviews(restaurant.id, (error, reviews) => {
		if (!error) {
			fillReviewsHTML(reviews);
		}
	});
};

/**
 * Create all reviews HTML and add them to the web page.
 */
let fillReviewsHTML = (reviews) => {
	const container = document.getElementById('reviews-container');
	if (!reviews) {
		const noReviews = document.createElement('p');
		noReviews.innerHTML = 'No reviews yet!';
		container.appendChild(noReviews);
		return;
	}

	if (reviews instanceof Array) {
		reviews.forEach(review => {
			const reviewCard = createReviewHTML(review);
			container.append(reviewCard);
		});
	} else {
		const reviewCard = createReviewHTML(reviews);
		container.append(reviewCard);
	}
};

/**
 * Create review HTML and add it to the web page.
 */
let createReviewHTML = (review) => {
	const mdCardTitle = document.createElement('h4');
	mdCardTitle.className = 'mdc-card__title mdc-typography--headline4';
	const updatedAt = getFormattedDate(review.updatedAt);
	mdCardTitle.innerHTML = `${review.name} <span class="mdc-card__subtitle mdc-typography--subtitle1"> / ${updatedAt}</span>`;

	const mdCardPrimary = document.createElement('div');
	mdCardPrimary.className = 'mdc-card__primary';
	mdCardPrimary.append(mdCardTitle);

	const mdCardSecondary = document.createElement('div');
	mdCardSecondary.className = 'mdc-card__secondary mdc-typography--body1';
	mdCardSecondary.innerHTML = review.comments;

	const mdCardPrimaryAction = document.createElement('div');
	mdCardPrimaryAction.className = 'mdc-card__primary-action mdc-ripple-upgraded';
	mdCardPrimaryAction.append(mdCardPrimary);
	mdCardPrimaryAction.append(mdCardSecondary);

	const satisfictionIcon = document.createElement('i');
	satisfictionIcon.className = 'mdc-icon-toggle material-icons mdc-card__action mdc-card__action--icon mdc-ripple-upgraded mdc-ripple-upgraded--unbounded';
	satisfictionIcon.innerHTML = satisfactionMap[review.rating];
	satisfictionIcon.setAttribute('tabindex', 0);
	satisfictionIcon.setAttribute('role', 'button');
	satisfictionIcon.setAttribute('title', satisfactionTitleMap[review.rating]);

	const deleteReviewButton = document.createElement('a');
	deleteReviewButton.className = 'mdc-button mdc-card__action mdc-card__action--button mdc-ripple-upgraded';
	deleteReviewButton.id = 'delete-review-button';
	deleteReviewButton.setAttribute('review-id', review.id);
	deleteReviewButton.innerHTML = 'Delete Review';
	deleteReviewButton.onclick = deleteReview;

	const mdCardActionButtons = document.createElement('div');
	mdCardActionButtons.className = 'mdc-card__action-buttons';
	// mdCardActionButtons.append(editReviewButton);
	mdCardActionButtons.append(deleteReviewButton);

	const mdCardActionIcons = document.createElement('div');
	mdCardActionIcons.className = 'mdc-card__action-icons';
	mdCardActionIcons.append(satisfictionIcon);

	const mdCardActions = document.createElement('div');
	mdCardActions.className = 'mdc-card__actions';
	mdCardActions.append(mdCardActionButtons);
	mdCardActions.append(mdCardActionIcons);

	const mdCard = document.createElement('div');
	mdCard.className = 'mdc-card';
	mdCard.append(mdCardPrimaryAction);
	mdCard.append(mdCardActions);
	return mdCard;
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

let getFormattedDate = (longTime) => {
	const d = new Date(longTime);
	return [(d.getMonth() + 1).padLeft(), d.getDate().padLeft(), d.getFullYear()].join('.') + ' ' + [d.getHours().padLeft(), d.getMinutes().padLeft(), d.getSeconds().padLeft()].join(':');
};

/**
 * Initialize favourite icons for each restaurant.
 */
let initializeFavouriteIcons = () => {
	const mdcIcons = Array.prototype.slice.call(document.querySelectorAll('.mdc-favorite-icons'));
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
 * Register click event ro add-review-button.
 */
let registerAddReviewButtonClickEvent = () => {
	const addReviewButton = document.getElementById('add-review-button');
	addReviewButton.onclick = addReview;
};

/**
 * Register click event ro add-review-button.
 */
let addReview = () => {
	const nameInput = document.getElementById('name');
	if (!nameInput || !nameInput.value) {
		showSnackMessage('Please type your name.');
		return;
	}
	const commentTextArea = document.getElementById('comment');
	if (!commentTextArea || !commentTextArea.value) {
		showSnackMessage('Please type your review.');
		return;
	}
	const mdcChip = document.querySelector('#satisfaction-chips > .mdc-chip--selected');
	if (!mdcChip) {
		showSnackMessage('Please select a rating.');
		return;
	}

	const restaurantId = self.restaurant.id;
	const name = nameInput.value;
	const comment = commentTextArea.value;
	const rating = mdcChip.getAttribute('rating');

	const review = {restaurant_id: restaurantId, name: name, rating: rating, comments: comment};
	DBHelper.addReview(restaurantId, review, (error, reviews) => {
		if (!error) {
			fillReviewsHTML(reviews);
			clearReviewForm();
			scrollToLastReview();
			showSnackMessage('Thanks for your review.');
		} else {
			showSnackMessage(error);
		}
	});
};

/**
 * Delete review action.
 */
let deleteReview = (event) => {
	const target = event.target || event.srcElement;
	const reviewId = target.getAttribute('review-id');
	DBHelper.deleteReview(reviewId, (error) => {
		if (!error) {
			const container = document.getElementById('reviews-container');
			const review = target.parentElement.parentElement.parentElement;
			container.removeChild(review);
			showSnackMessage('Review deleted!');
		} else {
			showSnackMessage(error);
		}
	});
};

/**
 * Scroll to review form.
 */
let scrollToReviewForm = () => {
	document.getElementById('add-review-container').scrollIntoView({behavior: 'smooth'});
};

/**
 * Scroll to lastly added review.
 */
let scrollToLastReview = () => {
	document.querySelector('#reviews-container .mdc-card:last-child').scrollIntoView({behavior: 'smooth'});
};

/**
 * Clear review form.
 */
let clearReviewForm = () => {
	document.getElementById('add-review-form').reset();
	chipSet.foundation_.deselectAll_();
};

/**
 * Initialize common material components.
 */
let initializeMaterialComponents = () => {
	const addReviewButton = document.getElementById('add-review');
	addReviewButton.onclick = scrollToReviewForm;
	new MDCRipple(addReviewButton);

	new MDCTextField(document.getElementById('name-text-field'));
	new MDCTextField(document.getElementById('review-textarea'));
	chipSet = new MDCChipSet(document.getElementById('satisfaction-chips'));

	snackbar = new MDCSnackbar(document.querySelector('.mdc-snackbar'));
};

/**
 * Show message to user on screen
 */
let showSnackMessage = (message) => {
	snackbar.show({message: message});
};

/**
 * Position add review button according to scroll position.
 */
window.onscroll = function () {
	if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 80) {
		document.getElementById('add-review').style.bottom = '100px';
	} else {
		document.getElementById('add-review').style.bottom = '10px';
	}
};

/**
 * Add padLeft prototype to Number.
 */
Number.prototype.padLeft = function (base, chr) {
	const len = (String(base || 10).length - String(this).length) + 1;
	return len > 0 ? new Array(len).join(chr || '0') + this : this;
};