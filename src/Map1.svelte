<script>
var timer = null;
var ms = 10;
// https://svelte.dev/tutorial/congratulations

var map1 = {
  "routeName": false,
  "routeIndex": false,
  "isInitialized": false,
  "mapDimensions": {
    "minX": "10",
    "minY": "100",
    "maxX": "400",
    "maxY": "400"
  },
  "init": function() {
    if( this.routeName ) { this.routeIndex = 1; }
    this.isInitialized = true;
  }
}

// Create Car Data
var cars = [];
for(var i=0; i<=5; i++) {
  let carData = {
    "id": i,
    "x": i,
    "y": i*20,
    "accel": Math.random() * 1
  }
  cars.push( carData );
}

function process() {
  for(let id=0; id<cars.length; id++) {
    if (cars[id].x < map1.mapDimensions.maxX ) { 
      cars[id].x += cars[id].accel;
    } 
  }
}

function startTimer() {
  var that = this;
  setInterval( function(){ process(); }, ms);
}


map1.init();
var initState = "Map1 State: " + map1.isInitialized ? "Initialized" : "Not initialized";
startTimer();

</script>

<style>
  .map {
    display: inline-block;
    position: relative;
    background: lightblue url('./images/testTrack0.jpg') center center;
    width: 400px;
    height: 184px;
  }
  .car {
    display: inline-block;
    position: absolute;
    transform: rotate(90deg);
    width: 30px;
  }
</style>

<h2>MAP1 Output</h2>
<p>initState = {initState}</p>

<p>MAP:</p>
<div class="map">
  {#each cars as car}
    <img class="car" style="left: {car.x}px; top: {car.y}px;" src="./images/car-bw.svg" alt="{car.x}">
  {/each}
</div>
