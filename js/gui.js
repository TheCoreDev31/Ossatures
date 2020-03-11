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
    if (down) factor = -(nbModules + 1) / nbModules;
    else factor = nbModules / (nbModules - 1);

    var leToit = scene.getObjectByName('Toit');
    if (leToit) {
        // On joue sur la taille du toit et on recalcule sa texture en fonction.
        var newTexture = createRoofTexture(nbModules);
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
                var newTexture = createRoofTexture(nbModules);
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
        this.deplacerModule = 0;
    };

    var options = {
        Ajouter: function () {
            switch (nbModules) {
                case 1:
                    module2 = createTravee();
                    module2.translateX(LARGEUR_MODULE / 2);
                    module1.translateX(-LARGEUR_MODULE / 2);
                    module1.children[indicePDAV].visible = false;
                    module1.children[indicePDAR].visible = false;
                    module2.children[indicePGAV].visible = false;
                    module2.children[indicePGAR].visible = false;
                    objetsModifiables.push(module2);
                    scene.add(module2);
                    recalculerCotes('largeur');
                    resizeRoof();
                    break;
                case 2:
                    module3 = createTravee();
                    module3.translateX(LARGEUR_MODULE);
                    module1.translateX(-LARGEUR_MODULE / 2);
                    module2.translateX(-LARGEUR_MODULE / 2);
                    module2.children[indicePDAV].visible = false;
                    module2.children[indicePDAR].visible = false;
                    module3.children[indicePGAV].visible = false;
                    module3.children[indicePGAR].visible = false;
                    objetsModifiables.push(module3);
                    scene.add(module3);
                    recalculerCotes('largeur');
                    resizeRoof();
                    break;
                case 3:
                    module4 = createTravee();
                    module4.translateX(LARGEUR_MODULE * 1.5);
                    module1.translateX(-LARGEUR_MODULE / 2);
                    module2.translateX(-LARGEUR_MODULE / 2);
                    module3.translateX(-LARGEUR_MODULE / 2);
                    module3.children[indicePDAV].visible = false;
                    module3.children[indicePDAR].visible = false;
                    module4.children[indicePGAV].visible = false;
                    module4.children[indicePGAR].visible = false;
                    objetsModifiables.push(module4);
                    scene.add(module4);
                    recalculerCotes('largeur');
                    resizeRoof();
                    break;
                default:
                    alert('Vous avez atteint le nombre maximum de modules (4).');
                    break;
            }
        },
        Supprimer: function () {
            switch (nbModules) {
                case 2:
                    scene.remove(module2);
                    module1.translateX(LARGEUR_MODULE / 2)
                    module1.children[indicePDAV].visible = true;
                    module1.children[indicePDAR].visible = true;
                    objetsModifiables.splice(objetsModifiables.indexOf('module2'), 1);
                    nbModules--;
                    recalculerCotes('largeur');
                    resizeRoof(DOWN);
                    break;
                case 3:
                    scene.remove(module3);
                    module1.translateX(LARGEUR_MODULE / 2);
                    module2.translateX(LARGEUR_MODULE / 2);
                    module2.children[indicePDAV].visible = true;
                    module2.children[indicePDAR].visible = true;
                    objetsModifiables.splice(objetsModifiables.indexOf('module3'), 1);
                    nbModules--;
                    recalculerCotes('largeur');
                    resizeRoof(DOWN);
                    break;
                case 4:
                    scene.remove(module4);
                    module1.translateX(LARGEUR_MODULE / 2);
                    module2.translateX(LARGEUR_MODULE / 2);
                    module3.translateX(LARGEUR_MODULE / 2);
                    module3.children[indicePDAV].visible = true;
                    module3.children[indicePDAR].visible = true;
                    objetsModifiables.splice(objetsModifiables.indexOf('module4'), 1);
                    nbModules--;
                    recalculerCotes('largeur');
                    resizeRoof(DOWN);
                    break;
                default:
                    alert('Au moins un module requis.');
                    break;
            }
        }
    }

    var myGui = new dat.GUI();
    var guiModules = myGui.addFolder('Gestion des travées');
    guiModules.add(options, 'Ajouter');
    guiModules.add(options, 'Supprimer');
    guiModules.open();


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
            module1.children[indicePlancher].visible = false;
            if (module2) {
                module2.children[indicePlancher].visible = false;
            }
            if (module3) {
                module3.children[indicePlancher].visible = false;
            }
            if (module4) {
                module4.children[indicePlancher].visible = false;
            }
        } else {
            module1.children[indicePlancher].visible = true;
            if (module2) {
                module2.children[indicePlancher].visible = true;
            }
            if (module3) {
                module3.children[indicePlancher].visible = true;
            }
            if (module4) {
                module4.children[indicePlancher].visible = true;
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
    guiTmp.add(controller, 'deplacerModule', -36, 36, 36).onChange(function (value) {
        if (moduleSelectionne) {
            if (value > 0) deplacerModule(moduleSelectionne, 'haut');
            else deplacerModule(moduleSelectionne, 'bas');
        } else {
            alerte("Veuillez sélectionner tout d'abord un module.");
        }
    });

}
