import {
    camera,
    renderer
} from "./environment.js"

import {
    COLOR_ARRAY,
    glassMaterial,
    selectedGlassMaterial
} from "./materials.js"

import {
    info,
    alerte,
    log
} from "./main.js"

import {
    displayContextualMenu,
    hideContextualMenu
} from "./gui.js"



export function onMouseClick(event) {
    event.preventDefault();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    var intersects = raycaster.intersectObjects(objetsModifiables, true); // Il faut penser à rajouter les objets sur lesquels on veut pouvoir cliquer dans objetsModifiables[]
    if (intersects.length === 0) {
        hideContextualMenu();
        traveeSelectionnee = '';

        log('onMouseClick : facesSelectionnes=' + facesSelectionnes);
        return
    }

    // Désélectionner l'objet actuellement sélectionné)

    var objet = intersects[0].object;
    if (objet.geometry.type == 'PlaneBufferGeometry') return; // Pour éviter les intersections avec le sol
    if (objet.name == 'excluded') return; // Pour exclure certains objets de l'intersection (ex : cadre des fenêtres)

    if (objet.material[1]) { // Objets multi-matériaux (= les murs)

        var face = Math.floor(intersects[0].faceIndex / 2); // Bidouille pour pouvoir sélectionner les 2 faces composant une façade.
        for (var j = 0; j < 2; j++) {
            var numFace = face * 2 + j;
            if (facesSelectionnes.indexOf(numFace) < 0) {
                objet.geometry.faces[numFace].color.set(COLOR_ARRAY['highlight']);
                facesSelectionnes.push(numFace);
                traveeSelectionnee = objet.parent.name;
                info(objet);
                displayContextualMenu(objet, mouse.left, mouse.top);
            } else {
                objet.geometry.faces[numFace].color.set(COLOR_ARRAY['blanc']);
                facesSelectionnes.splice(facesSelectionnes.indexOf(numFace), 1);
                traveeSelectionnee = '';
                info(null);
                hideContextualMenu();
            }
        }
        objet.geometry.elementsNeedUpdate = true;

    } else { // Objets mono-matériau = fenêtres par exemple

        var face = Math.floor(intersects[0].faceIndex / 2);
        for (var j = 0; j < 2; j++) {
            var numFace = face * 2 + j;
            if (facesSelectionnes.indexOf(numFace) < 0) {
                objet.material = selectedGlassMaterial;
                facesSelectionnes.push(numFace);
                info(objet);

                displayContextualMenu(objet, mouse.left, mouse.top);

            } else {
                objet.material = glassMaterial;
                facesSelectionnes.splice(facesSelectionnes.indexOf(numFace), 1);
                info(null);
                hideContextualMenu();
            }
        }
    }
}


export function onMouseMove(event) {
    event.preventDefault();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    mouse.left = event.pageX;
    mouse.top = event.pageY;
}


export function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
