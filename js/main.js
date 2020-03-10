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
    createWindow,
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

export function recalculerCotes(direction = 'largeur') {

    if (direction == 'largeur') {
        if (scene.getObjectByName('CoteX'))
            scene.remove(scene.getObjectByName('CoteX'));

        incrusterCotes('largeur');
    } else {
        if (scene.getObjectByName('CoteY'))
            scene.remove(scene.getObjectByName('CoteY'));

        incrusterCotes('longueur');
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


/*********************************************************************************************************************************/

module1 = createModule();
scene.add(module1);
objetsModifiables.push(module1);

scene.add(createRoof());

var firstWindow = createWindow();
scene.add(firstWindow);
objetsModifiables.push(firstWindow);

incrusterCotes();


window.addEventListener('resize', onWindowResize, false);
document.addEventListener('click', onMouseClick);
document.addEventListener('mousemove', onMouseMove, false);
//document.addEventListener('dblclick', onMouseDoubleClick);

init();
handleGui();
animate();
