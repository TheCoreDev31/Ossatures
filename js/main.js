import {
    renderer,
    camera
} from "./environment.js"

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
    window.position.set(0, 4.5, LARGEUR_MODULE);

    return window;
}


function createRoofPan(smallWidth, largeWidth, height) {
    let texture = loader.load("img/tuile.jpg");
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(0.08, 0.08);

    let geometry = new THREE.Shape();
    geometry.moveTo(-largeWidth / 2, 0);
    geometry.lineTo(-smallWidth / 2, height);
    geometry.lineTo(smallWidth / 2, height);
    geometry.lineTo(largeWidth / 2, 0);
    let extrudeSettings = {
        steps: 4,
        depth: 0.5,
        bevelEnabled: false
    };

    return (new THREE.Mesh(new THREE.ExtrudeBufferGeometry(geometry, extrudeSettings), new THREE.MeshLambertMaterial({
        map: texture
    })));
}


export function createModule() {

    // Un module = 4 murs + un sol + un plafond
    let wallTexture = loader.load("img/crepi.jpg");
    wallTexture.wrapS = wallTexture.wrapT = THREE.RepeatWrapping;
    wallTexture.repeat.set(5, 5);
    let wallMaterial = new THREE.MeshLambertMaterial({
        map: wallTexture,
        color: 0xf2eede,
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

    let wallsGroup = new THREE.Group();
    wallsGroup.add(wallBack);
    wallsGroup.add(wallRight);
    wallsGroup.add(wallFront);
    wallsGroup.add(wallLeft);
    wallsGroup.add(floor);
    wallsGroup.add(top);

    return wallsGroup;
}


export function createRoof() {
    var roof = new THREE.Group();
    var frontPan = createRoofPan(LARGEUR_MODULE - 10, LARGEUR_MODULE + 10, 12);
    var rearPan = frontPan.clone();
    frontPan.position.set(0, HAUTEUR_MODULE / 2, LONGUEUR_MODULE / 2 + 2);
    frontPan.rotateX(-0.7);
    roof.add(frontPan);

    rearPan.rotateX(0.7);
    rearPan.position.set(0, HAUTEUR_MODULE / 2, -LONGUEUR_MODULE / 2 - 2);
    roof.add(rearPan);

    var leftPan = createRoofPan(LONGUEUR_MODULE - 10, LONGUEUR_MODULE + 10, 12);
    leftPan.rotateY(Math.PI / 2);
    leftPan.rotateX(0.88);
    leftPan.position.set(-LARGEUR_MODULE / 2 - 5, HAUTEUR_MODULE / 2, 0);
    roof.add(leftPan);

    return roof;
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
module1.name = 'module1';
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
