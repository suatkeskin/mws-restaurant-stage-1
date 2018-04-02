let restaurant;
let map;

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
    fetchRestaurantFromURL((error, restaurant) => {
        if (error) { // Got an error!
            console.error(error);
        } else {
            self.map = new google.maps.Map(document.getElementById('map'), {
                zoom: 16,
                center: restaurant.latlng,
                scrollwheel: false
            });
            google.maps.event.addListener(self.map, "tilesloaded", function () {
                document.querySelectorAll('#map iframe').forEach(function (item) {
                    item.setAttribute('title', 'Google Maps');
                });
                document.querySelectorAll('#map *').forEach(function (item) {
                    item.setAttribute('tabindex', '-1');
                });
                document.querySelectorAll('#map [rel="noopener"]').forEach(function (item) {
                    item.removeAttribute("rel");
                });
            });
            fillBreadcrumb();
            DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
        }
    });
};

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
    if (self.restaurant) { // restaurant already fetched!
        callback(null, self.restaurant);
        return;
    }
    const id = getParameterByName('id');
    if (!id) { // no id found in URL
        error = 'No restaurant id in URL';
        callback(error, null);
    } else {
        DBHelper.fetchRestaurantById(id, (error, restaurant) => {
            self.restaurant = restaurant;
            if (!restaurant) {
                console.error(error);
                return;
            }
            fillRestaurantHTML();
            callback(null, restaurant)
        });
    }
};

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
    const name = document.getElementById('restaurant-name');
    name.innerHTML = restaurant.name;

    const address = document.getElementById('restaurant-address');
    address.innerHTML = restaurant.address;

    const webp = document.getElementById('restaurant-img-webp-src');
    webp.type = "image/webp";
    webp.srcset = DBHelper.webpSrcsetForRestaurant(restaurant);

    const img = document.getElementById('restaurant-img-jpg-src');
    img.type = "image/jpeg";
    img.srcset = DBHelper.imageSrcsetForRestaurant(restaurant);

    const image = document.getElementById('restaurant-img');
    image.className = 'restaurant-img';
    image.src = DBHelper.imageUrlForRestaurant(restaurant);
    image.srcset = DBHelper.imageSrcsetForRestaurant(restaurant);
    image.sizes = "100vw";
    image.alt = `Image of ${restaurant.name}`;

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
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
    const hours = document.getElementById('restaurant-hours');
    for (let key in operatingHours) {
        const times = operatingHours[key].split(',');
        for (let timeKey in times) {
            if (timeKey === "0") {
                addRestaurantHoursHTML(hours, key, times[timeKey]);
            } else {
                addRestaurantHoursHTML(hours, "", times[timeKey]);
            }
        }
    }
};

addRestaurantHoursHTML = (hours, dayDetail, timeDetail) => {
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
fillReviewsHTML = (reviews = self.restaurant.reviews) => {
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
createReviewHTML = (review) => {
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
    date.classList.add("date");
    date.innerHTML = review.date;
    li.appendChild(date);

    const rating = document.createElement('div');
    rating.classList.add("rating");
    rating.classList.add(`rating-${review.rating}`);
    li.appendChild(rating);

    return li;
};

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant = self.restaurant) => {
    const breadcrumb = document.getElementById('breadcrumb');
    const currentPage = document.createElement('a');
    currentPage.innerHTML = restaurant.name;
    currentPage.href = `restaurant.html?id=${restaurant.id}`;
    currentPage.setAttribute("aria-current", "page");
    const li = document.createElement('li');
    li.appendChild(currentPage);
    breadcrumb.appendChild(li);
};

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
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
