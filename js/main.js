import {
    renderer,
    camera
}
from "./environment.js"

import {
    onMouseClick,
    onMouseMove,
    onWindowResize
} from "./events.js"

import {
    handleGui
} from "./gui.js"


export function createWindow(largeur = 12.5, hauteur = 10) {
    // Fenêtre
    let glassMaterial = new THREE.MeshPhongMaterial({
        color: COLOR_CIEL,
        shininess: 50,
        specular: 0xffffff,
        refractionRatio: 0.7
    });
    let windowGlass = new THREE.Mesh(new THREE.BoxBufferGeometry(largeur - 1, hauteur - 1, EPAISSEUR_MUR + 0.1), glassMaterial);
    windowGlass.position.set(.5, .5, 0);

    let windowGeometry = new THREE.Shape();
    windowGeometry.moveTo(0, 0);
    windowGeometry.lineTo(0, hauteur);
    windowGeometry.lineTo(largeur, hauteur);
    windowGeometry.lineTo(largeur, 0);
    windowGeometry.lineTo(0, 0);
    let windowHole1 = new THREE.Shape();
    windowHole1.moveTo(.5, .5);
    windowHole1.lineTo(.5, hauteur - .5);
    windowHole1.lineTo((largeur / 2) - .2, hauteur - .5);
    windowHole1.lineTo((largeur / 2) - .2, .5);
    windowHole1.lineTo(.5, .5);
    windowGeometry.holes.push(windowHole1);
    let windowHole2 = new THREE.Shape();
    windowHole2.moveTo((largeur / 2) + .2, 0.5);
    windowHole2.lineTo((largeur / 2) + .2, hauteur - .5);
    windowHole2.lineTo(largeur - .5, hauteur - .5);
    windowHole2.lineTo(largeur - .5, 0.5);
    windowHole2.lineTo((largeur / 2) + .2, 0.5);
    windowGeometry.holes.push(windowHole2);

    let extrudeSettings = {
        steps: 4,
        depth: 2.5,
        bevelEnabled: false
    };
    let windowMaterial = new THREE.MeshStandardMaterial({
        color: COLOR_RAL7016,
        roughness: 0.4,
        metalness: 0.7,
        side: THREE.DoubleSide
    });
    let windowFrame = new THREE.Mesh(new THREE.ExtrudeBufferGeometry(windowGeometry, extrudeSettings), windowMaterial);
    windowFrame.position.set(-(largeur / 2) + .5, -(hauteur / 2) + .5, -1.1);

    let window = new THREE.Group();
    window.add(windowFrame);
    window.add(windowGlass);
    window.position.set(0, -(HAUTEUR_MODULE / 2) + hauteur / 2 + 10, LARGEUR_MODULE);

    return window;
}


function degrees_to_radians(degrees) {
    var pi = Math.PI;
    return degrees * (pi / 180);
}


export function createRoof() {
    var roof = new THREE.Group();
    let texture = loader.load("img/ardoise.jpg");
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(6 * nbModules, 6);

    var frontPan = new THREE.Mesh(new THREE.BoxBufferGeometry(LARGEUR_MODULE + 2, LARGEUR_MODULE * 1.3, 0.2), new THREE.MeshLambertMaterial({
        map: texture
    }));
    var rearPan = frontPan.clone();
    frontPan.position.set(0, HAUTEUR_MODULE, (LONGUEUR_MODULE / 2) - 16.8);
    frontPan.rotateX(-degrees_to_radians(55));
    roof.add(frontPan);

    rearPan.rotateX(degrees_to_radians(55));
    rearPan.position.set(0, HAUTEUR_MODULE, -(LONGUEUR_MODULE / 2) + 16.8);
    roof.add(rearPan);
    roof.name = 'roofGroup';

    return roof;
}


export function createModule() {

    // Un module = 4 murs + un sol + un plafond
    let wallTexture = loader.load("img/crepi.jpg");
    wallTexture.wrapS = wallTexture.wrapT = THREE.RepeatWrapping;
    wallTexture.repeat.set(5, 5);
    let wallMaterial = new THREE.MeshLambertMaterial({
        map: wallTexture,
        color: 0xf7f4e8,
        vertexColors: true
    });

    let wallLeft = new THREE.Mesh(new THREE.BoxGeometry(EPAISSEUR_MUR, HAUTEUR_MODULE, LONGUEUR_MODULE), wallMaterial);
    wallLeft.receiveShadow = false;
    wallLeft.castShadow = true;
    wallLeft.position.x = -LARGEUR_MODULE / 2;

    let wallRight = new THREE.Mesh(new THREE.BoxGeometry(EPAISSEUR_MUR, HAUTEUR_MODULE, LONGUEUR_MODULE), wallMaterial);
    wallRight.receiveShadow = false;
    wallRight.castShadow = true;
    wallRight.position.x = LARGEUR_MODULE / 2;

    let wallFront = new THREE.Mesh(new THREE.BoxGeometry(LARGEUR_MODULE + EPAISSEUR_MUR, HAUTEUR_MODULE, EPAISSEUR_MUR), wallMaterial);
    wallFront.receiveShadow = false;
    wallFront.castShadow = true;
    wallFront.position.set(0, 0, LARGEUR_MODULE);

    let wallBack = new THREE.Mesh(new THREE.BoxGeometry(LARGEUR_MODULE + EPAISSEUR_MUR, HAUTEUR_MODULE, EPAISSEUR_MUR), wallMaterial);
    wallBack.receiveShadow = false;
    wallBack.castShadow = true;
    wallBack.position.z = -LARGEUR_MODULE;


    let floorTexture = loader.load("img/carrelage.jpg");
    floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat.set(10, 20);
    let floorMaterial = new THREE.MeshLambertMaterial({
        map: floorTexture
    });
    let floor = new THREE.Mesh(new THREE.PlaneBufferGeometry(LARGEUR_MODULE, LONGUEUR_MODULE), floorMaterial);
    floor.position.set(0, (-HAUTEUR_MODULE / 2) + .01, 0);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    floor.castShadow = true;

    let top = new THREE.Mesh(new THREE.PlaneBufferGeometry(LARGEUR_MODULE, LONGUEUR_MODULE), new THREE.MeshBasicMaterial({
        opacity: 0.6,
        transparent: true
    }));
    top.rotation.x = -Math.PI / 2;
    top.position.set(0, (HAUTEUR_MODULE / 2) + .01, 0);
    top.visible = false;

    let wallsGroup = new THREE.Group();
    wallsGroup.add(wallBack);
    wallsGroup.add(wallRight);
    wallsGroup.add(wallFront);
    wallsGroup.add(wallLeft);
    wallsGroup.add(floor);
    wallsGroup.add(top);

    return wallsGroup;
}


/*********************************************************************************************************************************/

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
};


function init() {
    let controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.maxPolarAngle = Math.PI * 0.5;
    controls.minDistance = 20;
    controls.maxDistance = 2000;

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
}


// Début
module1 = createModule();
module1.name = 'Module 1';
editableObjects.push(module1);
nbModules = 1;
scene.add(module1);

scene.add(createRoof());

scene.add(createWindow());

window.addEventListener('resize', onWindowResize, false);
document.addEventListener('click', onMouseClick);
document.addEventListener('mousemove', onMouseMove, false);
//document.addEventListener('dblclick', onMouseDoubleClick);

init();
handleGui();
animate();
