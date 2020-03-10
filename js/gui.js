import {
    createModule
} from "./main.js"

import {
    createRoofTexture
}
from "./materials.js"


function resizeRoof(down = false) {
    var factor;
    if (down) factor = -(nbModules + 1) / nbModules;
    else factor = nbModules / (nbModules - 1);

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

}


export function handleGui() {
    var controller = new function () {
        this.afficherToit = true;
        this.afficherPlancher = false;
    };

    var options = {
        Ajouter: function () {
            switch (nbModules) {
                case 1:
                    module2 = createModule();
                    module2.translateX(LARGEUR_MODULE / 2);
                    module1.translateX(-LARGEUR_MODULE / 2);
                    module1.children[1].visible = false;
                    module2.children[3].visible = false;
                    editableObjects.push(module2);
                    scene.add(module2);
                    resizeRoof();
                    break;
                case 2:
                    module3 = createModule();
                    module3.translateX(LARGEUR_MODULE);
                    module1.translateX(-LARGEUR_MODULE / 2);
                    module2.translateX(-LARGEUR_MODULE / 2);
                    module1.children[1].visible = false;
                    module2.children[3].visible = false;
                    module2.children[1].visible = false;
                    module3.children[3].visible = false;
                    editableObjects.push(module3);
                    scene.add(module3);
                    resizeRoof();
                    break;
                case 3:
                    module4 = createModule();
                    module4.translateX(LARGEUR_MODULE * 1.5);
                    module1.translateX(-LARGEUR_MODULE / 2);
                    module2.translateX(-LARGEUR_MODULE / 2);
                    module3.translateX(-LARGEUR_MODULE / 2);
                    module1.children[1].visible = false;
                    module2.children[3].visible = false;
                    module2.children[1].visible = false;
                    module3.children[1].visible = false;
                    module3.children[3].visible = false;
                    module4.children[3].visible = false;
                    editableObjects.push(module4);
                    scene.add(module4);
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
                    module1.children[1].visible = true;
                    editableObjects.splice(editableObjects.indexOf('module2'), 1);
                    nbModules--;
                    resizeRoof(DOWN);
                    break;
                case 3:
                    scene.remove(module3);
                    module1.translateX(LARGEUR_MODULE / 2);
                    module2.translateX(LARGEUR_MODULE / 2);
                    module2.children[1].visible = true;
                    editableObjects.splice(editableObjects.indexOf('module3'), 1);
                    nbModules--;
                    resizeRoof(DOWN);
                    break;
                case 4:
                    scene.remove(module4);
                    module1.translateX(LARGEUR_MODULE / 2);
                    module2.translateX(LARGEUR_MODULE / 2);
                    module3.translateX(LARGEUR_MODULE / 2);
                    module3.children[1].visible = true;
                    editableObjects.splice(editableObjects.indexOf('module4'), 1);
                    nbModules--;
                    resizeRoof(DOWN);
                    break;
                default:
                    alert('Au moins un module requis.');
                    break;
            }
        }
    }

    var myGui = new dat.GUI();
    var guiModules = myGui.addFolder('Gestion des modules');
    guiModules.add(options, 'Ajouter');
    guiModules.add(options, 'Supprimer');

    var guiEnv = myGui.addFolder('Autres');
    guiEnv.add(controller, 'afficherToit').onChange(function (value) {
        scene.traverse(function (child) {
            if (child instanceof THREE.Object3D) {
                if (child.name == 'Toit') {
                    if (!value)
                        child.children[0].material.wireframe = true;
                    else
                        child.children[0].material.wireframe = false;
                }
            }
        });
    });

    guiEnv.add(controller, 'afficherPlancher').onChange(function (value) {
        if (!value) {
            module1.children[5].visible = false;
            if (module2) {
                module2.children[5].visible = false;
            }
            if (module3) {
                module3.children[5].visible = false;
            }
            if (module4) {
                module4.children[5].visible = false;
            }
        } else {
            module1.children[5].visible = true;
            if (module2) {
                module2.children[5].visible = true;
            }
            if (module3) {
                module3.children[5].visible = true;
            }
            if (module4) {
                module4.children[5].visible = true;
            }
        }
    });

    guiModules.open();
}
