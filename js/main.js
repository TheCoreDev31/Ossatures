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

import {
    COLOR_ARRAY,
    createRoofTexture,
    glassMaterial,
    windowMaterial,
    wallMaterial,
    floorMaterial
} from "./materials.js"



// Fonctions communes
function degrees_to_radians(degrees) {
    var pi = Math.PI;
    return degrees * (pi / 180);
}

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
};


function init() {
    var controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.maxPolarAngle = Math.PI * 0.5;
    controls.minDistance = 20;
    controls.maxDistance = 2000;

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
}



export function createWindow(largeur = LARGEUR_STANDARD_FENETRE, hauteur = HAUTEUR_STANDARD_FENETRE, nbPanneaux = 2) {

    var windowGlass = new THREE.Mesh(new THREE.BoxBufferGeometry(largeur - 1, hauteur - 1, EPAISSEUR_MUR + 0.1), glassMaterial);
    windowGlass.position.set(.5, .5, 0);

    var windowGeometry = new THREE.Shape();
    windowGeometry.moveTo(0, 0);
    windowGeometry.lineTo(0, hauteur);
    windowGeometry.lineTo(largeur, hauteur);
    windowGeometry.lineTo(largeur, 0);
    windowGeometry.lineTo(0, 0);
    switch (nbPanneaux) {
        case 1:
            var windowHole = new THREE.Shape();
            windowHole.moveTo(.5, .5);
            windowHole.lineTo(.5, hauteur - .5);
            windowHole.lineTo(largeur - .4, hauteur - .5);
            windowHole.lineTo(largeur - .4, .5);
            windowHole.lineTo(.5, .5);
            windowGeometry.holes.push(windowHole);
            break;
        default:
            var windowHole1 = new THREE.Shape();
            windowHole1.moveTo(.5, .5);
            windowHole1.lineTo(.5, hauteur - .5);
            windowHole1.lineTo((largeur / 2) - .2, hauteur - .5);
            windowHole1.lineTo((largeur / 2) - .2, .5);
            windowHole1.lineTo(.5, .5);
            windowGeometry.holes.push(windowHole1);
            var windowHole2 = new THREE.Shape();
            windowHole2.moveTo((largeur / 2) + .2, 0.5);
            windowHole2.lineTo((largeur / 2) + .2, hauteur - .5);
            windowHole2.lineTo(largeur - .5, hauteur - .5);
            windowHole2.lineTo(largeur - .5, 0.5);
            windowHole2.lineTo((largeur / 2) + .2, 0.5);
            windowGeometry.holes.push(windowHole2);
            break;
    }

    var extrudeSettings = {
        steps: 4,
        depth: EPAISSEUR_MUR + 0.5,
        bevelEnabled: false
    };
    var windowFrame = new THREE.Mesh(new THREE.ExtrudeBufferGeometry(windowGeometry, extrudeSettings), windowMaterial);
    windowFrame.position.set(-(largeur / 2) + .5, -(hauteur / 2) + .5, -1.1);

    var window = new THREE.Group();
    window.add(windowFrame);
    window.add(windowGlass);
    nbFenetres++;
    window.name = 'Fenetre ' + nbFenetres;
    window.position.set(0, -(HAUTEUR_MODULE / 2) + hauteur / 2 + 10, LARGEUR_MODULE);

    return window;
}



export function createRoof() {
    var roof = new THREE.Group();
    var texture = createRoofTexture();
    var frontPan = new THREE.Mesh(new THREE.BoxBufferGeometry(LARGEUR_MODULE + 2, LARGEUR_MODULE * 1.3, 0.2), new THREE.MeshLambertMaterial({
        map: texture,
        color: COLOR_ARRAY['gris_clair']
    }));
    var rearPan = frontPan.clone();
    frontPan.position.set(0, HAUTEUR_MODULE, (LONGUEUR_MODULE / 2) - 16.8);
    frontPan.rotateX(-degrees_to_radians(55));
    roof.add(frontPan);

    rearPan.rotateX(degrees_to_radians(55));
    rearPan.position.set(0, HAUTEUR_MODULE, -(LONGUEUR_MODULE / 2) + 16.8);
    roof.add(rearPan);
    roof.name = 'Toit';

    return roof;
}


export function createModule() {

    // Un module = 4 murs + un sol + un plafond
    var wallLeft = new THREE.Mesh(new THREE.BoxGeometry(EPAISSEUR_MUR, HAUTEUR_MODULE, LONGUEUR_MODULE), wallMaterial);
    wallLeft.receiveShadow = false;
    wallLeft.castShadow = true;
    wallLeft.position.x = -LARGEUR_MODULE / 2;

    var wallRight = new THREE.Mesh(new THREE.BoxGeometry(EPAISSEUR_MUR, HAUTEUR_MODULE, LONGUEUR_MODULE), wallMaterial);
    wallRight.rotation.y = Math.PI;
    wallRight.receiveShadow = false;
    wallRight.castShadow = true;
    wallRight.position.x = LARGEUR_MODULE / 2;

    var wallFront = new THREE.Mesh(new THREE.BoxGeometry(LARGEUR_MODULE + EPAISSEUR_MUR, HAUTEUR_MODULE, EPAISSEUR_MUR), wallMaterial);
    wallFront.receiveShadow = false;
    wallFront.castShadow = true;
    wallFront.position.set(0, 0, LARGEUR_MODULE);

    var wallBack = new THREE.Mesh(new THREE.BoxGeometry(LARGEUR_MODULE + EPAISSEUR_MUR, HAUTEUR_MODULE, EPAISSEUR_MUR), wallMaterial);
    wallBack.receiveShadow = false;
    wallBack.castShadow = true;
    wallBack.position.z = -LARGEUR_MODULE;


    var floor = new THREE.Mesh(new THREE.PlaneBufferGeometry(LARGEUR_MODULE, LONGUEUR_MODULE), floorMaterial);
    floor.position.set(0, (-HAUTEUR_MODULE / 2) + .01, 0);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = false;
    floor.castShadow = true;

    var top = new THREE.Mesh(new THREE.PlaneBufferGeometry(LARGEUR_MODULE, LONGUEUR_MODULE), new THREE.MeshBasicMaterial({
        opacity: 0.6,
        transparent: true
    }));
    top.rotation.x = -Math.PI / 2;
    top.position.set(0, (HAUTEUR_MODULE / 2) + .01, 0);
    top.visible = false;

    var wallsGroup = new THREE.Group();
    wallsGroup.add(wallBack);
    wallsGroup.add(wallRight);
    wallsGroup.add(wallFront);
    wallsGroup.add(wallLeft);
    wallsGroup.add(floor);
    wallsGroup.add(top);
    nbModules++;
    wallsGroup.name = 'Module ' + nbModules;

    return wallsGroup;
}


/*********************************************************************************************************************************/

module1 = createModule();
scene.add(module1);
editableObjects.push(module1);

scene.add(createRoof());

var firstWindow = createWindow();
scene.add(firstWindow);
editableObjects.push(firstWindow);



window.addEventListener('resize', onWindowResize, false);
document.addEventListener('click', onMouseClick);
document.addEventListener('mousemove', onMouseMove, false);
//document.addEventListener('dblclick', onMouseDoubleClick);

init();
handleGui();
animate();
