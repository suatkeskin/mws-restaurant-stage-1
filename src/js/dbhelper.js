/**
 * Create an indexedDB promise
 */
let dbPromise;
document.addEventListener('DOMContentLoaded', () => {
	dbPromise = openIndexedDB();
});

/**
 * Create an indexedDB that contains one objectStore: 'restaurants' that uses 'id' as its key and has an index called 'by-id', which is sorted by the 'id' property
 * @returns a promise for a database called 'restaurants'
 */
let openIndexedDB = () => {
	// If the browser doesn't support service worker, we don't care about having a database
	if (!('serviceWorker' in navigator)) {
		return Promise.resolve();
	}
	return idb.open('local-guides-db', 1, function (upgradeDb) {
		let restaurantsStore = upgradeDb.createObjectStore('restaurants', {keyPath: 'id'});
		restaurantsStore.createIndex('by-id', 'id');
		let reviewsStore = upgradeDb.createObjectStore('reviews', {keyPath: 'id'});
		reviewsStore.createIndex('by-restaurant-id', 'restaurant_id');
	});
};

/**
 * Common database helper functions.
 */
class DBHelper {
	/**
	 * Database URL.
	 * Change this to restaurants.json file location on your server.
	 */
	static REMOTE_SERVER_URL(collection, parameter, urlParametersAsString) {
		const port = 1337;
		let url = `http://localhost:${port}/${collection}/`;
		if (parameter) {
			url += `${parameter}/`;
		}
		if (urlParametersAsString) {
			url += `?${urlParametersAsString}`;
		}
		return url;
	}

	/**
	 * Marks a restaurant as favored
	 */
	static favoritesRestaurant(id) {
		this.updateRestaurantFavoriteStatus(id, 'is_favorite=true');
	}

	/**
	 * Marks a restaurant as unfavored.
	 */
	static unFavoritesRestaurant(id) {
		this.updateRestaurantFavoriteStatus(id, 'is_favorite=false');
	}

	/**
	 * Marks a restaurant as favored/unfavored.
	 */
	static updateRestaurantFavoriteStatus(id, urlParametersAsString) {
		fetch(DBHelper.REMOTE_SERVER_URL('restaurants', id, urlParametersAsString), {method: 'PUT'})
			.then(response => response.status === 200 ? response.json() : null)
			.then(restaurant => restaurant ? DBHelper.saveRestaurantsToIndexedDB(restaurant) : DBHelper.loadRestaurantsFromIndexedDB(id))
			.catch(() => DBHelper.loadRestaurantsFromIndexedDB(id));
	}

	/**
	 * Fetch all restaurants from remote server.
	 * Load all restaurants from remote server, if fails load from indexed DB
	 */
	static fetchRestaurants(id, callback) {
		fetch(DBHelper.REMOTE_SERVER_URL('restaurants', id))
			.then(response => response.status === 200 ? response.json() : null)
			.then(restaurants => restaurants ? DBHelper.saveRestaurantsToIndexedDB(restaurants) : DBHelper.loadRestaurantsFromIndexedDB(id))
			.catch(() => {
				return DBHelper.loadRestaurantsFromIndexedDB(id);
			}).then((restaurants) => callback(null, restaurants));
	}

	/**
	 * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
	 */
	static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
		// Fetch all restaurants
		DBHelper.fetchRestaurants(null, (error, restaurants) => {
			if (error) {
				callback(error, null);
			} else {
				let results = restaurants;
				if (cuisine !== 'All Cuisines') { // filter by cuisine
					results = results.filter(r => r.cuisine_type === cuisine);
				}
				if (neighborhood !== 'All Neighborhoods') { // filter by neighborhood
					results = results.filter(r => r.neighborhood === neighborhood);
				}
				callback(null, results);
			}
		});
	}

	/**
	 * Load restaurants from indexed DB.
	 */
	static loadRestaurantsFromIndexedDB(id) {
		return dbPromise.then(function (db) {
			const tx = db.transaction('restaurants');
			const restaurantsStore = tx.objectStore('restaurants');
			const idIndex = restaurantsStore.index('by-id');
			return id ? restaurantsStore.get(Number(id)) : idIndex.getAll();
		}).then(function (restaurants) {
			return restaurants;
		});
	}

	/**
	 * Save restaurants to indexed DB.
	 */
	static saveRestaurantsToIndexedDB(restaurants) {
		return dbPromise.then(function (db) {
			if (restaurants) {
				const tx = db.transaction('restaurants', 'readwrite');
				const restaurantsStore = tx.objectStore('restaurants');
				restaurantsStore.clear();
				if (restaurants instanceof Array) {
					restaurants.forEach(function (restaurant) {
						restaurantsStore.put(restaurant);
					});
				} else {
					restaurantsStore.put(restaurants);
				}
				return tx.complete;
			}
		}).then(function () {
			return restaurants;
		});
	}

	/**
	 * Restaurant page URL.
	 */
	static urlForRestaurant(restaurant) {
		return (`./restaurant.html?id=${restaurant.id}`);
	}

	/**
	 * Restaurant image srcset.
	 */
	static webpSrcsetForRestaurant(restaurant) {
		return `public/img/webp/1024w/${restaurant.photograph}.webp 1024w, public/img/webp/640w/${restaurant.photograph}.webp 640w, public/img/webp/320w/${restaurant.photograph}.webp 320w`;
	}

	/**
	 * Restaurant image srcset.
	 */
	static imageSrcsetForRestaurant(restaurant) {
		return `public/img/jpg/1024w/${restaurant.photograph}.jpg 1024w, public/img/jpg/640w/${restaurant.photograph}.jpg 640w, public/img/jpg/320w/${restaurant.photograph}.jpg 320w`;
	}

	/**
	 * Restaurant image URL.
	 */
	static imageUrlForRestaurant(restaurant) {
		if (!restaurant.photograph) {
			return;
		}
		return `public/img/jpg/320w/${restaurant.photograph}.jpg`;
	}

	/**
	 * Map marker for a restaurant.
	 */
	static mapMarkerForRestaurant(restaurant, map) {
		return new google.maps.Marker({
			position: restaurant.latlng,
			title: restaurant.name,
			url: DBHelper.urlForRestaurant(restaurant),
			map: map,
			animation: google.maps.Animation.DROP
		});
	}

	/**
	 * Adds a review for given restaurant
	 */
	static addReview(restaurantId, reviewData, callback) {
		fetch(DBHelper.REMOTE_SERVER_URL('reviews'), {method: 'POST', body: JSON.stringify(reviewData), headers: {'Accept': 'application/json', 'Content-Type': 'text/plain'}})
			.then(response => response.status === 201 ? response.json() : null)
			.then(review => review ? DBHelper.saveReviewsToIndexedDB(review) : null)
			.catch(() => {
				return null;
			}).then((review) => review ? callback(null, review) : callback('Thanks for your review, will be saved when online!', null));
	}

	/**
	 * Delete a review for given restaurant
	 */
	static deleteReview(reviewId, callback) {
		fetch(DBHelper.REMOTE_SERVER_URL('reviews', reviewId), {method: 'DELETE'})
			.then(response => response.status === 201 ? response.json() : null)
			.then(review => review ? DBHelper.deleteReviewsFromIndexedDB(review) : null)
			.catch(() => {
				return null;
			}).then((result) => callback(result));
	}

	/**
	 * Fetch all reviews from remote server.
	 * Load all reviews from remote server, if fails load from indexed DB
	 */
	static fetchReviews(restaurantId, callback) {
		fetch(DBHelper.REMOTE_SERVER_URL('reviews', null, `restaurant_id=${restaurantId}`))
			.then(response => response.status === 200 ? response.json() : null)
			.then(reviews => reviews ? DBHelper.saveReviewsToIndexedDB(reviews) : DBHelper.loadReviewsFromIndexedDB(restaurantId))
			.catch(() => {
				return DBHelper.loadReviewsFromIndexedDB(restaurantId);
			}).then((reviews) => callback(null, reviews));
	}

	/**
	 * Save reviews to indexed DB.
	 */
	static saveReviewsToIndexedDB(reviews) {
		return dbPromise.then(function (db) {
			if (reviews) {
				const tx = db.transaction('reviews', 'readwrite');
				const reviewsStore = tx.objectStore('reviews');
				reviewsStore.clear();
				if (reviews instanceof Array) {
					reviews.forEach(function (review) {
						reviewsStore.put(review);
					});
				} else {
					reviewsStore.put(reviews);
				}
				return tx.complete;
			}
		}).then(function () {
			return reviews;
		});
	}

	/**
	 * Delete reviews from indexed DB.
	 */
	static deleteReviewsFromIndexedDB(reviews) {
		return dbPromise.then(function (db) {
			if (reviews) {
				const tx = db.transaction('reviews', 'readwrite');
				const reviewsStore = tx.objectStore('reviews');
				if (reviews instanceof Array) {
					reviews.forEach(function (review) {
						reviewsStore.delete(review);
					});
				} else {
					reviewsStore.delete(reviews);
				}
				return tx.complete;
			}
		}).then(function () {
			return reviews;
		});
	}

	/**
	 * Load reviews from indexed DB.
	 */
	static loadReviewsFromIndexedDB(restaurantId) {
		return dbPromise.then(function (db) {
			const tx = db.transaction('reviews');
			const reviewsStore = tx.objectStore('reviews');
			const restaurantIidIndex = reviewsStore.index('by-restaurant-id');
			return restaurantIidIndex.getAll(Number(restaurantId));
		}).then(function (reviews) {
			return reviews;
		});
	}
}
