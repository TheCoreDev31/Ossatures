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
    log,
    extraireNomTravee
} from "./main.js"

import {
    displayContextualMenu,
    hideContextualMenu,
    unSelect
} from "./gui.js"

import {
    supprimerOuverture,
    deplacerTravee
} from "./objects.js"


/*******************************    Gestion du clic sur le menu déroulant    **************************************/
$(".liste-deroulante").click(function (e) {

    e.preventDefault();
    var action = $(e.target).attr('data-action');
    if (DEBUG) log('Action menu contextuel = ' + action);
    switch (action) {
        case 'deleteOuverture':
            supprimerOuverture(objetSelectionne);
            break;
        case 'addOpening':
            alert('add');
            break;
        case 'moveFrontTravee':
            deplacerTravee(extraireNomTravee(objetSelectionne), 'front');
            break;
        case 'moveBackTravee':
            deplacerTravee(extraireNomTravee(objetSelectionne), 'back');
            break;
        case 'unselect':
            unSelect();
            break;
        default:
            alert('Autre action inconnue !');
            break;
    }
    hideContextualMenu();
});



export function onMouseClick(event) {
    event.preventDefault();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    // Il faut penser à rajouter les objets sur lesquels on veut pouvoir cliquer dans objetsModifiables[]
    var intersects = raycaster.intersectObjects(objetsModifiables, true);

    if (intersects.length === 0) { // On clique en-dehors d'un objet cliquable.
        unSelect();
        return;
    }
    if ($('#contextualMenuDiv').css('opacity') == 1) return;

    var objet = intersects[0].object;

    // On n'intercepte volontairement pas certains objets
    if (objet.geometry.type == 'PlaneBufferGeometry') return; // Pour éviter les intersections avec le sol
    if (objet.name == 'excluded') return; // Pour exclure certains objets de l'intersection (ex : cadre des fenêtres ou toit)
    if (objet.name.includes('Travee') && !objet.parent.name.includes('>') && intersects[0].faceIndex < 10) return; // Façade != façade avant du mur

    // S'il existe déjà une précédente sélection, on l'efface.
    if (facesSelectionnees.length > 0) unSelect()

    var face = Math.floor(intersects[0].faceIndex / 2); // Bidouille pour pouvoir sélectionner les 2 faces composant une façade.
    for (var j = 0; j < 2; j++) {
        var numFace = face * 2 + j;
        if (objet.material[1]) { // Les murs
            objet.geometry.faces[numFace].color.set(COLOR_ARRAY['highlight']);
        } else { // Les ouvertures
            objet.material = selectedGlassMaterial;
        }
        objetSelectionne = objet.name;
        facesSelectionnees.push(numFace);
        info(objet);
        displayContextualMenu(objet, mouse.left, mouse.top);
    }
    objet.geometry.elementsNeedUpdate = true;
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
