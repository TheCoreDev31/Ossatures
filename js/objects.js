import {
    COLOR_ARRAY,
    createRoofTexture,
    glassMaterial,
    windowMaterial,
    wallMaterial,
    floorMaterial,
    topMaterial
} from "./materials.js"

function degrees_to_radians(degrees) {
    var pi = Math.PI;
    return degrees * (pi / 180);
}


export function createWindow(largeur = LARGEUR_STANDARD_FENETRE, hauteur = HAUTEUR_STANDARD_FENETRE, nbPanneaux = 2) {

    var windowGrp = new THREE.Group();
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

    windowGrp.add(windowFrame);
    windowGrp.add(windowGlass);
    nbFenetres++;
    windowGrp.name = 'Fenetre ' + nbFenetres;
    windowGrp.position.set(0, -(HAUTEUR_MODULE / 2) + hauteur / 2 + 10, LARGEUR_MODULE - 1);

    return windowGrp;
}


export function createRoof() {
    var roofGrp = new THREE.Group();
    var texture = createRoofTexture();
    var frontPan = new THREE.Mesh(new THREE.BoxBufferGeometry(LARGEUR_MODULE + 2, LARGEUR_MODULE * 1.3, 0.2), new THREE.MeshLambertMaterial({
        map: texture,
        color: COLOR_ARRAY['gris_clair']
    }));
    var rearPan = frontPan.clone();
    frontPan.position.set(0, HAUTEUR_MODULE, (LONGUEUR_MODULE / 2) - 16.8);
    frontPan.rotateX(-degrees_to_radians(55));
    frontPan.castShadow = true;
    roofGrp.add(frontPan);

    rearPan.rotateX(degrees_to_radians(55));
    rearPan.position.set(0, HAUTEUR_MODULE, -(LONGUEUR_MODULE / 2) + 16.8);
    rearPan.castShadow = true;
    roofGrp.add(rearPan);
    roofGrp.name = 'Toit';

    return roofGrp;
}


export function createModule() {

    // Un module = 4 murs + un sol + un plafond
    var wallLeft = new THREE.Mesh(new THREE.BoxGeometry(LONGUEUR_MODULE - (EPAISSEUR_MUR * 2), HAUTEUR_MODULE, EPAISSEUR_MUR), wallMaterial);
    wallLeft.rotation.y = Math.PI / 2;
    wallLeft.position.x = (EPAISSEUR_MUR / 2) - LARGEUR_MODULE / 2;

    var wallRight = new THREE.Mesh(new THREE.BoxGeometry(LONGUEUR_MODULE - (EPAISSEUR_MUR * 2), HAUTEUR_MODULE, EPAISSEUR_MUR), wallMaterial);
    wallRight.rotation.y = -Math.PI / 2;
    wallRight.position.x = (-EPAISSEUR_MUR / 2) + LARGEUR_MODULE / 2;

    var wallFront = new THREE.Mesh(new THREE.BoxGeometry(LARGEUR_MODULE, HAUTEUR_MODULE, EPAISSEUR_MUR), wallMaterial);
    wallFront.rotation.y = Math.PI;
    wallFront.position.z = LARGEUR_MODULE - (EPAISSEUR_MUR / 2);

    var wallBack = new THREE.Mesh(new THREE.BoxGeometry(LARGEUR_MODULE, HAUTEUR_MODULE, EPAISSEUR_MUR), wallMaterial);
    wallBack.position.z = -LARGEUR_MODULE + (EPAISSEUR_MUR / 2);

    var floor = new THREE.Mesh(new THREE.PlaneBufferGeometry(LARGEUR_MODULE, LONGUEUR_MODULE), floorMaterial);
    floor.position.set(0, (-HAUTEUR_MODULE / 2) + .01, 0);
    floor.rotation.x = -Math.PI / 2;

    var top = new THREE.Mesh(new THREE.PlaneBufferGeometry(LARGEUR_MODULE, LONGUEUR_MODULE), topMaterial);
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

    for (var i = 0; i < wallsGroup.children.length; i++) {
        wallsGroup.children[i].receiveShadow = false;
        wallsGroup.children[i].castShadow = true;
    }

    return wallsGroup;
}
