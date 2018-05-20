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
	return idb.open('restaurants-db', 1, function (upgradeDb) {
		let restaurantsStore = upgradeDb.createObjectStore('restaurants', {keyPath: 'id'});
		restaurantsStore.createIndex('by-id', 'id');
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
	static REMOTE_SERVER_URL(parameter, urlParametersAsString) {
		const port = 1337;
		let url = `http://localhost:${port}/restaurants`;
		if (parameter) {
			url += `/${parameter}`;
		}
		if (urlParametersAsString) {
			url += `/?${urlParametersAsString}`;
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
		fetch(DBHelper.REMOTE_SERVER_URL(id, urlParametersAsString), {method: 'PUT'})
			.then(response => response.status === 200 ? response.json() : null)
			.then(restaurant => restaurant ? DBHelper.saveRestaurantsToIndexedDB(restaurant) : DBHelper.loadRestaurantsFromIndexedDB(id))
			.catch(() => DBHelper.loadRestaurantsFromIndexedDB(id));
	}

	/**
	 * Fetch all restaurants from remote server.
	 * Load all restaurants from remote server, if fails load from indexed DB
	 */
	static fetchRestaurants(id, callback) {
		fetch(DBHelper.REMOTE_SERVER_URL(id))
			.then(response => response.status === 200 ? response.json() : null)
			.then(restaurants => restaurants ? DBHelper.saveRestaurantsToIndexedDB(restaurants) : DBHelper.loadRestaurantsFromIndexedDB(id))
			.catch((error) => {
				console.error('Can not fetch restaurants from remote server, will load from database!');
				console.error(error);
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
}
