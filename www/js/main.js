var colorIndex = 0;
function main() {
	let cvs = document.querySelector("#viewport-canvas");
	let glWindow = new GLWindow(cvs);

	if (!glWindow.ok()) return;

	let place = new Place(glWindow);
	place.initConnection();

	let gui = GUI(cvs, glWindow, place);
}

function selectColor(e) {
	let i = 0;

    for(let colorCase of document.getElementById("color-container").children) {
		
        if(e.target == colorCase) {
			colorIndex = i;
			break;
		}
		i++;
	}
					/*
        if(colorCase.getAttribute("class").includes("selected"))
            colorCase.setAttribute("class", "color-case");

		i++;

    }
    if(!e.target.getAttribute("class").includes("selected"))
        e.target.setAttribute("class", "color-case selected");
	*/
	zoomCurrentColorCase();
}

function zoomCurrentColorCase() {
	for(let i = 0; i < document.getElementById("color-container").childElementCount; i++) {
		let colorCase = document.getElementById("color-container").children[i];

		if(colorCase.getAttribute("class").includes("selected"))
            colorCase.setAttribute("class", "color-case");
		
		if(i == colorIndex)
			colorCase.setAttribute("class", "color-case selected");
	}
}

const GUI = (cvs, glWindow, place) => {
	let dragdown = false;
	let touchID = 0;
	let touchScaling = false;
	let lastMovePos = { x: 0, y: 0 };
	let lastScalingDist = 0;
	let touchstartTime;

	//const colorField = document.querySelector("#color-field");
	//const colorSwatch = document.querySelector("#color-swatch");

	// ***************************************************
	// ***************************************************
	// Event Listeners
	//
	document.addEventListener("keydown", ev => {
		switch (ev.keyCode) {
			case 189:
			case 173:
				ev.preventDefault();
				zoomOut(1.2);
				break;
			case 187:
			case 61:
				ev.preventDefault();
				zoomIn(1.2);
				break;
		}
	});

	cvs.addEventListener("wheel", ev => {
		ev.stopPropagation();

		let zoom = glWindow.getZoom();
		if (ev.deltaY > 0) {
			zoom /= 1.05;
		} else {
			zoom *= 1.05;
		}
		
		glWindow.setZoom(zoom);
		glWindow.draw();

	});


	console.log(document.querySelector("#zoom-in"));
	
	document.querySelector("#zoom-in").addEventListener("click", () => {
		
		zoomIn(1.2);
	});

	document.querySelector("#zoom-out").addEventListener("click", () => {
		zoomOut(1.2);
	});

	window.addEventListener("resize", ev => {
		glWindow.updateViewScale();
		glWindow.draw();
	});

	cvs.addEventListener("mousedown", (ev) => {
		switch (ev.button) {
			case 2:
				dragdown = true;
				lastMovePos = { x: ev.offsetX, y: ev.offsetY };
				break;
			case 1:
				pickColor({ x: ev.offsetX, y: ev.offsetY });
				break;
			case 0:				
				if (ev.ctrlKey) {
					pickColor({ x: ev.offsetX, y: ev.offsetY });
				} else {
					drawPixel({ x: ev.offsetX, y: ev.offsetY }, colorIndex);
				}
		}
	});

	cvs.addEventListener("mouseleave", (ev) => {
		dragdown = false;
		document.body.style.cursor = "auto";		
	});

	cvs.addEventListener("mouseup", (ev) => {
		dragdown = false;
		document.body.style.cursor = "auto";
	});

	cvs.addEventListener("mousemove", (ev) => {		
		const movePos = { x: ev.offsetX, y: ev.offsetY };
		if (dragdown) {
			glWindow.move(movePos.x - lastMovePos.x, movePos.y - lastMovePos.y);
			glWindow.draw();
			document.body.style.cursor = "grab";
		}
		lastMovePos = movePos;
	});

	cvs.addEventListener("touchstart", (ev) => {
		let thisTouch = touchID;

		touchstartTime = (new Date()).getTime();
		lastMovePos = getToucheOffsetPos(ev, 0)
		if(ev.touches.length === 2) {
			touchScaling = true;
			lastScalingDist = null;
		}

		setTimeout(() => {
			if(thisTouch == touchID) {
				pickColor(lastMovePos);
			}
		}, 350);
	});

	cvs.addEventListener("touchend", (ev) => {
		touchID++;
		let elapsed = (new Date()).getTime() - touchstartTime;
		if(elapsed < 100) {
			drawPixel(lastMovePos, colorIndex)
		}
		if(ev.touches.length === 0) {
			touchScaling = false;
		}
	});

	cvs.addEventListener("touchmove", (ev) => {
		touchID++;
		if (touchScaling) {
			ev.preventDefault();
			let pT1 = getToucheOffsetPos(ev, 0);
			let pT2 = getToucheOffsetPos(ev, 1);
			
			let dist = Math.hypot(
				pT1.x - pT2.x,
				pT1.y - pT2.y);
			if (lastScalingDist != null) {
				let delta = lastScalingDist - dist;
				if (delta < 0) {
					zoomIn(1 + Math.abs(delta) * 0.003);
				} else {
					zoomOut(1 + Math.abs(delta) * 0.003);
				}
			}
			lastScalingDist = dist;
		} else {
			let movePos = getToucheOffsetPos(ev, 0);
			
			glWindow.move(movePos.x - lastMovePos.x, movePos.y - lastMovePos.y);
			glWindow.draw();
			lastMovePos = movePos;
		}
	});

	cvs.addEventListener("contextmenu", (ev) => {ev.preventDefault(); return false;});

	// ***************************************************
	// ***************************************************
	// Helper Functions
	//

	function getToucheOffsetPos(touchEv, touchIndex=0) {
		var rect = touchEv.target.getBoundingClientRect();
		var x = touchEv.targetTouches[touchIndex].pageX - rect.left;
		var y = touchEv.targetTouches[touchIndex].pageY - rect.top;

		return {x: x, y: y};
	}

	const pickColor = (pos) => {
		pos = glWindow.click(pos);

		let colorI = place.getPixelColorIndex(Math.floor(pos.x), Math.floor(pos.y));
		if(colorI == undefined || colorI < 0)
			return;

		colorIndex = colorI;
		zoomCurrentColorCase();	
	}

	const drawPixel = (pos, color) => {
		pos = glWindow.click(pos);
		
		if(pos) {
			const oldColorIndex = place.getPixelColorIndex(Math.floor(pos.x), Math.floor(pos.y));
						
			if (oldColorIndex != colorIndex) {
				place.setPixel(pos.x, pos.y, colorIndex);
				return true;
			}
		}
		return false;
	}

	const zoomIn = (factor) => {
		let zoom = glWindow.getZoom();
		glWindow.setZoom(zoom * factor);
		glWindow.draw();
	}

	const zoomOut = (factor) => {
		let zoom = glWindow.getZoom();
		glWindow.setZoom(zoom / factor);
		glWindow.draw();
	}
}