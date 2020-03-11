import {
    COLOR_ARRAY,
    createRoofTexture,
    glassMaterial,
    windowMaterial,
    doorMaterial,
    wallMaterial,
    floorMaterial,
    topMaterial
} from "./materials.js"

function degrees_to_radians(degrees) {
    var pi = Math.PI;
    return degrees * (pi / 180);
}


export function createOpening(nomModule, face, typeOuverture, nbPanneaux = 1) {

    var windowGrp = new THREE.Group();
    var largeur, hauteur, epaisseur, elevation;

    // On récupère d'abord les caractéristiques de l'ouverture à créer
    largeur = PRODUITS[typeOuverture]['largeur'];
    hauteur = PRODUITS[typeOuverture]['hauteur'];
    epaisseur = PRODUITS[typeOuverture]['epaisseur'];
    elevation = PRODUITS[typeOuverture]['elevation'];

    // On constitue en premier le chassis
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
        depth: epaisseur,
        bevelEnabled: false
    };
    var windowFrame = new THREE.Mesh(new THREE.ExtrudeBufferGeometry(windowGeometry, extrudeSettings), windowMaterial);
    windowFrame.position.set(-(largeur / 2) + .5, -(hauteur / 2) + .5, -(epaisseur / 2));
    windowFrame.name = 'excluded';
    windowGrp.add(windowFrame);


    // Eventuellement, la vitre
    if (typeOuverture == 'F1' || typeOuverture == 'F2') {
        var windowGlass = new THREE.Mesh(new THREE.BoxGeometry(largeur - 0.5, hauteur - 0.5, EPAISSEUR_MUR + 0.2), glassMaterial);
        windowGlass.position.set(.5, .5, 0);
        windowGrp.add(windowGlass);
    } else {
        var windowDoor = new THREE.Mesh(new THREE.BoxGeometry(largeur - 0.5, hauteur - 0.5, EPAISSEUR_MUR + 0.2), doorMaterial);
        windowDoor.position.set(.5, .5, 0);
        windowGrp.add(windowDoor);
    }

    nbFenetres++;
    windowGrp.name = 'Fenetre ' + nbFenetres;
    objetsModifiables.push(windowGrp);

    // On calcule la position en fonction du type d'ouverture et de la face du module.
    var positionX = 0,
        positionY = 0,
        positionZ = 0;
    positionY = -(HAUTEUR_MODULE / 2) + (hauteur / 2) + elevation;

    switch (face) {
        case 'AV':
            positionX = 0;
            positionZ = (LONGUEUR_MODULE / 2) - epaisseur / 2 + 0.5;
            break;
        case 'AR':
            windowGrp.rotation.y = Math.PI;
            positionX = 0;
            positionZ = -(LONGUEUR_MODULE / 2) + (epaisseur / 2) - 0.5;
            break;
        case 'PGAV':
            windowGrp.rotation.y = -Math.PI / 2;
            positionX = -(LARGEUR_MODULE / 2) + (epaisseur / 2) - 0.5;
            positionZ = (LONGUEUR_MODULE / 4);
            break;
        case 'PGAR':
            windowGrp.rotation.y = -Math.PI / 2;
            positionX = -(LARGEUR_MODULE / 2) + (epaisseur / 2) - 0.5;
            positionZ = -(LONGUEUR_MODULE / 4);
            break;
        case 'PDAV':
            windowGrp.rotation.y = Math.PI / 2;
            positionX = (LARGEUR_MODULE / 2) - (epaisseur / 2) + 0.5;
            positionZ = (LONGUEUR_MODULE / 4);
            break;
        case 'PDAR':
            windowGrp.rotation.y = Math.PI / 2;
            positionX = (LARGEUR_MODULE / 2) - (epaisseur / 2) + 0.5;
            positionZ = -(LONGUEUR_MODULE / 4);
            break;
    }
    windowGrp.position.set(positionX, positionY, positionZ);


    // Ne pas oublier de mettre à jour les scores VT du module !!!!!
    switch (typeOuverture) {
        case 'F1':
            mesModules[nomModule]['nbFenetres1']++;
            break;
        case 'F2':
            mesModules[nomModule]['nbFenetres2']++;
            break;
        case 'PE':
            break;
        case 'PF':
            break;
        case 'PG':
            break;

    }
    //    mesModules['Module ' + nbModules]['vt_AV'] = 6;    //    mesModules['Module' + numModule]['vt_AR'] = 6;
    //    mesModules['Module' + numModule]['vt_PGAV'] = 6;
    //    mesModules['Module' + numModule]['vt_PGAR'] = 6;
    //    mesModules['Module' + numModule]['vt_PDAV'] = 6;
    //    mesModules['Module' + numModule]['vt_PDAR'] = 6;

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


export function createTravee() {

    // Un module = 6 murs (AV + AR + 2 par pignon) + un sol + un plafond
    // IMPORTANT : on crée les murs avec la face AV devant.
    var wallAR = new THREE.Mesh(new THREE.BoxGeometry(LARGEUR_MODULE, HAUTEUR_MODULE, EPAISSEUR_MUR), wallMaterial);
    wallAR.position.z = -LARGEUR_MODULE + (EPAISSEUR_MUR / 2);

    var wallPDAR = new THREE.Mesh(new THREE.BoxGeometry(LONGUEUR_MODULE / 2 - EPAISSEUR_MUR, HAUTEUR_MODULE, EPAISSEUR_MUR), wallMaterial);
    wallPDAR.rotation.y = -Math.PI / 2;
    wallPDAR.position.x = (-EPAISSEUR_MUR / 2) + LARGEUR_MODULE / 2;
    wallPDAR.position.z = -(LONGUEUR_MODULE / 4) + EPAISSEUR_MUR / 2;

    var wallPDAV = new THREE.Mesh(new THREE.BoxGeometry(LONGUEUR_MODULE / 2 - EPAISSEUR_MUR, HAUTEUR_MODULE, EPAISSEUR_MUR), wallMaterial);
    wallPDAV.rotation.y = -Math.PI / 2;
    wallPDAV.position.x = (-EPAISSEUR_MUR / 2) + LARGEUR_MODULE / 2;
    wallPDAV.position.z = (LONGUEUR_MODULE / 4) - EPAISSEUR_MUR / 2;

    var wallAV = new THREE.Mesh(new THREE.BoxGeometry(LARGEUR_MODULE, HAUTEUR_MODULE, EPAISSEUR_MUR), wallMaterial);
    wallAV.rotation.y = Math.PI;
    wallAV.position.z = LARGEUR_MODULE - (EPAISSEUR_MUR / 2);
    wallAV.name = 'front';

    var wallPGAV = new THREE.Mesh(new THREE.BoxGeometry(LONGUEUR_MODULE / 2 - EPAISSEUR_MUR, HAUTEUR_MODULE, EPAISSEUR_MUR), wallMaterial);
    wallPGAV.rotation.y = Math.PI / 2;
    wallPGAV.position.x = (EPAISSEUR_MUR / 2) - LARGEUR_MODULE / 2;
    wallPGAV.position.z = (LONGUEUR_MODULE / 4) - EPAISSEUR_MUR / 2;

    var wallPGAR = new THREE.Mesh(new THREE.BoxGeometry(LONGUEUR_MODULE / 2 - EPAISSEUR_MUR, HAUTEUR_MODULE, EPAISSEUR_MUR), wallMaterial);
    wallPGAR.rotation.y = Math.PI / 2;
    wallPGAR.position.x = (EPAISSEUR_MUR / 2) - LARGEUR_MODULE / 2;
    wallPGAR.position.z = -(LONGUEUR_MODULE / 4) + EPAISSEUR_MUR / 2;

    var floor = new THREE.Mesh(new THREE.PlaneBufferGeometry(LARGEUR_MODULE, LONGUEUR_MODULE), floorMaterial);
    floor.position.set(0, (-HAUTEUR_MODULE / 2) + .01, 0);
    floor.rotation.x = -Math.PI / 2;

    var top = new THREE.Mesh(new THREE.PlaneBufferGeometry(LARGEUR_MODULE, LONGUEUR_MODULE), topMaterial);
    top.rotation.x = -Math.PI / 2;
    top.position.set(0, (HAUTEUR_MODULE / 2) + .01, 0);
    top.visible = false;

    var wallsGrp = new THREE.Group();
    wallsGrp.add(wallAR);
    wallsGrp.add(wallPDAR);
    wallsGrp.add(wallPDAV);
    wallsGrp.add(wallAV);
    wallsGrp.add(wallPGAV);
    wallsGrp.add(wallPGAR);
    wallsGrp.add(floor);
    wallsGrp.add(top);
    nbModules++;
    wallsGrp.name = 'Module ' + nbModules;
    objetsModifiables.push(wallsGrp);

    for (var i = 0; i < wallsGrp.children.length; i++) {
        wallsGrp.children[i].receiveShadow = false;
        wallsGrp.children[i].castShadow = true;
    }

    // Initialisation du tableau d'infos sur le module
    mesModules['Module ' + nbModules]['nom'] = wallsGrp.name;
    mesModules['Module ' + nbModules]['nbF1'] = 0;
    mesModules['Module ' + nbModules]['nbF2'] = 0;
    mesModules['Module ' + nbModules]['nbPE'] = 0;
    mesModules['Module ' + nbModules]['vt_AR'] = 3;
    mesModules['Module ' + nbModules]['vt_PDAR'] = 1;
    mesModules['Module ' + nbModules]['vt_PDAV'] = 1;
    mesModules['Module ' + nbModules]['vt_AV'] = 3;
    mesModules['Module ' + nbModules]['vt_PGAV'] = 1;
    mesModules['Module ' + nbModules]['vt_PGAR'] = 1;

    return wallsGrp;
}