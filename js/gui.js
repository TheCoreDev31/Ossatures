import {
    createModule
} from "./main.js"


export function handleGui() {
    let controller = new function () {
        this.afficherPlafond = true;
    };

    let options = {
        Ajouter: function () {
            switch (nbModules) {
                case 1:
                    module2 = createModule();
                    module2.translateX(largeurModule / 2);
                    module1.translateX(-largeurModule / 2);
                    module1.children[1].visible = false;
                    module2.children[3].visible = false;
                    scene.add(module2);
                    nbModules++;
                    break;
                case 2:
                    module3 = createModule();
                    module3.translateX(largeurModule);
                    module1.translateX(-largeurModule / 2);
                    module2.translateX(-largeurModule / 2);
                    module1.children[1].visible = false;
                    module2.children[3].visible = false;
                    module2.children[1].visible = false;
                    module3.children[3].visible = false;
                    scene.add(module3);
                    nbModules++;
                    break;
                case 3:
                    module4 = createModule();
                    module4.translateX(largeurModule * 1.5);
                    module1.translateX(-largeurModule / 2);
                    module2.translateX(-largeurModule / 2);
                    module3.translateX(-largeurModule / 2);
                    module1.children[1].visible = false;
                    module2.children[3].visible = false;
                    module2.children[1].visible = false;
                    module3.children[1].visible = false;
                    module3.children[3].visible = false;
                    module4.children[3].visible = false;
                    scene.add(module4);
                    nbModules++;
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
                    module1.translateX(largeurModule / 2)
                    module1.children[1].visible = true;
                    nbModules--;
                    break;
                case 3:
                    scene.remove(module3);
                    module1.translateX(largeurModule / 2);
                    module2.translateX(largeurModule / 2);
                    module2.children[1].visible = true;
                    nbModules--;
                    break;
                case 4:
                    scene.remove(module4);
                    module1.translateX(largeurModule / 2);
                    module2.translateX(largeurModule / 2);
                    module3.translateX(largeurModule / 2);
                    module3.children[1].visible = true;
                    nbModules--;
                    break;
                default:
                    alert('Au moins un module requis.');
                    break;
            }
        }
    }

    let myGui = new dat.GUI();
    let guiModules = myGui.addFolder('Gestion des modules');
    guiModules.add(options, 'Ajouter');
    guiModules.add(options, 'Supprimer');

    let guiEnv = myGui.addFolder('Autres');
    guiEnv.add(controller, 'afficherPlafond').onChange(function () {
        if (module1.children[5].visible) {
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
    guiEnv.open();
}
