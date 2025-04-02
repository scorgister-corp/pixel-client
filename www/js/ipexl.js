
var socket = undefined;
const INITIAL_MESSAGE = {type: 0};

function load() {
    socket = new WebSocket("ws://localhost:8800");
    socket.onmessage = (data) => {
        onMessage(JSON.parse(data.data));
    };
    socket.onopen = e => {
        send(INITIAL_MESSAGE);
    }
}

function send(data) {
    if(socket == undefined) {
        return;
    }

    socket.send(JSON.stringify(data));
}

function onMessage(data) {
    console.log(data);
    
}

load();