class Pellet{
	static create(type,classes,text,appendLocation,cssText){
		let element = document.createElement(type);
		if(Array.isArray(classes)){
			element.classList.add(...classes);
			if(classes.includes("newTab")){
				element.setAttribute("target","_blank");
			}
		}
		else if(classes){
			if(classes[0] === "#"){
				element.id = classes.substring(1);
			}
			else{
				element.classList.add(classes);
				if(classes === "newTab"){
					element.setAttribute("target","_blank");
				}
			}
		};
		if(text || text === 0){
			element.innerText = text;
		};
		if(appendLocation && appendLocation.appendChild){
			appendLocation.appendChild(element)
		};
		if(cssText){
			element.style.cssText = cssText
		};
		return element
	};
	initCSS(){
		if(!document.getElementById("pelletSimulatorStylesheet")){
			let pelletStyle = Pellet.create("style");
			pelletStyle.id = "pelletSimulatorStylesheet";
			pelletStyle.type = "text/css";
			pelletStyle.textContent = `
body{
	--pellet-primary: 61,180,242;
}
.pelletSimulator{
	width: 1220px;
	height: 675px;
	border-style: solid;
	border-width: 2px;
	border-color: black;
	position: relative;
	border-radius: 2px;
}
.pelletSimulator .graphics{
	width: 900px;
	height: 675px;
	position: absolute;
	left: 0px;
	top: 0px;
}
.pelletSimulator .controls{
	width: 320px;
	height: 675px;
	position: absolute;
	right: 0px;
	top: 0px;
	border-left-style: solid;
	border-width: 1px;
	border-color: black;
}
.pelletSimulator .tabs{
	border-bottom-style: solid;
	border-bottom-width: 1px;
}
.pelletSimulator .tab{
	width: 40%;
	display: inline-block;
	padding: 5px;
	margin: 5px;
	cursor: pointer;
	border-style: solid;
	border-width: 1px;
	border-radius: 2px;
}
.pelletSimulator .tab.active{
	background: rgb(var(--pellet-primary));
}
.pelletSimulator .controlContent{
	padding: 4px;
}
.pelletSimulator .cameraControls{
	background: rgb(255,255,255,0.3);
	opacity: 0.9;
	display: flex;
	flex-direction: row;
	justify-content: space-around;
}
.pelletSimulator .control{
	background: rgb(255,255,255,0.5);
	font-weight: bold;
	font-size: 250%;
	cursor: pointer;
	padding: 4px;
	border-style: solid;
	border-width: 1px;
	margin: 4px;
	top: 3px;
	position: relative;
	border-radius: 4px;
	box-shadow: 0px 0px 3px black;
	display: inline-block;
	min-width: 50px;
	text-align: center;
	height: 57px;
	user-select: none;
}
.pelletSimulator .control:hover{
	background: rgb(var(--pellet-primary));
}
.pelletSimulator .control.active{
	background: rgb(var(--pellet-primary));
	box-shadow: 0px 0px 0px black;
}
.pelletSimulator .graphicsCanvas{
	cursor: move;
}
.pelletSimulator .overlay{
	width: 100%;
	height: 100%;
	position: absolute;
	top: 0px;
	left: 0px;
	cursor: crosshair;
}
.pelletSimulator .objectInfo{
	color: white;
	display: flex;
	justify-content: space-around;
}
			`
			let documentHead = document.querySelector("head");
			if(documentHead){
				documentHead.appendChild(pelletStyle)
			}
		}
	}
	constructor(element,config,scenario){
		const internalSimulator = this;
		let create = Pellet.create;
		this.graphics = {
			background: "black",
			bodyColor: "white",
			showNames: true,
			pelletRadius: 2,
			x: 0,
			y: 0,
			coRotation: true,
			angle: 0,
			frameRate: 24,
			viewMode: "barycentric",
			fade: 0.01,
			paused: false,
			drawPrimary: true,
			drawSecondary: true,
			drawBaryCenter: false,
			drawLpoints: false,
			scale: 1000000,
			colorFunc: function(num){
				return "hsl(" + Math.round(num*270) + ",100%,50%)";
			}
		};
		this.physics = {
			physicsPerGraphics: 200,
			pelletNumber: 100,
			vanishPoint: 5,
			speed: 20000,
			time: 0,
			semiMajor: 384399000,
			primaryMass: 5.97237e24,
			secondaryMass: 7.342e22,
			primaryRadius: 6600000,
			secondaryRadius: 1728000,
			G: 6.67430e-11,
			period: 27.321661*86400,
			primaryCollisions: 0,
			secondaryCollisions: 0,
			escaped: 0
		}
		this.pellets = [
		];
		this.DOMlocation = element;
		let simulator = create("div","pelletSimulator",false,element);
		let drawArea = create("div","graphics",false,simulator,"position:relative");
		let controls = create("div","controls",false,simulator);
		let tabs = create("div","tabs",false,controls);
		let controlContent = create("div","controlContent",`
This is a gravity simulator

It simulates a circulary restricted three body system (CR3BP)

Its core mechanism is launching clounds of "pellets" over a range of velocities, to help find very sensitive trajectories

Click the '+' button in the bottom left to add some pellets
		`,controls);
		[
			{tab: "System"},
			{tab: "Physics",
				ui: function(){
					create("p","label","Simulation speed:",controlContent);
					let speedValue = create("input",false,false,controlContent);
						speedValue.setAttribute("type","number");
						speedValue.setAttribute("min",0);
						speedValue.value = internalSimulator.physics.speed;
					speedValue.oninput = function(){
						internalSimulator.physics.speed = speedValue.value
					}
				}
			},
			{tab: "Graphics",
				ui: function(){
					create("p","label","Fade paths:",controlContent);
					let rangeInput = create("input",false,false,controlContent,"max-width:70%");
						rangeInput.setAttribute("type","range");
						rangeInput.setAttribute("min",0);
						rangeInput.setAttribute("max",1);
						rangeInput.setAttribute("step",0.01);
					rangeInput.value = internalSimulator.graphics.fade;
					let rangeInputValue = create("input",false,false,controlContent,"max-width:25%");
						rangeInputValue.setAttribute("type","number");
						rangeInputValue.setAttribute("min",0);
						rangeInputValue.setAttribute("max",1);
						rangeInputValue.setAttribute("step",".01");
					rangeInputValue.value = internalSimulator.graphics.fade;
					rangeInput.oninput = function(){
						rangeInputValue.value = rangeInput.value;
						internalSimulator.graphics.fade = rangeInput.value;
					}
					rangeInputValue.oninput = function(){
						rangeInput.value = rangeInputValue.value;
						internalSimulator.graphics.fade = rangeInputValue.value;
					};
					create("br",false,false,controlContent);
					create("br",false,false,controlContent);
					let viewL = create("input",false,false,controlContent);
					viewL.setAttribute("type","checkbox");
					viewL.checked = internalSimulator.graphics.drawLpoints;
					viewL.oninput = function(){
						internalSimulator.graphics.drawLpoints = viewL.checked
					}
					create("span","label"," Draw L-points",controlContent);
					create("br",false,false,controlContent);
					create("br",false,false,controlContent);
					let fpsInput = create("input",false,false,controlContent,"max-width:25%");
						fpsInput.setAttribute("type","number");
						fpsInput.setAttribute("min",0);
						fpsInput.setAttribute("max",60);
						fpsInput.value = internalSimulator.graphics.frameRate;
					fpsInput.oninput = function(){
						internalSimulator.graphics.frameRate = fpsInput.value;
						clearInterval(internalSimulator.graphicsLoop);
						internalSimulator.graphicsLoop = setInterval(function(){internalSimulator.drawGraphics(internalSimulator)},Math.round(1000/internalSimulator.graphics.frameRate));
					}
					create("span","label"," FPS",controlContent);
				}
			},
			{tab: "Pellets",
				ui: function(){
					create("p","label","Pellets per batch:",controlContent);
					let pelletNumberValue = create("input",false,false,controlContent);
						pelletNumberValue.setAttribute("type","number");
						pelletNumberValue.setAttribute("min",1);
						pelletNumberValue.setAttribute("step",1);
						pelletNumberValue.value = internalSimulator.physics.pelletNumber;
					pelletNumberValue.oninput = function(){
						internalSimulator.physics.pelletNumber = pelletNumberValue.value
					}
				}
			},
			{tab: "Scenarios"},
			{tab: "Import/Export"}
		].forEach(tab => {
			let tabButton = create("span","tab",tab.tab,tabs);
			tabButton.onclick = function(){
				if(tabs.querySelector(".active")){
					tabs.querySelector(".active").classList.remove("active")
				}
				tabButton.classList.add("active")
				while(controlContent.childElementCount){
					controlContent.lastChild.remove()
				}
				create("h2","heading",tab.tab,controlContent);
				tab.ui()
			}
		});
		let canvas = create("canvas","graphicsCanvas",false,drawArea,"width:100%;height:100%;");
		this.canvas = canvas;
		canvas.width = 900;
		canvas.height = 675;
		this.ctx = canvas.getContext("2d");
		canvas.onmousedown = function(event){
			if(event.buttons === 1){
				let deltaX = internalSimulator.graphics.x;
				let deltaY = internalSimulator.graphics.y;
				let moveHandler = function(eventMove){
					internalSimulator.graphics.x = deltaX - event.clientX + eventMove.clientX;
					internalSimulator.graphics.y = deltaY + event.clientY - eventMove.clientY;
					internalSimulator.drawGraphics(internalSimulator,true)
				};
				let upHandler = function(eventUp){
					document.removeEventListener("mousemove",moveHandler);
					document.removeEventListener("mouseup",upHandler);
				};
				document.addEventListener("mousemove",moveHandler);
				document.addEventListener("mouseup",upHandler);
			}
		}
		let cameraControls = create("div","cameraControls",false,drawArea,"width:100%;position:absolute;bottom:0px;height:80px");
		let objectInfo = create("div","objectInfo",false,drawArea,"width:100%;position:absolute;top:0px;height:60px");

		this.initCSS()

		if(scenario){
			loadScenario(
				Pellet.scenarios.find(elem => elem.name === scenario)
			)
		}
		internalSimulator.drawGraphics(internalSimulator,true);
		this.graphicsLoop = setInterval(function(){internalSimulator.drawGraphics(internalSimulator)},Math.round(1000/internalSimulator.graphics.frameRate));
		let addPelletsControl = create("span","control","+",cameraControls,"color:green");
			addPelletsControl.title = "Add pellets";
		let pauseControl = create("span","control","▮▮",cameraControls);
			pauseControl.title = "Pause";
		pauseControl.onclick = function(){
			if(internalSimulator.graphics.paused === true){
				internalSimulator.graphicsLoop = setInterval(function(){internalSimulator.drawGraphics(internalSimulator)},Math.round(1000/internalSimulator.graphics.frameRate));
				internalSimulator.graphics.paused = false;
				pauseControl.innerText = "▮▮";
				pauseControl.title = "Pause";
			}
			else{
				clearInterval(internalSimulator.graphicsLoop);
				internalSimulator.graphics.paused = true;
				pauseControl.innerText = "▶";
				pauseControl.title = "Start";
			}
		}
		let zoomControls = create("span",false,false,cameraControls);
		let zoomInControl = create("span","control","🔍+",zoomControls);
			zoomInControl.title = "Zoom in";
			zoomInControl.onclick = function(){
				internalSimulator.graphics.scale = internalSimulator.graphics.scale/2;
				internalSimulator.drawGraphics(internalSimulator,true)
			}
		let zoomOutControl = create("span","control","🔍—",zoomControls);
			zoomOutControl.title = "Zoom out";
			zoomOutControl.onclick = function(){
				internalSimulator.graphics.scale = internalSimulator.graphics.scale*2;
				internalSimulator.drawGraphics(internalSimulator,true)
			}

		let focusControls = create("span",false,false,cameraControls);
		let focusPrimaryControl = create("span","control",false,focusControls);
			focusPrimaryControl.title = "Focus on primary body";
			focusPrimaryControl.innerHTML = `
<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="90" height="50" viewBox="0 0 90 50">
	<g stroke="black" stroke-width="4" fill="none">
		<circle cx="25" cy="25" r="20" fill="green"/>
		<circle cx="75" cy="25" r="10"/>
		<line x1="48" x2="62" y1="18" y2="32"/>
		<line x1="48" x2="62" y1="32" y2="18"/>
	</g>
</svg>`;
		let focusBaryControl = create("span",["control","active"],false,focusControls);
			focusBaryControl.title = "Focus on barycentre";
			focusBaryControl.innerHTML = `
<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="90" height="50" viewBox="0 0 90 50">
	<g stroke="black" stroke-width="4" fill="none">
		<circle cx="25" cy="25" r="20"/>
		<circle cx="75" cy="25" r="10"/>
		<line x1="48" x2="62" y1="18" y2="32" stroke="green"/>
		<line x1="48" x2="62" y1="32" y2="18" stroke="green"/>
	</g>
</svg>`;
		let focusSecondaryControl = create("span","control",false,focusControls);
			focusSecondaryControl.title = "Focus on secondary body";
			focusSecondaryControl.innerHTML = `
<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="90" height="50" viewBox="0 0 90 50">
	<g stroke="black" stroke-width="4" fill="none">
		<circle cx="25" cy="25" r="20"/>
		<circle cx="75" cy="25" r="10" fill="green"/>
		<line x1="48" x2="62" y1="18" y2="32"/>
		<line x1="48" x2="62" y1="32" y2="18"/>
	</g>
</svg>`;
		let focusRotatingControl = create("span","control",false,focusControls);
			focusRotatingControl.title = "Co-rotating frame of reference";
			focusRotatingControl.innerHTML = `
<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="90" height="50" viewBox="0 0 90 50">
	<g stroke="black" stroke-width="4" fill="none">
		<circle cx="25" cy="25" r="20" fill="green"/>
		<circle cx="75" cy="25" r="10" fill="green"/>
		<line x1="48" x2="62" y1="18" y2="32" stroke="green"/>
		<line x1="48" x2="62" y1="32" y2="18" stroke="green"/>
	</g>
</svg>`;
		focusPrimaryControl.onclick = function(){
			internalSimulator.graphics.viewMode = "primary";
			internalSimulator.drawGraphics(internalSimulator,true);
			let active = focusControls.querySelector(".active");
			
			if(active){
				active.classList.remove("active")
			}
			focusPrimaryControl.classList.add("active")
		}
		focusBaryControl.onclick = function(){
			internalSimulator.graphics.viewMode = "barycentric";
			internalSimulator.drawGraphics(internalSimulator,true);
			let active = focusControls.querySelector(".active");
			if(active){
				active.classList.remove("active")
			}
			focusBaryControl.classList.add("active")
		}
		focusSecondaryControl.onclick = function(){
			internalSimulator.graphics.viewMode = "secondary";
			internalSimulator.drawGraphics(internalSimulator,true);
			let active = focusControls.querySelector(".active");
			if(active){
				active.classList.remove("active")
			}
			focusSecondaryControl.classList.add("active")
		}
		focusRotatingControl.onclick = function(){
			internalSimulator.graphics.viewMode = "co-rotating";
			internalSimulator.drawGraphics(internalSimulator,true);
			let active = focusControls.querySelector(".active");
			if(active){
				active.classList.remove("active")
			}
			focusRotatingControl.classList.add("active")
		}


		let resetControl = create("span","control","⟳",cameraControls);
			resetControl.title = "Reset";
		resetControl.onclick = function(){
			internalSimulator.physics.time = 0;
			internalSimulator.physics.escaped = 0;
			internalSimulator.physics.primaryCollisions = 0;
			internalSimulator.physics.secondaryCollisions = 0;
			internalSimulator.pellets = [];
			internalSimulator.drawGraphics(internalSimulator,true);
		}
		addPelletsControl.onclick = function(e){
			let overlay = document.createElementNS("http://www.w3.org/2000/svg","svg");
			overlay.classList.add("overlay");
			drawArea.appendChild(overlay);
			let clickNumber = 0;
			let previousClick;
			let secondClick;
			let positioner = function(e){
				let rect = overlay.getBoundingClientRect();
				let arrow = document.createElementNS("http://www.w3.org/2000/svg","line");
				arrow.setAttribute("stroke","red");
				arrow.setAttribute("stroke-width",2);
				let range = document.createElementNS("http://www.w3.org/2000/svg","g");
				range.setAttribute("stroke","blue");
				range.setAttribute("stroke-width",2);
				let rangeLine1 = document.createElementNS("http://www.w3.org/2000/svg","line");
				let rangeLine2 = document.createElementNS("http://www.w3.org/2000/svg","line");
				let rangeLine3 = document.createElementNS("http://www.w3.org/2000/svg","line");
				let rangeLine4 = document.createElementNS("http://www.w3.org/2000/svg","line");
				let rangeLine5 = document.createElementNS("http://www.w3.org/2000/svg","line");
				let circle = document.createElementNS("http://www.w3.org/2000/svg","circle");
				let circle2 = document.createElementNS("http://www.w3.org/2000/svg","circle");
				let circleCaption = document.createElementNS("http://www.w3.org/2000/svg","text");
				circleCaption.appendChild(document.createTextNode("circular velocity"));
				let circleCaption2 = document.createElementNS("http://www.w3.org/2000/svg","text");
				circleCaption2.appendChild(document.createTextNode("escape velocity"));
				range.appendChild(rangeLine1);
				range.appendChild(rangeLine2);
				range.appendChild(rangeLine3);
				range.appendChild(rangeLine4);
				range.appendChild(rangeLine5);
				circle.setAttribute("stroke","grey");
				circle.setAttribute("stroke-width",1);
				circle2.setAttribute("stroke","grey");
				circle2.setAttribute("stroke-width",1);
				circleCaption.setAttribute("fill","grey");
				circleCaption2.setAttribute("fill","grey");
				circle.setAttribute("fill","none");
				circle2.setAttribute("fill","none");
				let arrowDrawer = function(e){
					if(clickNumber > 1){
						overlay.removeEventListener("mousemove",arrowDrawer);
						return
					}
					let x = e.clientX - rect.left;
					let y = e.clientY - rect.top;
					arrow.setAttribute("x2",x);
					arrow.setAttribute("y2",y);
				};
				let combinedMass = internalSimulator.physics.primaryMass + internalSimulator.physics.secondaryMass;
				let longArm = internalSimulator.physics.semiMajor * internalSimulator.physics.primaryMass/combinedMass;
				let rangeDrawer = function(e){
					let x = e.clientX - rect.left;
					let y = e.clientY - rect.top;
					
					let delta_x = (secondClick.x - previousClick.x)/Math.hypot(secondClick.x - previousClick.x,secondClick.y - previousClick.y);
					let delta_y = (secondClick.y - previousClick.y)/Math.hypot(secondClick.x - previousClick.x,secondClick.y - previousClick.y);

					/*if(Math.abs(delta_x) > Math.abs(delta_y)){
						length = (x - secondClick.x)/delta_x
					}
					else{
						length = (y - secondClick.y)/delta_y
					}*/
					let length = (x - secondClick.x) * delta_x + (y - secondClick.y) * delta_y;
					if(clickNumber > 2){
						overlay.removeEventListener("mousemove",rangeDrawer);
						overlay.remove();
						let coords = internalSimulator.canvasToReal(previousClick.x,previousClick.y);
						let typicalSpeed = 2*Math.PI*longArm/internalSimulator.physics.period;
						let angle = (internalSimulator.physics.time / internalSimulator.physics.period) * 2 * Math.PI;
						let adjust_x = 0;
						let adjust_y = 0;
						let adjust_speed = function(vx,vy){
							return [vx || 0,vy || 0]
						}
						if(internalSimulator.graphics.viewMode === "secondary"){
							adjust_x = - Math.sin(angle) * typicalSpeed;
							adjust_y = Math.cos(angle) * typicalSpeed;
						}
						else if(internalSimulator.graphics.viewMode === "primary"){
							adjust_x = Math.sin(angle) * typicalSpeed * internalSimulator.physics.secondaryMass/internalSimulator.physics.primaryMass;
							adjust_y = - Math.cos(angle) * typicalSpeed * internalSimulator.physics.secondaryMass/internalSimulator.physics.primaryMass;
						}
						else if(internalSimulator.graphics.viewMode === "co-rotating"){
							adjust_speed = function(vx,vy){
								let angle2 = (internalSimulator.physics.time / internalSimulator.physics.period) * 2 * Math.PI;
								return [
									(vx * Math.cos(x) - vy * Math.sin(angle2)) || 0,
									(vy * Math.cos(x) + vx * Math.sin(angle2)) || 0
								]
							}
						}
						if(internalSimulator.physics.pelletNumber === 1){
							internalSimulator.pellets.push([
								...coords,
								...adjust_speed(-typicalSpeed*(previousClick.x - secondClick.x)/100 + adjust_x,
								typicalSpeed*(previousClick.y - secondClick.y)/100 + adjust_y),
								0.5
							]);
						}
						else{
							let lengthFraction = length/Math.hypot(previousClick.x - secondClick.x,previousClick.y - secondClick.y);
							let deltaDist = 2*lengthFraction/(internalSimulator.physics.pelletNumber - 1);
							for(let i=0;i<internalSimulator.physics.pelletNumber;i++){
								internalSimulator.pellets.push([
									...coords,
									...adjust_speed(-typicalSpeed*(previousClick.x - secondClick.x)*(1 - lengthFraction + i*deltaDist)/100 + adjust_x,
									typicalSpeed*(previousClick.y - secondClick.y)*(1 - lengthFraction + i*deltaDist)/100 + adjust_y),
									i/(internalSimulator.physics.pelletNumber - 1)
								]);
							}
						}
						internalSimulator.drawGraphics(internalSimulator,false,true);
						return
					}

					rangeLine1.setAttribute("x1",secondClick.x - length*delta_x + 7*delta_y);
					rangeLine1.setAttribute("x2",secondClick.x + length*delta_x + 7*delta_y);
					rangeLine1.setAttribute("y1",secondClick.y - length*delta_y - 7*delta_x);
					rangeLine1.setAttribute("y2",secondClick.y + length*delta_y - 7*delta_x);
					rangeLine2.setAttribute("x1",secondClick.x - length*delta_x - 7*delta_y);
					rangeLine2.setAttribute("x2",secondClick.x + length*delta_x - 7*delta_y);
					rangeLine2.setAttribute("y1",secondClick.y - length*delta_y + 7*delta_x);
					rangeLine2.setAttribute("y2",secondClick.y + length*delta_y + 7*delta_x);
					rangeLine3.setAttribute("x1",secondClick.x + 10*delta_y);
					rangeLine3.setAttribute("x2",secondClick.x - 10*delta_y);
					rangeLine3.setAttribute("y1",secondClick.y - 10*delta_x);
					rangeLine3.setAttribute("y2",secondClick.y + 10*delta_x);
					rangeLine4.setAttribute("x1",secondClick.x + length*delta_x + 10*delta_y);
					rangeLine4.setAttribute("x2",secondClick.x + length*delta_x - 10*delta_y);
					rangeLine4.setAttribute("y1",secondClick.y + length*delta_y - 10*delta_x);
					rangeLine4.setAttribute("y2",secondClick.y + length*delta_y + 10*delta_x);
					rangeLine5.setAttribute("x1",secondClick.x - length*delta_x + 10*delta_y);
					rangeLine5.setAttribute("x2",secondClick.x - length*delta_x - 10*delta_y);
					rangeLine5.setAttribute("y1",secondClick.y - length*delta_y - 10*delta_x);
					rangeLine5.setAttribute("y2",secondClick.y - length*delta_y + 10*delta_x);
				}
				if(e.target === overlay || e.target.parentElement === overlay || e.target.parentElement.parentElement === overlay){
					let x = e.clientX - rect.left;
					let y = e.clientY - rect.top;
					arrow.setAttribute("x1",x);
					arrow.setAttribute("x2",x);
					arrow.setAttribute("y1",y);
					arrow.setAttribute("y2",y);
					if(clickNumber === 0){
						let cross = document.createElementNS("http://www.w3.org/2000/svg","line");
						cross.setAttribute("x1",x - 20);
						cross.setAttribute("x2",x + 20);
						cross.setAttribute("y1",y - 20);
						cross.setAttribute("y2",y + 20);
						cross.setAttribute("stroke","green");
						cross.setAttribute("stroke-width",2);
						let cross2 = document.createElementNS("http://www.w3.org/2000/svg","line");
						cross2.setAttribute("x1",x - 20);
						cross2.setAttribute("x2",x + 20);
						cross2.setAttribute("y1",y + 20);
						cross2.setAttribute("y2",y - 20);
						cross2.setAttribute("stroke","green");
						cross2.setAttribute("stroke-width",2);
						circle.setAttribute("cx",x);
						circle.setAttribute("cy",y);
						circle2.setAttribute("cx",x);
						circle2.setAttribute("cy",y);
						circleCaption.setAttribute("x",x);
						circleCaption2.setAttribute("x",x);
						let dist = 100/Math.sqrt(Math.hypot(...internalSimulator.canvasToReal(x,y))/longArm);
						circleCaption.setAttribute("y",y - dist - 10);
						circleCaption2.setAttribute("y",y - dist*Math.SQRT2 - 10);
						circle.setAttribute("r",dist);
						circle2.setAttribute("r",dist*Math.SQRT2);
						overlay.appendChild(cross);
						overlay.appendChild(cross2);
						overlay.appendChild(arrow);
						overlay.appendChild(circle);
						overlay.appendChild(circleCaption);
						overlay.appendChild(circle2);
						overlay.appendChild(circleCaption2);
						overlay.addEventListener("mousemove",arrowDrawer);
						clickNumber = 1;
						previousClick = {x:x,y:y};
					}
					else if(clickNumber === 1){
						overlay.appendChild(range);
						overlay.addEventListener("mousemove",rangeDrawer);
						clickNumber = 2
						secondClick = {x:x,y:y};
					}
					else if(clickNumber === 2){
						clickNumber = 3;
						rangeDrawer(e);
					}
				}
				else if(e.target === addPelletsControl){
					return//the initial click
				}
				else{
					overlay.remove();
					document.removeEventListener("click",positioner);
					overlay.removeEventListener("mousemove",arrowDrawer);
				}
			}
			document.addEventListener("click",positioner);
		}
	}
	canvasToReal(x,y){
		let graphics = this.graphics;
		let physics = this.physics;
		if(graphics.viewMode === "barycentric"){
			return [
				(x - this.canvas.width/2 - graphics.x)*graphics.scale,
				-(y - this.canvas.height/2 + graphics.y)*graphics.scale
			]
		}
		else{
			let combinedMass = physics.primaryMass + physics.secondaryMass;
			let angle = (physics.time / physics.period) * 2 * Math.PI;
			if(graphics.viewMode === "primary"){
				let shortArm = physics.semiMajor * physics.secondaryMass/combinedMass;
				let prim_x = -shortArm * Math.cos(angle);
				let prim_y = -shortArm * Math.sin(angle);
				return [
					(x - this.canvas.width/2 - graphics.x)*graphics.scale + prim_x,
					-(y - this.canvas.height/2 + graphics.y)*graphics.scale + prim_y
				]
			}
			else if(graphics.viewMode === "secondary"){
				let longArm = physics.semiMajor * physics.primaryMass/combinedMass;
				let seco_x = longArm * Math.cos(angle);
				let seco_y = longArm * Math.sin(angle);
				return [
					(x - this.canvas.width/2 - graphics.x)*graphics.scale + seco_x,
					-(y - this.canvas.height/2 + graphics.y)*graphics.scale + seco_y
				]
			}
			else if(graphics.viewMode === "co-rotating"){
				let brav = [
					(x - this.canvas.width/2 - graphics.x)*graphics.scale,
					-(y - this.canvas.height/2 + graphics.y)*graphics.scale
				];
				return [
					brav[0] * Math.cos(angle) - brav[1] * Math.sin(angle),
					brav[1] * Math.cos(angle) + brav[0] * Math.sin(angle)
				]
			}
		}
	}
	realToCanvas(x,y){
		let graphics = this.graphics;
		let physics = this.physics;
		if(graphics.viewMode === "barycentric"){
			return [
				this.canvas.width/2  + x/graphics.scale + graphics.x,
				this.canvas.height/2 - y/graphics.scale - graphics.y
			]
		}
		else{
			let combinedMass = physics.primaryMass + physics.secondaryMass;
			let angle = (physics.time / physics.period) * 2 * Math.PI;
			if(graphics.viewMode === "primary"){
				let shortArm = physics.semiMajor * physics.secondaryMass/combinedMass;
				let prim_x = -shortArm * Math.cos(angle);
				let prim_y = -shortArm * Math.sin(angle);
				return [
					this.canvas.width/2  + (x - prim_x)/graphics.scale + graphics.x,
					this.canvas.height/2 - (y - prim_y)/graphics.scale - graphics.y
				]
			}
			else if(graphics.viewMode === "secondary"){
				let longArm = physics.semiMajor * physics.primaryMass/combinedMass;
				let seco_x = longArm * Math.cos(angle);
				let seco_y = longArm * Math.sin(angle);
				return [
					this.canvas.width/2  + (x - seco_x)/graphics.scale + graphics.x,
					this.canvas.height/2 - (y - seco_y)/graphics.scale - graphics.y
				]
			}
			else if(graphics.viewMode === "co-rotating"){
				return [
					this.canvas.width/2  + (x*Math.cos(angle) + y*Math.sin(angle))/graphics.scale + graphics.x,
					this.canvas.height/2 + (x*Math.sin(angle) - y*Math.cos(angle))/graphics.scale - graphics.y
				]
			}
		}
	}
	drawGraphics(instance,reload,onlyPellets){
		let ctx = instance.ctx;
		if(!reload){
			ctx.globalAlpha = instance.graphics.fade
		}
		ctx.fillStyle = instance.graphics.background;
		ctx.fillRect(0,0,instance.canvas.width,instance.canvas.height);
		const deltaTime = instance.physics.speed/(instance.graphics.frameRate * instance.physics.physicsPerGraphics);
		ctx.globalAlpha = 1;
		let combinedMass = instance.physics.primaryMass + instance.physics.secondaryMass;
		let longArm = instance.physics.semiMajor * instance.physics.primaryMass/combinedMass;
		let shortArm = instance.physics.semiMajor * instance.physics.secondaryMass/combinedMass;
		let angle;
		let prim_x;
		let prim_y;
		let seco_x;
		let seco_y;
		if(reload || onlyPellets){
			angle = (instance.physics.time / instance.physics.period) * 2 * Math.PI;
			prim_x = -shortArm * Math.cos(angle);
			prim_y = -shortArm * Math.sin(angle);
			seco_x = longArm * Math.cos(angle);
			seco_y = longArm * Math.sin(angle);
		}
		else{
			for(let i=0;i<instance.physics.physicsPerGraphics;i++){
				instance.physics.time += deltaTime;
				angle = (instance.physics.time / instance.physics.period) * 2 * Math.PI;
				prim_x = -shortArm * Math.cos(angle);
				prim_y = -shortArm * Math.sin(angle);
				seco_x = longArm * Math.cos(angle);
				seco_y = longArm * Math.sin(angle);
				instance.pellets = instance.pellets.map(pellet => {
					let delta_prim_x = pellet[0] - prim_x;
					let delta_prim_y = pellet[1] - prim_y;
					let delta_seco_x = pellet[0] - seco_x;
					let delta_seco_y = pellet[1] - seco_y;
					let square_prim = delta_prim_x*delta_prim_x + delta_prim_y*delta_prim_y;
					let square_seco = delta_seco_x*delta_seco_x + delta_seco_y*delta_seco_y;
					let primaryInfluence = instance.physics.primaryMass * instance.physics.G/square_prim;
					let secondaryInfluence = instance.physics.secondaryMass * instance.physics.G/square_seco;
					if(square_prim < instance.physics.primaryRadius*instance.physics.primaryRadius){
						instance.physics.primaryCollisions++
						return false
					}
					if(square_seco < instance.physics.secondaryRadius*instance.physics.secondaryRadius){
						instance.physics.secondaryCollisions++
						return false
					}
					return [
						pellet[0] + pellet[2]*deltaTime,
						pellet[1] + pellet[3]*deltaTime,
						pellet[2] - (delta_prim_x*primaryInfluence/Math.sqrt(square_prim) + delta_seco_x*secondaryInfluence/Math.sqrt(square_seco))*deltaTime,
						pellet[3] - (delta_prim_y*primaryInfluence/Math.sqrt(square_prim) + delta_seco_y*secondaryInfluence/Math.sqrt(square_seco))*deltaTime,
						pellet[4]
					]
				}).filter(e => e)
			};
			instance.pellets = instance.pellets.filter(pellet => {
				if(Math.hypot(pellet[0],pellet[1]) < instance.physics.vanishPoint*instance.physics.semiMajor){
					return true
				}
				else{
					instance.physics.escaped++;
					return false
				}
			})
		}
		//let coords = this.rtok(instance,prim_x,prim_y);
		ctx.fillStyle = instance.graphics.bodyColor;
		ctx.beginPath();
		let primaryCoords = instance.realToCanvas(prim_x,prim_y);
		let scaleRad = instance.physics.primaryRadius/instance.graphics.scale;
		if(primaryCoords[0] + scaleRad < 0){
			if(primaryCoords[1] + scaleRad < 0){
				ctx.moveTo(0,0);
				ctx.lineTo(20,18);
				ctx.lineTo(18,20);
				ctx.closePath();
			}
			else if(primaryCoords[1] - scaleRad > instance.canvas.height){
				ctx.moveTo(0,instance.canvas.height);
				ctx.lineTo(20,instance.canvas.height - 18);
				ctx.lineTo(18,instance.canvas.height - 20);
				ctx.closePath();
			}
			else{
				ctx.moveTo(0,primaryCoords[1]);
				ctx.lineTo(20,primaryCoords[1] - 1);
				ctx.lineTo(20,primaryCoords[1] + 1);
				ctx.closePath();
			}
		}
		else if(primaryCoords[0] - scaleRad > instance.canvas.width){
			if(primaryCoords[1] + scaleRad < 0){
				ctx.moveTo(instance.canvas.width,0);
				ctx.lineTo(instance.canvas.width - 20,18);
				ctx.lineTo(instance.canvas.width - 18,20);
				ctx.closePath();
			}
			else if(primaryCoords[1] - scaleRad > instance.canvas.height){
				ctx.moveTo(instance.canvas.width,instance.canvas.height);
				ctx.lineTo(instance.canvas.width - 20,instance.canvas.height - 18);
				ctx.lineTo(instance.canvas.width - 18,instance.canvas.height - 20);
				ctx.closePath();
			}
			else{
				ctx.moveTo(instance.canvas.width,primaryCoords[1]);
				ctx.lineTo(instance.canvas.width - 20,primaryCoords[1] - 1);
				ctx.lineTo(instance.canvas.width - 20,primaryCoords[1] + 1);
				ctx.closePath();
			}
		}
		else if(primaryCoords[1] + scaleRad < 0){
			ctx.moveTo(primaryCoords[0],0);
			ctx.lineTo(primaryCoords[0] - 1,20);
			ctx.lineTo(primaryCoords[0] + 1,20);
			ctx.closePath();
		}
		else if(primaryCoords[1] - scaleRad  > instance.canvas.height){
			ctx.moveTo(primaryCoords[0],instance.canvas.height);
			ctx.lineTo(primaryCoords[0] - 1,instance.canvas.height - 20);
			ctx.lineTo(primaryCoords[0] + 1,instance.canvas.height - 20);
			ctx.closePath();
		}
		else{
			ctx.arc(...primaryCoords,Math.max(instance.physics.primaryRadius/instance.graphics.scale,1),0,2 * Math.PI);
		}
		primaryCoords = instance.realToCanvas(seco_x,seco_y);
		scaleRad = instance.physics.secondaryRadius/instance.graphics.scale;
		if(primaryCoords[0] + scaleRad < 0){
			if(primaryCoords[1] + scaleRad < 0){
				ctx.moveTo(0,0);
				ctx.lineTo(20,18);
				ctx.lineTo(18,20);
				ctx.closePath();
			}
			else if(primaryCoords[1] - scaleRad > instance.canvas.height){
				ctx.moveTo(0,instance.canvas.height);
				ctx.lineTo(20,instance.canvas.height - 18);
				ctx.lineTo(18,instance.canvas.height - 20);
				ctx.closePath();
			}
			else{
				ctx.moveTo(0,primaryCoords[1]);
				ctx.lineTo(20,primaryCoords[1] - 1);
				ctx.lineTo(20,primaryCoords[1] + 1);
				ctx.closePath();
			}
		}
		else if(primaryCoords[0] - scaleRad > instance.canvas.width){
			if(primaryCoords[1] + scaleRad < 0){
				ctx.moveTo(instance.canvas.width,0);
				ctx.lineTo(instance.canvas.width - 20,18);
				ctx.lineTo(instance.canvas.width - 18,20);
				ctx.closePath();
			}
			else if(primaryCoords[1] - scaleRad > instance.canvas.height){
				ctx.moveTo(instance.canvas.width,instance.canvas.height);
				ctx.lineTo(instance.canvas.width - 20,instance.canvas.height - 18);
				ctx.lineTo(instance.canvas.width - 18,instance.canvas.height - 20);
				ctx.closePath();
			}
			else{
				ctx.moveTo(instance.canvas.width,primaryCoords[1]);
				ctx.lineTo(instance.canvas.width - 20,primaryCoords[1] - 1);
				ctx.lineTo(instance.canvas.width - 20,primaryCoords[1] + 1);
				ctx.closePath();
			}
		}
		else if(primaryCoords[1] + scaleRad < 0){
			ctx.moveTo(primaryCoords[0],0);
			ctx.lineTo(primaryCoords[0] - 1,20);
			ctx.lineTo(primaryCoords[0] + 1,20);
			ctx.closePath();
		}
		else if(primaryCoords[1] - scaleRad  > instance.canvas.height){
			ctx.moveTo(primaryCoords[0],instance.canvas.height);
			ctx.lineTo(primaryCoords[0] - 1,instance.canvas.height - 20);
			ctx.lineTo(primaryCoords[0] + 1,instance.canvas.height - 20);
			ctx.closePath();
		}
		else{
			ctx.arc(...primaryCoords,Math.max(instance.physics.secondaryRadius/instance.graphics.scale,1),0,2 * Math.PI);
		}
		ctx.fill();
		ctx.beginPath();
		ctx.strokeStyle = "red";
		ctx.arc(...instance.realToCanvas(0,0),instance.physics.vanishPoint*instance.physics.semiMajor/instance.graphics.scale,0,2*Math.PI);
		ctx.stroke();
		if(instance.graphics.drawLpoints){
			ctx.beginPath();
			let set1 = instance.realToCanvas(
				(seco_x + prim_x)/2 - instance.physics.semiMajor*Math.sqrt(3)*((seco_y - prim_y)/instance.physics.semiMajor)/2,
				(seco_y + prim_y)/2 + instance.physics.semiMajor*Math.sqrt(3)*((seco_x - prim_x)/instance.physics.semiMajor)/2
			);
			let set2 = instance.realToCanvas(
				(seco_x + prim_x)/2 + instance.physics.semiMajor*Math.sqrt(3)*((seco_y - prim_y)/instance.physics.semiMajor)/2,
				(seco_y + prim_y)/2 - instance.physics.semiMajor*Math.sqrt(3)*((seco_x - prim_x)/instance.physics.semiMajor)/2
			);
			ctx.strokeStyle = "red";
			ctx.moveTo(set1[0]-5,set1[1]-5);
			ctx.lineTo(set1[0]+5,set1[1]+5);
			ctx.moveTo(set1[0]+5,set1[1]-5);
			ctx.lineTo(set1[0]-5,set1[1]+5);
			ctx.moveTo(set2[0]-5,set2[1]-5);
			ctx.lineTo(set2[0]+5,set2[1]+5);
			ctx.moveTo(set2[0]+5,set2[1]-5);
			ctx.lineTo(set2[0]-5,set2[1]+5);
			ctx.stroke()
		}
		instance.pellets.forEach(pellet => {
			ctx.fillStyle = instance.graphics.colorFunc(pellet[4]);
			ctx.beginPath();
			let coords = this.realToCanvas(pellet[0],pellet[1]);
			ctx.arc(...coords,instance.graphics.pelletRadius,0,2 * Math.PI);
			ctx.fill();
		});
		let objectInfo = instance.DOMlocation.querySelector(".objectInfo");
		while(objectInfo.childElementCount){
			objectInfo.lastChild.remove()
		}
		if(instance.pellets.length){
			Pellet.create("span",false,"Objects: " + instance.pellets.length,objectInfo)
		}
		if(instance.physics.primaryCollisions){
			Pellet.create("span",false,"Primary collisions: " + instance.physics.primaryCollisions,objectInfo)
		}
		if(instance.physics.secondaryCollisions){
			Pellet.create("span",false,"Secondary collisions: " + instance.physics.secondaryCollisions,objectInfo)
		}
		if(instance.physics.escaped){
			Pellet.create("span",false,"Escaped: " + instance.physics.escaped,objectInfo)
		}
	}
	get scenarios(){
		return [
		]
	}
	loadScenario(scenario){
		if(!scenario){
			return
		}
	}
}
