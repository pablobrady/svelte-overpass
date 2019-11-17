<script>

var map1 = {
  "routeName": false,
  "routeIndex": false,
  "isInitialized": false,
  "mapDimensions": {
    "minX": "10px",
    "minY": "100px",
    "maxX": "400px",
    "maxY": "400px"
  },
  "init": function() {
    if( this.routeName ) { this.routeIndex = 1; }
    this.isInitialized = true;

  },
  "car1": {
    "left": "200px",
    "top": "50px"
  },
}

class Car {
  constructor(config) {
    this.id = Number(config["id"]) || 0;
    this.x = Number(config["x"]) || 0;
    this.y = Number(config["y"]) || 0;
    this.that = this;
    console.log("CAR ID: " + this.id + " created at " + this.x + ", " + this.y)
  }

  progress() {
    this.x++;
    console.log("RUNNING: " + this.id + ", x = " + this.x)
  }

  start() {
    var that = this;
    this.timer = setInterval( function(){ that.progress(); }, 1000);
    console.log("Car " + this.id + " started...");
  }

}

var cars = [];
for(var i=0; i<=2; i++) {
  let newCar = new Car({"id": i, "x": 10, "y": i*10})
  newCar.start();
  cars.push( newCar );
}


map1.init();
var initState = "Map1 State: " + map1.isInitialized ? "Initialized" : "Not initialized";

</script>

<style>
  .map {
    display: inline-block;
    position: relative;
    background: lightblue url('./images/testTrack0.jpg');
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
{cars[0].x}<br>
{cars[1].x}<br>
{cars[2].x}<br>
<div class="map">
  <img class="car" style="left: {cars[0].x}; top: {cars[0].y};" src="./images/car-bw.svg" alt="{cars[0].x}">
  <img class="car" style="left: {cars[1].x}; top: {cars[1].y};" src="./images/car-bw.svg" alt="">
  <img class="car" style="left: {cars[2].x}; top: {cars[2].y};" src="./images/car-bw.svg" alt="">
</div>
