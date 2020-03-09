// Renderer
let renderer = new THREE.WebGLRenderer({
    antialias: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.gammaFactor = 2.2;


// Camera
let camera = new THREE.PerspectiveCamera(75, (window.innerWidth / window.innerHeight), 1, 400);
camera.position.set(20, 40, 120);
camera.aspect = window.innerWidth / window.innerHeight;
camera.lookAt(scene.position);


// Environnement
let groundTexture = loader.load("img/grass.jpg");
groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
groundTexture.repeat.set(20, 20);
groundTexture.anisotropy = 16;
groundTexture.encoding = THREE.sRGBEncoding;
let groundMaterial = new THREE.MeshLambertMaterial({
    map: groundTexture
});
let ground = new THREE.Mesh(new THREE.PlaneBufferGeometry(2000, 2000), groundMaterial);
ground.position.y = -12.5;
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;

scene.background = new THREE.Color(COLOR_CIEL);
scene.fog = new THREE.Fog(COLOR_CIEL, 100, 600);
scene.add(ground);


// Eclairage
scene.add(new THREE.AmbientLight(COLOR_BLANC, 0.1));

// Un lampe derrière pour l'ombre des bâtiments
let reference = 200;

let rearLight = new THREE.DirectionalLight(COLOR_BLANC, .6);
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
let frontLight = new THREE.SpotLight(COLOR_BLANC, 0.3);
frontLight.position.set(0, HAUTEUR_MODULE / 2, 350);
frontLight.castShadow = false;
scene.add(frontLight);

document.body.appendChild(renderer.domElement);
let canvas = renderer.domElement;


export {
    renderer,
    camera,
    canvas,
    rearLight,
    frontLight
}
