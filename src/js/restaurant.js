let restaurant;
let map;
let snackbar;
let chipSet;
const satisfactionMap = {1: 'sentiment_very_dissatisfied', 2: 'sentiment_dissatisfied', 3: 'sentiment_satisfied', 4: 'sentiment_satisfied_alt', 5: 'sentiment_very_satisfied'};
const satisfactionTitleMap = {1: 'Not Satisfied', 2: 'Slightly Satisfied', 3: 'Satisfied', 4: 'Very Satisfied', 5: 'Extremely Satisfied'};

let lazyReviewObserver;

/**
 * Lazy review lod observer.
 */
if ('IntersectionObserver' in window) {
	lazyReviewObserver = new IntersectionObserver(function (entries) {
		entries.forEach(function (entry) {
			if (entry.isIntersecting) {
				fetchReviewsFromURL();
				lazyReviewObserver.unobserve(entry.target);
			}
		});
	});
}

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
	DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
};

/**
 * Get current restaurant from page URL.
 */
let fetchRestaurantFromURL = (callback) => {
	if (self.restaurant) { // restaurant already fetched!
		fillBreadcrumb();
		callback();
		return;
	}
	const id = getParameterByName('id');
	if (id) {
		DBHelper.fetchRestaurants(id, (error, restaurant) => {
			if (!error) {
				self.restaurant = restaurant;
				fillBreadcrumb();
				fillRestaurantHTML();
			}
		});
	}
	callback();
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
	initializeFavouriteIcon(favoriteIcon);

	// fill operating hours
	if (restaurant.operating_hours) {
		fillRestaurantHoursHTML();
	}
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
	row.className = 'mdc-list-item';
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
	mdCardPrimaryAction.className = 'mdc-card__primary-action';
	mdCardPrimaryAction.append(mdCardPrimary);
	mdCardPrimaryAction.append(mdCardSecondary);

	const satisfictionIcon = document.createElement('i');
	satisfictionIcon.className = 'mdc-icon-toggle material-icons mdc-card__action mdc-card__action--icon--unbounded';
	satisfictionIcon.innerHTML = satisfactionMap[review.rating];
	satisfictionIcon.setAttribute('tabindex', 0);
	satisfictionIcon.setAttribute('role', 'button');
	satisfictionIcon.setAttribute('title', satisfactionTitleMap[review.rating]);

	const deleteReviewButton = document.createElement('a');
	deleteReviewButton.className = 'mdc-button mdc-card__action mdc-card__action--button';
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
 * Initialize favourite icon.
 */
let initializeFavouriteIcon = (favouriteIcon) => {
	MDCIconToggle.attachTo(favouriteIcon);
	favouriteIcon.addEventListener('MDCIconToggle:change', (event) => {
		const target = event.target || event.srcElement;
		const restaurantId = target.getAttribute('restaurant-id');
		if (target.getAttribute('aria-pressed') === 'true') {
			DBHelper.favoritesRestaurant(restaurantId);
		} else {
			DBHelper.unFavoritesRestaurant(restaurantId);
		}
	});
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
		if (error) {
			showSnackMessage(error);
		} else {
			const container = document.getElementById('reviews-container');
			const review = target.parentElement.parentElement.parentElement;
			container.removeChild(review);
			showSnackMessage('Review deleted!');
			scrollToLastReview();
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
 * Show message to user on screen
 */
let showSnackMessage = (message) => {
	snackbar.show({message: message});
};

/**
 * Position add review button according to scroll position.
 */
window.onscroll = function () {
	const addReview = document.getElementById('add-review');
	if (addReview) {
		if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 80) {
			addReview.style.bottom = '100px';
		} else {
			addReview.style.bottom = '10px';
		}
	}
};

/**
 * Add padLeft prototype to Number.
 */
Number.prototype.padLeft = function (base, chr) {
	const len = (String(base || 10).length - String(this).length) + 1;
	return len > 0 ? new Array(len).join(chr || '0') + this : this;
};


/**
 * Initialize breadcrumb container.
 */
let initializeBreadcrumbContainer = () => {
	const homeLink = document.createElement('a');
	homeLink.href = '/';
	homeLink.innerHTML = 'Home';

	const listItem = document.createElement('li');
	listItem.appendChild(homeLink);

	const orderedList = document.createElement('ol');
	orderedList.id = 'breadcrumb';
	orderedList.appendChild(listItem);

	const nav = document.createElement('nav');
	nav.id = 'breadcrumb-container';
	nav.setAttribute('aria-label', 'Breadcrumb');
	nav.appendChild(orderedList);
	return nav;
};

/**
 * Initialize restaurant container.
 */
let initializeRestaurantContainer = () => {
	const restaurantPicture = document.createElement('picture');
	restaurantPicture.id = 'restaurant-picture';

	const cardMedia = document.createElement('div');
	cardMedia.className = 'mdc-card__media mdc-card__media--square';
	cardMedia.appendChild(restaurantPicture);

	const cardTitle = document.createElement('h2');
	cardTitle.className = 'mdc-card__title mdc-typography--headline2';
	cardTitle.id = 'restaurant-name';

	const cardPrimary = document.createElement('div');
	cardPrimary.className = 'mdc-card__primary';
	cardPrimary.appendChild(cardTitle);

	const restaurantAddress = document.createElement('p');
	restaurantAddress.id = 'restaurant-address';

	const restaurantHours = document.createElement('ul');
	restaurantHours.className = 'mdc-list demo-list';
	restaurantHours.id = 'restaurant-hours';

	const cardSecondary = document.createElement('div');
	cardSecondary.className = 'mdc-card__secondary mdc-typography--body1';
	cardSecondary.appendChild(restaurantAddress);
	cardSecondary.appendChild(restaurantHours);

	const primaryAction = document.createElement('div');
	primaryAction.className = 'mdc-card__primary-action';
	primaryAction.appendChild(cardMedia);
	primaryAction.appendChild(cardPrimary);
	primaryAction.appendChild(cardSecondary);

	const favoriteIcon = document.createElement('i');
	favoriteIcon.className = 'mdc-favorite-icons mdc-icon-toggle material-icons mdc-card__action mdc-card__action--icon--unbounded';
	favoriteIcon.id = 'favorite-icon';
	favoriteIcon.innerText = 'favorite_border';
	favoriteIcon.setAttribute('tabindex', '0');
	favoriteIcon.setAttribute('role', 'button');
	favoriteIcon.setAttribute('aria-label', 'Add to favorites');
	favoriteIcon.setAttribute('title', 'Add to favorites');
	favoriteIcon.setAttribute('data-toggle-on', '{"content": "favorite", "label": "Remove from favorites"}');
	favoriteIcon.setAttribute('data-toggle-off', '{"content": "favorite_border", "label": "Add to favorites"}');

	const actionIcons = document.createElement('div');
	actionIcons.className = 'mdc-card__action-icons';
	actionIcons.appendChild(favoriteIcon);

	const cardActions = document.createElement('div');
	cardActions.className = 'mdc-card__actions';
	cardActions.appendChild(actionIcons);

	const card = document.createElement('div');
	card.className = 'mdc-card';
	card.appendChild(primaryAction);
	card.appendChild(cardActions);

	const restaurantContainer = document.createElement('div');
	restaurantContainer.id = 'restaurant-container';
	restaurantContainer.appendChild(card);

	return restaurantContainer;
};

/**
 * Initialize top app bar icons.
 */
let initializeTopAppBarIcons = () => {
	const navigationIcon = document.createElement('a');
	navigationIcon.className = 'material-icons mdc-top-app-bar__navigation-icon';
	navigationIcon.setAttribute('tabindex', '-1');
	navigationIcon.innerHTML = 'rate_review';
	navigationIcon.href = '/';
	const startSection = document.getElementById('mdc-top-app-bar-start-section');
	startSection.insertBefore(navigationIcon, startSection.childNodes[0]);

	const actionIcon = document.createElement('a');
	actionIcon.className = 'material-icons mdc-top-app-bar__action-item';
	actionIcon.id = 'show-map';
	actionIcon.setAttribute('aria-label', 'Show Map');
	actionIcon.setAttribute('alt', 'Show Map');
	actionIcon.innerHTML = 'map';
	actionIcon.href = 'javascript:void(0)';
	actionIcon.click = showHideMap;
	const endSection = document.getElementById('mdc-top-app-bar-end-section');
	endSection.appendChild(actionIcon);
};

/**
 * Initialize review container.
 */
let initializeReviewContainer = () => {
	const tittle = document.createElement('p');
	tittle.className = 'mdc-typography--headline2';
	tittle.innerHTML = 'Reviews';

	const reviewsContainer = document.createElement('div');
	reviewsContainer.id = 'reviews-container';
	reviewsContainer.appendChild(tittle);
	return reviewsContainer;
};

/**
 * Initialize chip.
 */
let initializeChip = (rating) => {
	const chipIcon = document.createElement('i');
	chipIcon.className = 'material-icons mdc-chip__icon mdc-chip__icon--leading';
	chipIcon.innerHTML = satisfactionMap[rating];

	const checkMarkSvgPath = document.createElement('path');
	checkMarkSvgPath.className = 'mdc-chip__checkmark-path';
	checkMarkSvgPath.setAttribute('fill', 'none');
	checkMarkSvgPath.setAttribute('stroke', 'black');
	checkMarkSvgPath.setAttribute('d', 'M1.73,12.91 8.1,19.28 22.79,4.59');

	const checkMarkSvg = document.createElement('svg');
	checkMarkSvg.className = 'mdc-chip__checkmark-svg';
	checkMarkSvg.setAttribute('viewBox', '-2 -3 30 30');
	checkMarkSvg.appendChild(checkMarkSvgPath);

	const chipCheckMark = document.createElement('div');
	chipCheckMark.className = 'mdc-chip__checkmark';
	chipCheckMark.appendChild(checkMarkSvg);

	const chipText = document.createElement('div');
	chipText.className = 'mdc-chip__text';
	chipText.innerHTML = satisfactionTitleMap[rating];

	const chip = document.createElement('div');
	chip.className = 'mdc-chip';
	chip.setAttribute('rating', rating);
	chip.appendChild(chipIcon);
	chip.appendChild(chipCheckMark);
	chip.appendChild(chipText);
	return chip;
};

/**
 * Initialize add review container.
 */
let initializeAddReviewContainer = () => {
	const cardPrimaryTittle = document.createElement('p');
	cardPrimaryTittle.className = 'mdc-card__title mdc-typography--headline4';
	cardPrimaryTittle.innerHTML = 'Rate and review';

	const cardPrimary = document.createElement('div');
	cardPrimary.className = 'mdc-card__primary';
	cardPrimary.appendChild(cardPrimaryTittle);

	const nameInput = document.createElement('input');
	nameInput.className = 'mdc-text-field__input';
	nameInput.id = 'name';
	nameInput.type = 'text';
	nameInput.setAttribute('aria-label', 'name-label');

	const nameLabel = document.createElement('label');
	nameLabel.className = 'mdc-floating-label';
	nameLabel.id = 'name-label';
	nameLabel.for = 'name';
	nameLabel.innerHTML = 'Your Name';

	const notchedOutlineSvgPath = document.createElement('path');
	notchedOutlineSvgPath.className = 'mdc-notched-outline__path';

	const notchedOutlineSvg = document.createElement('svg');
	notchedOutlineSvg.appendChild(notchedOutlineSvgPath);

	const notchedOutline = document.createElement('div');
	notchedOutline.className = 'mdc-notched-outline';
	notchedOutline.appendChild(notchedOutlineSvg);

	const notchedOutlineIdle = document.createElement('div');
	notchedOutlineIdle.className = 'mdc-notched-outline__idle';

	const textContainer = document.createElement('div');
	textContainer.className = 'mdc-text-field mdc-text-field--outlined';
	textContainer.id = 'name-text-field';
	textContainer.appendChild(nameInput);
	textContainer.appendChild(nameLabel);
	textContainer.appendChild(notchedOutline);
	textContainer.appendChild(notchedOutlineIdle);

	const textArea = document.createElement('textarea');
	textArea.className = 'mdc-text-field__input';
	textArea.id = 'comment';
	textArea.rows = 8;
	textArea.cols = 40;
	textArea.setAttribute('aria-label', 'review-label');

	const reviewLabel = document.createElement('label');
	reviewLabel.className = 'mdc-floating-label';
	reviewLabel.id = 'review-label';
	reviewLabel.for = 'comment';
	reviewLabel.innerHTML = 'Write a review';

	const textAreaContainer = document.createElement('div');
	textAreaContainer.className = 'mdc-text-field mdc-text-field--textarea';
	textAreaContainer.id = 'review-textarea';
	textAreaContainer.appendChild(textArea);
	textAreaContainer.appendChild(reviewLabel);

	const chipSet = document.createElement('div');
	chipSet.className = 'mdc-chip-set mdc-chip-set--choice';
	chipSet.id = 'satisfaction-chips';

	for (let i = 1; i <= 5; i++) {
		const chip = initializeChip(i);
		chipSet.appendChild(chip);
	}

	const reviewForm = document.createElement('form');
	reviewForm.id = 'add-review-form';
	reviewForm.appendChild(textContainer);
	reviewForm.appendChild(textAreaContainer);
	reviewForm.appendChild(chipSet);
	new MDCTextField(textContainer); // TODO outline does not appears!
	new MDCTextField(textAreaContainer);
	self.chipSet = new MDCChipSet(chipSet); // TODO check mark does not appears!

	const cardSecondary = document.createElement('div');
	cardSecondary.className = 'mdc-card__secondary mdc-typography--body1';
	cardSecondary.appendChild(reviewForm);

	const cardPrimaryAction = document.createElement('div');
	cardPrimaryAction.className = 'mdc-card__primary-action';
	cardPrimaryAction.appendChild(cardPrimary);
	cardPrimaryAction.appendChild(cardSecondary);

	const reviewButton = document.createElement('a');
	reviewButton.className = 'mdc-button mdc-card__action mdc-card__action--button';
	reviewButton.id = 'add-review-button';
	reviewButton.innerHTML = 'Add Review';
	reviewButton.onclick = addReview;

	const actionButtons = document.createElement('div');
	actionButtons.className = 'mdc-card__action-buttons';
	actionButtons.appendChild(reviewButton);

	const cardActions = document.createElement('div');
	cardActions.className = 'mdc-card__actions';
	cardActions.appendChild(actionButtons);

	const reviewCard = document.createElement('div');
	reviewCard.className = 'mdc-card';
	reviewCard.id = 'review-card';
	reviewCard.appendChild(cardPrimaryAction);
	reviewCard.appendChild(cardActions);

	const reviewContainer = document.createElement('div');
	reviewContainer.id = 'add-review-container';
	reviewContainer.appendChild(reviewCard);
	return reviewContainer;
};

/**
 * Initialize add review button.
 */
let initializeAddReviewButton = () => {
	const span = document.createElement('span');
	span.className = 'mdc-fab__icon';
	span.innerHTML = 'comment';

	const reviewButton = document.createElement('button');
	reviewButton.className = 'mdc-fab material-icons';
	reviewButton.id = 'add-review';
	reviewButton.setAttribute('aria-label', 'Favorite');
	reviewButton.appendChild(span);
	reviewButton.onclick = scrollToReviewForm;
	return reviewButton;
};

/**
 * Initialize add review button.
 */
let initializeSnackBar = () => {
	const text = document.createElement('div');
	text.className = 'mdc-snackbar__text';

	const actionButton = document.createElement('button');
	actionButton.className = 'mdc-snackbar__action-button';
	actionButton.type = 'button';

	const actionWrapper = document.createElement('div');
	actionWrapper.className = 'mdc-snackbar__action-wrapper';
	actionWrapper.appendChild(actionButton);

	const snackBar = document.createElement('div');
	snackBar.className = 'mdc-snackbar mdc-snackbar--align-start';
	snackBar.setAttribute('aria-live', 'assertive');
	snackBar.setAttribute('aria-atomic', 'true');
	snackBar.setAttribute('aria-hidden', 'true');
	snackBar.appendChild(text);
	snackBar.appendChild(actionWrapper);
	self.snackbar = new MDCSnackbar(snackBar);
	return snackBar;
};

/**
 * Initialize page.
 */
(function () {
	const breadcrumbContainer = initializeBreadcrumbContainer();
	const restaurantContainer = initializeRestaurantContainer();
	const mainContent = document.getElementById('maincontent');
	mainContent.removeChild(document.getElementById('progressbar'));
	mainContent.appendChild(breadcrumbContainer);
	mainContent.appendChild(restaurantContainer);
	fetchRestaurantFromURL(() => {
		loadStylesheet('https://fonts.googleapis.com/css?family=Roboto:300,400,500');
		loadStylesheet('https://fonts.googleapis.com/icon?family=Material+Icons');
		loadStylesheet('public/css/material.top.app.bar.min.css');
		initializeTopAppBarIcons();
		const firstSplitter = document.createElement('hr');
		const reviewsContainer = initializeReviewContainer();
		const secondSplitter = document.createElement('hr');
		const addReviewsContainer = initializeAddReviewContainer();
		const addReviewsButton = initializeAddReviewButton();
		const snackBar = initializeSnackBar();
		mainContent.appendChild(firstSplitter);
		mainContent.appendChild(reviewsContainer);
		mainContent.appendChild(secondSplitter);
		mainContent.appendChild(addReviewsContainer);
		mainContent.appendChild(addReviewsButton);
		mainContent.appendChild(snackBar);
		if (lazyReviewObserver) {
			lazyReviewObserver.observe(addReviewsContainer);
		} else {
			fetchReviewsFromURL();
		}
	});
})();