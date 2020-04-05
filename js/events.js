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
    extraireNomTravee,
    extraireFace,
    verifierContraintes
} from "./main.js"

import {
    displayContextualMenu,
    displayOpenings,
    unSelect
} from "./gui.js"

import {
    supprimerOuverture,
    decalerTravee,
    creerOuverture
} from "./objects.js"


/*******************************    Gestion du clic sur le menu déroulant    **************************************/
$(".liste-deroulante").click(function (e) {

    e.preventDefault();

    var action = $(e.target).attr('data-action');
    var autorise = $(e.target).attr('class');

    if (autorise && autorise.indexOf('disabled') > -1) {
        alerte("Opération non autorisée : ouverture déjà présente sur ce mur.");
        return;
    }

    switch (action) {
        case 'deleteOuverture':
            var parent = scene.getObjectByName(objetSelectionne).parent.name;
            supprimerOuverture(parent);
            break;
        case 'addOpening':
            displayOpenings(objetSelectionne);
            break;
        case 'moveFrontTravee':
            decalerTravee(extraireNomTravee(objetSelectionne), 'front');
            break;
        case 'moveBackTravee':
            decalerTravee(extraireNomTravee(objetSelectionne), 'back');
            break;
        case 'unselect':
            unSelect();
            break;
        default:
            alert('Autre action inconnue !');
            break;
    }
    $("#div-menu-contextuel").hide();
});


/*******************************  Gestion des clics dans la popup des ouvertures  *********************************/
$("#popup-ouverture").click(function (e) {
    e.preventDefault();

    if ($(e.target).attr('id') == 'popup-alerte-annuler') {
        $("#popup-ouverture").hide();
        $("#overlay").hide();
        unSelect();
        return;
    }

    if (!$(e.target).parent().hasClass('disabled')) {
        var nomTravee = extraireNomTravee($("#traveeSelectionnee").val());
        var nomFace = extraireFace($("#traveeSelectionnee").val());
        if ($(e.target).parent().attr('id') == 'PE+F1') {
            scene.add(creerOuverture(nomTravee, nomFace, 'PE'));
            scene.add(creerOuverture(nomTravee, nomFace, 'F1'));
        } else scene.add(creerOuverture(nomTravee, nomFace, $(e.target).parent().attr('id')));
        $("#popup-ouverture").hide();
        $("#overlay").hide();
        unSelect();
    }
});


export function onMouseClick(event) {
    var objetTouche, faceTouchee;
    var _faceExterneMur = 10;
    // Pour info, les faces

    event.preventDefault();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    mouse.left = event.pageX;
    mouse.top = event.pageY;

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
    if ($('#div-menu-contextuel').css('opacity') == 1) return;

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
        if (objetTouche.parent.name.includes('>'))
            objetTouche.material = selectedGlassMaterial;
        else
            objetTouche.geometry.faces[numFace].color.set(COLOR_ARRAY['highlight']);

        objetTouche.geometry.elementsNeedUpdate = true;
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
