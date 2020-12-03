import {
    camera,
    cameraOrtho,
    renderer,
    aspectRatio
} from "./environment.js"

import {
    COLOR_ARRAY,
    windowMaterial,
    glassMaterial,
    selectedGlassMaterial,
    doorMaterial,
    selectedDoorMaterial,
    SOLP_Material,
    SOLE_1_Material,
    SOLE_2_Material,
    SOLT_Material,
    MPE_Material,
    MF1d_Material,
    MF1g_Material,
    MF2_Material,
    MPEF_Material,
    MPF_Material,
    MPI_Material,
    MPG1_Material,
    MPG2_Material,
    PINT_Gauche_Material,
    PINT_Droite_Material,
    PEXT_Material,
    createText
}
from "./materials.js"

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
    showMainIncrustations,
    hideMainIncrustations,
    showPignonIncrustations,
    hidePignonIncrustations,
    animate,
    traduireNomObjet,
    calculerTaillePoliceOptimale,
    redimensionnerIncrustations,
    rechercherFaceOpposee,
    verifierControlesMetier
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
    creerTravee,
    creerOuverture,
    creerComboOuvertures,
    supprimerToutesOuvertures,
    traitementCreationTravee,
    traitementCreationOuverture,
    selectionnerSolivage,
    verifierPossibiliteDecalage,
    recreerTrappes
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
            var backupObjetSelectionne = objetSelectionne;
            var typeOuverture = objetSelectionne.substring(objetSelectionne.indexOf("Ouverture"), objetSelectionne.lastIndexOf('>'));
            supprimerOuverture(scene.getObjectByName(objetSelectionne).parent.name);

            // Pour les cas de modules en jonction, il faut également supprimer l'ouverture qui est en face.
            var faceOpposee = rechercherFaceOpposee(extraireNomTravee(backupObjetSelectionne), extraireFace(backupObjetSelectionne));
            if (faceOpposee != null) {
                var autreOuverture = faceOpposee[0] + ">" + faceOpposee[1] + ">" + typeOuverture;
                supprimerOuverture(autreOuverture);
            }
            break;
        case 'addOpening':
            displayOpenings(objetSelectionne, faceInterieureOuExterieure(objetSelectionne));
            break;
        case 'moveFrontTravee':
            var nomTravee = extraireNomTravee(objetSelectionne);
            if (verifierPossibiliteDecalage(nomTravee, 'front')) {
                decalerTravee(nomTravee, 'front');
            }
            break;
        case 'moveBackTravee':
            var nomTravee = extraireNomTravee(objetSelectionne);
            if (verifierPossibiliteDecalage(nomTravee, 'back')) {
                decalerTravee(nomTravee, 'back');
            }
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

    var laTravee = extraireNomTravee(objetSelectionne);
    var pignonSelectionne = scene.getObjectByName(objetSelectionne);
    switch ($(e.target).parent().attr('id')) {
        case "gauche":
            pignonSelectionne.material = PINT_Gauche_Material;
            tableauTravees[laTravee].typePINT = "gauche";
            break;
        case "droite":
            pignonSelectionne.material = PINT_Droite_Material;
            tableauTravees[laTravee].typePINT = "droite";
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

        var nomTravee = extraireNomTravee(objetSelectionne);
        var nomFace = extraireFace(objetSelectionne);
        var solivageChoisi = $(e.target).parent().attr('id');

        if (verifierControlesMetier(solivageChoisi, tableauTravees[nomTravee].numConstruction)) {
            var typeSolivage, decalageIncrustation = 0;

            selectionnerSolivage(nomTravee, solivageChoisi);

            $(".popup-ouverture").hide();
            $("#overlay").hide();
            unSelect();
        } else {
            unSelect();
            $("#overlay").hide();
            $(".popup-ouverture").hide();
            alerte("Une seule ouverture <u>de chaque type</u> par construction autorisée.");
        }
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
        var nouvelleOuverture;

        if ($(e.target).parent().attr('id') != 'PE+F1') {
            nouvelleOuverture = creerOuverture(nomTravee, nomFace, $(e.target).parent().attr('id'));
            traitementCreationOuverture(nomTravee, nomFace, nouvelleOuverture);

            var faceOpposee = rechercherFaceOpposee(nomTravee, nomFace);
            if (faceOpposee != null) {
                nouvelleOuverture = creerOuverture(faceOpposee[0], faceOpposee[1], $(e.target).parent().attr('id'));
                traitementCreationOuverture(faceOpposee[0], faceOpposee[1], nouvelleOuverture);
            }
        } else {

            // Cas particulier du combo PE + F1 :
            // on crée chacune de 2 ouvertures puis on régularise (nb d'ouvertures, score VT, etc...)
            var ouvertures = creerComboOuvertures(nomTravee, nomFace);
            traitementCreationOuverture(nomTravee, nomFace, ouvertures);
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


$("#transparent-overlay").click(function (e) {
    e.preventDefault();
    if ($("#transparent-overlay").is(":visible"))
        alerte("Pour quitter cette vue, cliquez sur le bouton rouge.");
});


/*******************************    Clic pour quitter le mode vue aérienne    **************************************/
$("#quitter-vue-aerienne").click(function (e) {
    e.preventDefault();
    $("#vue-aerienne").hide();
    if ($("#overlay").is(":visible")) $("#overlay").hide();
    if ($("#transparent-overlay").is(":visible")) $("#transparent-overlay").hide();

    $("div:contains('Open Controls')").click();

    $("#changement-vue div#aerien").removeClass('surligne');
    activeCamera = camera;
    camera.position.set(60, 40, 160);
    cameraOrtho.zoom = 1;

    hideMainIncrustations();

    // On raffiche toit et plancher
    $("span:contains('afficherToit')").click();
    $("span:contains('afficherPlancher')").click();
});



$("#zoom").click(function (e) {
    if (cameraOrtho.zoom < 4)
        cameraOrtho.zoom += 0.1;
    e.stopImmediatePropagation();

    // On redimensionne la police des incrustations
    redimensionnerIncrustations();
});

$("#dezoom").click(function (e) {

    if (cameraOrtho.zoom > 0.2)
        cameraOrtho.zoom -= 0.1;
    e.stopImmediatePropagation();

    // On redimensionne la police des incrustations
    redimensionnerIncrustations();
});


/*********************************   Dans la vue d'implantation, affichage de la légende   ****************************/
$("#boutons > #legende").click(function (e) {
    e.preventDefault();

    if (!$("#legende").is(":visible")) {
        $("#legende").show();
        //        $("#overlay").show();
    } else {
        $("#legende").hide();
        //        $("#overlay").hide();
    }
});



/**********************************   Popup d'export de la scene   *************************************************/
$("#popup-export-button").click(function (e) {
    $("#popup-export").hide();
    $("#overlay").hide();

    $("#popup-export .texte").html(TEXTE_EXPORT);
});


/**********************************   Popup de choix du sens de décalage   *************************************************/
$("#popup-decalage-annuler").click(function (e) {
    $("#popup-decalage").hide();
    $("#overlay").hide();
});
$("#popup-decalage-arriere").click(function (e) {
    $("#popup-decalage").hide();
    $("#overlay").hide();

    decalerTravee(PREFIXE_TRAVEE + nbTravees, 'back', false);
    var travee = creerTravee();
    if (travee) traitementCreationTravee(travee);
    decalerTravee(PREFIXE_TRAVEE + (nbTravees - 1), 'front', false);
    supprimerToutesOuvertures();
    recreerTrappes();

});

$("#popup-decalage-avant").click(function (e) {
    $("#popup-decalage").hide();
    $("#overlay").hide();

    decalerTravee(PREFIXE_TRAVEE + nbTravees, 'front', false);
    var travee = creerTravee();
    if (travee) traitementCreationTravee(travee);
    decalerTravee(PREFIXE_TRAVEE + (nbTravees - 1), 'back', false);
    supprimerToutesOuvertures();
    recreerTrappes();
});


/*****************************************************************************************************************************/


/*    Petit easter-egg : le double-clic sur le logo Maninghem affiche des logs complètes dans la console  */
$(".image-logo").dblclick(function (e) {
    e.stopImmediatePropagation();
    log("tableauTravees[] = ");
    log(tableauTravees);
    log("inventaire[] = ");
    log(inventaire);
    log("objetsModifiables[] = ");
    log(objetsModifiables);

    showMainIncrustations();
    showPignonIncrustations();
});


/****************************************************************************************************************/


export function onMouseDoubleClick(event) {
    var objetTouche, faceTouchee;
    var FACE_EXTERNE = 10;

    if ($("#vue-aerienne").css("display") == "flex") return;
    if ($("#quitter-vue-aerienne").is(":visible")) return;

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

        // Suivant l'objet touché...
        if (!objetTouche.parent.name.includes('>')) { // Un mur            
            objetTouche.geometry.faces[numFace].color.set(COLOR_ARRAY['highlight']);
        } else {

            if (objetTouche.name.includes('Portique'))
                objetTouche.geometry.faces[numFace].color.set(COLOR_ARRAY['highlight']);

            if (objetTouche.name.includes('Vitre'))
                objetTouche.material = selectedGlassMaterial;

            if (objetTouche.name.includes('Porte'))
                objetTouche.material = selectedDoorMaterial;

            if (objetTouche.name.includes('PINT')) { // Pignon intérieur
                for (var k = 0; k < 12; k++) {
                    objetTouche.geometry.faces[k].color.set(COLOR_ARRAY['highlight']);
                }
            }
        }

        objetTouche.geometry.elementsNeedUpdate = true;
        facesSelectionnees.push(numFace);

        var modeOssatureBois = $("span:contains('ossatureBois')").parent().find("input[type='checkbox']").prop('checked');
        var ouvertureDansMur;

        /* En mode "Ossature bois", il n'est pas possible de sélectionner une ouverture (puisqu'elles n'apparaissent pas) donc, en cas de sélection d'un mur possédant une ouverture, on présume que c'est sur l'ouverture que l'on veut jouer. */
        if (modeOssatureBois) {

            ouvertureDansMur = false;
            // On recherche s'il existe une ouverture sur ce mur
            for (var objet in objetsModifiables) {
                if (objetsModifiables[objet].name.indexOf(objetTouche.name + '>Ouverture ') != -1) {
                    for (var child in objetsModifiables[objet].children) {
                        if (objetsModifiables[objet].children[child].name != "excluded") {
                            objetSelectionne = objetsModifiables[objet].children[child].name;
                            ouvertureDansMur = true;
                            break;
                        }
                    }
                }
            }
            if (ouvertureDansMur) {
                var nouvelObjetTouche = scene.getObjectByName(objetSelectionne);
                info(traduireNomObjet(nouvelObjetTouche));
                displayContextualMenu(nouvelObjetTouche, mouse.left, mouse.top);
            }
        }

        if (!modeOssatureBois || (modeOssatureBois && !ouvertureDansMur)) {

            objetSelectionne = objetTouche.name;
            info(traduireNomObjet(objetTouche));
            displayContextualMenu(objetTouche, mouse.left, mouse.top);
        }
    }
}


export function onMouseClick(event) {

    if (!event.srcElement.localName == 'a') event.preventDefault();

    if ($(".div-aide").hasClass("affiche")) $(".div-aide").removeClass("affiche");

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
