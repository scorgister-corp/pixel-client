class Place {
	#loaded;
	#socket;
	#loadingp;
	#uiwrapper;
	#glWindow;
	#allowDraw;
	#colors;
	#pixels;

	static TYPES = {LOGIN: 0, PLACE: 1};
	static BACKGROUND_COLOR = "#ffffff";

	constructor(glWindow) {
		this.#loaded = false;
		this.#socket = null;
		this.#glWindow = glWindow;
		this.#allowDraw = null;
		this.#colors = [];
		this.#pixels = [];
	}

	initConnection() {
		//this.#loadingp.innerHTML = "connecting";

		/*let host = window.location.hostname;
		let port = window.location.port;
		if (port != "") {
			host += ":" + port;
		}

		let wsProt;
		if (window.location.protocol == "https:") {
			wsProt = "wss:";
		} else {
			wsProt = "ws:";
		}*/

		//this.#connect("ws://localhost:8100");
		//this.#connect("ws://192.168.0.13:8100");
		this.#connect("wss://api.ipexl.scorgister.net");
		//this.#loadingp.innerHTML = "downloading canvas";

		/*fetch(window.location.protocol + "//" + host + "/place.png")
			.then(async resp => {
				if (!resp.ok) {
					console.error("Error downloading canvas.");
					return null;
				}

				let buf = await this.#downloadProgress(resp);
				await this.#setImage(buf);

				this.#loaded = true;
				//this.#loadingp.innerHTML = "";
				//this.#uiwrapper.setAttribute("hide", true);
			});
			*/
	}

	/*async #downloadProgress(resp) {
		let len = resp.headers.get("Content-Length");
		let a = new Uint8Array(len);
		let pos = 0;
		let reader = resp.body.getReader();
		while (true) {
			let { done, value } = await reader.read();
			if (value) {
				a.set(value, pos);
				pos += value.length;
				//this.#loadingp.innerHTML = "downloading map " + Math.round(pos / len * 100) + "%";
			}
			if (done) break;
		}
		return a;
	}*/

	async #load(data) {

		// CREATE COLOR BAR
		let first = true;
		let i = 0;
		for(let color of data.colors) {
			let colorCase = document.createElement("div");
			colorCase.setAttribute("class", "color-case" + (first?" selected":""));
			colorCase.setAttribute("value", i);
			colorCase.style.backgroundColor = color;
			colorCase.color = color;
			colorCase.onclick = selectColor;

			document.getElementById("color-container").appendChild(colorCase);

			this.#colors.push(color);
			first = false;
			i++;
		}

		await this.#setImage(data.pixels[0].length, data.pixels.length);


		for(let y = 0; y < data.pixels.length; y++) {
			this.#pixels.push([]);
			for(let x = 0; x < data.pixels[0].length; x++) {
				this.#pixels[y].push(data.pixels[y][x]);
				if(data.pixels[y][x] == -1)
					continue;
				this.setPixel(x, y, data.pixels[y][x], false, false);
			}
		}

		this.#glWindow.draw();

		this.#loaded = true;
	}

	#connect(path) {
		this.#socket = new WebSocket(path);

		const socketOpen = (event) => {
			this.send({type: Place.TYPES.LOGIN})
		};

		const socketMessage = async (event) => {
			/*let b = await event.data.arrayBuffer();
			if (this.#allowDraw == null) {
				let view = new DataView(b);
				this.#allowDraw = view.getUint8(0) === 1;
				if (!this.#allowDraw) {
					this.#keyPrompt();
				}
			} else {
				this.#handleSocketSetPixel(b);
			}*/
			let data = JSON.parse(event.data);

			switch(data.type) {
				case Place.TYPES.LOGIN:
					this.#load(data);
					break;
				case Place.TYPES.PLACE:
					this.#handleSocketSetPixel(data)
					//placeOtherPixels(data)
					break;
			}
		};

		const socketClose = (event) => {
			this.#socket = null;
		};

		const socketError = (event) => {
			console.error("Error making WebSocket connection.");
			alert("Failed to connect.");
			this.#socket.close();
		};

		this.#socket.addEventListener("open", socketOpen);
		this.#socket.addEventListener("message", socketMessage);
		this.#socket.addEventListener("close", socketClose);
		this.#socket.addEventListener("error", socketError);
	}

	setPixel(x, y, colorIndex, updateServer = true, drawCanvas=true) {
		x = Math.floor(x)
		y = Math.floor(y);
		/*if (!this.#allowDraw) {
			return;
		}*/

		if (this.#socket != null && this.#socket.readyState == 1) {
			this.#pixels[y][x] = colorIndex;
			if(updateServer)
				this.send({type: Place.TYPES.PLACE, coord: [x, y], color: colorIndex});
			this.#glWindow.setPixelColor(x, y, this.getColor(colorIndex));

			if(drawCanvas)
				this.#glWindow.draw();
		} else {
			alert("Disconnected.");
			console.error("Disconnected.");
		}
	}

	getColorIndex(color) {
		return this.#colors.indexOf(color);
	}

	getColor(colorIndex) {
		if(colorIndex == -1) {
			return Place.BACKGROUND_COLOR;
		}

		return this.#colors[colorIndex] + "ff";
	}

	getPixelColorIndex(x, y) {
		return this.#pixels[y][x];
	}

	#handleSocketSetPixel(data) {
		if(this.#loaded) {
			for(let pix of data.pixels) {
				this.setPixel(pix.coord[0], pix.coord[1], pix.color, false, false);
			}
			this.#glWindow.draw();
		}
	}

	async #setImage(width, height) {
		/*let img = new Image()
		let blob = new Blob([data], { type: "image/png" });
		let blobUrl = URL.createObjectURL(blob);
		img.src = blobUrl;*/
		let promise = new Promise((resolve, reject) => {
			//img.onload = () => {
				this.#glWindow.setTexture(width, height);
				this.#glWindow.draw();
				resolve();
			//};
			//img.onerror = reject;
		});
		await promise;
	}
/*
	#putUint32(b, offset, n) {
		let view = new DataView(b);
		view.setUint32(offset, n, false);
	}

	#getUint32(b, offset) {
		let view = new DataView(b);
		return view.getUint32(offset, false);
	}

	#keyPrompt() {
		let key = prompt("This canvas uses a whitelist.\n\nIf you don't have a key you can still view the canvas but you will not be able to draw.\n\nTo request an access key you can create an issue on the GitHub project.\n\nIf you already have one, enter it here.", "");
		fetch("./verifykey?key="+key)
			.then(async resp => {
				if (resp.ok) {
					window.location.reload();
				} else {
					alert("Bad key.")
				}
			});
	}
*/
	send(data) {
		this.#socket.send(JSON.stringify(data));
	}
}