import {
    camera,
    renderer
} from "./environment.js"

import {
    COLOR_ARRAY
} from "./materials.js"


/*   Pour la gestion des faces

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    var intersects = raycaster.intersectObjects(objetsModifiables, true); // Il faut penser à rajouter les objets sur lesquels on veut pouvoir cliquer dans objetsModifiables[]
    if (intersects.length === 0) return;
    var face = Math.floor(intersects[0].faceIndex / 2); // Bidouille pour pouvoir sélectionner les 2 faces composant une façade.
    for (var j = 0; j < 2; j++) {
        var numFace = face * 2 + j;
        if (objectsSelectionnes.indexOf(numFace) < 0) {
            intersects[0].object.geometry.faces[numFace].color.set(COLOR_HIGHLIGHT);
            objectsSelectionnes.push(numFace);
        } else {
            intersects[0].object.geometry.faces[numFace].color.set(COLOR_BLANC);
            objectsSelectionnes.splice(objectsSelectionnes.indexOf(numFace), 1);
        }
    }
    intersects[0].object.geometry.elementsNeedUpdate = true;
*/

function displayInfos(objet) {
    if (objet != null)
        document.getElementById('objectDescription').innerHTML = objet.parent.name + " sélectionné (Id : " + objet.id + ")";
    else
        document.getElementById('objectDescription').innerHTML = '';
}


export function onMouseClick(event) {
    event.preventDefault();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    var intersects = raycaster.intersectObjects(objetsModifiables, true); // Il faut penser à rajouter les objets sur lesquels on veut pouvoir cliquer dans objetsModifiables[]
    if (intersects.length === 0) return;
    var objet = intersects[0].object;

    console.log(objet);

    if (objet.geometry.type == 'PlaneBufferGeometry') return;

    if (objectsSelectionnes.indexOf(objet.id) < 0) {
        if (objet.material[1])
            objet.material[1].color.set(COLOR_ARRAY['highlight']);
        else
            objet.material.color.set(COLOR_ARRAY['highlight']);

        objectsSelectionnes.push(objet.id);
        displayInfos(objet);
    } else {
        if (objet.material[1])
            objet.material[1].color.set(COLOR_ARRAY['blanc']);
        else
            objet.material.color.set(COLOR_ARRAY['blanc']);

        objectsSelectionnes.splice(objectsSelectionnes.indexOf(objet.id), 1);
        displayInfos(null);
    }
}


export function onMouseMove(event) {
    event.preventDefault();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}


export function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
