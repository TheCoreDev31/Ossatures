import {
    creerTravee,
    creerOuverture,
    decalerTravee,
    supprimerToutesOuvertures
} from "./objects.js"

import {
    creerToitTexture,
    glassMaterial,
    MPL_Material,
    pignonMaterial,
    wallMaterial,
    PEXT_Material,
    PEXT_Front_Material,
    PEXT_Back_Material,
    COLOR_ARRAY
}
from "./materials.js"

import {
    recalculerCotes,
    info,
    alerte,
    log,
    retirerObjetModifiable,
    extraireFace,
    extraireNomTravee,
    verifierContraintes
} from "./main.js"

import {
    camera,
    cameraOrtho
} from "./environment.js"

export function unSelect() {

    /* On masque le menu déroulant...
       on déselectionne tous les objets à l'IHM,
       puis on vide les variables  */

    $("#div-menu-contextuel").hide();

    if (objetSelectionne) {
        var objet = scene.getObjectByName(objetSelectionne);

        for (var i = 0; i < facesSelectionnees.length; i++) {
            if (objet.parent.name.includes('>'))
                objet.material = glassMaterial;
            else
                objet.geometry.faces[facesSelectionnees[i]].color.set(COLOR_ARRAY['blanc']);
        }
        objet.geometry.elementsNeedUpdate = true;
    }
    facesSelectionnees.length = 0;
    objetSelectionne = '';

    if ($("#message-info").prop("class") == "normal")
        info(null);
}



export function changePointOfView(direction) {

    switch (direction) {
        case 'dessus':
            camera.position.set(0, 200, 0);
            camera.lookAt(scene.position);
            info("Vue de dessus");
            break;
        case 'avant':
            camera.position.set(0, 5, 150);
            camera.lookAt(scene.position);
            info("Vue avant");
            break;
        case 'arriere':
            camera.position.set(0, 5, -150);
            camera.lookAt(scene.position);
            info("Vue arrière");
            break;
        case 'gauche':
            camera.position.set(-150, 5, 0);
            camera.lookAt(scene.position);
            info("Vue de gauche");
            break;
        case 'droite':
            camera.position.set(150, 5, 0);
            camera.lookAt(scene.position);
            info("Vue de droite");
            break;
        case 'perspective':
            camera.position.set(60, 40, 160);
            camera.lookAt(scene.position);
            break;
    }
}

/*******************************    Gestion du menu contextuel    ***********************************************/

function addInfo(message) {
    var liText = "<li class=\"blank\">" + message + "</li>";

    $('.liste-deroulante').append(liText);
}

function addMenu(menuTitle, action, isActive = true) {

    var liText = liText = "<li data-action=\"" + action + "\"";

    if (action.match('moveFront')) liText += " class=\"moveFront";
    if (action.match('moveBack')) liText += " class=\"moveBack";
    if (action.match('add')) liText += " class=\"add";
    if (action.match('delete')) liText += " class=\"delete";
    if (action.match('choose')) liText += " class=\"choose";
    if (!isActive) liText += " disabled";
    liText += "\">" + menuTitle + "</li>";

    $('.liste-deroulante').append(liText);
}

function addSeparator() {
    var liText = "<hr>";
    $('.liste-deroulante').append(liText);
}


export function chooseFloorHole(traveeSelectionnee) {
    $('.popup-ouverture-image').each(function (i) {
        $(this).parent().removeClass();
        $(this).parent().addClass("normal");
    });

    $("#popup-plancher").css({
        left: (window.innerWidth / 2) - ($("#popup-plancher").width() / 2) + 'px',
        top: (window.innerHeight / 2) - ($("#popup-plancher").height() / 2) + 'px'
    });
    $("#popup-plancher").show();
    $("#traveeSelectionnee").val(traveeSelectionnee);
    $("#overlay").show();
}



export function displayOpenings(traveeSelectionnee, face) {

    // RAZ des figures
    $('.popup-ouverture-image').each(function (i) {
        $(this).parent().removeClass();
        $(this).parent().addClass("normal");
    });
    disableUnauthorizedOpenings(verifierContraintes(traveeSelectionnee));

    if (face == 'interieur') {
        $("#popup-ouverture-in").css({
            left: (window.innerWidth / 2) - ($("#popup-ouverture-in").width() / 2) + 'px',
            top: (window.innerHeight / 2) - ($("#popup-ouverture-in").height() / 2) + 'px'
        });
        $("#popup-ouverture-in").show();

    } else {

        $("#popup-ouverture-out").css({
            left: (window.innerWidth / 2) - ($("#popup-ouverture-out").width() / 2) + 'px',
            top: (window.innerHeight / 2) - ($("#popup-ouverture-out").height() / 2) + 'px'
        });
        $("#popup-ouverture-out").show();
    }
    $("#traveeSelectionnee").val(traveeSelectionnee);
    $("#overlay").show();
}

export function disableUnauthorizedOpenings(tableauOuverturesAutorisees) {

    $('.popup-ouverture-image').each(function (i) {

        if (!tableauOuverturesAutorisees.includes($(this).parent().attr('id'))) {
            $(this).parent().toggleClass("disabled");
        }
    });
}

export function displayContextualMenu(objet, x, y) {

    if (facesSelectionnees.length > 1) return;

    /*   -> ex : "Travee 1>AV"                       => décaler la travée + rajouter ouverture (si permis)
         -> ex : "Travee 1>PDAV"                     => seulement rajouter une ouverture
         -> ex : "Travee 1>AV>Ouverture F2>Vitre"    => seulement supprimer l'ouverture                */
    $('.liste-deroulante').empty();

    addInfo($("#message-info").html());
    addSeparator();
    if (objet.name.includes('Ouverture'))
        addMenu("Supprimer cette ouverture", 'deleteOuverture');
    else {
        if (objet.name.includes('>AV') || objet.name.includes('>AR')) {

            var decalageActuel = tableauTravees[objet.parent.name]['decalage'];
            if (decalageActuel < 0) {
                addMenu("Reculer cette travée", 'moveBackTravee', false);
                addMenu("Avancer cette travée", 'moveFrontTravee');
            } else {
                if (decalageActuel > 0) {
                    addMenu("Reculer cette travée", 'moveBackTravee');
                    addMenu("Avancer cette travée", 'moveFrontTravee', false);

                } else {
                    addMenu("Reculer cette travée", 'moveBackTravee');
                    addMenu("Avancer cette travée", 'moveFrontTravee');
                }
            }
            addSeparator();
        }
        if (objet.name.includes('plancher')) {
            addMenu("Positionner la trappe d'accès", 'chooseFloorHole');
        } else {
            var nomFace = extraireFace(objet.name);
            // S'il existe déjà une ouverture sur ce module, on grise la possibilité d'en ajouter une autre.
            if (tableauTravees[extraireNomTravee(objet.name)]['nb_ouvertures_' + nomFace] > 0)
                addMenu("Créer une ouverture", 'addOpening', false);
            else
                addMenu("Créer une ouverture", 'addOpening');
        }
    }
    addSeparator();
    addMenu("Annuler la sélection", 'unselect');


    // Suivant la position du curseur, on place le menu à gauche ou à droite de cette dernière.
    var left = (x >= (window.innerWidth / 2)) ? (x + 30) + 'px' : (x - $("#div-menu-contextuel").width() - 30) + 'px';
    $("#div-menu-contextuel").css({
        left: left,
        top: y - ($("#div-menu-contextuel").height() / 2) + 'px'
    });
    $("#div-menu-contextuel").show();
}


export function displayGui() {

    var controller = new function () {
        this.afficherToit = true;
        this.afficherPlancher = true;
        this.afficherCotes = true;
        this.armaturesBois = false;
    };

    var options = {
        Ajouter: function () {

            if (nbOuvertures > 0) {
                if (!confirm("Vous allez perdre toutes les ouvertures déjà créées. Continuer ?")) return;
                supprimerToutesOuvertures();
            }
            /* Les cas où l'ajout est interdit sont :
                1 - nb maxi de travées (au total) atteint (déjà géré dans creeTravee)
                2 - on atteint le nb maxi de travées par construction */
            if (nbTravees > 1) {
                var voisine = tableauTravees[PREFIXE_TRAVEE + nbTravees];
                if (voisine['rangDansConstruction'] >= NB_TRAVEES_MAXI) {
                    alerte("Vous avez atteint le nombre maximal de travées autorisées (" + NB_TRAVEES_MAXI + ").");
                    return;
                }
            }

            var travee = creerTravee();
            if (travee) {

                // Rajout d'une travée -> on décale suivant X tout le monde vers la gauche.
                travee.translateX(LARGEUR_TRAVEE / 2 * (nbTravees - 1));
                tableauTravees[travee.name]['positionX'] += (LARGEUR_TRAVEE / 2 * (nbTravees - 1));
                for (var i = nbTravees - 1; i > 0; i--) {
                    var traveePrecedente = scene.getObjectByName(PREFIXE_TRAVEE + i);
                    traveePrecedente.translateX(-LARGEUR_TRAVEE / 2);
                    tableauTravees[traveePrecedente.name]['positionX'] -= LARGEUR_TRAVEE / 2;
                }
                scene.add(travee);

                // La travée doit-elle être décalée suivant Z, car une nouvelle travée aura toujours le même décalage que sa voisine de gauche.
                var decalageVoisine = tableauTravees[PREFIXE_TRAVEE + (nbTravees - 1)]['decalage'];
                if (decalageVoisine != 0) {
                    switch (decalageVoisine) {
                        case 1:
                            decalerTravee(travee.name, 'front');
                            break;
                        default:
                            decalerTravee(travee.name, 'back');
                            break;
                    }
                }

                // On masque les cloisons de la travée de gauche
                var voisine = scene.getObjectByName(PREFIXE_TRAVEE + (nbTravees - 1));
                voisine.children[indicePDAV].visible = voisine.children[indicePDAR].visible = false;

                recalculerCotes('largeur');
                scene.getObjectByName('CoteY').position.x += (LARGEUR_TRAVEE / 2);
            }
        },

        Supprimer: function () {

            if (nbTravees == 1) {
                alerte("Au moins une travée requise.");
                return;
            }
            if (nbOuvertures > 0) {
                if (!confirm("Vous allez perdre toutes les ouvertures déjà créées. Continuer ?")) return;
                supprimerToutesOuvertures();
            }
            var nomTravee = PREFIXE_TRAVEE + nbTravees;
            var travee = scene.getObjectByName(nomTravee);
            scene.remove(travee);
            delete tableauTravees[nomTravee];
            tableauTravees.length--;

            // Suppression d'une travée -> on décale suivant X tout le monde vers la droite.
            for (var i = nbTravees - 1; i > 0; i--) {
                var traveePrecedente = scene.getObjectByName(PREFIXE_TRAVEE + i);
                traveePrecedente.translateX(LARGEUR_TRAVEE / 2);
                tableauTravees[traveePrecedente.name]['positionX'] += LARGEUR_TRAVEE / 2;
            }
            retirerObjetModifiable(nomTravee);
            nbTravees--;

            // On raffiche les cloisons de la travée de gauche
            var voisine = scene.getObjectByName(PREFIXE_TRAVEE + nbTravees);
            voisine.children[indicePDAV].visible = voisine.children[indicePDAR].visible = true;

            recalculerCotes('largeur');
            scene.getObjectByName('CoteY').position.x -= (LARGEUR_TRAVEE / 2);
        }
    }

    var myGui = new dat.GUI();
    var guitravees = myGui.addFolder('Gestion des travées');
    guitravees.add(options, 'Ajouter');
    guitravees.add(options, 'Supprimer');
    guitravees.open();


    var guiEnv = myGui.addFolder("Réglages d'affichage");

    guiEnv.add(controller, 'afficherToit').onChange(function (value) {

        for (var j = 1; j <= nbTravees; j++) {
            var leToit = scene.getObjectByName(PREFIXE_TRAVEE + j + '>Toit');
            if (!value) {
                for (var i = 0; i < leToit.children.length; i++) {
                    leToit.children[i].material.wireframe = true;
                    leToit.children[i].name = 'transparent';
                }
            } else {
                for (var i = 0; i < leToit.children.length; i++) {
                    leToit.children[i].material.wireframe = false;
                    leToit.children[i].name = 'excluded';
                }
            }
        }
        //        guiEnv.close();
    });

    guiEnv.add(controller, 'afficherPlancher').onChange(function (value) {
        if (!value) {
            for (var i = 1; i <= nbTravees; i++) {
                var travee = scene.getObjectByName(PREFIXE_TRAVEE + i);
                travee.children[indiceRoof].visible = false;

                travee.children[indiceRoof].visible = false;
            }
        } else {
            for (var i = 1; i <= nbTravees; i++) {
                var travee = scene.getObjectByName(PREFIXE_TRAVEE + i);
                travee.children[indiceRoof].visible = true;
            }
        }
    });

    guiEnv.add(controller, 'afficherCotes').onChange(function (value) {
        var cotesX = scene.getObjectByName('CoteX');
        var cotesY = scene.getObjectByName('CoteY');

        if (!value) {
            if (cotesX) cotesX.visible = false;
            if (cotesY) cotesY.visible = false;
        } else {
            if (cotesX) cotesX.visible = true;
            if (cotesY) cotesY.visible = true;
        }
    });

    guiEnv.add(controller, 'armaturesBois').onChange(function (value) {

        if ($("span:contains('afficherToit')").parent().find("input[type='checkbox']").prop('checked'))
            $("span:contains('afficherToit')").click();

        scene.traverse(function (child) {

            if (!value) {
                // On remet la texture d'origine
                switch (child.material) {
                    case MPL_Material:
                        child.material = wallMaterial;
                        break;
                    case PEXT_Material:
                        child.material = pignonMaterial;
                        break;
                }
            } else {
                // Plus compliqué : chaque module a sa propre texture
                switch (child.material) {
                    case wallMaterial:
                        child.material = MPL_Material;
                        break;
                    case pignonMaterial:
                        child.material = PEXT_Material;
                        break;
                }

            }
        });
    });

    guiEnv.open();

}
