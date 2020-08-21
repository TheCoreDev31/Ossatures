import {
    COLOR_ARRAY,
    groundMaterial,
    boussoleMaterial
} from "./materials.js"


// Renderer
export var renderer = new THREE.WebGLRenderer({
    antialias: true,
    preserveDrawingBuffer: true
});


renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.gammaFactor = 2.2;


export var aspectRatio = window.innerWidth / window.innerHeight;
// Camera
export var camera = new THREE.PerspectiveCamera(50, aspectRatio, 1, 600);
camera.position.set(60, 40, 160);
camera.aspect = aspectRatio;
camera.lookAt(scene.position);

var frustumSize = 300;
export var cameraOrtho = new THREE.OrthographicCamera(frustumSize * aspectRatio / -2, frustumSize * aspectRatio / 2, frustumSize / 2, frustumSize / -2, 1, 500);
cameraOrtho.position.set(0, 200, 0);
camera.aspect = aspectRatio;
cameraOrtho.lookAt(scene.position);


// Environnement
var ground = new THREE.Mesh(new THREE.PlaneBufferGeometry(2000, 2000), groundMaterial);
ground.position.y = -12.5;
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
ground.castShadow = false;
ground.matrixAutoUpdate = false;
ground.updateMatrix();
ground.name = 'ground';
scene.add(ground);

scene.background = COLOR_ARRAY['bleu_ciel'];
scene.fog = new THREE.Fog(COLOR_ARRAY['bleu_ciel'], 100, 1000);


// Repère face avant
var boussole = new THREE.Mesh(new THREE.PlaneBufferGeometry(16, 16), boussoleMaterial);
boussole.name = 'boussole';
boussole.rotation.x = -Math.PI / 2;
boussole.position.set(50, -(HAUTEUR_TRAVEE / 2) + 0.1, 0);
scene.add(boussole);


// Eclairage
var ambient = new THREE.AmbientLight(COLOR_ARRAY['blanc'], 0.45);
ambient.name = "ambientLight";
scene.add(ambient);

// Une lampe derrière pour l'ombre des bâtiments
const reference = 200;

export var rearLight = new THREE.DirectionalLight(COLOR_ARRAY['blanc'], 0.6);
rearLight.position.set(reference, reference, -reference / 2);
rearLight.castShadow = true;
rearLight.shadow.mapSize.width = reference;
rearLight.shadow.mapSize.height = reference;
rearLight.shadow.camera.left = rearLight.shadow.camera.bottom = -reference;
rearLight.shadow.camera.right = rearLight.shadow.camera.top = reference;
rearLight.shadow.camera.near = 1;
rearLight.shadow.camera.far = reference * 2;
rearLight.name = "rearLight";
scene.add(rearLight);

// Une lampe devant pour éclairer la façade
export var frontLight = new THREE.SpotLight(COLOR_ARRAY['blanc'], 0.2);
frontLight.position.set(10, HAUTEUR_TRAVEE, 300);
frontLight.castShadow = false;
frontLight.name = "frontLight";
scene.add(frontLight);

export var leftLight = new THREE.SpotLight(COLOR_ARRAY['blanc'], 0.1);
leftLight.position.set(-300, HAUTEUR_TRAVEE, 0);
leftLight.castShadow = false;
leftLight.name = "leftLight";
scene.add(leftLight);

export var rightLight = new THREE.SpotLight(COLOR_ARRAY['blanc'], 0.05);
rightLight.position.set(300, HAUTEUR_TRAVEE, 0);
rightLight.castShadow = false;
rightLight.name = "rightight";
scene.add(rightLight);


document.body.appendChild(renderer.domElement);
export var canvas = renderer.domElement;
