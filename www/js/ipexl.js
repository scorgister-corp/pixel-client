
var socket = undefined;
var connected = false;

const BACKGROUND_COLOR = "#FFFFFF";
var oldPointerCoord = [-1, -1];

const TYPES = {LOGIN: 0, PLACE: 1};

const INITIAL_MESSAGE = {type: TYPES.LOGIN};

const WIDTH_CELL = 15;
const HEIGHT_CELL = 15;

const COLORS = [];

var PIXELS = [];

var GC = undefined;

var zoomFactor = 1;

function load() {
    socket = new WebSocket("wss://api.ipexl.scorgister.net");
    socket.onmessage = (data) => {
        onMessage(JSON.parse(data.data));
    };
    socket.onopen = e => {
        connected = true;
        send(INITIAL_MESSAGE);
    }

    socket.onclose = e => {
        if(!connected) {
            alert("Une erreur s'est produite")
        }else {
            alert("Vous avez été déconnecté !");
            window.location = window.location;
        }
    }

    socket.onerror = e => {
    }
}

function createCanvas(data) {
    document.getElementById("canvas-container").innerText = "";

    let first = true;
    for(let color of data.colors) {
        let colorCase = document.createElement("div");
        colorCase.setAttribute("class", "color-case" + (first?" selected":""));
        colorCase.style.backgroundColor = color;
        colorCase.color = color;
        colorCase.onclick = selectColor;

        document.getElementById("color-container").appendChild(colorCase);

        COLORS.push(color);
        first = false;
    }

    let canvas = document.createElement("canvas");
    canvas.id = "main-canvas";
    canvas.width = WIDTH_CELL * data.pixels[0].length;
    canvas.height = HEIGHT_CELL * data.pixels.length;
    
    canvas.addEventListener("mousedown", onMouseDown);
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseleave", onMouseLeave);

    GC = canvas.getContext("2d");

    for(let y = 0; y < data.pixels.length; y++) {
        PIXELS.push([]);
        for(let x = 0; x < data.pixels[0].length; x++) {
            PIXELS[y].push(data.pixels[y][x]);
            if(data.pixels[y][x] == -1)
                continue;
            placePixel(x, y, getColor(data.pixels[y][x]), false);
        }
    }

    document.getElementById("canvas-container").appendChild(canvas);
}

function placePixel(x, y, color, updateServer=true) {
    if(GC == undefined)
        return;

    PIXELS[y][x] = COLORS.indexOf(color);

    GC.fillStyle = color;
    GC.fillRect(x * WIDTH_CELL, y * HEIGHT_CELL, WIDTH_CELL, HEIGHT_CELL);
    if(updateServer)
        send({type: TYPES.PLACE, coord: [x, y], color: COLORS.indexOf(color)});
}

function onMouseDown(e) {
    let x = Math.floor(e.offsetX / WIDTH_CELL), y = Math.floor(e.offsetY / HEIGHT_CELL);
    placePixel(x, y, getSelectedColor());    
}

function onMouseMove(e) {
    let x = Math.floor(e.offsetX / WIDTH_CELL), y = Math.floor(e.offsetY / HEIGHT_CELL);

    mouseHighlight(x, y);
}

function onMouseLeave(e) {
    clearHighlight(oldPointerCoord[0], oldPointerCoord[1]);
    oldPointerCoord = [-1, -1];
}
/*
function dezoom(factor) {
    zoomFactor /= factor;
    modifyScale();
}

function zoom(factor) {
    zoomFactor *= factor;
    modifyScale();
}

function modifyScale() {
    clearCanvas();
    let canvas = document.getElementById("main-canvas");

    canvas.width = canvas.width * zoomFactor;
    canvas.height = canvas.height * zoomFactor;
    GC.scale(zoomFactor, zoomFactor);
    placePixels(PIXELS);
}
*/
function clearCanvas() {
    GC.style = BACKGROUND_COLOR;
    GC.fillRect(0, 0, WIDTH_CELL * PIXELS[0].length, HEIGHT_CELL * PIXELS.length);
}

function mouseHighlight(x, y) {
    if(oldPointerCoord[0] == x && oldPointerCoord[1] == y) {
        return;
    }else {
        clearHighlight(oldPointerCoord[0], oldPointerCoord[1]);
    }

    document.getElementById("x-coord").innerText = x;
    document.getElementById("y-coord").innerText = y;

    highlightCase(x, y, getSelectedColor() + "80");
}

function highlightCase(x, y, color) {
    if(GC == undefined)
        return;

    GC.fillStyle = color;
    GC.fillRect(x * WIDTH_CELL, y * HEIGHT_CELL, WIDTH_CELL, HEIGHT_CELL);
    oldPointerCoord = [x, y];
}

function clearHighlight(x, y) {
    if(x == -1 || y == -1 || y >= PIXELS.length || x >= PIXELS[0].length)
        return;

    GC.fillStyle = getColor(PIXELS[y][x]);
    GC.fillRect(x * WIDTH_CELL, y * HEIGHT_CELL, WIDTH_CELL, HEIGHT_CELL);
}

function getSelectedColor() {
    for(let colorCase of document.getElementById("color-container").children)
        if(colorCase.getAttribute("class").includes("selected"))
            return colorCase.color;
    return undefined;
}

function selectColor(e) {
    for(let colorCase of document.getElementById("color-container").children) {
        if(e.target == colorCase)
            continue;

        if(colorCase.getAttribute("class").includes("selected"))
            colorCase.setAttribute("class", "color-case");

    }
    if(!e.target.getAttribute("class").includes("selected"))
        e.target.setAttribute("class", "color-case selected");
}

function getColor(index) {
    if(index == -1) {
        return BACKGROUND_COLOR;
    }

    return COLORS[index];
}

function placeOtherPixels(data) {
    for(let pix of data.pixels) {
        placePixel(pix.coord[0], pix.coord[1], getColor(pix.color), false);
    }
}

function placePixels(pixels) {
    for(let y = 0; y < pixels.length; y++) {
        for(let x = 0; x < pixels[0].length; x++) {
            if(pixels[y][x] == -1)
                continue;
            placePixel(x, y, getColor(pixels[y][x]));
        }
    }
}

function send(data) {
    if(socket == undefined) {
        return;
    }

    socket.send(JSON.stringify(data));
}

function onMessage(data) {
    switch(data.type) {
        case TYPES.LOGIN:
            createCanvas(data);
            break;
        case TYPES.PLACE:
            placeOtherPixels(data)
            break;
    }
    
}

load();