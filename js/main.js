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


/*********************************************************************************************************************************/

module1 = createModule();
scene.add(module1);
editableObjects.push(module1);

scene.add(createRoof());

var firstWindow = createWindow();
scene.add(firstWindow);
editableObjects.push(firstWindow);

//afficherCotes();


window.addEventListener('resize', onWindowResize, false);
document.addEventListener('click', onMouseClick);
document.addEventListener('mousemove', onMouseMove, false);
//document.addEventListener('dblclick', onMouseDoubleClick);

init();
handleGui();
animate();
