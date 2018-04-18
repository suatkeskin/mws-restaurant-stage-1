/**
 * Common database helper functions.
 */
class DBHelper {
    /**
     * Database URL.
     * Change this to restaurants.json file location on your server.
     */
    static get DATABASE_URL() {
        const port = 1337;
        return `http://localhost:${port}/restaurants`;
    }

    /**
     * Fetch all restaurants from remote server.
     * Load all restaurants from remote server, if fails load from indexed DB
     */
    static fetchRestaurants(callback) {
        fetch(DBHelper.DATABASE_URL)
            .then(response => response.status === 200 ? response.json() : null)
            .then(restaurants => restaurants ? DBHelper.saveRestaurantsToIndexedDB(restaurants) : DBHelper.loadRestaurantsFromIndexedDB())
            .catch((error) => {
                console.error("Can not fetch restaurants from remote server, will load from database!");
                console.error(error);
                return DBHelper.loadRestaurantsFromIndexedDB();
            }).then((restaurants) => callback(null, restaurants));
    }

    /**
     * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
     */
    static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
        // Fetch all restaurants
        DBHelper.fetchRestaurants((error, restaurants) => {
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
     * Fetch all neighborhoods with proper error handling.
     */
    static fetchNeighborhoods(callback) {
        // Fetch all restaurants
        DBHelper.fetchRestaurants((error, restaurants) => {
            if (error) {
                callback(error, null);
            } else {
                if (restaurants) {
                    // Get all neighborhoods from all restaurants
                    const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood);
                    // Remove duplicates from neighborhoods
                    const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) === i);
                    callback(null, uniqueNeighborhoods);
                } else {
                    callback('No restaurants available', null);
                }
            }
        });
    }

    /**
     * Fetch all cuisines with proper error handling.
     */
    static fetchCuisines(callback) {
        // Fetch all restaurants
        DBHelper.fetchRestaurants((error, restaurants) => {
            if (error) {
                callback(error, null);
            } else {
                // Get all cuisines from all restaurants
                const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
                // Remove duplicates from cuisines
                const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) === i);
                callback(null, uniqueCuisines);
            }
        });
    }

    /**
     * Load restaurants from indexed DB.
     */
    static loadRestaurantsFromIndexedDB() {
        return dbPromise.then(function (db) {
            const tx = db.transaction('restaurants');
            const restaurantsStore = tx.objectStore('restaurants');
            const idIndex = restaurantsStore.index('by-id');
            return idIndex.getAll();
        }).then(function (restaurants) {
            return restaurants;
        });
    }

    /**
     * Load restaurant from indexed DB by ID.
     */
    static loadRestaurantFromIndexedDbById(id, callback) {
        dbPromise.then(function (db) {
            const tx = db.transaction('restaurants');
            const restaurantsStore = tx.objectStore('restaurants');
            return restaurantsStore.get(Number(id));
        }).then(function (restaurant) {
            return callback(restaurant);
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
                restaurants.forEach(function (restaurant) {
                    restaurantsStore.put(restaurant);
                });
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
            }
        );
    }
}
