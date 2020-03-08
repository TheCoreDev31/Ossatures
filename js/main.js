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



export function createWindow() {

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
    let wallMaterial = new THREE.MeshPhongMaterial({
        map: wallTexture,
        color: 0xfae5af,
        roughness: 0.9
    });
    let roofMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
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


    var frontPan = createRoofPan(largeurModule - 10, largeurModule + 10, 12);
    var rearPan = frontPan.clone();
    frontPan.position.set(0, hauteurModule / 2, longueurModule / 2 + 2);
    frontPan.rotateX(-0.7);
    wallsGroup.add(frontPan);

    rearPan.rotateX(0.7);
    rearPan.position.set(0, hauteurModule / 2, -longueurModule / 2 - 2);
    wallsGroup.add(rearPan);

    var leftPan = createRoofPan(longueurModule - 10, longueurModule + 10, 12);
    leftPan.rotateY(Math.PI / 2);
    leftPan.rotateX(0.88);
    leftPan.position.set(-largeurModule / 2 - 5, hauteurModule / 2, 0);
    wallsGroup.add(leftPan);

    return wallsGroup;
}


function render() {
    raycaster.setFromCamera(mouse, camera);
    var intersects = raycaster.intersectObject(module1);

    if (intersects.length > 0) {
        var intersect = intersects[0];
        var face = intersect.face;

        alert('touché');
    }

    renderer.render(scene, camera);
}


function animate() {
    requestAnimationFrame(animate);
    render();
};


function initControls() {
    let controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.maxPolarAngle = Math.PI * 0.5;
    controls.minDistance = 20;
    controls.maxDistance = 2000;

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
}


// Début
module1 = createModule();
scene.add(module1);
nbModules++;

let window1 = createWindow();
scene.add(window1);

window.addEventListener('mousedown', onMouseClick);
window.addEventListener('mousemove', onMouseMove, false);
window.addEventListener('resize', onWindowResize, false);
initControls();
handleGui();
animate();
