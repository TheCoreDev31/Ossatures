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
    hideContextualMenu,
    unSelect
} from "./gui.js"

import {
    creerOuverture,
    creerToit,
    creerTravee
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
    controls.minDistance = 1;
    controls.maxDistance = 500;

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
}


/********************************   Gestion des messages d'info et des alertes   ***************************************/
export function alerte(message) {
    $("#messageInfo").prop("class", "alerte");
    $("#messageInfo").html(message);
    setTimeout(function () {
        $("#messageInfo").prop("class", "normal");
        $("#messageInfo").html("");
    }, 2000);
    unSelect();
}

export function info(param) {
    if (param == null) {
        $("#messageInfo").prop("class", "normal");
        $("#messageInfo").html("");
        return;
    }
    if (typeof (param) == 'string') {
        newMessage
        $("#messageInfo").html(param);
        setTimeout(function () {
            $("#messageInfo").html("");
        }, 2000);
    } else {
        var newMessage = "Sélection : " + param.name;
        $("#messageInfo").prop("class", "normal");
        $("#messageInfo").html(newMessage);
    }
}

export function log(message) {
    console.log(message);
}


/************************   Gestion des cotes affichées sur le plan   ***********************************************/

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


function initialisationTableaux() {

    // Tableau fixe des produits
    var nbCaract = 5;
    PRODUITS['MU'] = new Array(nbCaract); // ScoreVT, largeur, hauteur, epaisseur, distance du sol
    PRODUITS['MU']['VT'] = 3;
    PRODUITS['MU']['largeur'] = PRODUITS['MU']['hauteur'] = PRODUITS['MU']['epaisseur'] = PRODUITS['MU']['elevation'] = 0;

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



/*******************************************    Petites fonctions utiles   ********************************************/

export function extraireNomTravee(objet) {
    return objet.substr(0, objet.indexOf('>'));
}

export function extraireFace(objet) {
    var face = objet.substr(objet.indexOf('>') + 1, objet.length);

    return face.substr(0, face.indexOf('>'));
}

export function rechercherConstruction(nomTravee) {
    for (var i = 1; i < tableauConstructions.length; i++) {
        if (tableauConstructions[i].includes(voisine)) {
            tableauConstructions[i].push(prefixe);
            break;
        }
    }
}

/******************   La grosse fonction pour déterminer si une ouverture peut être rajoutée ou non   *****************/
export function verifierRajoutOuverture(nomTravee, face, typeOuverture) {

    var typeConstruction = '';
    var positionDansConstruction = '';

    var contraintesVT = new Array();
}


/*********************************************************************************************************************************/

initialisationTableaux();

var travee1 = creerTravee();
scene.add(travee1);

var firstWindow = creerOuverture(travee1.name, 'AV', 'F2');
scene.add(firstWindow);

var secondWindow = creerOuverture(travee1.name, 'PGAV', 'F1');
scene.add(secondWindow);

//var firstDoor = creerOuverture(travee1.name, 'PDAR', 'PE');
//scene.add(firstDoor);
//
//var secondDoor = creerOuverture(travee1.name, 'PGAR', 'PF', 2);
//scene.add(secondDoor);

incrusterCotes();

window.addEventListener('resize', onWindowResize, false);
document.addEventListener('click', onMouseClick);
document.addEventListener('mousemove', onMouseMove, false);
//document.addEventListener('dblclick', onMouseDoubleClick);

init();
displayGui();
animate();
