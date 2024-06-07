/**
 * @author 	Sam Christy <sam_christy@hotmail.co.uk>
 * @licence     GNU GPL v3.0 <http://www.gnu.org/licenses/gpl-3.0.html>
 * @copyright   Sam Christy 2012 | All rights reserved (c)
 */

// TODO Make the UI scale to different resolutions and optimise the controls for
//      tablet and mobile devices.

// Red: With wind resitance
// Blue: In a vacuum
// Purple: Kinetic energy

const isMobile = window.matchMedia("(max-width: 768px)").matches;
if (isMobile) {
    var graphContainer = document.getElementById("graph-container-mobile");
    var genImageButton = document.getElementById("generate-image-mobile");
    var plotButton = document.getElementById("plot-trajectory-mobile");
    var cancelButton = document.getElementById("cancel-mobile");
}
else {
    var graphContainer = document.getElementById("graph-container");
    var genImageButton = document.getElementById("generate-image");
    var plotButton = document.getElementById("plot-trajectory");
    var cancelButton = document.getElementById("cancel");
}


genImageButton.addEventListener('click', generatePNG, false);
plotButton.addEventListener('click', plotTrajectory, false);
cancelButton.style.display = 'none';
cancelButton.addEventListener('click', abort, false);

window.addEventListener('keypress', function (e) {
    if (e.which == 13)  // Enter
        plotTrajectory();
}, false);

// TODO Delay this, to prevent it locking the UI.
window.addEventListener('resize', scale, false);

/**
 * Terminates the trajectory computation background thread.
 */
function abort() {
    if (typeof worker !== 'undefined') {
        worker.terminate();
        swapElements(cancelButton, plotButton);
    }
}

/**
 * Temporarily swaps the elements by setting their CSS display values.
 * @param {object} e1 The element to be hidden.
 * @param {object} e2 The hidden element, that will appear in the other's place.
 */
function swapElements(e1, e2) {
    e1.style.display = 'none';
    e2.style.display = '';
}

function generatePNG() {
    if (typeof graph === "undefined") {
        alert("You have to plot the trajectory first!");
        return;
    }

    var png = graph.toImg();
    var canvas = graph.getCanvas();

    var w = window.open("", "png",
        "width=" + Math.round(canvas.width * 1.04)
        + ",height=" + Math.round(canvas.height * 1.04)
        + ",modal=yes"
    );

    w.document.body.innerHTML = "<img src='" + png.src + "'>";
    w.document.title = "Generated PNG";
}

/**
 * Computes the trajectory and plots it on a graph.
 */
function plotTrajectory() {
    swapElements(plotButton, cancelButton);

    if (isMobile) {
        var input = getMobileInput();
    }
    else {
        var input = getInput();
    }

    if (typeof worker !== 'undefined') {
        worker.terminate();
    }

    worker = new Worker('js/worker.js');
    worker.postMessage(input);

    worker.onmessage = function (e) {
        trajectoryInVacuum = e.data.trajectoryInVacuum;
        bounds = e.data.bounds;
        trajectory = e.data.trajectory;
        worker.terminate();

        var initialKineticEnergy = 0.0005 * input.mass * input.velocity * input.velocity;
        renderGraph(trajectory, trajectoryInVacuum, bounds);
        // updateFlightStats(bounds.duration, bounds.distance, bounds.height, initialKineticEnergy);
        // init();
        swapElements(cancelButton, plotButton);
    }
}

function renderGraph() {

    settings = {
        xGridlineCount: 10,
        yGridlineCount: 10,

        xAxis1: {
            min: 0,
            max: bounds.distance,
            title: "Distance (metres)"
        },

        yAxis1: {
            min: 0,
            max: bounds.height,
            title: "Height (metres)"
        },

        xAxis2: null,

        yAxis2: {
            min: 0,
            max: 100,
            suffix: "%",
            title: "Kinetic Energy",

            auto: false
        }
    };

    // Remove the graph, if it already exists.
    graphContainer.innerHTML = "";
    var boundingBox = graphContainer.getBoundingClientRect();
    if (isMobile){
        var width = 400;
        var height = 300;
    }
    else{
        var width = 800;
        var height = 400;
    }
    

    graph = new Graph(width, height, settings)
    // graph = new Graph(boundingBox.width, boundingBox.height, settings);
    graph.draw();
    graph.appendTo(graphContainer);

    // Plot the kinetic energy.
    graph.plotData(trajectory, Graph.colours.purple, 1, 2, 0, 2);

    // Plot the trajectories on the graph.
    graph.plotData(trajectoryInVacuum, Graph.colours.red);
    graph.plotData(trajectory, Graph.colours.blue);
}


/**
 * Get the projectile's input data.
 */
function getInput() {
    // TODO Add alternative unit options (Metric/Imperial) to the UI and handle
    //      the conversions here.
    var input = {
        "gravity": parseFloat(document.getElementById("gravity").value),
        "velocity": parseFloat(document.getElementById("velocity").value),
        "angle": deg2Rad(parseFloat(document.getElementById("angle").value)),
        "height": parseFloat(document.getElementById("height").value),
        "mass": parseFloat(document.getElementById("mass").value),
        "diameter": parseFloat(document.getElementById("diameter").value),
        "dragCoef": parseFloat(document.getElementById("drag-coefficient").value),
        "density": parseFloat(document.getElementById("fluid-density").value)
    }

    return input;
}

function getMobileInput() {
    // TODO Add alternative unit options (Metric/Imperial) to the UI and handle
    //      the conversions here.
    var input = {
        "gravity": parseFloat(document.getElementById("gravity-mobile").value),
        "velocity": parseFloat(document.getElementById("velocity-mobile").value),
        "angle": deg2Rad(parseFloat(document.getElementById("angle-mobile").value)),
        "height": parseFloat(document.getElementById("height-mobile").value),
        "mass": parseFloat(document.getElementById("mass-mobile").value),
        "diameter": parseFloat(document.getElementById("diameter-mobile").value),
        "dragCoef": parseFloat(document.getElementById("drag-coefficient-mobile").value),
        "density": parseFloat(document.getElementById("fluid-density-mobile").value)
    }

    return input;
}

// function updateFlightStats(duration, distance, height, energy, precision) {
//     if (typeof precision === "undefined")
//         precision = 2;

//     document.getElementById("flight-duration").textContent = duration.toFixed(precision);
//     document.getElementById("flight-distance").textContent = distance.toFixed(precision);
//     document.getElementById("flight-height").textContent   = height.toFixed(precision);
//     document.getElementById("kinetic-energy").textContent  = energy.toFixed(precision);
// };

/**
 * Scale the graph to the size of its container.
 */
function scale() {
    renderGraph();
}

// TODO: Write validation functions for the input and validate input before
//       performing calculations.

/**
 * Validates all of the fields, to ensure that they contain sensible values (all fields are 
 * required).
 */
function validateFields() { }

/*
Trajectory Animation
*/
if (isMobile) {
    var canvas = document.getElementById('canvas-mobile');
    var btnStart = document.getElementById('btnStart-mobile');
    var angle = document.getElementById("animationAngle-mobile")
    var height = document.getElementById("height-mobile")
    var speed = document.getElementById("animationVelocity-mobile");
    var drawing = canvas.getContext("2d");
    var T = 0;
    var X0 = 0;
    var Y0 = canvas.height - height.value;
    var X = X0;
    var Y = Y0;
    var g = 0.0005;
    var run = false;

    var oldTimeStamp = 0.;
    var secondsPassed = 0.;
    var animationSpeed = document.getElementById("animationSpeed-mobile");
}
else {

    var canvas = document.getElementById('canvas');
    var btnStart = document.getElementById('btnStart');
    var angle = document.getElementById("animationAngle")
    var height = document.getElementById("height")
    var speed = document.getElementById("animationVelocity");
    var drawing = canvas.getContext("2d");
    var T = 0;
    var X0 = 0;
    var Y0 = canvas.height - height.value;
    var X = X0;
    var Y = Y0;
    var g = 0.0005;
    var run = false;

    var oldTimeStamp = 0.;
    var secondsPassed = 0.;
    var animationSpeed = document.getElementById("animationSpeed");
}
btnStart.addEventListener('click', toggle);


window.onload = init();

function init() {
    window.requestAnimationFrame(animationLoop);
}

function toggle() {
    if (!run) {
        btnStart.value = 'Stop';
    } else {
        btnStart.value = 'Start';
        X = X0;
        Y = Y0;
        T = 0;
    }
    run = !run;
}

function animationLoop(timeStamp) {
    secondsPassed = (timeStamp - oldTimeStamp) / 1000.;
    oldTimeStamp = timeStamp;
    update();
    draw();
    window.requestAnimationFrame(animationLoop);
}

function update() {
    if (run) {
        // T += 1;
        T += animationSpeed.value * secondsPassed;
        X = ((speed.value / 10) * Math.cos(-angle.value * Math.PI / 180.) * T) + X0;
        Y = (0.5 * g * T * T) + ((speed.value / 10) * Math.sin(-angle.value * Math.PI / 180.) * T) + Y0;
        // console.log(T, X, Y, X0, Y0);
    }
}


function draw() {
    drawing.clearRect(0, 0, canvas.width, canvas.height);
    drawing.beginPath();
    drawing.arc(X, Y, 10, 0, 2 * Math.PI);
    drawing.fillStyle = "darkred";
    drawing.fill();
    drawing.beginPath();
    drawing.moveTo(X0, Y0);
    drawing.strokeStyle = "grey";
    drawing.lineTo(X0 + 80 * Math.cos(angle.value * Math.PI / 180.), Y0 - 80 * Math.sin(angle.value * Math.PI / 180.));
    drawing.lineWidth = 40;
    drawing.stroke();
}