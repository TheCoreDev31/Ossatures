import {
    createTravee
} from "./objects.js"

import {
    createRoofTexture
}
from "./materials.js"

import {
    recalculerCotes,
    deplacerTravee,
    info,
    alerte
} from "./main.js"


// Quelques constantes pratiques
var indicePDAR = 1;
var indicePDAV = 2;
var indicePGAV = 4;
var indicePGAR = 5;
var indiceRoof = 7;


function resizeRoof(down = false) {
    var factor;
    if (down) factor = -(nbTravees + 1) / nbTravees;
    else factor = nbTravees / (nbTravees - 1);

    var leToit = scene.getObjectByName('Toit');
    if (leToit) {
        // On joue sur la taille du toit et on recalcule sa texture en fonction.
        var newTexture = createRoofTexture(nbTravees);
        if (factor >= 0) {
            leToit.scale.x *= factor;
        } else
            leToit.scale.x /= factor;
        leToit.children[0].material.map = newTexture;
        leToit.children[0].material.needsUpdate = true;
    }

    /*   On le garde.... pour l'exemple
    scene.traverse(function (child) {
        if (child instanceof THREE.Object3D) {
            if (child.name == 'Toit') {

                // On joue sur la taille du toit et on recalcule sa texture en fonction.
                var newTexture = createRoofTexture(nbTravees);
                if (factor >= 0) {
                    child.scale.x *= factor;
                } else
                    child.scale.x /= factor;
                child.children[0].material.map = newTexture;
                child.children[0].material.needsUpdate = true;
                return;
            }
        }
    });
    */
}


export function displayGui() {

    var controller = new function () {
        this.afficherToit = true;
        this.afficherPlancher = false;
        this.afficherCotes = true;
        this.deplacerTravee = 0;
    };

    var options = {
        Ajouter: function () {
            switch (nbTravees) {
                case 1:
                    travee2 = createTravee();
                    travee2.translateX(LARGEUR_TRAVEE / 2);
                    travee1.translateX(-LARGEUR_TRAVEE / 2);
                    travee1.children[indicePDAV].visible = false;
                    travee1.children[indicePDAR].visible = false;
                    travee2.children[indicePGAV].visible = false;
                    travee2.children[indicePGAR].visible = false;
                    objetsModifiables.push(travee2);
                    scene.add(travee2);
                    recalculerCotes('largeur');
                    resizeRoof();
                    break;
                case 2:
                    travee3 = createTravee();
                    travee3.translateX(LARGEUR_TRAVEE);
                    travee1.translateX(-LARGEUR_TRAVEE / 2);
                    travee2.translateX(-LARGEUR_TRAVEE / 2);
                    travee2.children[indicePDAV].visible = false;
                    travee2.children[indicePDAR].visible = false;
                    travee3.children[indicePGAV].visible = false;
                    travee3.children[indicePGAR].visible = false;
                    objetsModifiables.push(travee3);
                    scene.add(travee3);
                    recalculerCotes('largeur');
                    resizeRoof();
                    break;
                case 3:
                    travee4 = createTravee();
                    travee4.translateX(LARGEUR_TRAVEE * 1.5);
                    travee1.translateX(-LARGEUR_TRAVEE / 2);
                    travee2.translateX(-LARGEUR_TRAVEE / 2);
                    travee3.translateX(-LARGEUR_TRAVEE / 2);
                    travee3.children[indicePDAV].visible = false;
                    travee3.children[indicePDAR].visible = false;
                    travee4.children[indicePGAV].visible = false;
                    travee4.children[indicePGAR].visible = false;
                    objetsModifiables.push(travee4);
                    scene.add(travee4);
                    recalculerCotes('largeur');
                    resizeRoof();
                    break;
                default:
                    alert('Vous avez atteint le nombre maximum de travees (4).');
                    break;
            }
        },
        Supprimer: function () {
            switch (nbTravees) {
                case 2:
                    scene.remove(travee2);
                    travee1.translateX(LARGEUR_TRAVEE / 2)
                    travee1.children[indicePDAV].visible = true;
                    travee1.children[indicePDAR].visible = true;
                    objetsModifiables.splice(objetsModifiables.indexOf('travee2'), 1);
                    nbTravees--;
                    recalculerCotes('largeur');
                    resizeRoof(DOWN);
                    break;
                case 3:
                    scene.remove(travee3);
                    travee1.translateX(LARGEUR_TRAVEE / 2);
                    travee2.translateX(LARGEUR_TRAVEE / 2);
                    travee2.children[indicePDAV].visible = true;
                    travee2.children[indicePDAR].visible = true;
                    objetsModifiables.splice(objetsModifiables.indexOf('travee3'), 1);
                    nbTravees--;
                    recalculerCotes('largeur');
                    resizeRoof(DOWN);
                    break;
                case 4:
                    scene.remove(travee4);
                    travee1.translateX(LARGEUR_TRAVEE / 2);
                    travee2.translateX(LARGEUR_TRAVEE / 2);
                    travee3.translateX(LARGEUR_TRAVEE / 2);
                    travee3.children[indicePDAV].visible = true;
                    travee3.children[indicePDAR].visible = true;
                    objetsModifiables.splice(objetsModifiables.indexOf('travee4'), 1);
                    nbTravees--;
                    recalculerCotes('largeur');
                    resizeRoof(DOWN);
                    break;
                default:
                    alert('Au moins un travee requis.');
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
        if (!value)
            leToit.children[0].material.wireframe = true;
        else
            leToit.children[0].material.wireframe = false;
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

        if (value) {
            if (cotesX) cotesX.visible = true;
            if (cotesY) cotesY.visible = true;
        } else {
            if (cotesX) cotesX.visible = false;
            if (cotesY) cotesY.visible = false;

        }
    });

    var guiTmp = myGui.addFolder('Temporaire');
    guiTmp.open();
    guiTmp.add(controller, 'deplacerTravee', -36, 36, 36).onChange(function (value) {
        if (traveeSelectionnee) {
            if (value > 0) deplacerTravee(traveeSelectionnee, 'haut');
            else deplacerTravee(traveeSelectionnee, 'bas');
        } else {
            alerte("Veuillez sélectionner tout d'abord un travee.");
        }
    });

}
