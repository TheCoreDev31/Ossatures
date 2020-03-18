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
    var objetTouche, faceTouchee;
    var _faceExterneMur = 10;
    // Pour info, les faces

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

    if (DEBUG) {
        log('Vous avez cliqué sur : ');
        log(intersects);
    }

    // Pour éviter les intersections alors que le menu contextuel est affiché.
    if ($('#contextualMenuDiv').css('opacity') == 1) return;

    objetTouche = intersects[0].object;
    faceTouchee = intersects[0].faceIndex;

    // On n'intercepte volontairement pas certains objets
    if (objetTouche.name == 'excluded') return; // Pour exclure certains objets de l'intersection (ex : cadre des fenêtres ou toit)
    if (objetTouche.name.includes('Travee') && !objetTouche.parent.name.includes('>') && faceTouchee < _faceExterneMur) return; // Façade != façade avant du mur

    // Pour le cas particulier du toit, qui doit laisser passer le raycast, on recherche le prochain objet ni transparent ni exclu.
    var trouve = false;
    if (objetTouche.name == 'transparent') {
        for (var i = 1; i < intersects.length; i++) {
            if (intersects[i].object.name != 'transparent' && intersects[i].object.name != 'excluded') {
                objetTouche = intersects[i].object;
                faceTouchee = intersects[i].faceIndex;
                trouve = true;
                break;
            }
        }
        if (!trouve) return;
    }

    // S'il existe déjà une précédente sélection, on l'efface.
    if (facesSelectionnees.length > 0) unSelect()

    var face = Math.floor(faceTouchee / 2); // Bidouille pour pouvoir sélectionner les 2 faces composant une façade.

    for (var j = 0; j < 2; j++) {
        var numFace = face * 2 + j;
        if (objetTouche.material[1]) { // Les murs
            objetTouche.geometry.faces[numFace].color.set(COLOR_ARRAY['highlight']);
        } else { // Les ouvertures
            objetTouche.material = selectedGlassMaterial;
        }
        facesSelectionnees.push(numFace);
        objetSelectionne = objetTouche.name;
        info(objetTouche);
        displayContextualMenu(objetTouche, mouse.left, mouse.top);
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
