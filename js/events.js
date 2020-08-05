import {
    camera,
    cameraOrtho,
    renderer,
    aspectRatio
} from "./environment.js"

import {
    COLOR_ARRAY,
    glassMaterial,
    selectedGlassMaterial,
    SOLE_1_Material,
    SOLE_2_Material,
    SOLP_Material,
    SOLT_Material,
    PEXT_Material,
    PINT_Gauche_Material,
    PINT_Droite_Material
} from "./materials.js"

import {
    info,
    alerte,
    log,
    extraireNomTravee,
    extraireFace,
    verifierContraintes,
    mergeGroups,
    retirerObjetModifiable,
    faceInterieureOuExterieure,
    modifierIncrustation,
    toggleIncrustations,
    animate
} from "./main.js"

import {
    displayContextualMenu,
    displayOpenings,
    displayPignonOpenings,
    chooseFloorHole,
    unSelect,
    changePointOfView,
    afficherVueAerienne
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
        var message = "Opération non autorisée : ";
        if (action == 'addOpening') message += "une ouverture est déjà présente sur ce mur.";
        if (action.startsWith('move')) message += "décalage impossible dans cette configuration.";
        alerte(message);
        return;
    }

    switch (action) {
        case 'deleteOuverture':
            supprimerOuverture(scene.getObjectByName(objetSelectionne).parent.name);
            break;
        case 'addOpening':
            displayOpenings(objetSelectionne, faceInterieureOuExterieure(objetSelectionne));
            break;
        case 'moveFrontTravee':
            decalerTravee(extraireNomTravee(objetSelectionne), 'front');
            break;
        case 'moveBackTravee':
            decalerTravee(extraireNomTravee(objetSelectionne), 'back');
            break;
        case 'chooseFloorHole':
            chooseFloorHole(extraireNomTravee(objetSelectionne));
            break;
        case 'unselect':
            unSelect();
            break;
        case 'addPignonOpening':
            displayPignonOpenings(objetSelectionne);
            break;
        case 'deletePignonOpening':
            // On remplace la texture du pignon intérieur par celle d'un pignon plein
            var pignon = scene.getObjectByName(objetSelectionne);
            pignon.material = PEXT_Material;
            unSelect();
            break;
        default:
            alert('Autre action inconnue !');
            break;
    }
    $("#div-menu-contextuel").hide();
});


/*******************************  Gestion des clics dans la popup des pignons  *********************************/
$("#popup-pignon").click(function (e) {
    e.stopImmediatePropagation();
    if ($(e.target).attr('id') == 'popup-alerte-annuler') {
        $(".popup-ouverture").hide();
        $("#overlay").hide();
        unSelect();
        return;
    }

    var pignonSelectionne = scene.getObjectByName(objetSelectionne);
    switch ($(e.target).parent().attr('id')) {
        case "gauche":
            pignonSelectionne.material = PINT_Gauche_Material;
            break;
        case "droite":
            pignonSelectionne.material = PINT_Droite_Material;
            break;
    }
    $(".popup-ouverture").hide();
    $("#overlay").hide();
    unSelect();
});


/*******************************  Gestion des clics dans la popup des planchers  *********************************/
$("#popup-plancher").click(function (e) {
    e.stopImmediatePropagation();
    if ($(e.target).attr('id') == 'popup-alerte-annuler') {
        $(".popup-ouverture").hide();
        $("#overlay").hide();
        unSelect();
        return;
    }

    if (!$(e.target).parent().hasClass('disabled')) {

        // On supprime l'ancien plancher et on le recrée avec la trappe au bon endroit
        var nomTravee = extraireNomTravee($("#traveeSelectionnee").val());
        var nomFace = extraireFace($("#traveeSelectionnee").val());

        var plancher = scene.getObjectByName(objetSelectionne);
        if (plancher) {
            switch ($(e.target).parent().attr('id')) {
                case "plein":
                    plancher.material = SOLP_Material;
                    break;
                case "haut-gauche":
                    plancher.material = SOLE_1_Material;
                    plancher.rotation.z = 0;
                    break;
                case "haut-droite":
                    plancher.material = SOLE_2_Material;
                    plancher.rotation.z = 0;
                    break;
                case "bas-droite":
                    plancher.material = SOLE_1_Material;
                    plancher.rotation.z = Math.PI;
                    break;
                case "bas-gauche":
                    plancher.material = SOLE_2_Material;
                    plancher.rotation.z = Math.PI;
                    break;
                case "haut-centre":
                    plancher.material = SOLT_Material;
                    plancher.rotation.z = 0;
                    break;
                case "bas-centre":
                    plancher.material = SOLT_Material;
                    plancher.rotation.z = Math.PI;
                    break;
            }
        }

        $(".popup-ouverture").hide();
        $("#overlay").hide();
        unSelect();
    }
});



/*******************************  Gestion des clics dans la popup des ouvertures  *********************************/
$(".popup-ouverture").click(function (e) {
    e.preventDefault();

    if ($(e.target).attr('id') == 'popup-alerte-annuler') {
        $(".popup-ouverture").hide();
        $("#overlay").hide();
        unSelect();
        return;
    }

    if (!$(e.target).parent().hasClass('disabled')) {
        var nomTravee = extraireNomTravee($("#traveeSelectionnee").val());
        var nomFace = extraireFace($("#traveeSelectionnee").val());

        if ($(e.target).parent().attr('id') != 'PE+F1') {
            scene.add(creerOuverture(nomTravee, nomFace, $(e.target).parent().attr('id')));
        } else {

            // Cas particulier du combo PE + F1 :
            // on créé chacune de 2 ouvertures puis on régularise (nb d'ouvertures, score VT, etc...)
            var porte = creerOuverture(nomTravee, nomFace, 'PE');
            var fenetre = creerOuverture(nomTravee, nomFace, 'F1');
            modifierIncrustation(nomTravee, nomFace, PRODUITS['PE+F1']['codeModule'])

            var nouveauGroupe = new THREE.Group();
            nouveauGroupe = mergeGroups(porte, fenetre);
            nouveauGroupe.name = nomTravee + '>' + nomFace + '>Ouverture ' + 'PE+F1';
            objetsModifiables.push(nouveauGroupe);
            tableauTravees[nomTravee]['nb_ouvertures_' + nomFace]--;
            tableauTravees[nomTravee]['vt_' + nomFace] = PRODUITS['PE+F1']['VT'];
            nbOuvertures--;

            scene.add(nouveauGroupe);
            scene.remove(porte);
            retirerObjetModifiable(porte.name);
            scene.remove(fenetre);
            retirerObjetModifiable(fenetre.name);
        }
        $(".popup-ouverture").hide();
        $("#overlay").hide();
        unSelect();
    }
});



/**********************************  Changement d'angle de vue  ***********************************/
$("#changement-vue div").click(function (e) {
    e.stopImmediatePropagation();
    $("#changement-vue div").removeClass('actif');

    var direction = $(e.target).parent().attr('id');
    if (direction == "aerien") {
        afficherVueAerienne();
    } else {
        $(e.target).parent().addClass('actif');
        changePointOfView(direction);
    }

});

/*******************************    Clic pour quitter le mode vue aérienne    **************************************/
$("#quitter-vue-aerienne").click(function (e) {
    e.preventDefault();
    $("#vue-aerienne").hide();
    $("div:contains('Open Controls')").click();

    $("#changement-vue div#aerien").removeClass("actif");
    activeCamera = camera;
    camera.position.set(60, 40, 160);
    cameraOrtho.zoom = 1;

    toggleIncrustations();

    // On raffiche toit et plancher
    $("span:contains('afficherToit')").click();
    $("span:contains('afficherPlancher')").click();
});



$("#zoom").click(function (e) {
    if (cameraOrtho.zoom < 4)
        cameraOrtho.zoom += 0.1;
    e.stopImmediatePropagation();
});

$("#dezoom").click(function (e) {
    if (cameraOrtho.zoom > 0.2)
        cameraOrtho.zoom -= 0.1;
    e.stopImmediatePropagation();
});







/****************************************************************************************************************/


export function onMouseDoubleClick(event) {
    var objetTouche, faceTouchee;
    var FACE_EXTERNE = 10;

    if ($("#vue-aerienne").css("display") == "flex") return;

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
    if (objetTouche.name.includes('excluded')) return; // Pour exclure certains objets de l'intersection (ex : cadre des fenêtres ou toit)
    //    if (objetTouche.name.startsWith('Travee') && !objetTouche.parent.name.includes('>') && faceTouchee < FACE_EXTERNE) return; // Façade != façade avant du mur

    // Pour le cas particulier du toit, qui doit laisser passer le raycast, on recherche le prochain objet ni transparent ni exclu.
    var trouve = false;
    if (objetTouche.name.includes('transparent')) {
        for (var i = 1; i < intersects.length; i++) {
            if (!intersects[i].object.name.includes('transparent') && !intersects[i].object.name.includes('excluded')) {
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
        if (objetTouche.parent.name.includes('>') && !objetTouche.name.includes('PINT'))
            objetTouche.material = selectedGlassMaterial;
        else {
            if (objetTouche.name.includes('PINT')) {
                for (var k = 0; k < 12; k++) {
                    objetTouche.geometry.faces[k].color.set(COLOR_ARRAY['highlight']);
                }
            } else
                objetTouche.geometry.faces[numFace].color.set(COLOR_ARRAY['highlight']);
        }
        objetTouche.geometry.elementsNeedUpdate = true;
        facesSelectionnees.push(numFace);
        objetSelectionne = objetTouche.name;
        info(objetTouche);
        displayContextualMenu(objetTouche, mouse.left, mouse.top);
    }
}


export function onMouseClick(event) {

    if (!event.srcElement.localName == 'a') event.preventDefault();

    if (activeCamera != camera)
        camera.zoom = 1;

    $("#changement-vue div").removeClass("actif");
}


export function onMouseMove(event) {
    event.preventDefault();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    mouse.left = event.pageX;
    mouse.top = event.pageY;

    if (DEBUG) {
        var intersects = raycaster.intersectObjects(objetsModifiables, true);
        alerte(intersects[0].name);
    }


}

export function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
