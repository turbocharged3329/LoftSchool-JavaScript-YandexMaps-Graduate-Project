ymaps.ready(init);

let storage = localStorage;

function init() {
  var myMap = new ymaps.Map("map", {
    center: [56.14273210871949, 40.403456925781235],
    zoom: 11,
    controls: ["zoomControl"],
    behaviors: ["drag"],
  });

  function createBalloonTemplate(feedbacks) {
    console.log(feedbacks);
    const balloonTemplate = Handlebars.compile(
      `<div class="balloon-wrapper">
      {{#each feedbacks}}
      <div class="feedback-wrapper">
      <h3>{{name}}</h3>
      <p>{{feedback}}</p> 
      </div>
      {{/each}}
      <h1>Отзыв:</h1>
          <div>
          <input type="text" class="enter-name" placeholder="Укажите ваше имя"/>
          </div>
          <div>
          <input type="text" class="enter-place" placeholder="Укажите место" />
          </div>
          <div>
          <textarea  class="enter-feedback" placeholder="Оcтавьте отзыв"></textarea>
          </div>
          <div class="add-feedback">
          <button class="add-feedback-button">Добавить</button>
          </div>
          </div>`
    );
    console.log(balloonTemplate(feedbacks))
    return balloonTemplate(feedbacks);
  }

  function createFeedbacksArr(coords) {
    const feedbacks = [];
    const feedsFromStorage = storage[`${coords[0]}:${coords[1]}`].split(';');
    for (let feed of feedsFromStorage) {
      feedbacks.push(
        {name: JSON.parse(feed).name,
        feedback: JSON.parse(feed).feedback
        }
        )
    }
    return {feedbacks};
  }

  function openBalloon(e) {
    if(e.get('target').geometry) {
      const coords = e.get('target').geometry.getCoordinates();
      const feedbacks = createFeedbacksArr(coords);
      myMap.balloon.open(coords,{
        content: createBalloonTemplate(feedbacks),
      },{ 
        closeButton: true }
    );
        console.log(myMap.balloon);
    }
    else {
    const coords = e.get("coords");
    myMap.balloon.open(coords,{
        content: createBalloonTemplate(),
      },{ 
        closeButton: true }
    );
      }
  }

  function createPlacemark(coords, place) {
    var placemark = new ymaps.Placemark([coords[0], coords[1]], {
      hintContent: place,
      balloonContent: createBalloonTemplate()
    });
    return placemark;
  }

  function writePlacemarkToStoarge(coords,name,place,feedback) {
    storage[`${coords[0]}:${coords[1]}`] = JSON.stringify({
      name: name,
      place: place,
      feedback: feedback,
    });
  }

  //получение данных о метках из хранилища
  function getMarksFormStorage() {
    console.log(storage['points'].split(';'));
    // const posOfMarks = Object.keys(storage);

    // const markers = [];

    // for (key in posOfMarks) {
    //   const placemark = {
    //     center: [posOfMarks[key].split(":")[0], posOfMarks[key].split(":")[1]],
    //     feedbacks: (storage[`${posOfMarks[key]}`]), 
    //   };
    //   markers.push(placemark);
    // }

    return markers;
  }

  //установка меток на карте
  function setMarksOnMap() {
    const markers = getMarksFormStorage();
 
    var clusterer = new ymaps.Clusterer({
      clusterDisableClickZoom: true,
      clusterBalloonCycling: false,
      clusterBalloonPagerType: "marker",
      clusterBalloonPagerSize: 6,
      clusterBalloonContentLayout: 'cluster#balloonCarousel',
  });


    for (let mark of markers) {
      const placemark = new ymaps.Placemark({ type: "Point",
      coordinates: mark.center}, {
        hintContent: "I was added",
        clusterCaption: 'Геообъект № ',
        balloonContentBody: [
          '<div id="feedback-results" class="feedback-results">',
          '<div>',
          '<div id="loader-container">',
          '<img class="loader" src="./assets/loader.gif" /></div>',
          "</div>",
          '<div class="feedback-info">',
          "<h3>Оставьте отзыв:</h3>",
          "<div>",
          '<input type="text" id="enter-name" placeholder="Укажите ваше имя"/>',
          "</div>",
          "<div>",
          '<input type="text" id="enter-place" placeholder="Укажите место" />',
          "</div>",
          "<div>",
          '<textarea  id="enter-feedback" placeholder="Оcтавьте отзыв"></textarea>',
          "</div>",
          "</div>",
          '<div class="add-feedback">',
          '<button id="add-feedback-button">Добавить</button>',
          "</div>",
        ].join(""),
      });
      placemark.events.add("balloonopen", (e) => {
        setTimeout(() => balloonActions(mark.center, mark.feedbacks), 1010);
      });
      clusterer.add(placemark);
    }
    myMap.geoObjects.add(clusterer);
  }
 
 
  //оживление формы балуна для еще не созданой метки
  function balloonActions(e, feedbacks = {}) {
    if (e.target.classList.contains('add-feedback-button')){
    const coords = myMap.balloon.getPosition();
    const wrapper = e.target.closest('.balloon-wrapper');
    const enterName = wrapper.querySelector('.enter-name');
    const enterPlace = wrapper.querySelector('.enter-place');
    const enterFeedback = wrapper.querySelector('.enter-feedback');
    const placemark = createPlacemark(coords, enterPlace.value);
    
    writePlacemarkToStoarge(coords, enterName.value, enterPlace.value, enterFeedback.value);
    placemark.events.add('click', openBalloon);
    myMap.geoObjects.add(placemark);
    myMap.balloon.close();
    }
  }

  // setMarksOnMap();
  myMap.events.add('click', openBalloon);
  document.addEventListener('click', balloonActions);
}
