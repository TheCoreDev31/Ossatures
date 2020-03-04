import {
    renderer,
    camera,
    light

} from "./scene.js"

import {
    pickPosition,
    handleClick
} from "./clickHandling.js"

var animate = function () {
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
};

function init() {
    let controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.maxPolarAngle = Math.PI * 0.5;
    controls.minDistance = 20;
    controls.maxDistance = 1000;

    window.addEventListener('mousedown', handleClick);
    animate();
}

module1 = buildModule();
scene.add(module1);

window.addEventListener('mousedown', handleClick);
init();
animate();
