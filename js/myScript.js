import {
    scene,
    loader,
    renderer,
    camera,
    light

} from "./scene.js"

import {
    pickPosition,
    handleClick
} from "./clickHandling.js"

import {
    module
} from "./mesh.js"


var animate = function () {
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
};

function init() {
    // Contrôles
    let controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.maxPolarAngle = Math.PI * 0.5;
    controls.minDistance = 20;
    controls.maxDistance = 1000;
}

var module1 = new module();
scene.add(module1);

var module2 = new module();
module2.translateX(36);
scene.add(module2);

var module3 = new module();
module3.translateX(-36);
scene.add(module3);



window.addEventListener('mousedown', handleClick);
init();
animate();
