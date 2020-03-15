import {
    createTravee,
    deplacerTravee,
    resizeToit
} from "./objects.js"

import {
    createToitTexture,
    glassMaterial,
    COLOR_ARRAY
}
from "./materials.js"

import {
    recalculerCotes,
    info,
    alerte,
    log
} from "./main.js"



// Quelques constantes pratiques pour repérer les faces
var indicePDAR = 1;
var indicePDAV = 2;
var indicePGAV = 4;
var indicePGAR = 5;
var indiceRoof = 7;




function addMenu(menuTitle, isActive, action) {

    var liText = liText = "<li data-action='" + action + "'";

    if (action.match('moveUp')) liText += " class=\"moveUp";
    if (action.match('moveDown')) liText += " class=\"moveDown";
    if (action.match('add')) liText += " class=\"add";
    if (!isActive) liText += " disabled";
    liText += "\">" + menuTitle + "</li>";

    $('.liste-deroulante').append(liText);
}



export function unSelect() {

    /* On masque le menu déroulant...
       on déselectionne tous les objets à l'IHM,
       puis on vide les variables  */

    hideContextualMenu();

    if (objetSelectionne) {
        var objet = scene.getObjectByName(objetSelectionne);

        for (var i = 0; i < facesSelectionnees.length; i++) {
            if (objet.material[1]) { // Les murs
                objet.geometry.faces[facesSelectionnees[i]].color.set(COLOR_ARRAY['crepi']);
            } else { // Les ouvertures
                objet.material = glassMaterial;
            }
        }
        objet.geometry.elementsNeedUpdate = true;
    }
    facesSelectionnees.length = 0;
    objetSelectionne = '';

    if ($("#messageInfo").prop("class") == "normal")
        info(null);
}



/*******************************    Gestion du menu contextuel    ***********************************************/
export function hideContextualMenu() {
    $("#contextualMenuDiv").css({
        opacity: 0,
        left: -300, // Obligé sinon le menu était encore cliquable, même invisible.
        top: -300
    });

}


export function displayContextualMenu(objet, x, y) {

    if (facesSelectionnees.length > 1) return;

    /*   -> ex : "Travee 1>AV"                       => décaler la travée + rajouter ouverture (si permis)
         -> ex : "Travee 1>PDAV"                     => seulement rajouter une ouverture
         -> ex : "Travee 1>AV>Ouverture F2>Vitre"    => seulement supprimer l'ouverture                */

    $('.liste-deroulante').empty();

    if (objet.name.includes('Ouverture'))
        addMenu("Supprimer cette ouverture", true, 'deleteOpening');
    else {
        if (objet.name.includes('>AV') || objet.name.includes('>AR')) {

            var decalageActuel = tableauTravees[objet.parent.name]['decalee'];
            if (decalageActuel < 0) {
                addMenu("Reculer cette travée", false, 'moveUpTravee');
                addMenu("Avancer cette travée", true, 'moveDownTravee');
            } else {
                if (decalageActuel > 0) {
                    addMenu("Reculer cette travée", true, 'moveUpTravee');
                    addMenu("Avancer cette travée", false, 'moveDownTravee');

                } else {
                    addMenu("Reculer cette travée", true, 'moveUpTravee');
                    addMenu("Avancer cette travée", true, 'moveDownTravee');
                }
            }
        } else addMenu("Ajouter une ouverture", true, 'addOpening');
    }


    // Suivant la position du curseur, on place le menu à gauche ou à droite de cette dernière.
    var left = (x >= (window.innerWidth / 2)) ? (x + 30) + 'px' : (x - $("#contextualMenuDiv").width() - 30) + 'px';
    $("#contextualMenuDiv").css({
        opacity: 1,
        left: left,
        top: y - ($("#contextualMenuDiv").height() / 2) + 'px'
    });
}


export function displayGui() {

    var controller = new function () {
        this.afficherToit = true;
        this.afficherPlancher = false;
        this.afficherCotes = false;
    };

    var options = {
        Ajouter: function () {
            switch (nbTravees) {
                case 1:
                    var travee2 = createTravee();
                    travee2.translateX(LARGEUR_TRAVEE / 2);
                    var travee1 = scene.getObjectByName('Travee 1');
                    travee1.translateX(-LARGEUR_TRAVEE / 2);
                    travee1.children[indicePDAV].visible = false;
                    travee1.children[indicePDAR].visible = false;
                    travee2.children[indicePGAV].visible = false;
                    travee2.children[indicePGAR].visible = false;
                    objetsModifiables.push(travee2);
                    scene.add(travee2);
                    recalculerCotes('largeur');
                    resizeToit();
                    break;
                case 2:
                    var travee3 = createTravee();
                    travee3.translateX(LARGEUR_TRAVEE);
                    var travee1 = scene.getObjectByName('Travee 1');
                    travee1.translateX(-LARGEUR_TRAVEE / 2);
                    var travee2 = scene.getObjectByName('Travee 2');
                    travee2.translateX(-LARGEUR_TRAVEE / 2);
                    travee2.children[indicePDAV].visible = false;
                    travee2.children[indicePDAR].visible = false;
                    travee3.children[indicePGAV].visible = false;
                    travee3.children[indicePGAR].visible = false;
                    objetsModifiables.push(travee3);
                    scene.add(travee3);
                    recalculerCotes('largeur');
                    resizeToit();
                    break;
                case 3:
                    var travee4 = createTravee();
                    travee4.translateX(LARGEUR_TRAVEE * 1.5);
                    var travee1 = scene.getObjectByName('Travee 1');
                    travee1.translateX(-LARGEUR_TRAVEE / 2);
                    var travee2 = scene.getObjectByName('Travee 2');
                    travee2.translateX(-LARGEUR_TRAVEE / 2);
                    var travee3 = scene.getObjectByName('Travee 3');
                    travee3.translateX(-LARGEUR_TRAVEE / 2);
                    travee3.children[indicePDAV].visible = false;
                    travee3.children[indicePDAR].visible = false;
                    travee4.children[indicePGAV].visible = false;
                    travee4.children[indicePGAR].visible = false;
                    objetsModifiables.push(travee4);
                    scene.add(travee4);
                    recalculerCotes('largeur');
                    resizeToit();
                    break;
                default:
                    alerte('Vous avez atteint le nombre maximum de travees (4).');
                    break;
            }
        },
        Supprimer: function () {
            switch (nbTravees) {
                case 2:
                    var travee2 = scene.getObjectByName('Travee 2');
                    scene.remove(travee2);
                    var travee1 = scene.getObjectByName('Travee 1');
                    travee1.translateX(LARGEUR_TRAVEE / 2)
                    travee1.children[indicePDAV].visible = true;
                    travee1.children[indicePDAR].visible = true;
                    objetsModifiables.splice(objetsModifiables.indexOf('travee2'), 1);
                    nbTravees--;
                    recalculerCotes('largeur');
                    resizeToit(DOWN);
                    break;
                case 3:
                    var travee3 = scene.getObjectByName('Travee 3');
                    scene.remove(travee3);
                    var travee1 = scene.getObjectByName('Travee 1');
                    travee1.translateX(LARGEUR_TRAVEE / 2);
                    var travee2 = scene.getObjectByName('Travee 2');
                    travee2.translateX(LARGEUR_TRAVEE / 2);
                    travee2.children[indicePDAV].visible = true;
                    travee2.children[indicePDAR].visible = true;
                    objetsModifiables.splice(objetsModifiables.indexOf('travee3'), 1);
                    nbTravees--;
                    recalculerCotes('largeur');
                    resizeToit(DOWN);
                    break;
                case 4:
                    var travee4 = scene.getObjectByName('Travee 4');
                    scene.remove(travee4);
                    var travee1 = scene.getObjectByName('Travee 1');
                    travee1.translateX(LARGEUR_TRAVEE / 2);
                    var travee2 = scene.getObjectByName('Travee 2');
                    travee2.translateX(LARGEUR_TRAVEE / 2);
                    var travee3 = scene.getObjectByName('Travee 3');
                    travee3.translateX(LARGEUR_TRAVEE / 2);
                    travee3.children[indicePDAV].visible = true;
                    travee3.children[indicePDAR].visible = true;
                    objetsModifiables.splice(objetsModifiables.indexOf('travee4'), 1);
                    nbTravees--;
                    recalculerCotes('largeur');
                    resizeToit(DOWN);
                    break;
                default:
                    alerte("Au moins une travée requise.");
                    break;
            }
        }
    }

    var myGui = new dat.GUI();
    var guitravees = myGui.addFolder('Gestion des travées');
    guitravees.add(options, 'Ajouter');
    guitravees.add(options, 'Supprimer');
    guitravees.open();


    var guiEnv = myGui.addFolder('Autres réglages');

    guiEnv.add(controller, 'afficherToit').onChange(function (value) {
        var leToit = scene.getObjectByName('Toit');
        if (!value) {
            for (var i = 0; i < leToit.children.length; i++) {
                leToit.children[i].material.wireframe = true;
            }
        } else {
            for (var i = 0; i < leToit.children.length; i++) {
                leToit.children[i].material.wireframe = false;
            }
        }
    });

    guiEnv.add(controller, 'afficherPlancher').onChange(function (value) {
        var indicePlancher = 7;
        if (!value) {
            travee1.children[indicePlancher].visible = false;
            if (travee2) {
                travee2.children[indicePlancher].visible = false;
            }
            if (travee3) {
                travee3.children[indicePlancher].visible = false;
            }
            if (travee4) {
                travee4.children[indicePlancher].visible = false;
            }
        } else {
            travee1.children[indicePlancher].visible = true;
            if (travee2) {
                travee2.children[indicePlancher].visible = true;
            }
            if (travee3) {
                travee3.children[indicePlancher].visible = true;
            }
            if (travee4) {
                travee4.children[indicePlancher].visible = true;
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
}
