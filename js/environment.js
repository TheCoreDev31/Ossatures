import {
    COLOR_ARRAY,
    groundMaterial
} from "./materials.js"


// Renderer
var renderer = new THREE.WebGLRenderer({
    antialias: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.gammaFactor = 2.2;


// Camera
var camera = new THREE.PerspectiveCamera(75, (window.innerWidth / window.innerHeight), 1, 400);
camera.position.set(50, 20, 120);
camera.aspect = window.innerWidth / window.innerHeight;
camera.lookAt(scene.position);


// Environnement
var ground = new THREE.Mesh(new THREE.PlaneBufferGeometry(2000, 2000), groundMaterial);
ground.position.y = -12.5;
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
ground.castShadow = false;
ground.matrixAutoUpdate = false;
ground.updateMatrix();
scene.add(ground);

scene.background = COLOR_ARRAY['bleu_ciel'];
scene.fog = new THREE.Fog(COLOR_ARRAY['bleu_ciel'], 100, 600);



// Eclairage
scene.add(new THREE.AmbientLight(COLOR_ARRAY['blanc'], 0.3));

// Un lampe derrière pour l'ombre des bâtiments
const reference = 200;

var rearLight = new THREE.DirectionalLight(COLOR_ARRAY['blanc'], .6);
rearLight.position.set(reference, reference, -reference / 2);
rearLight.castShadow = true;
rearLight.shadow.mapSize.width = reference;
rearLight.shadow.mapSize.height = reference;
rearLight.shadow.camera.left = rearLight.shadow.camera.bottom = -reference;
rearLight.shadow.camera.right = rearLight.shadow.camera.top = reference;
rearLight.shadow.camera.near = 1;
rearLight.shadow.camera.far = reference * 2;
scene.add(rearLight);

// Une lampe devant pour éclairer la façade
var frontLight = new THREE.SpotLight(COLOR_ARRAY['blanc'], 0.3);
frontLight.position.set(10, HAUTEUR_MODULE, 300);
frontLight.castShadow = false;
scene.add(frontLight);



document.body.appendChild(renderer.domElement);
var canvas = renderer.domElement;


export {
    renderer,
    camera,
    canvas,
    rearLight,
    frontLight
}
