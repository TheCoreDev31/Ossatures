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
    displayGui
} from "./gui.js"

import {
    createOpening,
    createRoof,
    createModule
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
        var newMessage = param.parent.name + " sélectionné (Id : " + param.id + ")";
        document.getElementById('objectDescription').className = 'normal';
        document.getElementById('objectDescription').innerHTML = newMessage;
        return;
    }
}


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

function incrusterCotes(direction = 'largeur') {
    if (direction == 'largeur') {
        var texte = (nbModules * (LARGEUR_MODULE / 10)) + ' m';
        var cotes = createText(texte);
        var hauteurTexte = -(HAUTEUR_MODULE / 2) + 0.2;
        var cotesGrp = new THREE.Group();

        cotes.rotation.x = -Math.PI / 2;
        cotes.position.set(0, hauteurTexte, (LONGUEUR_MODULE / 2) + 8);
        cotesGrp.add(cotes);

        var points = [];
        points.push(new THREE.Vector3((-LARGEUR_MODULE / 2) * nbModules, hauteurTexte, (LONGUEUR_MODULE / 2) + 1));
        points.push(new THREE.Vector3((-LARGEUR_MODULE / 2) * nbModules, hauteurTexte, (LONGUEUR_MODULE / 2) + 10));
        points.push(new THREE.Vector3((LARGEUR_MODULE / 2) * nbModules, hauteurTexte, (LONGUEUR_MODULE / 2) + 10));
        points.push(new THREE.Vector3((LARGEUR_MODULE / 2) * nbModules, hauteurTexte, (LONGUEUR_MODULE / 2) + 1));
        var line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), textMaterial);
        cotesGrp.add(line);
        cotesGrp.name = 'CoteX';
        scene.add(cotesGrp);
    } else {
        /*      Calcul de la côte de profondeur, plus complexe en raison des décalages éventuels
         */
    }
}

export function incrusterCotesX() {
    incrusterCotes('largeur');
}

export function incrusterCotesY() {
    incrusterCotes('longueur');
}


export function deplacerModule(moduleName, direction) {
    if (nbModules <= 1) {
        alerte("Vous devez avoir plus d'un module dans votre projet.");
        return;
    }

    var module = scene.getObjectByName(moduleName);
    var nbMurs = module.children.length;
    for (var i = 0; i < nbMurs - 1; i++) {
        module.children[i].visible = true;
    };
    if (direction == 'haut') {
        module.position.z += 36;
    } else {
        module.position.z -= 36;
    }

}


function initialisationTableaux() {

    for (var i = 0; i < 4; i++) {
        mesModules['Module ' + (i + 1)] = new Array();
    }


    var nbCaract = 5;
    PRODUITS['PE'] = new Array(nbCaract); // ScoreVT, largeur, hauteur, epaisseur, distance du sol
    PRODUITS['PE']['VT'] = 2;
    PRODUITS['PE']['largeur'] = 9;
    PRODUITS['PE']['hauteur'] = 21.5;
    PRODUITS['PE']['epaisseur'] = 3;
    PRODUITS['PE']['elevation'] = 0;

    PRODUITS['F1'] = new Array(nbCaract); // ScoreVT, largeur, hauteur, epaisseur
    PRODUITS['F1']['VT'] = 2;
    PRODUITS['F1']['largeur'] = 4.5;
    PRODUITS['F1']['hauteur'] = 6.5;
    PRODUITS['F1']['epaisseur'] = 3;
    PRODUITS['F1']['elevation'] = 15;

    PRODUITS['F2'] = new Array(nbCaract); // ScoreVT, largeur, hauteur, epaisseur
    PRODUITS['F2']['VT'] = 2;
    PRODUITS['F2']['largeur'] = 10.5;
    PRODUITS['F2']['hauteur'] = 11.5;
    PRODUITS['F2']['epaisseur'] = 3;
    PRODUITS['F2']['elevation'] = 10;

    PRODUITS['PF'] = new Array(nbCaract); // ScoreVT, largeur, hauteur, epaisseur
    PRODUITS['PF']['VT'] = 1.4;
    PRODUITS['PF']['largeur'] = 18;
    PRODUITS['PF']['hauteur'] = 21.5;
    PRODUITS['PF']['epaisseur'] = 3;
    PRODUITS['PF']['elevation'] = 0;

    PRODUITS['PG'] = new Array(nbCaract); // ScoreVT, largeur, hauteur, epaisseur
    PRODUITS['PG']['VT'] = 0;
    PRODUITS['PG']['largeur'] = 24;
    PRODUITS['PG']['hauteur'] = 20;
    PRODUITS['PG']['epaisseur'] = 3;
    PRODUITS['PG']['elevation'] = 0;

}


/*********************************************************************************************************************************/

initialisationTableaux();

module1 = createModule();
scene.add(module1);

scene.add(createRoof());

var firstWindow = createOpening(module1.name, 'AV', 'F2', 2);
scene.add(firstWindow);

var secondWindow = createOpening(module1.name, 'PDAV', 'F1');
scene.add(secondWindow);

var firstDoor = createOpening(module1.name, 'PDAR', 'PE');
scene.add(firstDoor);


incrusterCotes();


window.addEventListener('resize', onWindowResize, false);
document.addEventListener('click', onMouseClick);
document.addEventListener('mousemove', onMouseMove, false);
//document.addEventListener('dblclick', onMouseDoubleClick);

init();
displayGui();
animate();
