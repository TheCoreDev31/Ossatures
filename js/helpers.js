import {
    light,
    light2
} from "./scene.js"

// Aide au debug
var lightHelper1 = new THREE.DirectionalLightHelper(light, 5);
var lightHelper2 = new THREE.DirectionalLightHelper(light2, 5);
var axesHelper = new THREE.AxesHelper(200);

scene.add(lightHelper1);
scene.add(lightHelper2);
scene.add(axesHelper);
