//World Gen=============================
class ChunkGenWorld {
	constructor(chunkSize, chunkCount, superChunkSize, isSuper = false) {
		this.chunkGrid = [];
		this.chunkCount = chunkCount;
		this.chunkSize = chunkSize;
		this.superChunkSize = superChunkSize;

		for (var x = 0; x < chunkCount; x++) {
			this.chunkGrid[x] = [];
			for (var y = 0; y < chunkCount; y++) {
				var a, b, c, d;
				d = -3;
				var lowNum = function () {
					return Math.random() * (2 / 5);
				};

				if (!this.isSuper) {
					if (x == 0) {
						c = lowNum();
						a = lowNum();
					}
					if (y == 0) {
						b = lowNum();
						d = lowNum();
					}
					if (x >= chunkCount - 1) {
						b = lowNum();
						d = lowNum();
					}
					if (y >= chunkCount - 1) {
						c = lowNum();
						d = lowNum();
					}
				} else {
					if (x == 0) {
						c = Math.random();
					}
					if (y == 0) {
						b = Math.random();
						if (x == 0) {
							a = Math.random();
						}
					}
				}

				if (d == -3) {
					d = Math.random();
				}

				if (x > 0) {
					a = this.chunkGrid[x - 1][y].b;
					c = this.chunkGrid[x - 1][y].d;
				}
				if (y > 0) {
					a = this.chunkGrid[x][y - 1].c;
					b = this.chunkGrid[x][y - 1].d;
				}

				this.chunkGrid[x][y] = new Chunk(chunkSize, a, b, c, d);
			}
		}
	}
	GetMap() {
		var map = [];
		for (var x = 0; x < this.chunkCount; x++) {
			for (var y = 0; y < this.chunkCount; y++) {
				var theChunk = this.chunkGrid[x][y];
				var mapStartx = x * this.chunkSize;
				var mapStarty = y * this.chunkSize;

				for (var cx = 0; cx < theChunk.size; cx++) {
					for (var cy = 0; cy < theChunk.size; cy++) {
						if (!map[mapStartx + cx]) {
							map[mapStartx + cx] = [];
						}
						map[mapStartx + cx][mapStarty + cy] = theChunk.grid[cx][cy];
					}
				}
			}
		}
		if (this.isSuper) {
			var SuperGen = new ChunkGenWorld(this.chunkSize, this.superChunkSize);
			var superChunkMap = SuperGen.GetMap();
			for (var x = 0; x < map.length; x++) {
				for (var y = 0; y < map[0].length; y++) {
					var sx = Math.floor((superChunkMap.length * x) / map.length);
					var sy = Math.floor((superChunkMap.length * y) / map[0].length);

					var mod = superChunkMap[sx][sy];

					map[x][y] *= mod * 1.5;
				}
			}
		}
		return map;
	}
}
class Chunk {
	constructor(size, a, b, c, d) {
		this.grid = [];
		this.a = a;
		this.b = b;
		this.c = c;
		this.d = d;

		for (var x = 0; x < size; x++) {
			this.grid[x] = [];
			for (var y = 0; y < size; y++) {
				this.grid[x][y] = undefined;
			}
		}
		this.size = size;
		this.edge = size - 1;
		this.grid[0][0] = a;
		this.grid[this.edge][0] = b;
		this.grid[0][this.edge] = c;
		this.grid[this.edge][this.edge] = d;

		this.Interpolate();
	}

	Interpolate() {
		for (var x = 1; x < this.size - 1; x++) {
			var p = x / this.size;
			this.grid[x][0] = this.InterpValues(this.a, this.b, p);
			this.grid[x][this.edge] = this.InterpValues(this.c, this.d, p);
		}
		for (var x = 0; x < this.size; x++) {
			for (var y = 1; y < this.size - 1; y++) {
				var p = y / this.size;
				this.grid[x][y] = this.InterpValues(
					this.grid[x][0],
					this.grid[x][this.edge],
					p
				);
			}
		}
	}
	InterpValues(a, b, p) {
		return (b - a) * p + a;
	}
}

class BubbleWorldGen {
	constructor(resolution, bubbleCount, bubbleStrength) {
		this.bubbles = [];
		this.bubbleAmps = [];
		this.resolution = resolution;
		this.bubbleStrength = bubbleStrength;
		for (var i = 0; i < bubbleCount; i++) {
			this.bubbles[i] = new Vec2(
				0.1 + Math.random() * 0.8,
				0.1 + Math.random() * 0.8
			);
			//this.bubbleAmps[i] = Math.random();
		}
	}

	GetMap() {
		var output = [];
		for (var x = 0; x < this.resolution; x++) {
			output[x] = [];
			for (var y = 0; y < this.resolution; y++) {
				var value = 1;
				var point = new Vec2(x / this.resolution, y / this.resolution);
				for (var i = 0; i < this.bubbles.length; i++) {
					value *= this.bubbleStrength / point.distance(this.bubbles[i]); //*this.bubbleAmps[i];
				}

				output[x][y] = value * 0.8;
			}
		}
		return output;
	}
}
class Vec2 {
	constructor(x, y) {
		if (x.hasOwnProperty("x")) {
			var out = y.sub(x);
			this.x = out.x;
			this.y = out.y;
		} else {
			this.x = x;
			this.y = y;
		}
	}

	distance(vec) {
		var delta = this.sub(vec);
		return delta.magnitude();
	}

	add(vec) {
		return new Vec2(this.x + vec.x, this.y + vec.y);
	}
	sub(vec) {
		return new Vec2(this.x - vec.x, this.y - vec.y);
	}
	times(factor) {
		return new Vec2(this.x * factor, this.y * factor);
	}
	magnitude() {
		return Math.sqrt(this.x * this.x + this.y * this.y);
	}
	normalised() {
		var out = this.times(1 / this.magnitude());
		return new Vec2(out.x, out.y);
	}
	dot(vec) {
		return this.x * vec.x + this.y * vec.y;
	}
	angle(vec) {
		return Math.acos(
			(this.x * vec.x + this.y * vec.y) /
				Math.sqrt(this.x * this.x + this.y * this.y) /
				Math.sqrt(vec.x * vec.x + vec.y * vec.y)
		);
	}

	clone() {
		return new Vec2(this.x, this.y);
	}
}

class worleyAndChunkGen {
	constructor(resolution) {
		this.chunkGen = new ChunkGenWorld(resolution/10, resolution/5);
		this.bubble = new BubbleWorldGen(resolution, 4, 0.3);
	}
	GetMap() {
		var map = this.chunkGen.GetMap();
		var superChunkMap = this.bubble.GetMap();
		for (var x = 0; x < map.length; x++) {
			for (var y = 0; y < map[0].length; y++) {
				var sx = Math.floor((superChunkMap.length * x) / map.length);
				var sy = Math.floor((superChunkMap.length * y) / map[0].length);

				var mod = superChunkMap[sx][sy];

				map[x][y] *= mod;
			}
		}
		return map;
	}
}

//3D====================================

var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(
	40,
	window.innerWidth / window.innerHeight,
	0.1,
	1000
);
camera.rotation.x=-0.1;
camera.Update = function () {
	var rotationSpeed = 1 / 50000;
	var t = Date.now() * rotationSpeed +(MousePos.x*Math.PI*2);
	var r = 15;
	//this.rotation.x = MousePos.y;
	this.position.x = r * Math.sin(t);
	this.position.z = r * Math.cos(t);
	this.position.y = 2+MousePos.y*50 + 0.3+((1+Math.sin(t/2))*5);
	
	
	camera.lookAt( new THREE.Vector3() );

	//this.rotation.y+=0.01;
};

var renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

//Everything that can be updated.
var World = [camera];

function SetupScene() {
	//Lights
	scene.add(new THREE.AmbientLight(0xff22cc, 0.8));
	/*var dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
	dirLight.position.set(4, 1, 0);
	scene.add(dirLight);*/
	//Camera
	camera.position.set(0, 3, 10);

	//Sky
	var sky = new THREE.Mesh(
		new THREE.ConeGeometry(800, 400, 16),
		new THREE.MeshBasicMaterial({
			color: 0x9bd0fc,
			side: THREE.BackSide
		})
	);
	sky.rotation.y = Math.PI / 4;
	scene.add(sky);
	//Fog
	scene.fog = new THREE.Fog(0xffffff, 100, 450);

	//Sea
	var sea = new THREE.Mesh(
		new THREE.PlaneGeometry(800, 800, 80, 80),
		new THREE.MeshBasicMaterial({ color: 0x6c8eb3 })
	);
	sea.rotation.x = -Math.PI / 2;
	scene.add(sea);

	//Something to look at
	//var thing = new THREE.Mesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshBasicMaterial({color:0x444444}));
	//scene.add(thing);
}

//3DWorldGenMix=========================

function getPositionsInsideOfHight(minheight, maxHeight, heightMap) {
	var scale = 1 / heightMap.length;
	var output = [];
	for (var x = 0; x < heightMap.length; x++) {
		for (var y = 0; y < heightMap[x].length; y++) {
			var thisheight = heightMap[x][y];
			if (thisheight > minheight && thisheight < maxHeight) {
				var tout = new THREE.Vector3(x * scale - 0.5, 0, y * scale - 0.5);
				tout.coord = {x:x,y:y};
		
				
				output.push(tout);
			}
		}
	}
	return output;
	/*
	var shape = new THREE.Shape();
	shape.moveTo(0,0);
	var scale = 10/heightMap.length;
	for(var x = 0;x<heightMap.length;x++){
		for(var y = 0;y<heightMap[x].length;y++){
			var thisheight = heightMap[x][y];
			if(thisheight>height){
				shape.lineTo(x*scale,y*scale);
			}
		}
	}
	shape.lineTo(0,0);
	return shape;
	*/
}

//Island

class Island {
	constructor() {
		var resolution = 100;
		this.generator = new worleyAndChunkGen(resolution);
		this.layoutMap = this.generator.GetMap();
		var sandPosses = getPositionsInsideOfHight(2 / 5, 3 / 5, this.layoutMap);
		var sandMaterial = new THREE.MeshBasicMaterial({ color: 0xefdbb3 });
		this.sand = this.setupSand(
			sandMaterial,
			this.layoutMap.length*0.8,
			sandPosses,
			10,
			0.1,
			1.5
		);
		for (var i = 0; i < this.sand.length; i++) {
			scene.add(this.sand[i]);
		}

		var landPosses = getPositionsInsideOfHight(3 / 5, 1, this.layoutMap);
		var landMaterial = new THREE.MeshBasicMaterial({ color: 0xbfbcb3 });
		var landHeightGenerator = new ChunkGenWorld(resolution*2/5,5);
		var landHeights = landHeightGenerator.GetMap();
		var minLandHeight = Math.pow(Math.random(),1.4);
		var heightScale = (Math.pow(Math.random(),0.5)*2)+0.1;
		this.landmass = this.setupLand(
			landMaterial,
			this.layoutMap.length*0.7,
			landPosses,
			landHeights,
			10,
			minLandHeight,
			heightScale,
			1.2
		);
		for (var i = 0; i < this.landmass.length; i++) {
			scene.add(this.landmass[i]);
		}

		//Grass
		var grassMaterial = new THREE.MeshBasicMaterial({color:0x8aaa43});
		var grassposses = getPositionsInsideOfHight(3.5 / 5, 10000, this.layoutMap);
		var grassThickness = 0.1;
		this.grass = this.setupGrass(
			grassMaterial,
			this.layoutMap.length*0.7,
			grassposses,
			landHeights,
			10,
			minLandHeight+(grassThickness/2),
			heightScale,
			1,
			grassThickness
		);
		for (var i = 0; i < this.grass.length; i++) {
			scene.add(this.grass[i]);
		}
		
		
		this.cliffs = [];
	}
	setupSand(material, initArraySize, posses, scale, height, baseScale) {
		var unitSize = scale / initArraySize;
		var geometry = new THREE.CylinderGeometry(
			unitSize,
			unitSize * baseScale,
			height,
			5
		);
		var output = [];
		for (var i = 0; i < posses.length; i++) {
			var unit = new THREE.Mesh(geometry, material);
			var p = posses[i].multiplyScalar(scale);
			unit.rotation.y = Math.random()*2*Math.PI;
			unit.position.set(p.x, p.y, p.z);
			output.push(unit);
		}
		return output;
	}
	setupLand(material,initArraySize,posses,heights,scale,height,heightScale,baseScale){
		var unitSize = scale / initArraySize;
		
		var output = [];
		for (var i = 0; i < posses.length; i++) {
			
			var thisHeight = (heights[posses[i].coord.x][posses[i].coord.y]*heightScale)+height;
			var geometry = new THREE.CylinderGeometry(
				unitSize,
				unitSize * baseScale,
				thisHeight,
				10
			);
			var unit = new THREE.Mesh(geometry, material);
			var p = posses[i].multiplyScalar(scale);
			//unit.rotation.y = Math.random()*2*Math.PI;
			unit.position.set(p.x, p.y, p.z);
			output.push(unit);
		}
		return output;
	}
	setupGrass(material,initArraySize,posses,heights,scale,height,heightScale,baseScale,grassThickness){
		var unitSize = scale / initArraySize;
		
		var output = [];
		for (var i = 0; i < posses.length; i++) {
			
			var x = posses[i].coord.x;
			var y = posses[i].coord.y;
			
			var thisHeight = (heights[posses[i].coord.x][posses[i].coord.y]*heightScale)+height;
			
			var minNei=100,maxNei=-100;
			for (var xd = -1; xd <= 1; xd++) {
				for (var yd = -1; yd <=1; yd++) {
					if(y+yd>=0&&x+xd>=0&&y+yd<heights[x].length&&x+xd<heights.length){
						var testHeight = heights[x+xd][y+yd];
						if(testHeight<minNei){
							minNei = testHeight;
						}
						if(testHeight>maxNei){
							maxNei = testHeight;
						}
					}
				}
			}
			var gradient = (maxNei-minNei);
			
			var geometry = new THREE.CylinderGeometry(
				unitSize,
				unitSize * baseScale,
				gradient+grassThickness,
				5
			);
			var unit = new THREE.Mesh(geometry, material);
			var p = posses[i].multiplyScalar(scale);
			//unit.rotation.y = Math.random()*2*Math.PI;
			unit.position.set(p.x, thisHeight/2, p.z);
			output.push(unit);
		}
		return output;
	}
	delete(){
		for(var i = 0;i<this.sand.length;i++){
			var t = this.sand[i];
			if(t.geometry){
				t.geometry.dispose();
			}
			if(t.material){
				t.material.dispose();
			}
			scene.remove(t);
		}
		for(var i = 0;i<this.grass.length;i++){
			var t = this.grass[i];
			if(t.geometry){
				t.geometry.dispose();
			}
			if(t.material){
				t.material.dispose();
			}
			scene.remove(t);
		}
		for(var i = 0;i<this.landmass.length;i++){
			var t = this.landmass[i];
			if(t.geometry){
				t.geometry.dispose();
			}
			if(t.material){
				t.material.dispose();
			}
			scene.remove(t);
		}
	}
}

var island = new Island();


function NewIsland(){
	//$(".text").addClass("hidden");
		island.delete();
	island = new Island();
}
//$("canvas").on("click",NewIsland);
SetupScene();

function MainLoop() {
	var hasErrored = false;
	try {
		Update();
		Draw();
	} catch {
		hasErrored = true;
	}
	if (!hasErrored) {
		setTimeout(function(){MainLoop();}, 1000/15);//to use less resourses.
	}
}
function Update() {
	for (var i = 0; i < World.length; i++) {
		World[i].Update();
	}
}
function Draw() {
	renderer.render(scene, camera);
}
var MousePos = new THREE.Vector3();
/*
$("canvas").on("mousemove", function (e) {
	//Update();
	//Draw();
	MousePos.x = e.pageX / $(this).innerWidth();
	MousePos.y = e.pageY / $(this).innerHeight();
});*/

MainLoop();
setInterval(NewIsland,30000);
Update();
Draw();


