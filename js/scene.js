let renderer = new THREE.WebGLRenderer({
    antialias: true
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.shadowMap.enabled = true;
renderer.shadowMapType = THREE.PCFSoftShadowMap;
renderer.gammaFactor = 2.2;
renderer.gammaOutput = true;

// Camera
let camera = new THREE.PerspectiveCamera(75, (window.innerWidth / window.innerHeight), 1, 500);
//camera.position.set(100, 40, -20);
camera.position.set(20, 40, 120);
camera.aspect = window.innerWidth / window.innerHeight;
camera.lookAt(scene.position);
//console.log(scene.position);

// Environnement
var groundTexture = loader.load("img/grass.jpg");
groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
groundTexture.repeat.set(12, 12);
groundTexture.anisotropy = 16;
groundTexture.encoding = THREE.sRGBEncoding;
var groundMaterial = new THREE.MeshLambertMaterial({
    map: groundTexture
});
var ground = new THREE.Mesh(new THREE.PlaneBufferGeometry(2000, 2000), groundMaterial);
ground.position.y = -12.5;
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.background = new THREE.Color(0xaef8ff);
scene.fog = new THREE.Fog(0xcce0ff, 100, 700);
scene.add(ground);

// Eclairage
scene.add(new THREE.AmbientLight(0x111122));

let reference = 200;
let light = new THREE.DirectionalLight(0xdfebff, 0.62);
light.position.set(60, 150, -200);
light.castShadow = true;
light.shadowCameraVisible = true;
light.shadowMapWidth = reference * 5;
light.shadowMapHeight = reference * 5;

light.shadowCameraLeft = -reference;
light.shadowCameraRight = reference;
light.shadowCameraTop = reference;
light.shadowCameraBottom = -reference;
light.shadowCameraFar = reference * 2;
light.shadowDarkness = 0.35;
scene.add(light);

let light2 = light.clone();
light2.position.set(10, 10, 350);
light2.shadowCameraVisible = false;
light2.shadowDarkness = 0.2;
scene.add(light2);

document.body.appendChild(renderer.domElement);
const canvas = renderer.domElement;

export {
    renderer,
    camera,
    canvas,
    light,
    light2
}
