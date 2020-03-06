import {
    renderer,
    camera
} from "./environment.js"

import {
    handleClick
} from "./events.js"

import {
    handleGui
} from "./gui.js"



function createWindow() {

    // Fenêtre
    let glassMaterial = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        shininess: 60,
        specular: 0x99ccff,
        refractionRatio: 0.8
    });
    let windowGlass = new THREE.Mesh(new THREE.BoxBufferGeometry(10, 12, 2.1), glassMaterial);

    let windowGeometry = new THREE.Shape();
    windowGeometry.moveTo(0, 0);
    windowGeometry.lineTo(0, 12.5);
    windowGeometry.lineTo(10.5, 12.5);
    windowGeometry.lineTo(10.5, 0);
    windowGeometry.lineTo(0, 0);
    let windowHole1 = new THREE.Shape();
    windowHole1.moveTo(0.5, 0.5);
    windowHole1.lineTo(0.5, 12);
    windowHole1.lineTo(5.1, 12);
    windowHole1.lineTo(5.1, 0.5);
    windowHole1.lineTo(0.5, 0.5);
    windowGeometry.holes.push(windowHole1);
    let windowHole2 = new THREE.Shape();
    windowHole2.moveTo(5.5, 0.5);
    windowHole2.lineTo(5.375, 12);
    windowHole2.lineTo(10, 12);
    windowHole2.lineTo(10, 0.5);
    windowHole2.lineTo(5.5, 0.5);
    windowGeometry.holes.push(windowHole2);

    let extrudeSettings = {
        steps: 4,
        depth: 2.5,
        bevelEnabled: false
    };
    let windowMaterial = new THREE.MeshStandardMaterial({
        color: 0x303438,
        roughness: 0.4,
        metalness: 0.7,
        side: THREE.DoubleSide
    });
    let windowFrame = new THREE.Mesh(new THREE.ExtrudeBufferGeometry(windowGeometry, extrudeSettings), windowMaterial);
    windowFrame.position.set(-5.25, -6.25, -1.1);

    let window = new THREE.Group();
    window.add(windowFrame);
    window.add(windowGlass);
    window.position.set(0, 4.5, largeurModule);

    return window;
}


export function createModule() {

    // Un module = 4 murs + un sol + un plafond
    let wallTexture = loader.load("img/crepi.jpg");
    let wallMaterial = new THREE.MeshLambertMaterial({
        map: wallTexture,
        color: 0xf7db92
    });
    let roofMaterial = new THREE.MeshBasicMaterial({
        opacity: 0.6,
        transparent: true
    });

    let wallLeft = new THREE.Mesh(new THREE.BoxBufferGeometry(epaisseurMur, hauteurModule, longueurModule), wallMaterial);
    wallLeft.receiveShadow = false;
    wallLeft.castShadow = true;
    wallLeft.position.x = -largeurModule / 2;

    let wallRight = wallLeft.clone();
    wallRight.position.x = largeurModule / 2;

    let wallFront = new THREE.Mesh(new THREE.BoxBufferGeometry(largeurModule + epaisseurMur, hauteurModule, epaisseurMur), wallMaterial);
    wallFront.receiveShadow = false;
    wallFront.castShadow = true;
    wallFront.position.set(0, 0, largeurModule);

    let wallBack = wallFront.clone();
    wallBack.position.z = -largeurModule;

    let floorTexture = loader.load("img/carrelage.jpg");
    floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat.set(10, 20);
    let floorMaterial = new THREE.MeshLambertMaterial({
        map: floorTexture
    });
    let floor = new THREE.Mesh(new THREE.BoxBufferGeometry(largeurModule, 0.1, longueurModule), floorMaterial);
    floor.position.set(0, -hauteurModule / 2, 0);
    floor.receiveShadow = true;
    floor.castShadow = true;

    let roof = new THREE.Mesh(new THREE.BoxBufferGeometry(largeurModule, 0.1, longueurModule), roofMaterial);
    roof.position.set(0, hauteurModule / 2, 0);

    let wallsGroup = new THREE.Group();
    wallsGroup.add(wallBack);
    wallsGroup.add(wallRight);
    wallsGroup.add(wallFront);
    wallsGroup.add(wallLeft);
    wallsGroup.add(floor);
    wallsGroup.add(roof);

    return wallsGroup;
}


var animate = function () {
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
};


function initControls() {
    let controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.maxPolarAngle = Math.PI * 0.5;
    controls.minDistance = 20;
    controls.maxDistance = 2000;
}



module1 = createModule();
nbModules++;
scene.add(module1);

let window1 = createWindow();
scene.add(window1);

window.addEventListener('mousedown', handleClick);
initControls();
handleGui();
animate();
