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
    alerte
} from "./main.js"



export function onMouseClick(event) {
    event.preventDefault();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    var intersects = raycaster.intersectObjects(objetsModifiables, true); // Il faut penser à rajouter les objets sur lesquels on veut pouvoir cliquer dans objetsModifiables[]
    if (intersects.length === 0) return;
    var objet = intersects[0].object;
    if (objet.geometry.type == 'PlaneBufferGeometry') return; // Pour éviter les intersections avec le sol
    if (objet.name == 'excluded') return; // Pour exclure certains objets de l'intersection (ex : cadre des fenêtres)

    if (objet.material[1]) { // Objets multi-matériaux (= les murs)

        //if (objet.name == 'front') {
        var face = Math.floor(intersects[0].faceIndex / 2); // Bidouille pour pouvoir sélectionner les 2 faces composant une façade.
        for (var j = 0; j < 2; j++) {
            var numFace = face * 2 + j;
            if (objetsSelectionnes.indexOf(numFace) < 0) {
                objet.geometry.faces[numFace].color.set(COLOR_ARRAY['highlight']);
                objetsSelectionnes.push(numFace);
                moduleSelectionne = objet.parent.name;

                // Dans la Gui, remettre à 0 la jauge "deplacerModule"

                info(objet);

            } else {
                objet.geometry.faces[numFace].color.set(COLOR_ARRAY['blanc']);
                objetsSelectionnes.splice(objetsSelectionnes.indexOf(numFace), 1);
                moduleSelectionne = '';
                info(null);
            }
        }
        objet.geometry.elementsNeedUpdate = true;
        /*        } else {
                    alerte("Sur un module, merci de sélectionner la façade avant.");
                }
        */
    } else { // Objets mono-matériau = fenêtres par exemple

        var face = Math.floor(intersects[0].faceIndex / 2);
        for (var j = 0; j < 2; j++) {
            var numFace = face * 2 + j;
            if (objetsSelectionnes.indexOf(numFace) < 0) {
                objet.material = selectedGlassMaterial;
                objetsSelectionnes.push(numFace);
                info(objet);
            } else {
                objet.material = glassMaterial;
                objetsSelectionnes.splice(objetsSelectionnes.indexOf(numFace), 1);
                info(null);
            }
        }
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
