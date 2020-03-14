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
    displayGui,
    hideContextualMenu
} from "./gui.js"

import {
    createOpening,
    createToit,
    createTravee
} from "./objects.js"

import {
    textMaterial,
    createText
} from "./materials.js"


// Fonctions communes
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


/***********************************************************************/
export function alerte(message) {
    document.getElementById('objectDescription').className = 'alerte';
    document.getElementById('objectDescription').innerHTML = message;
    setTimeout(function () {
        document.getElementById('objectDescription').className = 'normal';
        document.getElementById('objectDescription').innerHTML = '';
    }, 2000);
}

export function info(param) {
    if (param == null) {
        document.getElementById('objectDescription').className = 'normal';
        document.getElementById('objectDescription').innerHTML = '';
        return;
    }
    if (typeof (param) == 'string') {
        document.getElementById('objectDescription').innerHTML = param;
        setTimeout(function () {
            document.getElementById('objectDescription').innerHTML = '';
        }, 2000);
        return;
    } else {
        var newMessage = "Sélection : " + param.parent.name + " (VT = ???)";
        document.getElementById('objectDescription').className = 'normal';
        document.getElementById('objectDescription').innerHTML = newMessage;
        return;
    }
}

export function log(message) {
    console.log(message);
}

/***********************************************************************/


export function recalculerCotes(direction = 'largeur') {

    if (direction == 'largeur') {
        if (scene.getObjectByName('CoteX')) {
            scene.remove(scene.getObjectByName('CoteX'));
            incrusterCotes('largeur');
        }
    } else {
        if (scene.getObjectByName('CoteY')) {
            scene.remove(scene.getObjectByName('CoteY'));
            incrusterCotes('longueur');
        }
    }
}

function incrusterCotes() {

    var texte = (nbTravees * (LARGEUR_TRAVEE / 10)) + ' m';
    var cotes = createText(texte);
    var hauteurTexte = -(HAUTEUR_TRAVEE / 2) + 0.2;
    var cotesGrp = new THREE.Group();

    cotes.rotation.x = -Math.PI / 2;
    cotes.position.set(0, hauteurTexte, (LONGUEUR_TRAVEE / 2) + 8);
    cotesGrp.add(cotes);

    var points = [];
    points.push(new THREE.Vector3((-LARGEUR_TRAVEE / 2) * nbTravees, hauteurTexte, (LONGUEUR_TRAVEE / 2) + 1));
    points.push(new THREE.Vector3((-LARGEUR_TRAVEE / 2) * nbTravees, hauteurTexte, (LONGUEUR_TRAVEE / 2) + 10));
    points.push(new THREE.Vector3((LARGEUR_TRAVEE / 2) * nbTravees, hauteurTexte, (LONGUEUR_TRAVEE / 2) + 10));
    points.push(new THREE.Vector3((LARGEUR_TRAVEE / 2) * nbTravees, hauteurTexte, (LONGUEUR_TRAVEE / 2) + 1));
    var line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), textMaterial);
    cotesGrp.add(line);
    cotesGrp.name = 'CoteX';
    cotesGrp.visible = false;
    scene.add(cotesGrp);

    /*      Calcul de la côte de profondeur, plus complexe en raison des décalages éventuels    */
    var texte = (LONGUEUR_TRAVEE / 10) + ' m';
    var cotes = createText(texte);
    var hauteurTexte = -(HAUTEUR_TRAVEE / 2) + 0.2;
    var cotesGrp = new THREE.Group();
    cotes.rotation.z = -Math.PI / 2;
    cotes.rotation.x = Math.PI / 2;
    cotes.rotation.y = Math.PI;
    cotes.position.set((LARGEUR_TRAVEE / 2) + 8, hauteurTexte, 0);
    cotesGrp.add(cotes);

    var points = [];
    points.push(new THREE.Vector3((LARGEUR_TRAVEE / 2) + 1, hauteurTexte, LONGUEUR_TRAVEE / 2));
    points.push(new THREE.Vector3((LARGEUR_TRAVEE / 2) + 10, hauteurTexte, LONGUEUR_TRAVEE / 2));
    points.push(new THREE.Vector3((LARGEUR_TRAVEE / 2) + 10, hauteurTexte, -LONGUEUR_TRAVEE / 2));
    points.push(new THREE.Vector3((LARGEUR_TRAVEE / 2) + 1, hauteurTexte, -LONGUEUR_TRAVEE / 2));
    var line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), textMaterial);
    cotesGrp.add(line);
    cotesGrp.name = 'CoteY';
    cotesGrp.visible = false;
    scene.add(cotesGrp);
}


export function deplacerTravee(nomTravee, direction) {
    if (nbTravees <= 1) {
        alerte("Vous devez avoir plus d'une travée dans votre projet.");
        return;
    }

    if ((direction == 'haut' && tableauTravees[nomTravee]['decalee'] == 1) ||
        (direction == 'bas' && tableauTravees[nomTravee]['decalee'] == -1)) {
        alerte("Travée déjà décalée dans cette direction.");
        return;
    }

    var travee = scene.getObjectByName(nomTravee);
    var nbMurs = travee.children.length;

    for (var i = 0; i < nbMurs - 1; i++) {
        travee.children[i].visible = true;
    };
    if (direction == 'haut') {
        travee.position.z += 36;
        tableauTravees[nomTravee]['decalee']++;
    } else {
        travee.position.z -= 36;
        tableauTravees[nomTravee]['decalee']--;
    }
}


function initialisationTableaux() {

    // Tableau fixe des produits
    var nbCaract = 5;
    PRODUITS['MU'] = new Array(nbCaract); // ScoreVT, largeur, hauteur, epaisseur, distance du sol
    PRODUITS['MU']['VT'] = 3;
    PRODUITS['MU']['largeur'] = 0;
    PRODUITS['MU']['hauteur'] = 0;
    PRODUITS['MU']['epaisseur'] = 0;
    PRODUITS['MU']['elevation'] = 0;

    PRODUITS['PE'] = new Array(nbCaract);
    PRODUITS['PE']['VT'] = 2;
    PRODUITS['PE']['largeur'] = 9;
    PRODUITS['PE']['hauteur'] = 21.5;
    PRODUITS['PE']['epaisseur'] = 3;
    PRODUITS['PE']['elevation'] = 0;

    PRODUITS['F1'] = new Array(nbCaract);
    PRODUITS['F1']['VT'] = 2;
    PRODUITS['F1']['largeur'] = 4.5;
    PRODUITS['F1']['hauteur'] = 6.5;
    PRODUITS['F1']['epaisseur'] = 3;
    PRODUITS['F1']['elevation'] = 15;

    PRODUITS['F2'] = new Array(nbCaract);
    PRODUITS['F2']['VT'] = 2;
    PRODUITS['F2']['largeur'] = 10.5;
    PRODUITS['F2']['hauteur'] = 11.5;
    PRODUITS['F2']['epaisseur'] = 3;
    PRODUITS['F2']['elevation'] = 10;

    PRODUITS['PF'] = new Array(nbCaract);
    PRODUITS['PF']['VT'] = 1.4;
    PRODUITS['PF']['largeur'] = 18;
    PRODUITS['PF']['hauteur'] = 21.5;
    PRODUITS['PF']['epaisseur'] = 3;
    PRODUITS['PF']['elevation'] = 0;

    PRODUITS['PG'] = new Array(nbCaract);
    PRODUITS['PG']['VT'] = 0;
    PRODUITS['PG']['largeur'] = 24;
    PRODUITS['PG']['hauteur'] = 20;
    PRODUITS['PG']['epaisseur'] = 3;
    PRODUITS['PG']['elevation'] = 0;

    PRODUITS['PE+F1'] = new Array(nbCaract);
    PRODUITS['PE+F1']['VT'] = 0.5;
    PRODUITS['PE+F1']['largeur'] = 0;
    PRODUITS['PE+F1']['hauteur'] = 0;
    PRODUITS['PE+F1']['epaisseur'] = 0;
    PRODUITS['PE+F1']['elevation'] = 0;

    PRODUITS['PO'] = new Array(nbCaract);
    PRODUITS['PO']['VT'] = 0;
    PRODUITS['PO']['largeur'] = 36;
    PRODUITS['PO']['hauteur'] = 25;
    PRODUITS['PO']['epaisseur'] = 0;
    PRODUITS['PO']['elevation'] = 0;
}


/*********************************************************************************************************************************/

initialisationTableaux();

var travee1 = createTravee();
scene.add(travee1);

scene.add(createToit());

var firstWindow = createOpening(travee1.name, 'AV', 'F2');
scene.add(firstWindow);

var secondWindow = createOpening(travee1.name, 'PGAV', 'F1');
scene.add(secondWindow);

var firstDoor = createOpening(travee1.name, 'PDAR', 'PE');
scene.add(firstDoor);

var secondDoor = createOpening(travee1.name, 'PGAR', 'PF', 2);
scene.add(secondDoor);

log(tableauTravees);



incrusterCotes();

window.addEventListener('resize', onWindowResize, false);
document.addEventListener('click', onMouseClick);
document.addEventListener('mousemove', onMouseMove, false);
//document.addEventListener('dblclick', onMouseDoubleClick);
init();
displayGui();
animate();
