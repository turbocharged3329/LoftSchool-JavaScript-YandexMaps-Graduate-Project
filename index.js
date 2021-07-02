ymaps.ready(init);

let storage = localStorage;

function init() {
  const myMap = new ymaps.Map("map", {
    center: [56.14273210871949, 40.403456925781235],
    zoom: 11,
    controls: ["zoomControl"],
    behaviors: ["drag"],
  });

  function createClusterer() {
    const clusterer = new ymaps.Clusterer({
      clusterDisableClickZoom: true,
      clusterBalloonCycling: false,
      clusterGroupByCoordinates: true,
      clusterOpenBalloonOnClick: false,
    });

    clusterer.events.add("click", clustererHandler);

    return clusterer;
  }

  function clustererHandler(e) {
    if (e.get("target").options._name === "cluster") {
      const feedbacks = createFeedsForCluster(findUniqCoordsInClusterer(e));

      myMap.balloon.open(
        e.get("target").geometry.getCoordinates(),
        createBalloonContent(feedbacks)
      );
    }
  }

  function findUniqCoordsInClusterer(e) {
    const gObjects = e.get("target").getGeoObjects();
    const uniqCoords = [];

    gObjects.forEach((obj) => {
      const coords = `${obj.geometry.getCoordinates()[0]}:${
        obj.geometry.getCoordinates()[1]
      }`;
      if (!uniqCoords.includes(coords)) {
        uniqCoords.push(coords);
      }
    });

    return uniqCoords;
  }

  function createFeedsForCluster(places) {
    const feedbacks = [];

    places.forEach((place) => {
      const feeds = createFeedbacks(place.split(":"));
      feeds.forEach((feed) => {
        feedbacks.push(feed);
      });
    });

    return feedbacks;
  }

  function addClustererOnMap(clusterer) {
    myMap.geoObjects.add(clusterer);
  }

  function createBalloonContent(feedbacks = {}) {
    const template = document.createElement("div");
    template.innerHTML = document.querySelector(".balloon-template").innerHTML;

    if (feedbacks.length > 0) {
      const feedbackWrapper = template.querySelector(".feedback-wrapper");
      const fragment = document.createDocumentFragment();

      feedbacks.forEach((feed) => {
        const name = document.createElement("h2");
        name.textContent = feed.name;
        fragment.appendChild(name);
        const feedback = document.createElement("p");
        fragment.appendChild(feedback);
        feedback.textContent = feed.feedback;
        feedbackWrapper.appendChild(fragment);
      });
    }

    return template.innerHTML;
  }

  function createFeedbacks(coords) {
    const placemarks = getMarksFormStorage();

    return placemarks.reduce((acc, current) => {
      if (current.coords === coords.join(":")) {
        return [...acc, current.feedback]
      }
      return acc;
    }, []);
  }

  function openBalloon(coords, content = null) {
    const feedbacks = createFeedbacks(coords);
    const template = createBalloonContent(feedbacks);

    myMap.balloon.open(coords, template);
  }

  function openPlacemarkBalloon(e) {
    const coords = e.get("target").geometry.getCoordinates();
    openBalloon(coords);
  }

  function createPlacemark(coords, place) {
    const placemark = new ymaps.Placemark(
      coords,
      {
        hintContent: place,
      },
      {
        iconLayout: "default#image",
        iconImageHref: "./assets/pin.png",
        iconImageSize: [36, 36],
      }
    );

    return placemark;
  }

  function writePlacemarkToStoarge(coords, name, place, feedback) {
    !storage[`${coords[0]}:${coords[1]}`]
      ? (storage[`${coords[0]}:${coords[1]}`] = JSON.stringify({
          name: name,
          place: place,
          feedback: feedback,
        }))
      : (storage[`${coords[0]}:${coords[1]}`] +=
          ";" +
          JSON.stringify({
            name: name,
            place: place,
            feedback: feedback,
          }));
  }

  function getMarksFormStorage() {
    return Object.keys((storage)).reduce((acc, current) => {
      const feeds = storage[`${current}`].split(";");
      feeds.forEach((feed) => {
        acc.push({
          coords: current,
          feedback: JSON.parse(feed),
        });
      });
      return acc;
    }, []);
  }

  function setPlacemarksOnMap() {
    addClustererOnMap(clusterer);
    const placemarks = getMarksFormStorage();

    placemarks.forEach((place) => {
      const coords = place.coords.split(":");
      const placemark = new ymaps.Placemark(
        coords,
        {
          hintContent: place.feedback.place,
        },
        {
          iconLayout: "default#image",
          iconImageHref: "./assets/pin.png",
          iconImageSize: [36, 36],
        }
      );
      placemark.events.add("click", openPlacemarkBalloon);
      clusterer.add(placemark);
    });
  }

  function addPlacemark(e, coords) {
    const wrapper = e.target.closest(".balloon-wrapper");
    const enterName = wrapper.querySelector(".enter-name");
    const enterPlace = wrapper.querySelector(".enter-place");
    const enterFeedback = wrapper.querySelector(".enter-feedback");
    const placemark = createPlacemark(coords, enterPlace.value);

    writePlacemarkToStoarge(
      coords,
      enterName.value,
      enterPlace.value,
      enterFeedback.value
    );
    placemark.events.add("click", openPlacemarkBalloon);
    clusterer.add(placemark);
    myMap.balloon.close();
  }

  function showMapBallon(e) {
    const content = createBalloonContent();
    openBalloon(e.get("coords"), content);
  }

  function saveFeedback(e) {
    if (e.target.classList.contains("add-feedback-button")) {
      addPlacemark(e, myMap.balloon.getPosition());
    }
  }

  const clusterer = createClusterer();

  setPlacemarksOnMap();
  myMap.events.add("click", showMapBallon);
  document.addEventListener("click", saveFeedback);
}
