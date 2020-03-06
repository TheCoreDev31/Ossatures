import {
    rearLight,
    frontLight
} from "./environment.js"

// Aide au debug
var lightHelper1 = new THREE.DirectionalLightHelper(rearLight, 5);
var lightHelper2 = new THREE.DirectionalLightHelper(frontLight, 5);
var axesHelper = new THREE.AxesHelper(100);

scene.add(lightHelper1);
scene.add(lightHelper2);
scene.add(axesHelper);
